import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── ELIGIBILITY GATE ──
const ALLOWED_TYPES = [
  "lista",
  "criterios",
  "causas",
  "classificacao",
  "efeitos_adversos",
  "sinais_classicos",
  "fatores_de_risco",
  "diagnostico_diferencial_curto",
  "componentes",
];

const BLOCKED_KEYWORDS = [
  "dosagem",
  "posologia",
  "dose",
  "mg/kg",
  "protocolo de emergência",
  "reanimação",
  "pcr",
];

function isEligible(items: string[], contentType: string, topic: string): { ok: boolean; reason?: string } {
  if (!ALLOWED_TYPES.includes(contentType)) {
    return { ok: false, reason: `Tipo "${contentType}" não é elegível para mnemônico visual.` };
  }
  if (items.length < 3) return { ok: false, reason: "Mínimo de 3 itens para gerar mnemônico." };
  if (items.length > 8) return { ok: false, reason: "Máximo de 8 itens. Listas maiores ficam poluídas visualmente." };

  const combined = (topic + " " + items.join(" ")).toLowerCase();
  for (const kw of BLOCKED_KEYWORDS) {
    if (combined.includes(kw)) {
      return { ok: false, reason: `Conteúdo contém "${kw}" — não seguro para mnemônico visual.` };
    }
  }
  return { ok: true };
}

// ── TEXTUAL AUDIT ──
function auditTextual(items: string[], generated: { letter: string; word: string }[]): { ok: boolean; reason?: string } {
  if (generated.length !== items.length) {
    return { ok: false, reason: `Gerou ${generated.length} itens, esperado ${items.length}.` };
  }
  for (let i = 0; i < generated.length; i++) {
    if (!generated[i]?.word || generated[i].word.trim().length < 2) {
      return { ok: false, reason: `Item ${i + 1} vazio ou muito curto.` };
    }
  }
  return { ok: true };
}

