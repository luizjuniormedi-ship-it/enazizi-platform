import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Check admin role
    const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem executar upgrades" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { batch_size = 5 } = await req.json().catch(() => ({}));
    const limit = Math.min(batch_size, 10);

    // Fetch draft questions with their assets
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

    if (fetchErr) throw new Error(`Erro ao buscar questões: ${fetchErr.message}`);
    if (!drafts || drafts.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhuma questão em draft encontrada", upgraded: 0, failed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ id: string; code: string; status: string; error?: string }> = [];

    for (const draft of drafts) {
      const asset = (draft as any).medical_image_assets;
      try {
        const upgraded = await upgradeQuestion(draft, asset);
        if (!upgraded) {
          results.push({ id: draft.id, code: draft.question_code, status: "invalid", error: "IA não conseguiu gerar padrão alto" });
          continue;
        }

        // Validate minimum quality
        if (upgraded.statement.length < 400) {
          results.push({ id: draft.id, code: draft.question_code, status: "rejected", error: `Enunciado curto: ${upgraded.statement.length} chars` });
          continue;
        }
        if (upgraded.explanation.length < 120) {
          results.push({ id: draft.id, code: draft.question_code, status: "rejected", error: `Explicação curta: ${upgraded.explanation.length} chars` });
          continue;
        }

        // Update the question
        const { error: updateErr } = await sb
          .from("medical_image_questions")
          .update({
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
            status: "published",
          })
          .eq("id", draft.id);

        if (updateErr) {
          results.push({ id: draft.id, code: draft.question_code, status: "error", error: updateErr.message });
        } else {
          results.push({ id: draft.id, code: draft.question_code, status: "upgraded" });
        }
      } catch (e) {
        results.push({ id: draft.id, code: draft.question_code, status: "error", error: e.message });
      }

      // Small delay between AI calls
      await new Promise(r => setTimeout(r, 500));
    }

    const upgraded = results.filter(r => r.status === "upgraded").length;
    const failed = results.filter(r => r.status !== "upgraded").length;

    return new Response(JSON.stringify({ upgraded, failed, total: drafts.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("upgrade-image-questions error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function upgradeQuestion(draft: any, asset: any): Promise<any | null> {
  const findings = Array.isArray(asset.clinical_findings)
    ? asset.clinical_findings.join(", ")
    : String(asset.clinical_findings || "");
  const distractors = Array.isArray(asset.distractors)
    ? asset.distractors.join(", ")
    : String(asset.distractors || "");

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

== QUESTÃO ATUAL (RASCUNHO — PRECISA UPGRADE) ==
Enunciado: ${draft.statement}
A) ${draft.option_a}
B) ${draft.option_b}
C) ${draft.option_c}
D) ${draft.option_d}
E) ${draft.option_e}
Gabarito: alternativa índice ${draft.correct_index}
Explicação: ${draft.explanation}

== REGRAS ABSOLUTAS ==
1. O enunciado DEVE ter >= 400 caracteres e conter:
   - Identificação do paciente (idade, sexo, profissão quando relevante)
   - Contexto clínico (onde está sendo atendido)
   - História da doença atual (HDA) detalhada
   - Dados de exame físico relevantes
   - Menção ao exame de imagem e seus achados principais
   - Pergunta final objetiva

2. As 5 alternativas devem ser:
   - Plausíveis clinicamente
   - Sem alternativa absurda
   - Uma correta e quatro incorretas mas defensáveis para quem não domina o tema

3. A explicação DEVE ter >= 120 caracteres e:
   - Justificar por que a correta é correta
   - Explicar por que cada errada está errada
   - Citar achados relevantes da imagem

4. PROIBIDO:
   - Enunciado tipo "Qual o diagnóstico deste ECG?"
   - Alternativa absurda (ex: "Resfriado comum" em questão de ECG)
   - Explicação rasa tipo "É clássico de X"
   - Qualquer texto em inglês

5. O paciente deve ter perfil ÚNICO e variado (nome regional brasileiro, idade específica, comorbidades relevantes)

Retorne APENAS um JSON válido sem markdown:
{
  "statement": "caso clínico completo >= 400 chars",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "option_d": "...",
  "option_e": "...",
  "correct_index": 0,
  "explanation": "explicação robusta >= 120 chars",
  "rationale_map": {"A":"...","B":"...","C":"...","D":"...","E":"..."},
  "difficulty": "easy|medium|hard",
  "exam_style": "ENARE"
}

Se não conseguir atingir o padrão, retorne: {"invalid": true, "reason": "..."}`;

  const response = await aiFetch({
    messages: [{ role: "user", content: prompt }],
    model: "google/gemini-2.5-flash",
    maxTokens: 4096,
  });

  if (!response.ok) {
    throw new Error(`AI response error: ${response.status}`);
  }

  const aiData = await response.json();
  const rawContent = aiData.choices?.[0]?.message?.content || "";
  const content = rawContent.replace(/[\x00-\x1F\x7F]/g, (ch: string) =>
    ch === "\n" || ch === "\r" || ch === "\t" ? ch : " "
  );

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Sem JSON na resposta da IA");

  const parsed = JSON.parse(jsonMatch[0]);

  if (parsed.invalid) return null;

  // Validate required fields
  const required = ["statement", "option_a", "option_b", "option_c", "option_d", "option_e", "correct_index", "explanation", "rationale_map", "difficulty", "exam_style"];
  for (const field of required) {
    if (!(field in parsed)) throw new Error(`Campo obrigatório ausente: ${field}`);
  }

  return parsed;
}
