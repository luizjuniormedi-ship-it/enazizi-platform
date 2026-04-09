import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch, parseAiJson, cleanQuestionText } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_QUESTIONS_PER_ASSET = 3;
const BATCH_SIZE = 3; // assets per invocation
const MIN_STATEMENT = 400;
const MIN_EXPLANATION = 120;
const ENGLISH_PATTERN = /\b(the|is|are|was|were|this|that|which|what|patient|diagnosis|treatment|clinical|history)\b/gi;

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validateQuestion(q: any): string[] {
  const errors: string[] = [];
  if (!q.statement || q.statement.length < MIN_STATEMENT) errors.push(`statement curto: ${q.statement?.length || 0}`);
  if (!q.explanation || q.explanation.length < MIN_EXPLANATION) errors.push(`explanation curta: ${q.explanation?.length || 0}`);
  for (const opt of ["option_a", "option_b", "option_c", "option_d", "option_e"]) {
    if (!q[opt] || q[opt].trim().length === 0) errors.push(`${opt} ausente`);
  }
  if (typeof q.correct_index !== "number" || q.correct_index < 0 || q.correct_index > 4) errors.push("correct_index inválido");
  if (!q.rationale_map || typeof q.rationale_map !== "object") {
    errors.push("rationale_map ausente");
  } else {
    for (const key of ["A", "B", "C", "D", "E"]) {
      if (!q.rationale_map[key] || q.rationale_map[key].trim().length === 0) errors.push(`rationale_map.${key} vazio`);
    }
  }
  if (!q.difficulty || !["easy", "medium", "hard"].includes(q.difficulty)) errors.push("difficulty inválido");
  const fullText = `${q.statement || ""} ${q.explanation || ""}`;
  const eng = fullText.match(ENGLISH_PATTERN) || [];
  if (eng.length > 3) errors.push("conteúdo em inglês");
  return errors;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Find assets that have < 3 published questions and are active+validated
    const { data: assets, error: assetErr } = await sb.rpc("get_assets_needing_questions", {
      max_q: MAX_QUESTIONS_PER_ASSET,
      lim: BATCH_SIZE,
    });

    // Fallback: if RPC doesn't exist, do a manual query
    let targetAssets: any[] = [];
    if (assetErr || !assets) {
      console.log("[auto-gen] RPC not available, using manual query");
      // Get active published assets with high confidence
      const { data: allAssets } = await sb
        .from("medical_image_assets")
        .select("id, asset_code, image_type, specialty, subtopic, diagnosis, clinical_findings, distractors, difficulty, image_url")
        .eq("is_active", true)
        .eq("review_status", "published")
        .gte("clinical_confidence", 0.9)
        .in("validation_level", ["gold", "silver"])
        .limit(50);

      if (!allAssets || allAssets.length === 0) {
        return ok({ success: true, message: "Nenhum asset elegível", generated: 0 });
      }

      // Check how many published questions each has
      for (const asset of allAssets) {
        const { count } = await sb
          .from("medical_image_questions")
          .select("id", { count: "exact", head: true })
          .eq("asset_id", asset.id)
          .in("status", ["published", "needs_review", "draft", "upgrading"]);

        if ((count || 0) < MAX_QUESTIONS_PER_ASSET) {
          targetAssets.push({ ...asset, existing_count: count || 0 });
        }
        if (targetAssets.length >= BATCH_SIZE) break;
      }
    } else {
      targetAssets = assets;
    }

    if (targetAssets.length === 0) {
      return ok({ success: true, message: "Todos os assets já têm 3 questões", generated: 0 });
    }

    console.log(`[auto-gen] Processing ${targetAssets.length} assets`);

    // Create a generation run record
    const { data: run } = await sb
      .from("question_generation_runs")
      .insert({
        run_type: "auto_image_batch",
        status: "running",
        target_assets: targetAssets.length,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    const runId = run?.id;
    let totalGenerated = 0;
    let totalFailed = 0;
    const results: any[] = [];

    for (const asset of targetAssets) {
      const needed = MAX_QUESTIONS_PER_ASSET - (asset.existing_count || 0);
      if (needed <= 0) continue;

      try {
        const findings = Array.isArray(asset.clinical_findings) ? asset.clinical_findings.join(", ") : String(asset.clinical_findings || "");
        const distractors = Array.isArray(asset.distractors) ? asset.distractors.join(", ") : String(asset.distractors || "");

        // Generate trio (or remaining needed)
        const difficulties = ["medium", "hard", "hard"].slice(0, needed);
        const types = [
          "diagnóstico direto (caso clássico)",
          "diagnóstico diferencial (caso atípico)",
          "conduta/manejo clínico",
        ].slice(0, needed);

        const prompt = `IDIOMA OBRIGATÓRIO: TUDO em PORTUGUÊS BRASILEIRO (pt-BR). NUNCA use inglês.

Você é um examinador de prova de Residência Médica nível USP/ENARE.

GERE EXATAMENTE ${needed} questão(ões) médica(s) sobre a imagem descrita abaixo.

== ASSET DE IMAGEM ==
Tipo: ${asset.image_type}
Especialidade: ${asset.specialty || "N/A"}
Subtema: ${asset.subtopic || "N/A"}  
Diagnóstico: ${asset.diagnosis}
Achados clínicos: ${findings || "N/A"}
Distratores: ${distractors || "N/A"}
Dificuldade do asset: ${asset.difficulty || "medium"}

== QUESTÕES A GERAR ==
${difficulties.map((d, i) => `Q${i + 1}: ${types[i]} - difficulty: ${d}`).join("\n")}

== REGRAS ABSOLUTAS ==
1. Enunciado >= 400 caracteres: identificação do paciente, contexto clínico, HDA, exame físico, conexão com achados da imagem, pergunta
2. 5 alternativas plausíveis (NUNCA absurdas), apenas 1 correta
3. Explicação >= 120 caracteres justificando a correta e explicando por que as erradas estão incorretas
4. rationale_map com chaves A-E, cada uma explicando por que correta/incorreta
5. Paciente com perfil brasileiro único (nome, idade, contexto social)
6. A imagem DEVE ser essencial para responder — sem ela, a questão não pode ser resolvida
7. PROIBIDO: frases como "observe a imagem" ou "veja a figura". Integrar achados naturalmente
8. PROIBIDO: texto em inglês, alternativas absurdas, enunciado curto
9. Cada questão DEVE ter perspectiva clínica diferente das demais
10. exam_style: ENARE ou USP

Retorne APENAS um JSON array válido (sem markdown):
[{"statement":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","option_e":"...","correct_index":0,"explanation":"...","rationale_map":{"A":"...","B":"...","C":"...","D":"...","E":"..."},"difficulty":"...","exam_style":"ENARE"}]`;

        const response = await aiFetch({
          messages: [{ role: "user", content: prompt }],
          model: "google/gemini-2.5-flash",
          maxTokens: 8192,
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          throw new Error(`AI ${response.status}: ${errText.slice(0, 200)}`);
        }

        const aiData = await response.json();
        const rawContent = aiData.choices?.[0]?.message?.content || "";
        let parsed = parseAiJson(rawContent);

        // Normalize to array
        if (!Array.isArray(parsed)) parsed = [parsed];

        let assetGenerated = 0;
        for (const q of parsed) {
          if (q.invalid) {
            console.warn(`[auto-gen] AI rejected for ${asset.asset_code}: ${q.reason}`);
            continue;
          }

          // Clean text
          for (const f of ["statement", "option_a", "option_b", "option_c", "option_d", "option_e", "explanation"]) {
            if (typeof q[f] === "string") q[f] = cleanQuestionText(q[f]);
          }

          if (!q.difficulty) q.difficulty = asset.difficulty || "medium";
          if (!q.exam_style) q.exam_style = "ENARE";

          const errors = validateQuestion(q);
          if (errors.length > 0) {
            console.warn(`[auto-gen] Validation failed for ${asset.asset_code}: ${errors.join("; ")}`);
            totalFailed++;
            continue;
          }

          // Generate question code
          const prefix = (asset.image_type || "img").toUpperCase().slice(0, 4);
          const seq = Date.now().toString().slice(-6) + Math.random().toString(36).slice(2, 5);
          const questionCode = `${prefix}-AUTO-${seq}`;

          const { error: insertErr } = await sb.from("medical_image_questions").insert({
            asset_id: asset.id,
            question_code: questionCode,
            statement: q.statement,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            option_e: q.option_e,
            correct_index: q.correct_index,
            explanation: q.explanation,
            rationale_map: q.rationale_map,
            difficulty: q.difficulty,
            exam_style: q.exam_style,
            status: "needs_review",
          });

          if (insertErr) {
            console.error(`[auto-gen] Insert error for ${asset.asset_code}:`, insertErr);
            totalFailed++;
          } else {
            assetGenerated++;
            totalGenerated++;
          }
        }

        results.push({ asset: asset.asset_code, needed, generated: assetGenerated });

        // Rate limit between assets
        await new Promise(r => setTimeout(r, 1000));

      } catch (e) {
        console.error(`[auto-gen] Error processing ${asset.asset_code}:`, e);
        totalFailed++;
        results.push({ asset: asset.asset_code, error: (e as Error).message });
      }
    }

    // Update run
    if (runId) {
      await sb.from("question_generation_runs").update({
        status: totalGenerated > 0 ? "completed" : "failed",
        processed_assets: targetAssets.length,
        generated_questions: totalGenerated,
        failed_assets: totalFailed,
        finished_at: new Date().toISOString(),
        notes: `Auto-batch: ${totalGenerated} geradas, ${totalFailed} falharam`,
      }).eq("id", runId);
    }

    console.log(`[auto-gen] Done: ${totalGenerated} generated, ${totalFailed} failed`);

    return ok({
      success: true,
      generated: totalGenerated,
      failed: totalFailed,
      assets_processed: targetAssets.length,
      results,
    });

  } catch (e) {
    console.error("[auto-gen] FATAL:", e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
