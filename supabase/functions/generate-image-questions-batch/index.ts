import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Safety classification ──────────────────────────────────────
const MULTIMODAL_ALLOWED_ORIGINS = new Set(["real_medical", "validated_medical"]);
const MIN_CONFIDENCE = 0.90;

interface AssetSafetyResult {
  safe: boolean;
  reason?: string;
}

function checkAssetSafety(asset: {
  asset_origin: string;
  review_status: string;
  integrity_status: string;
  clinical_confidence: number;
  is_active: boolean;
  image_url: string | null;
  multimodal_ready?: boolean;
}): AssetSafetyResult {
  if (!asset.image_url) return { safe: false, reason: "no_image_url" };
  if (!asset.is_active) return { safe: false, reason: "asset_inactive" };
  if (asset.multimodal_ready === false) return { safe: false, reason: "multimodal_ready=false" };
  if (!MULTIMODAL_ALLOWED_ORIGINS.has(asset.asset_origin))
    return { safe: false, reason: `origin_blocked:${asset.asset_origin}` };
  if (asset.review_status !== "published")
    return { safe: false, reason: `review_status:${asset.review_status}` };
  if (asset.integrity_status !== "ok")
    return { safe: false, reason: `integrity:${asset.integrity_status}` };
  if ((asset.clinical_confidence ?? 0) < MIN_CONFIDENCE)
    return { safe: false, reason: `low_confidence:${asset.clinical_confidence}` };
  return { safe: true };
}

// ── Log blocked generation ─────────────────────────────────────
async function logSafetyBlock(asset: any, reason: string) {
  await supabase.from("multimodal_safety_log").insert({
    asset_id: asset.id,
    asset_code: asset.asset_code,
    block_reason: reason,
    fallback_used: true,
    asset_origin: asset.asset_origin,
    review_status: asset.review_status,
    integrity_status: asset.integrity_status,
    clinical_confidence: asset.clinical_confidence,
  });
}

// ── Prompt builders ────────────────────────────────────────────
function buildMultimodalMessages(asset: any) {
  const text = `Você é um professor de medicina especialista criando questões para residência médica.

IMPORTANTE: Analise DETALHADAMENTE a imagem clínica fornecida. Suas questões devem ser baseadas nos achados VISÍVEIS na imagem.

CONTEXTO:
- Tipo de exame: ${asset.image_type.toUpperCase()}
- Diagnóstico: ${asset.diagnosis}
- Achados clínicos: ${JSON.stringify(asset.clinical_findings || {})}

Gere EXATAMENTE 3 questões de múltipla escolha sobre esta imagem clínica real.

REGRAS:
1. Descreva achados visíveis na imagem no enunciado (ex: "O ECG mostra supradesnivelamento de ST em derivações V1-V4")
2. Enunciado com contexto clínico realista, MÍNIMO 400 caracteres
3. Paciente com idade, sexo, queixa principal, história
4. EXATAMENTE 5 alternativas (A a E), cada uma com 80+ caracteres
5. Explicação detalhada MÍNIMO 200 caracteres, referenciando achados da imagem
6. Dificuldade variada: 1 fácil (2), 1 média (3), 1 difícil (4)
7. Estilo de prova USP/UNIFESP/ENARE
8. Português brasileiro, sem markdown, sem caracteres especiais
9. NÃO use expressões como "imagem abaixo" ou "observe a figura" - descreva os achados diretamente

Retorne APENAS um array JSON válido:
[{"statement":"...","options":["A) ...","B) ...","C) ...","D) ...","E) ..."],"correct_index":0,"explanation":"...","difficulty":3,"exam_style":"USP","topic":"...","subtopic":"..."}]`;

  return [
    {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: asset.image_url } },
        { type: "text", text },
      ],
    },
  ];
}

function buildTextFallbackMessages(asset: any) {
  const text = `Você é um professor de medicina especialista criando questões para residência médica.

CONTEXTO (questão TEXTUAL, sem imagem):
- Tipo de exame: ${asset.image_type.toUpperCase()}
- Diagnóstico: ${asset.diagnosis}
- Achados clínicos: ${JSON.stringify(asset.clinical_findings || {})}

Gere EXATAMENTE 3 questões de múltipla escolha sobre este diagnóstico.
A questão deve ser PURAMENTE TEXTUAL - descreva achados clínicos e de exames sem referenciar imagens.

REGRAS:
1. Enunciado com contexto clínico realista, MÍNIMO 400 caracteres
2. Paciente com idade, sexo, queixa principal, história
3. Descreva achados de exames POR TEXTO (ex: "ECG evidencia supradesnivelamento de ST em V1-V4")
4. EXATAMENTE 5 alternativas (A a E), cada uma com 80+ caracteres
5. Explicação detalhada MÍNIMO 200 caracteres
6. Dificuldade variada: 1 fácil (2), 1 média (3), 1 difícil (4)
7. Estilo de prova USP/UNIFESP/ENARE
8. Português brasileiro, sem markdown, sem caracteres especiais
9. NUNCA mencione imagens, figuras, fotografias ou elementos visuais

Retorne APENAS um array JSON válido:
[{"statement":"...","options":["A) ...","B) ...","C) ...","D) ...","E) ..."],"correct_index":0,"explanation":"...","difficulty":3,"exam_style":"USP","topic":"...","subtopic":"..."}]`;

  return [{ role: "user", content: text }];
}

