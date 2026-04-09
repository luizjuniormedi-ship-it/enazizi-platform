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

// ── Clinical Contradiction Detector (inline for edge function) ──
const CLINICAL_CONTRADICTION_RULES: Array<{
  diag: RegExp;
  required: RegExp[];
  label: string;
  severity: "grave" | "moderado" | "leve";
}> = [
  { diag: /\b(dpoc|doença pulmonar obstrutiva crônica|enfisema)\b/i, required: [/\b(tabag|fumo|fumante|ex-fumante|ex-tabagista|cigarro|maços?[- ]?ano|carga tabág)/i], label: "DPOC sem tabagismo", severity: "grave" },
  { diag: /\b(pneumonia|broncopneumonia|pnm)\b/i, required: [/\b(tosse|dispneia|febre|taqui[pn]|estertores?|crepitações?|expectoração)\b/i], label: "Pneumonia sem sintomas respiratórios", severity: "grave" },
  { diag: /\b(iam|infarto agudo|infarto do miocárdio|sca|síndrome coronariana aguda)\b/i, required: [/\b(dor|precordial|retroesternal|opressão|angina|troponina|supra|infra|ECG|eletrocardiograma)\b/i], label: "IAM sem dor/ECG/marcadores", severity: "grave" },
  { diag: /\b(avc|acidente vascular cerebral)\b/i, required: [/\b(déficit|paresia|plégia|afasia|disartria|hemipar|hemipleg|desvio|anisocoria|rebaixamento)\b/i], label: "AVC sem déficit neurológico", severity: "grave" },
  { diag: /\b(meningite)\b/i, required: [/\b(febre|rigidez de nuca|cefaleia|kernig|brudzinski|fotofobia|líquor)\b/i], label: "Meningite sem sinais meníngeos", severity: "grave" },
  { diag: /\b(tep|tromboembolismo pulmonar|embolia pulmonar)\b/i, required: [/\b(dispneia|taquicardia|dor torác|hemoptise|hipoxemia|d-?dímero)\b/i], label: "TEP sem dispneia/taquicardia", severity: "grave" },
  { diag: /\b(cetoacidose diabética|cad)\b/i, required: [/\b(glicemia|glicose|acidose|pH|bicarbonato|kussmaul|cetonúria|cetona)\b/i], label: "CAD sem hiperglicemia/acidose", severity: "grave" },
  { diag: /\b(apendicite)\b/i, required: [/\b(dor abdominal|FID|fossa ilíaca|blumberg|rovsing|mcburney)\b/i], label: "Apendicite sem dor em FID", severity: "grave" },
  { diag: /\b(tuberculose|tb pulmonar)\b/i, required: [/\b(tosse|febre|sudorese noturna|emagrecimento|hemoptise|BAAR|escarro)\b/i], label: "TB sem tosse ou sintomas constitucionais", severity: "grave" },
  { diag: /\b(insuficiência cardíaca|ic descompensada|icc)\b/i, required: [/\b(dispneia|edema|jugular|ortopneia|B3|crepitações?|congestão|BNP)\b/i], label: "IC sem congestão ou dispneia", severity: "grave" },
  { diag: /\b(melanoma)\b/i, required: [/\b(lesão|nevo|assimetria|borda|cor|diâmetro|ABCDE|pigmentad)\b/i], label: "Melanoma sem lesão cutânea", severity: "grave" },
  { diag: /\b(eclâmpsia|pré-eclâmpsia)\b/i, required: [/\b(hipertensão|PA |pressão arterial|proteinúria|gestante|grávida|semanas)\b/i], label: "Pré-eclâmpsia sem HAS em gestante", severity: "grave" },
  { diag: /\b(retinopatia diabética)\b/i, required: [/\b(diabetes|diabétic|microaneurisma|exsudato|hemorragia|fundoscopia)\b/i], label: "Retinopatia diabética sem diabetes", severity: "grave" },
  { diag: /\b(glaucoma)\b/i, required: [/\b(pressão intraocular|PIO|campo visual|escavação|disco óptico|tonometria)\b/i], label: "Glaucoma sem PIO ou alteração de disco", severity: "moderado" },
  { diag: /\b(dengue)\b/i, required: [/\b(febre|mialgia|cefaleia|retro-?orbit|plaquetopenia|prova do laço)\b/i], label: "Dengue sem febre ou mialgia", severity: "grave" },
  { diag: /\b(pancreatite aguda)\b/i, required: [/\b(dor abdominal|epigástr|amilase|lipase|irradiação para dorso)\b/i], label: "Pancreatite sem dor/marcadores", severity: "grave" },
  { diag: /\b(bronquiolite)\b/i, required: [/\b(lactente|meses|sibil|taqui[pn]|dispneia|tiragem|VSR)\b/i], label: "Bronquiolite sem lactente/sintomas", severity: "grave" },
];

