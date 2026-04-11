import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ══════════════════════════════════════════════════
// ELIGIBILITY GATE (same as generate-mnemonic)
// ══════════════════════════════════════════════════

const ALLOWED_TYPES = [
  "lista", "criterios", "causas", "classificacao",
  "efeitos_adversos", "sinais_classicos", "fatores_de_risco",
  "diagnostico_diferencial_curto", "componentes",
];

const BLOCKED_KEYWORDS = [
  "dosagem", "posologia", "dose", "mg/kg", "mg/dl",
  "protocolo de emergência", "reanimação", "pcr",
  "timing", "intervalo de tempo", "controvérsia",
  "off-label", "experimental",
];

function validateEligibility(items: string[], contentType: string, topic: string): { ok: boolean; reason?: string } {
  if (!ALLOWED_TYPES.includes(contentType)) return { ok: false, reason: `Tipo "${contentType}" não elegível.` };
  if (items.length < 3) return { ok: false, reason: "Mínimo 3 itens." };
  if (items.length > 7) return { ok: false, reason: "Máximo 7 itens." };
  const combined = (topic + " " + items.join(" ")).toLowerCase();
  for (const kw of BLOCKED_KEYWORDS) {
    if (combined.includes(kw)) return { ok: false, reason: `Contém "${kw}" — bloqueado.` };
  }
  return { ok: true };
}

// ══════════════════════════════════════════════════
// AI HELPER
// ══════════════════════════════════════════════════

async function callAI(apiKey: string, prompt: string, model = "google/gemini-2.5-flash"): Promise<{ ok: boolean; text?: string; status?: number }> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.5 }),
  });
  if (!resp.ok) return { ok: false, status: resp.status };
  const data = await resp.json();
  return { ok: true, text: data.choices?.[0]?.message?.content || "" };
}

function extractJSON(raw: string): any | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

// ══════════════════════════════════════════════════
// PROMPTS (reused from generate-mnemonic)
// ══════════════════════════════════════════════════

function buildGeneratorPrompt(topic: string, items: string[]): string {
  return `Você é um especialista em mnemônicos médicos para residência.

TAREFA: Crie um mnemônico + mapeamento visual para memorizar esta lista sobre "${topic}":
${items.map((it, i) => `${i + 1}. ${it}`).join("\n")}

REGRAS OBRIGATÓRIAS:
- Use a PRIMEIRA LETRA de cada item para formar uma palavra ou frase
- A frase deve ter NO MÁXIMO 12 palavras
- Deve ser fácil de falar e memorável
- NÃO invente itens que não estão na lista
- NÃO force letras incorretas
- Cada item deve ter UM símbolo visual ÚNICO, concreto e óbvio
- NÃO repetir símbolos

Responda APENAS em JSON válido:
{
  "mnemonic_word": "SIGLA ou palavra formada",
  "phrase": "Frase mnemônica completa",
  "items_mapped": [
    {"letter": "A", "word": "palavra do mnemônico", "original_item": "item original", "symbol": "objeto visual concreto", "symbol_reason": "por que esse símbolo"}
  ],
  "scene_description": "Descrição curta da cena visual unificada (1-2 frases)"
}`;
}

function buildMedicalAuditorPrompt(topic: string, items: string[], generated: any): string {
  return `Você é um auditor médico sênior. Avalie com RIGOR CLÍNICO.
TEMA: "${topic}"
LISTA: ${items.map((it, i) => `${i + 1}. ${it}`).join("\n")}
MNEMÔNICO: Sigla=${generated.mnemonic_word}, Frase=${generated.phrase}, Map=${JSON.stringify(generated.items_mapped)}

VERIFIQUE: omissão, distorção, associação falsa, risco clínico, fidelidade.
Responda JSON: {"approved": bool, "score": 0-100, "critical_risk": bool, "issues": [...], "summary": "..."}`;
}

function buildPedagogicalAuditorPrompt(topic: string, items: string[], generated: any): string {
  return `Você é um auditor pedagógico de memorização visual para provas médicas.
TEMA: "${topic}" (${items.length} itens)
MNEMÔNICO: Sigla=${generated.mnemonic_word}, Frase=${generated.phrase}, Cena=${generated.scene_description}
Símbolos: ${JSON.stringify(generated.items_mapped?.map((m: any) => ({ item: m.original_item, symbol: m.symbol })))}

AVALIE: clareza (<10s), revisabilidade, memorabilidade, poluição visual, ambiguidade, utilidade.
Responda JSON: {"approved": bool, "score": 0-100, "issues": [...], "summary": "..."}`;
}

// ══════════════════════════════════════════════════
// RECONCILER (same logic as generate-mnemonic)
// ══════════════════════════════════════════════════