// ── Text cleaner ───────────────────────────────────────────────
const cleanText = (t: string) =>
  t
    .replace(/\*\*/g, "").replace(/##/g, "").replace(/\\n/g, " ")
    .replace(/[#*_~`]/g, "").replace(/\s{2,}/g, " ")
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ")
    .replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, "")
    .trim();

const cleanOpt = (o: string) => cleanText(o).replace(/^[A-E]\)\s*/, "");

// ── Post-generation multimodal audit ───────────────────────────
const FAKE_PATTERNS = [
  /logo\b/i, /símbolo\b/i, /\bamerican academy\b/i, /\bsociedade brasileira\b/i,
  /emblema\b/i, /\binsígnia\b/i, /\bmetaforiza\b/i, /\bsimboliza\b/i,
  /\bvisualmente sugerido\b/i, /\bvisualmente metaforizada\b/i,
  /\bcírculo.*roxo\b/i, /\braios.*partindo\b/i, /\bse assemelha\b.*\bfundo de olho\b/i,
  /\bpadrão de cores.*formas\b/i, /\bconforme ilustrado\b.*\blogo\b/i,
];

function isFakeMultimodal(statement: string, explanation: string): boolean {
  const allText = `${statement} ${explanation}`;
  return FAKE_PATTERNS.some(p => p.test(allText));
}

// ── Main handler ───────────────────────────────────────────────
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

    // Fetch candidate assets (no origin filter — safety check decides)
    let query = supabase
      .from("medical_image_assets")
      .select("id, asset_code, diagnosis, image_type, clinical_findings, image_url, asset_origin, review_status, integrity_status, clinical_confidence, is_active, multimodal_ready")
      .not("image_url", "is", null)
      .limit(200);

    if (imageType) query = query.eq("image_type", imageType);

    const { data: assets, error } = await query;
    if (error || !assets?.length) {
      return new Response(JSON.stringify({ message: "No assets to process", error: error?.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find assets that still need questions
    const { data: existingQ } = await supabase
      .from("medical_image_questions")
      .select("asset_id")
      .neq("status", "rejected");

    const existingAssetIds = new Set((existingQ || []).map((q: any) => q.asset_id));
    const needsQuestions = assets.filter((a: any) => !existingAssetIds.has(a.id)).slice(0, batchSize);

    if (needsQuestions.length === 0) {
      return new Response(JSON.stringify({
        message: "All assets already have questions",
        total_assets: assets.length,
        with_questions: existingAssetIds.size,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let totalGenerated = 0;
    const results: any[] = [];

    for (const asset of needsQuestions) {
      // ── SAFETY CHECK ──
      const safety = checkAssetSafety(asset);
      const useMultimodal = safety.safe;

      if (!useMultimodal) {
        console.warn(`⛔ BLOCKED multimodal for [${asset.asset_code}] ${asset.diagnosis}: ${safety.reason}`);
        await logSafetyBlock(asset, safety.reason!);
      }

      const mode = useMultimodal ? "multimodal" : "text_fallback";
      console.log(`[${mode}] Generating for: ${asset.diagnosis} (${asset.image_type})`);

      const messages = useMultimodal
        ? buildMultimodalMessages(asset)
        : buildTextFallbackMessages(asset);

      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages,
            temperature: 0.7,
          }),
        });

        if (!aiResp.ok) {
          const errText = await aiResp.text();
          console.error(`AI error (${aiResp.status}): ${errText}`);
          results.push({ asset: asset.diagnosis, mode, error: `AI ${aiResp.status}` });
          continue;
        }

        const aiData = await aiResp.json();
        const content = aiData?.choices?.[0]?.message?.content || "";

        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          console.error("No JSON found for:", asset.diagnosis);
          results.push({ asset: asset.diagnosis, mode, error: "No JSON" });
          continue;
        }

        let questions;
        try {
          const cleaned = jsonMatch[0]
            .replace(/```json/g, "").replace(/```/g, "")
            .replace(/,\s*]/g, "]").replace(/,\s*}/g, "}")
            .replace(/[\x00-\x1F\x7F]/g, " ");
          questions = JSON.parse(cleaned);
        } catch {
          results.push({ asset: asset.diagnosis, mode, error: "Parse error" });
          continue;
        }

        let inserted = 0;
        for (const q of questions) {
          if (!q.statement || q.statement.length < 200 || !q.options || q.options.length < 5) continue;

          const opts = q.options || [];
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
        results.push({ asset: asset.diagnosis, type: asset.image_type, mode, generated: inserted, safety_reason: safety.reason || null });
        console.log(`✓ ${inserted} questions [${mode}] for ${asset.diagnosis}`);
      } catch (err) {
        console.error("Error:", err);
        results.push({ asset: asset.diagnosis, mode, error: String(err) });
      }

      await new Promise((r) => setTimeout(r, 1000));
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