// ── VISUAL AUDIT ──
function auditVisualMap(map: Array<{ item: string; symbol: string }>): { ok: boolean; reason?: string } {
  const symbols = map.map((m) => m.symbol.toLowerCase().trim());
  if (new Set(symbols).size !== symbols.length) {
    return { ok: false, reason: "Símbolos visuais duplicados detectados." };
  }
  for (const s of symbols) {
    if (s.length < 3) return { ok: false, reason: `Símbolo "${s}" muito vago.` };
  }
  return { ok: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { topic, items, contentType } = body as {
      topic: string;
      items: string[];
      contentType: string;
    };

    if (!topic || !items || !Array.isArray(items) || !contentType) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: topic, items (array), contentType" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STEP 1: ELIGIBILITY GATE
    const elig = isEligible(items, contentType, topic);
    if (!elig.ok) {
      return new Response(JSON.stringify({ error: elig.reason, blocked: true }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // STEP 2+3: GENERATE + AUDIT TEXT MNEMONIC
    const textPrompt = `Você é um especialista em mnemônicos médicos para residência.

TAREFA: Crie um mnemônico para memorizar esta lista sobre "${topic}":
${items.map((it, i) => `${i + 1}. ${it}`).join("\n")}

REGRAS OBRIGATÓRIAS:
- Use a PRIMEIRA LETRA de cada item para formar uma palavra ou frase
- A frase deve ter NO MÁXIMO 12 palavras
- Deve ser fácil de falar e memorável
- NÃO invente itens que não estão na lista
- NÃO force letras incorretas
- Se não for possível fazer um mnemônico natural, use uma frase onde cada palavra começa com a letra correspondente

Responda APENAS em JSON válido:
{
  "mnemonic_word": "SIGLA ou palavra formada",
  "phrase": "Frase mnemônica completa",
  "items_mapped": [
    {"letter": "A", "word": "palavra do mnemônico", "original_item": "item original da lista"}
  ]
}`;

    const textResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: textPrompt }],
        temperature: 0.7,
      }),
    });

    if (!textResp.ok) {
      const errText = await textResp.text();
      console.error("AI text error:", textResp.status, errText);
      if (textResp.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (textResp.status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const textData = await textResp.json();
    const rawText = textData.choices?.[0]?.message?.content || "";
    
    let mnemonicData: any;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      mnemonicData = JSON.parse(jsonMatch[0]);
    } catch {
      return new Response(JSON.stringify({ error: "Falha ao interpretar resposta da IA. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Audit textual
    const textAudit = auditTextual(items, mnemonicData.items_mapped || []);
    if (!textAudit.ok) {
      console.warn("Textual audit failed:", textAudit.reason);
      // Retry not implemented yet — return error
      return new Response(JSON.stringify({ error: `Auditoria textual falhou: ${textAudit.reason}. Tente novamente.` }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STEP 4+5: VISUAL MAPPING + AUDIT
    const visualPrompt = `Você é um designer de mnemônicos visuais médicos.

Para o mnemônico "${mnemonicData.phrase}" sobre "${topic}", crie um MAPEAMENTO VISUAL.

Itens:
${items.map((it, i) => `${i + 1}. ${it}`).join("\n")}

REGRAS:
- Cada item deve ter UM símbolo visual ÚNICO e ÓBVIO
- Símbolos devem ser objetos concretos, fáceis de desenhar
- NÃO repetir símbolos
- NÃO usar símbolos abstratos
- Cada símbolo deve ter uma razão lógica de associação
- Máximo 7 símbolos

Responda APENAS em JSON válido:
{
  "visual_map": [
    {"item": "nome do item", "symbol": "objeto visual concreto", "reason": "por que esse símbolo representa o item"}
  ],
  "scene_description": "Descrição curta da cena visual unificada (1-2 frases)"
}`;

    const visualResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: visualPrompt }],
        temperature: 0.7,
      }),
    });

    if (!visualResp.ok) throw new Error("Visual mapping AI error");

    const visualData = await visualResp.json();
    const rawVisual = visualData.choices?.[0]?.message?.content || "";

    let visualMap: any;
    try {
      const jsonMatch = rawVisual.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON");
      visualMap = JSON.parse(jsonMatch[0]);
    } catch {
      return new Response(JSON.stringify({ error: "Falha no mapeamento visual. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Audit visual
    const visualAudit = auditVisualMap(visualMap.visual_map || []);
    if (!visualAudit.ok) {
      console.warn("Visual audit failed:", visualAudit.reason);
    }

    // STEP 6: IMAGE GENERATION
    const symbols = (visualMap.visual_map || []).map((v: any) => `- ${v.symbol} (representando ${v.item})`).join("\n");
    const imagePrompt = `Crie uma ilustração médica didática, estilo limpo e colorido, fundo branco.

Cena única contendo:
${symbols}

Regras visuais:
- Cada elemento deve estar SEPARADO e claramente identificável
- Sem sobreposição de elementos
- Estilo cartoon/infográfico médico
- Cores vibrantes e distintas para cada elemento
- Sem texto na imagem
- Fundo limpo e claro`;

    let imageUrl: string | null = null;
    try {
      const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (imgResp.ok) {
        const imgData = await imgResp.json();
        imageUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
      } else {
        console.warn("Image generation failed:", imgResp.status);
      }
    } catch (e) {
      console.warn("Image generation error:", e);
    }

    // STEP 7: PEDAGOGICAL SCORE
    let score = 100;
    if (!imageUrl) score -= 20;
    if (items.length > 6) score -= 10;
    if ((mnemonicData.phrase || "").split(" ").length > 12) score -= 15;
    if (!visualAudit.ok) score -= 15;

    const warning = score < 80
      ? "⚠️ Mnemônico gerado com qualidade abaixo do ideal. Revise antes de usar."
      : null;

    // BUILD OUTPUT
    const output = {
      topic,
      mnemonic: mnemonicData.mnemonic_word,
      phrase: mnemonicData.phrase,
      items_map: (mnemonicData.items_mapped || []).map((im: any, i: number) => ({
        letter: im.letter,
        word: im.word,
        original_item: im.original_item || items[i],
        symbol: visualMap.visual_map?.[i]?.symbol || null,
        symbol_reason: visualMap.visual_map?.[i]?.reason || null,
      })),
      scene_description: visualMap.scene_description || "",
      image_url: imageUrl,
      quality_score: Math.max(0, score),
      warning,
      review_question: `Usando o mnemônico "${mnemonicData.mnemonic_word}", quais são os ${items.length} itens de "${topic}"?`,
    };

    return new Response(JSON.stringify(output), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-mnemonic error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