function reconcile(medical: any, pedagogical: any): { verdict: "approve" | "reject"; score: number; reason: string } {
  if (medical.critical_risk) return { verdict: "reject", score: 0, reason: "Risco clínico crítico." };
  if (!medical.approved) return { verdict: "reject", score: Math.round((medical.score + pedagogical.score) / 2), reason: medical.summary };
  const avg = Math.round((medical.score + pedagogical.score) / 2);
  if (avg < 65) return { verdict: "reject", score: avg, reason: "Score combinado < 65." };
  return { verdict: "approve", score: avg, reason: "Aprovado." };
}

// ══════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, items, contentType, userId, hash } = await req.json();

    if (!topic || !items || !hash) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Eligibility
    const elig = validateEligibility(items, contentType || "criterios", topic);
    if (!elig.ok) {
      return new Response(JSON.stringify({ rejected: true, error: elig.reason }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check if hash already exists
    const { data: existing } = await supabase
      .from("mnemonic_assets")
      .select("id, verdict")
      .eq("hash", hash)
      .single();

    if (existing) {
      if (existing.verdict === "rejected") {
        return new Response(JSON.stringify({ rejected: true, error: "Previously rejected" }), {
          status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ assetId: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate
    const genResult = await callAI(LOVABLE_API_KEY, buildGeneratorPrompt(topic, items));
    if (!genResult.ok) {
      return new Response(JSON.stringify({ rejected: true, error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const generated = extractJSON(genResult.text || "");
    if (!generated?.items_mapped || generated.items_mapped.length !== items.length) {
      return new Response(JSON.stringify({ rejected: true, error: "Structural mismatch" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Dual audit (parallel)
    const [medRes, pedRes] = await Promise.all([
      callAI(LOVABLE_API_KEY, buildMedicalAuditorPrompt(topic, items, generated)),
      callAI(LOVABLE_API_KEY, buildPedagogicalAuditorPrompt(topic, items, generated)),
    ]);

    // Fail-closed
    if (!medRes.ok || !pedRes.ok) {
      return new Response(JSON.stringify({ rejected: true, error: "Audit call failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const medAudit = extractJSON(medRes.text || "");
    const pedAudit = extractJSON(pedRes.text || "");
    if (!medAudit || !pedAudit) {
      return new Response(JSON.stringify({ rejected: true, error: "Audit parse failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const medical = {
      approved: !!medAudit.approved,
      score: Number(medAudit.score) || 0,
      critical_risk: !!medAudit.critical_risk,
      summary: medAudit.summary || "",
    };
    const pedagogical = {
      approved: !!pedAudit.approved,
      score: Number(pedAudit.score) || 0,
      summary: pedAudit.summary || "",
    };

    const result = reconcile(medical, pedagogical);

    if (result.verdict === "reject") {
      // Save rejected to prevent retries
      await supabase.from("mnemonic_assets").insert({
        hash,
        topic,
        content_type: contentType || "criterios",
        items_json: items,
        mnemonic: generated.mnemonic_word || "",
        phrase: generated.phrase || "",
        items_map_json: generated.items_mapped || [],
        scene_description: generated.scene_description,
        quality_score: result.score,
        medical_score: medical.score,
        pedagogical_score: pedagogical.score,
        verdict: "rejected",
        review_question: `Quais são os ${items.length} itens de "${topic}"?`,
      });

      return new Response(JSON.stringify({ rejected: true, error: result.reason }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate image (best-effort)
    let imageUrl: string | null = null;
    try {
      const symbols = (generated.items_mapped || []).map((v: any) => `- ${v.symbol} (${v.original_item})`).join("\n");
      const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: `Ilustração médica didática, estilo cartoon limpo, fundo branco:\n${symbols}\nElementos separados, sem sobreposição, sem texto.` }],
          modalities: ["image", "text"],
        }),
      });
      if (imgResp.ok) {
        const imgData = await imgResp.json();
        imageUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
      }
    } catch { /* image is best-effort */ }

    const verdict = imageUrl ? "approved_visual" : "approved_text_map_only";

    // Save approved asset
    const { data: inserted, error: insertErr } = await supabase
      .from("mnemonic_assets")
      .insert({
        hash,
        topic,
        content_type: contentType || "criterios",
        items_json: items,
        mnemonic: generated.mnemonic_word,
        phrase: generated.phrase,
        items_map_json: generated.items_mapped,
        scene_description: generated.scene_description,
        image_url: imageUrl,
        quality_score: result.score,
        medical_score: medical.score,
        pedagogical_score: pedagogical.score,
        verdict,
        review_question: `Usando "${generated.mnemonic_word}", quais são os ${items.length} itens de "${topic}"?`,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("Insert failed:", insertErr);
      return new Response(JSON.stringify({ rejected: true, error: "Save failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ assetId: inserted.id, verdict, score: result.score }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(JSON.stringify({ rejected: true, error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