function detectContradictions(statement: string, diagnosis: string, explanation?: string): { has_contradiction: boolean; severity: string; issues: string[] } {
  const issues: string[] = [];
  let worst = "none";
  const text = `${statement} ${explanation || ""}`.toLowerCase();
  const severityRank: Record<string, number> = { none: 0, leve: 1, moderado: 2, grave: 3 };

  for (const rule of CLINICAL_CONTRADICTION_RULES) {
    if (!rule.diag.test(diagnosis)) continue;
    const hasRequired = rule.required.some(p => p.test(text));
    if (!hasRequired) {
      issues.push(rule.label);
      if (severityRank[rule.severity] > severityRank[worst]) worst = rule.severity;
    }
  }
  return { has_contradiction: issues.length > 0, severity: worst, issues };
}

function buildPrompt(asset: any, studentPerf?: any): string {
  const findings = Array.isArray(asset.clinical_findings) ? asset.clinical_findings.join(", ") : String(asset.clinical_findings || "");
  const distractors = Array.isArray(asset.distractors) ? asset.distractors.join(", ") : String(asset.distractors || "");
  const examStyle = asset.exam_style || "ENARE";

  // Adaptive strategy block
  let adaptiveBlock = "";
  if (studentPerf) {
    const weakMods = Object.entries(studentPerf.by_modality || {})
      .filter(([, v]: any) => (v as any).accuracy < 0.5)
      .map(([k]) => k);
    const errorFocus = studentPerf.error_patterns?.top_category || "";
    adaptiveBlock = `
== ESTRATÉGIA ADAPTATIVA (baseada no aluno) ==
Modalidades fracas: ${weakMods.join(", ") || "nenhuma"}
Padrão de erro dominante: ${errorFocus || "não identificado"}
Tempo médio de resposta: ${studentPerf.response_time || "N/A"}s
→ Priorizar: ${weakMods.length > 0 ? "questões HARD + estilo USP/ENARE" : "distribuição equilibrada"}
→ Foco: ${errorFocus === "conduta" ? "conduta terapêutica" : errorFocus === "imagem" ? "interpretação visual obrigatória" : "diagnóstico diferencial"}
`;
  }

  return `IDIOMA OBRIGATÓRIO: TUDO em PORTUGUÊS BRASILEIRO (pt-BR). NUNCA use inglês.

Você é um SISTEMA INTELIGENTE COMPLETO DE TREINAMENTO MÉDICO.
Você atua simultaneamente como: banca examinadora (USP, SUS-SP, ENARE, UNIFESP), auditor clínico, auditor pedagógico e motor de melhoria contínua.

MISSÃO: Gerar 3 questões PERFEITAS, validar internamente e retornar APENAS as aprovadas.
Se QUALQUER erro existir → REESCREVER até ficar correta. NUNCA retorne questão com erro.

== ASSET ==
Tipo de imagem: ${asset.image_type || "N/A"}
Especialidade: ${asset.specialty || "N/A"}
Subtema: ${asset.subtopic || "N/A"}
Diagnóstico correto: ${asset.diagnosis || "N/A"}
Achados clínicos: ${findings || "N/A"}
Distratores: ${distractors || "N/A"}
Estilo da banca: ${examStyle}
${asset.tri_a !== undefined ? `TRI a: ${asset.tri_a}` : ""}
${asset.tri_b !== undefined ? `TRI b: ${asset.tri_b}` : ""}
${asset.tri_c !== undefined ? `TRI c: ${asset.tri_c}` : ""}
${adaptiveBlock}

== GERE EXATAMENTE 3 QUESTÕES ==
Q1: diagnóstico direto, difficulty: medium, exam_style: ENARE
Q2: diagnóstico diferencial, difficulty: hard, exam_style: USP
Q3: conduta clínica, difficulty: hard, exam_style: SUS-SP

== REGRAS ANTI-ERRO ==

1. COERÊNCIA CLÍNICA ABSOLUTA
- Caso DEVE ser compatível com o diagnóstico
- DPOC EXIGE tabagismo. IAM EXIGE dor/ECG/marcador. AVC EXIGE déficit focal. Pneumonia EXIGE sintoma respiratório.
- Se o diagnóstico exigir um achado obrigatório e ele estiver ausente → REESCREVER

2. COERÊNCIA COM IMAGEM
- Usar achados REAIS do asset (clinical_findings)
- NÃO inventar achados
- Menção natural: "O ECG evidencia...", "A radiografia mostra..."
- PROIBIDO: "observe a imagem abaixo", "veja a figura", "imagem apresentada"

3. ESSENCIALIDADE DA IMAGEM
- A questão NÃO PODE ser respondida sem ver a imagem
- Se for possível responder só com o enunciado → REESCREVER
- A imagem deve conter a informação-chave para o diagnóstico

4. ALTERNATIVAS (5 opções A-E)
- Plausíveis, mesmo nível técnico, sem resposta óbvia
- correct_index DIFERENTE nas 3 questões (distribuir A-E)
- Usar distratores clínicos fornecidos quando possível

5. EXPLICAÇÃO (>= 200 caracteres)
- Raciocínio clínico completo
- Justificar por que CADA errada está errada
- Citar achados da imagem

6. DIVERSIDADE OBRIGATÓRIA
- Contexto clínico diferente (idade, sexo, cenário)
- Pergunta final diferente
- Raciocínio diferente
- NÃO reescrever a mesma questão
- Sobreposição > 70% → REJEITAR e REFAZER

7. ENUNCIADO (>= 400 caracteres)
- Caso clínico completo: idade, sexo, HDA, exame físico, contexto real (PS, ambulatório, UBS)
- Pelo menos 1 dado de exame complementar quando pertinente

== AJUSTE POR BANCA ==
${examStyle === "ENARE" ? "ENARE: objetivo, alta incidência, correlação clínico-prática" : ""}
${examStyle === "USP" ? "USP: distratores refinados, integração fisiopatológica profunda" : ""}
${examStyle === "UNIFESP" ? "UNIFESP: diagnóstico diferencial aprofundado" : ""}
${examStyle === "SUS-SP" ? "SUS-SP: conduta e raciocínio aplicado" : ""}

== AUTO-VALIDAÇÃO INTERNA (OBRIGATÓRIA ANTES DE RETORNAR) ==
Para CADA questão, verificar internamente:
1. Contradição clínica? → corrigir
2. Possível responder sem imagem? → reescrever
3. Mais de uma resposta possível? → corrigir
4. Alternativas vagas? → corrigir
5. Questões parecidas? → reescrever
6. Explicação rasa (< 200 chars)? → expandir
7. Enunciado curto (< 400 chars)? → expandir

== SCORE INTERNO (calcular para cada questão) ==
- coerência clínica: 0-25
- uso da imagem: 0-20
- nível de prova: 0-20
- alternativas: 0-15
- explicação: 0-10
- valor pedagógico: 0-10
Se score < 75 → NÃO retornar essa questão. Reescrever.

== SAÍDA ==
Retorne APENAS JSON array válido (sem markdown, sem comentários):
[
  {
    "statement": "...",
    "image_description": "...",
    "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...", "option_e": "...",
    "correct_index": 0,
    "explanation": "...",
    "rationale_map": {"A":"...","B":"...","C":"...","D":"...","E":"..."},
    "difficulty": "medium",
    "exam_style": "${examStyle}",
    "internal_score": 90,
    "multimodal_strength": "strong"
  }
]

Se NÃO conseguir atingir qualidade → retorne: {"invalid":true,"reason":"..."}`;
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

        // Validate structure
        const validation = validateGenerated(parsed);
        if (!validation.valid) {
          console.warn(`[generate][${assetCode}] Validação falhou: ${validation.errors.join("; ")}`);
          results.push({ asset_id: asset.id, asset_code: assetCode, status: "rejected", stage: "validation", error: validation.errors.join("; ") });
          continue;
        }

        // Clinical contradiction check
        const contradiction = detectContradictions(parsed.statement, asset.diagnosis || "", parsed.explanation);
        if (contradiction.has_contradiction && contradiction.severity === "grave") {
          console.warn(`[generate][${assetCode}] ❌ Contradição clínica GRAVE: ${contradiction.issues.join("; ")}`);
          results.push({ asset_id: asset.id, asset_code: assetCode, status: "rejected", stage: "clinical_contradiction", error: `Contradição grave: ${contradiction.issues.join("; ")}` });
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
