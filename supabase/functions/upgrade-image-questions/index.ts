import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENGLISH_PATTERN = /\b(the|is|are|was|were|this|that|which|what|patient|diagnosis|treatment|clinical|history)\b/gi;
const MIN_STATEMENT_LEN = 400;
const MIN_EXPLANATION_LEN = 120;

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateUpgradedQuestion(q: any): ValidationResult {
  const errors: string[] = [];

  if (!q.statement || q.statement.length < MIN_STATEMENT_LEN)
    errors.push(`statement curto: ${q.statement?.length || 0} chars (min ${MIN_STATEMENT_LEN})`);
  if (!q.explanation || q.explanation.length < MIN_EXPLANATION_LEN)
    errors.push(`explanation curta: ${q.explanation?.length || 0} chars (min ${MIN_EXPLANATION_LEN})`);

  for (const opt of ["option_a", "option_b", "option_c", "option_d", "option_e"]) {
    if (!q[opt] || q[opt].trim().length === 0) errors.push(`${opt} ausente ou vazio`);
  }

  if (typeof q.correct_index !== "number" || q.correct_index < 0 || q.correct_index > 4)
    errors.push(`correct_index inválido: ${q.correct_index}`);

  if (!q.rationale_map || typeof q.rationale_map !== "object") {
    errors.push("rationale_map ausente");
  } else {
    for (const key of ["A", "B", "C", "D", "E"]) {
      if (!q.rationale_map[key] || q.rationale_map[key].trim().length === 0)
        errors.push(`rationale_map.${key} ausente ou vazio`);
    }
  }

  if (!q.difficulty || !["easy", "medium", "hard"].includes(q.difficulty))
    errors.push(`difficulty inválido: ${q.difficulty}`);

  if (!q.exam_style) errors.push("exam_style ausente");

  // Check for English content
  const fullText = `${q.statement} ${q.explanation} ${q.option_a} ${q.option_b} ${q.option_c} ${q.option_d} ${q.option_e}`;
  const englishMatches = fullText.match(ENGLISH_PATTERN) || [];
  if (englishMatches.length > 3)
    errors.push(`conteúdo em inglês detectado: ${englishMatches.slice(0, 5).join(", ")}`);

  return { valid: errors.length === 0, errors };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await sb.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Apenas administradores" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { action = "upgrade", batch_size = 3, question_id } = body;
    const ok = (data: unknown) => new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // --- ACTION: stats ---
    if (action === "stats") {
      const { data: stats } = await sb.rpc("", {}).catch(() => ({ data: null }));
      // Manual query for stats
      const counts: Record<string, number> = {};
      for (const status of ["draft", "upgrading", "upgraded", "needs_review", "published", "rejected"]) {
        const { count } = await sb.from("medical_image_questions").select("id", { count: "exact", head: true }).eq("status", status);
        counts[status] = count || 0;
      }

      const { data: recentErrors } = await sb
        .from("image_question_audit_log")
        .select("question_id, previous_status, new_status, reason, created_at")
        .eq("new_status", "rejected")
        .order("created_at", { ascending: false })
        .limit(10);

      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const failRate = total > 0 ? ((counts.rejected || 0) / total * 100).toFixed(1) : "0";

      return ok({ counts, total, fail_rate_pct: failRate, recent_errors: recentErrors || [] });
    }

    // --- ACTION: publish (move needs_review → published) ---
    if (action === "publish") {
      if (!question_id) return ok({ error: "question_id obrigatório" });

      const { data: q } = await sb.from("medical_image_questions")
        .select("id, status, statement, explanation, option_a, option_b, option_c, option_d, option_e, correct_index, rationale_map, difficulty, exam_style")
        .eq("id", question_id).single();

      if (!q) return ok({ error: "Questão não encontrada" });
      if (q.status !== "needs_review") return ok({ error: `Status inválido para publicação: ${q.status}` });

      const validation = validateUpgradedQuestion(q);
      if (!validation.valid) {
        await sb.from("medical_image_questions").update({ status: "rejected" }).eq("id", question_id);
        return ok({ error: "Falhou validação final", errors: validation.errors });
      }

      await sb.from("medical_image_questions").update({ status: "published" }).eq("id", question_id);
      return ok({ published: true, question_id });
    }

    // --- ACTION: publish_all (batch publish all needs_review) ---
    if (action === "publish_all") {
      const { data: pending } = await sb.from("medical_image_questions")
        .select("id, statement, explanation, option_a, option_b, option_c, option_d, option_e, correct_index, rationale_map, difficulty, exam_style")
        .eq("status", "needs_review")
        .limit(50);

      let published = 0, rejected = 0;
      for (const q of (pending || [])) {
        const v = validateUpgradedQuestion(q);
        if (v.valid) {
          await sb.from("medical_image_questions").update({ status: "published" }).eq("id", q.id);
          published++;
        } else {
          await sb.from("medical_image_questions").update({ status: "rejected" }).eq("id", q.id);
          rejected++;
        }
      }
      return ok({ published, rejected, total: (pending || []).length });
    }

    // --- ACTION: upgrade (default) ---
    const limit = Math.min(batch_size, 5);

    const { data: drafts, error: fetchErr } = await sb
      .from("medical_image_questions")
      .select(`
        id, question_code, statement, option_a, option_b, option_c, option_d, option_e,
        correct_index, explanation, rationale_map, difficulty, exam_style,
        asset_id,
        medical_image_assets!inner (
          asset_code, image_type, specialty, subtopic, diagnosis,
          clinical_findings, distractors, difficulty
        )
      `)
      .eq("status", "draft")
      .limit(limit);

    if (fetchErr) throw new Error(`Erro ao buscar: ${fetchErr.message}`);
    if (!drafts || drafts.length === 0) {
      return ok({ message: "Nenhuma questão em draft", upgraded: 0, failed: 0, needs_review: 0 });
    }

    // Mark all as "upgrading" first
    const ids = drafts.map(d => d.id);
    await sb.from("medical_image_questions").update({ status: "upgrading" }).in("id", ids);

    const results: Array<{ id: string; code: string; status: string; error?: string }> = [];

    for (const draft of drafts) {
      const asset = (draft as any).medical_image_assets;
      try {
        const upgraded = await callAiUpgrade(draft, asset);

        if (!upgraded) {
          await sb.from("medical_image_questions").update({ status: "rejected" }).eq("id", draft.id);
          results.push({ id: draft.id, code: draft.question_code, status: "rejected", error: "IA não conseguiu gerar padrão alto" });
          continue;
        }

        // Validate
        const validation = validateUpgradedQuestion(upgraded);

        if (!validation.valid) {
          // Save upgraded content but mark as rejected
          await sb.from("medical_image_questions").update({
            statement: upgraded.statement || draft.statement,
            explanation: upgraded.explanation || draft.explanation,
            status: "rejected",
          }).eq("id", draft.id);
          results.push({ id: draft.id, code: draft.question_code, status: "rejected", error: validation.errors.join("; ") });
          continue;
        }

        // Save as needs_review (passed auto-validation)
        await sb.from("medical_image_questions").update({
          statement: upgraded.statement,
          option_a: upgraded.option_a,
          option_b: upgraded.option_b,
          option_c: upgraded.option_c,
          option_d: upgraded.option_d,
          option_e: upgraded.option_e,
          correct_index: upgraded.correct_index,
          explanation: upgraded.explanation,
          rationale_map: upgraded.rationale_map,
          difficulty: upgraded.difficulty,
          exam_style: upgraded.exam_style,
          status: "needs_review",
        }).eq("id", draft.id);

        results.push({ id: draft.id, code: draft.question_code, status: "needs_review" });
      } catch (e) {
        // On error, revert to draft so it can be retried
        await sb.from("medical_image_questions").update({ status: "draft" }).eq("id", draft.id);
        results.push({ id: draft.id, code: draft.question_code, status: "error", error: e.message });
      }

      await new Promise(r => setTimeout(r, 500));
    }

    const upgraded = results.filter(r => r.status === "needs_review").length;
    const failed = results.filter(r => r.status === "rejected").length;
    const errors = results.filter(r => r.status === "error").length;

    return ok({ upgraded, failed, errors, total: drafts.length, results });
  } catch (e) {
    console.error("upgrade-image-questions error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function callAiUpgrade(draft: any, asset: any): Promise<any | null> {
  const findings = Array.isArray(asset.clinical_findings) ? asset.clinical_findings.join(", ") : String(asset.clinical_findings || "");
  const distractors = Array.isArray(asset.distractors) ? asset.distractors.join(", ") : String(asset.distractors || "");

  const prompt = `IDIOMA OBRIGATÓRIO: TUDO em PORTUGUÊS BRASILEIRO (pt-BR). NUNCA use inglês.

Você é um examinador de prova de Residência Médica (ENARE/USP).

TAREFA: Reescrever completamente a questão abaixo para padrão de prova real de alta concorrência.

== DADOS DO ASSET DE IMAGEM ==
Tipo: ${asset.image_type}
Especialidade: ${asset.specialty}
Subtema: ${asset.subtopic}
Diagnóstico: ${asset.diagnosis}
Achados clínicos na imagem: ${findings}
Distratores do asset: ${distractors}
Dificuldade do asset: ${asset.difficulty}

== QUESTÃO ATUAL (RASCUNHO) ==
Enunciado: ${draft.statement}
A) ${draft.option_a}  B) ${draft.option_b}  C) ${draft.option_c}  D) ${draft.option_d}  E) ${draft.option_e}
Gabarito: índice ${draft.correct_index}
Explicação: ${draft.explanation}

== REGRAS ABSOLUTAS ==
1. Enunciado >= 400 caracteres com: identificação, contexto, HDA, exame físico, conexão com imagem, pergunta
2. 5 alternativas plausíveis (sem absurdas), 1 correta
3. Explicação >= 120 caracteres justificando correta e erradas
4. rationale_map com chaves A-E preenchidas
5. difficulty: easy|medium|hard
6. exam_style: ENARE ou USP
7. Paciente com perfil único brasileiro
8. PROIBIDO: enunciado curto, frase seca, alternativa absurda, texto em inglês

Retorne APENAS JSON válido sem markdown:
{"statement":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","option_e":"...","correct_index":0,"explanation":"...","rationale_map":{"A":"...","B":"...","C":"...","D":"...","E":"..."},"difficulty":"...","exam_style":"ENARE"}

Se não atingir padrão: {"invalid":true,"reason":"..."}`;

  const response = await aiFetch({
    messages: [{ role: "user", content: prompt }],
    model: "google/gemini-2.5-flash",
    maxTokens: 4096,
  });

  if (!response.ok) throw new Error(`AI error: ${response.status}`);

  const aiData = await response.json();
  const rawContent = aiData.choices?.[0]?.message?.content || "";
  const content = rawContent.replace(/[\x00-\x1F\x7F]/g, (ch: string) =>
    ch === "\n" || ch === "\r" || ch === "\t" ? ch : " "
  );

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Sem JSON na resposta da IA");

  const parsed = JSON.parse(jsonMatch[0]);
  if (parsed.invalid) return null;

  const required = ["statement", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_index", "explanation", "rationale_map"];
  for (const field of required) {
    if (!(field in parsed)) throw new Error(`Campo ausente: ${field}`);
  }

  // Default difficulty/exam_style if missing
  if (!parsed.difficulty) parsed.difficulty = asset.difficulty || "medium";
  if (!parsed.exam_style) parsed.exam_style = "ENARE";

  return parsed;
}
