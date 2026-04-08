import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not set" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size || 2, 5);
    const imageType = body.image_type || null;

    // Find ALL real assets with images
    let query = supabase
      .from("medical_image_assets")
      .select("id, asset_code, diagnosis, image_type, clinical_findings, image_url")
      .eq("asset_origin", "real_clinical")
      .not("image_url", "is", null)
      .limit(200);

    if (imageType) query = query.eq("image_type", imageType);

    const { data: assets, error } = await query;
    if (error || !assets?.length) {
      return new Response(JSON.stringify({ message: "No assets to process", error: error?.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get ALL non-rejected questions to find which assets need new ones
    const { data: existingQ } = await supabase
      .from("medical_image_questions")
      .select("asset_id")
      .neq("status", "rejected");

    const existingAssetIds = new Set((existingQ || []).map(q => q.asset_id));
    const needsQuestions = assets.filter(a => !existingAssetIds.has(a.id)).slice(0, batchSize);

    if (needsQuestions.length === 0) {
      return new Response(JSON.stringify({ message: "All assets already have questions", total_assets: assets.length, with_questions: existingAssetIds.size }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalGenerated = 0;
    const results: any[] = [];

    for (const asset of needsQuestions) {
      console.log(`Generating questions for: ${asset.diagnosis} (${asset.image_type})`);

      const prompt = `Você é um professor de medicina especialista criando questões para residência médica.

CONTEXTO:
- Tipo de exame: ${asset.image_type.toUpperCase()}
- Diagnóstico: ${asset.diagnosis}
- Achados clínicos: ${JSON.stringify(asset.clinical_findings || {})}

Gere EXATAMENTE 3 questões de múltipla escolha sobre esta imagem clínica.

REGRAS:
1. Enunciado com contexto clínico realista, MÍNIMO 400 caracteres
2. Paciente com idade, sexo, queixa principal, história
3. EXATAMENTE 5 alternativas (A a E), cada uma com 80+ caracteres
4. Explicação detalhada MÍNIMO 200 caracteres
5. Dificuldade variada: 1 fácil (2), 1 média (3), 1 difícil (4)
6. Estilo de prova USP/UNIFESP/ENARE
7. Português brasileiro, sem markdown, sem caracteres especiais

Retorne APENAS um array JSON válido:
[{"statement":"...","options":["A) ...","B) ...","C) ...","D) ...","E) ..."],"correct_index":0,"explanation":"...","difficulty":3,"exam_style":"USP","topic":"...","subtopic":"..."}]`;

      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
          }),
        });

        if (!aiResp.ok) {
          const errText = await aiResp.text();
          console.error(`AI error (${aiResp.status}): ${errText}`);
          results.push({ asset: asset.diagnosis, error: `AI ${aiResp.status}` });
          continue;
        }

        const aiData = await aiResp.json();
        const content = aiData?.choices?.[0]?.message?.content || "";

        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          console.error("No JSON found for:", asset.diagnosis, "content:", content.substring(0, 200));
          results.push({ asset: asset.diagnosis, error: "No JSON" });
          continue;
        }

        let questions;
        try { 
          // Clean common issues
          let cleaned = jsonMatch[0]
            .replace(/```json/g, "").replace(/```/g, "")
            .replace(/,\s*]/g, "]").replace(/,\s*}/g, "}")
            .replace(/[\x00-\x1F\x7F]/g, " ");
          questions = JSON.parse(cleaned); 
        } catch (parseErr) {
          console.error("JSON parse error for:", asset.diagnosis, "raw:", jsonMatch[0].substring(0, 300));
          results.push({ asset: asset.diagnosis, error: "Parse error" });
          continue;
        }

        const cleanText = (t: string) => t
          .replace(/\*\*/g, "").replace(/##/g, "").replace(/\\n/g, " ")
          .replace(/[#*_~`]/g, "").replace(/\s{2,}/g, " ")
          .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ")
          .replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, "")
          .trim();

        let inserted = 0;
        for (const q of questions) {
          if (!q.statement || q.statement.length < 200 || !q.options || q.options.length < 5) continue;

          const opts = q.options || [];
          const cleanOpt = (o: string) => cleanText(o).replace(/^[A-E]\)\s*/, "");

          const qCode = `IMG-${asset.image_type.toUpperCase()}-${Date.now()}-${inserted}`;
          const { error: insErr } = await supabase.from("medical_image_questions").insert({
            asset_id: asset.id,
            question_code: qCode,
            statement: cleanText(q.statement),
            option_a: cleanOpt(opts[0] || ""),
            option_b: cleanOpt(opts[1] || ""),
            option_c: cleanOpt(opts[2] || ""),
            option_d: cleanOpt(opts[3] || ""),
            option_e: cleanOpt(opts[4] || ""),
            correct_index: q.correct_index ?? 0,
            explanation: cleanText(q.explanation || ""),
            difficulty: q.difficulty <= 2 ? "easy" : q.difficulty >= 4 ? "hard" : "medium",
            exam_style: q.exam_style || "USP",
            status: "needs_review",
          });

          if (!insErr) inserted++;
          else console.error("Insert error:", insErr.message);
        }

        totalGenerated += inserted;
        results.push({ asset: asset.diagnosis, type: asset.image_type, generated: inserted });
        console.log(`✓ ${inserted} questions for ${asset.diagnosis}`);

      } catch (err) {
        console.error("Error:", err);
        results.push({ asset: asset.diagnosis, error: String(err) });
      }

      await new Promise(r => setTimeout(r, 1000));
    }

    return new Response(JSON.stringify({
      status: "completed",
      processed: needsQuestions.length,
      questions_generated: totalGenerated,
      results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
