import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch, parseAiJson, cleanQuestionText } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Validation constants ──
const MIN_STATEMENT = 400;
const MIN_EXPLANATION = 150;
const ENGLISH_PATTERN = /\b(the patient|which of the following|a \d+-year-old|presents with|physical examination|most likely|treatment of choice|year-old male|year-old female)\b/i;

interface GenerationResult {
  asset_id: string;
  asset_code: string;
  status: "created" | "rejected" | "failed";
  question_id?: string;
  stage?: string;
  error?: string;
}

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errResp(status: number, error: string, stage: string) {
  return new Response(JSON.stringify({ success: false, error, stage }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validateGenerated(q: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!q.statement || q.statement.length < MIN_STATEMENT)
    errors.push(`enunciado curto: ${q.statement?.length || 0} chars (mín ${MIN_STATEMENT})`);
  if (!q.explanation || q.explanation.length < MIN_EXPLANATION)
    errors.push(`explicação curta: ${q.explanation?.length || 0} chars (mín ${MIN_EXPLANATION})`);

  for (const opt of ["option_a", "option_b", "option_c", "option_d", "option_e"]) {
    if (!q[opt] || q[opt].trim().length < 3) errors.push(`${opt} ausente ou muito curta`);
  }

  if (typeof q.correct_index !== "number" || q.correct_index < 0 || q.correct_index > 4)
    errors.push(`correct_index inválido: ${q.correct_index}`);

  if (!q.rationale_map || typeof q.rationale_map !== "object") {
    errors.push("rationale_map ausente");
  } else {
    for (const k of ["A", "B", "C", "D", "E"]) {
      if (!q.rationale_map[k] || q.rationale_map[k].trim().length < 10)
        errors.push(`rationale_map.${k} ausente ou curta`);
    }
  }

  if (!q.difficulty || !["easy", "medium", "hard"].includes(q.difficulty))
    errors.push(`difficulty inválido: ${q.difficulty}`);

  // Check duplicated options
  const opts = [q.option_a, q.option_b, q.option_c, q.option_d, q.option_e]
    .filter(Boolean).map((o: string) => o.trim().toLowerCase());
  if (new Set(opts).size !== opts.length) errors.push("alternativas duplicadas");

  // English check
  const fullText = `${q.statement || ""} ${q.explanation || ""}`;
  if (ENGLISH_PATTERN.test(fullText)) errors.push("conteúdo em inglês detectado");

  return { valid: errors.length === 0, errors };
}

function buildPrompt(asset: any): string {
  const findings = Array.isArray(asset.clinical_findings) ? asset.clinical_findings.join(", ") : String(asset.clinical_findings || "");
  const distractors = Array.isArray(asset.distractors) ? asset.distractors.join(", ") : String(asset.distractors || "");
  const examStyle = asset.exam_style || "ENARE";
  const difficulty = asset.difficulty || "medium";

  return `IDIOMA OBRIGATÓRIO: TUDO em PORTUGUÊS BRASILEIRO (pt-BR). NUNCA use inglês em nenhum campo.

Você é um elaborador sênior de questões médicas de alta concorrência, especializado em ENARE, USP, UNIFESP e provas de residência médica brasileiras.

== DADOS DO ASSET DE IMAGEM ==
Tipo de imagem: ${asset.image_type || "N/A"}
Especialidade: ${asset.specialty || "N/A"}
Subtema: ${asset.subtopic || "N/A"}
Diagnóstico correto: ${asset.diagnosis || "N/A"}
Achados clínicos na imagem: ${findings || "N/A"}
Distratores clínicos: ${distractors || "N/A"}
Dificuldade alvo: ${difficulty}
Estilo da banca: ${examStyle}
${asset.tri_a !== undefined ? `TRI a (discriminação): ${asset.tri_a}` : ""}
${asset.tri_b !== undefined ? `TRI b (dificuldade): ${asset.tri_b}` : ""}
${asset.tri_c !== undefined ? `TRI c (acerto ao acaso): ${asset.tri_c}` : ""}

== REGRAS DO ENUNCIADO (400-900 caracteres) ==
O enunciado DEVE conter:
1. Idade e sexo do paciente
2. Contexto assistencial real (PS, ambulatório, enfermaria, UBS)
3. HDA detalhada (queixa, tempo de evolução, fatores associados)
4. Pelo menos 1 dado de exame físico OU exame complementar
5. Menção natural ao exame de imagem ("Diante do ECG realizado...", "A radiografia de tórax evidencia...")
6. Pergunta objetiva ao final

PROIBIDO no enunciado:
- "Qual o diagnóstico desta imagem?" (pergunta seca)
- Enunciado telegráfico ou superficial
- Texto resolvível sem analisar a imagem
- Qualquer texto em inglês

== REGRAS DAS ALTERNATIVAS ==
- 5 alternativas obrigatórias (A-E)
- Apenas 1 correta
- Distratores plausíveis e do mesmo universo clínico
- PROIBIDO: alternativas absurdas, brincadeiras, duas corretas parciais
- Use os distratores clínicos fornecidos quando possível

== REGRAS DA EXPLICAÇÃO (mínimo 150 caracteres) ==
- Justificar por que a correta está certa
- Justificar por que CADA errada está errada
- Citar achados relevantes da imagem
- Explicar o raciocínio clínico completo

== REGRAS DA DESCRIÇÃO DA IMAGEM ==
- Usar SOMENTE os achados presentes em clinical_findings
- NÃO inventar detalhes além do asset
- NÃO extrapolar achados

== AJUSTE POR BANCA ==
${examStyle === "ENARE" ? "ENARE: mais objetivo, forte correlação clínico-prática, alta incidência" : ""}
${examStyle === "USP" ? "USP: mais interpretação, distratores refinados, maior integração fisiopatológica" : ""}
${examStyle === "UNIFESP" ? "UNIFESP: clínica + diagnóstico diferencial aprofundado" : ""}
${examStyle === "SUS-SP" ? "SUS-SP: foco em conduta e raciocínio aplicado" : ""}

== CONTROLE DE DIFICULDADE ==
${difficulty === "easy" ? "EASY: achado mais evidente, menor ambiguidade, menos etapas de raciocínio" : ""}
${difficulty === "medium" ? "MEDIUM: interpretação moderada, 1 diferencial forte" : ""}
${difficulty === "hard" ? "HARD: achado sutil exigindo integração, distratores fortes, alta discriminação" : ""}

== SAÍDA ==
Retorne APENAS um JSON válido (sem markdown, sem comentários):
{"statement":"...","image_description":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","option_e":"...","correct_index":0,"explanation":"...","rationale_map":{"A":"...","B":"...","C":"...","D":"...","E":"..."},"difficulty":"${difficulty}","exam_style":"${examStyle}"}

Se NÃO conseguir atingir o padrão de qualidade, retorne:
{"invalid":true,"reason":"..."}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errResp(401, "Não autorizado", "auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return errResp(500, "Config incompleta", "config");

    const sb = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !user) return errResp(401, "Token inválido", "auth");

    // Admin check
    const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", user.id);
    if (!roles?.some((r: any) => r.role === "admin")) return errResp(403, "Apenas administradores", "auth");

    // Parse body
    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }

    const {
      batch_size = 3,
      image_type,
      specialty,
      difficulty,
      exam_style = "ENARE",
      asset_ids,
    } = body;

    const limit = Math.min(batch_size, 5);

    // Fetch assets to generate from
    let assets: any[] = [];
    try {
      let query = sb.from("medical_image_assets")
        .select("id, asset_code, image_type, specialty, subtopic, diagnosis, clinical_findings, distractors, difficulty, tri_a, tri_b, tri_c, image_url")
        .eq("is_active", true);

      if (asset_ids && Array.isArray(asset_ids) && asset_ids.length > 0) {
        query = query.in("id", asset_ids);
      } else {
        if (image_type) query = query.eq("image_type", image_type);
        if (specialty) query = query.eq("specialty", specialty);
        if (difficulty) query = query.eq("difficulty", difficulty);
      }

      const { data, error } = await query.limit(limit);
      if (error) throw error;
      assets = data || [];
    } catch (e) {
      return errResp(500, `Erro ao buscar assets: ${(e as Error).message}`, "fetch_assets");
    }

    if (assets.length === 0) {
      return ok({ success: true, message: "Nenhum asset encontrado para os filtros", created: 0, results: [] });
    }

    const results: GenerationResult[] = [];

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const assetCode = asset.asset_code || asset.id;

      try {
        // Enrich asset with exam_style for prompt
        asset.exam_style = exam_style;

        const prompt = buildPrompt(asset);

        // AI call
        const response = await aiFetch({
          messages: [{ role: "user", content: prompt }],
          model: "google/gemini-2.5-flash",
          maxTokens: 8192,
          timeoutMs: 60000,
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          throw new Error(`AI ${response.status}: ${errText.slice(0, 200)}`);
        }

        const aiData = await response.json();
        const rawContent = aiData.choices?.[0]?.message?.content || "";

        // Parse
        const parsed = parseAiJson(rawContent);

        // AI self-rejection
        if (parsed.invalid) {
          console.warn(`[generate][${assetCode}] IA rejeitou: ${parsed.reason}`);
          results.push({ asset_id: asset.id, asset_code: assetCode, status: "rejected", stage: "ai_invalid", error: parsed.reason });
          continue;
        }

        // Clean text
        for (const f of ["statement", "option_a", "option_b", "option_c", "option_d", "option_e", "explanation", "image_description"]) {
          if (typeof parsed[f] === "string") parsed[f] = cleanQuestionText(parsed[f]);
        }

        // Defaults
        if (!parsed.difficulty) parsed.difficulty = asset.difficulty || "medium";
        if (!parsed.exam_style) parsed.exam_style = exam_style;

        // Validate
        const validation = validateGenerated(parsed);
        if (!validation.valid) {
          console.warn(`[generate][${assetCode}] Validação falhou: ${validation.errors.join("; ")}`);
          results.push({ asset_id: asset.id, asset_code: assetCode, status: "rejected", stage: "validation", error: validation.errors.join("; ") });
          continue;
        }

        // Generate question code
        const qCode = `IMG-${asset.image_type?.toUpperCase() || "GEN"}-${Date.now().toString(36).toUpperCase()}`;

        // Insert into medical_image_questions
        const { data: inserted, error: insertErr } = await sb.from("medical_image_questions").insert({
          asset_id: asset.id,
          question_code: qCode,
          statement: parsed.statement,
          image_description: parsed.image_description || "",
          option_a: parsed.option_a,
          option_b: parsed.option_b,
          option_c: parsed.option_c,
          option_d: parsed.option_d,
          option_e: parsed.option_e,
          correct_index: parsed.correct_index,
          explanation: parsed.explanation,
          rationale_map: parsed.rationale_map,
          difficulty: parsed.difficulty,
          exam_style: parsed.exam_style,
          status: "needs_review",
        }).select("id").single();

        if (insertErr) throw insertErr;

        results.push({
          asset_id: asset.id,
          asset_code: assetCode,
          status: "created",
          question_id: inserted?.id,
        });

        console.log(`[generate][${assetCode}] ✅ Questão criada: ${qCode}`);

      } catch (e) {
        console.error(`[generate][${assetCode}] Erro:`, e);
        results.push({
          asset_id: asset.id,
          asset_code: assetCode,
          status: "failed",
          stage: "runtime",
          error: (e as Error).message,
        });
      }

      // Delay between calls
      if (i < assets.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    const created = results.filter(r => r.status === "created").length;
    const rejected = results.filter(r => r.status === "rejected").length;
    const failed = results.filter(r => r.status === "failed").length;

    return ok({ success: true, created, rejected, failed, total: assets.length, results });

  } catch (e) {
    console.error("[FATAL] generate-image-questions:", e);
    return errResp(500, (e as Error).message || "Erro desconhecido", "fatal");
  }
});
