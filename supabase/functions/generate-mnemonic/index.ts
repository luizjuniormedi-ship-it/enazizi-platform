import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ══════════════════════════════════════════════════
// STEP 1 — ELIGIBILITY GATE
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

function validateMnemonicEligibility(
  items: string[], contentType: string, topic: string
): { ok: boolean; reason?: string } {
  if (!ALLOWED_TYPES.includes(contentType)) {
    return { ok: false, reason: `Tipo "${contentType}" não é elegível para mnemônico visual.` };
  }
  if (items.length < 3) return { ok: false, reason: "Mínimo de 3 itens para gerar mnemônico." };
  if (items.length > 7) return { ok: false, reason: "Máximo de 7 itens. Listas maiores geram poluição visual." };

  const combined = (topic + " " + items.join(" ")).toLowerCase();
  for (const kw of BLOCKED_KEYWORDS) {
    if (combined.includes(kw)) {
      return { ok: false, reason: `Conteúdo contém "${kw}" — não seguro para mnemônico visual.` };
    }
  }
  return { ok: true };
}

// ══════════════════════════════════════════════════
// AI CALL HELPER
// ══════════════════════════════════════════════════

async function callAI(apiKey: string, prompt: string, model = "google/gemini-2.5-flash"): Promise<{ ok: boolean; text?: string; status?: number }> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    }),
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
// STEP 2 — GENERATOR PROMPT
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
- Cada símbolo deve ter razão lógica de associação

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

// ══════════════════════════════════════════════════
// STEP 3 — MEDICAL AUDITOR PROMPT
// ══════════════════════════════════════════════════

function buildMedicalAuditorPrompt(topic: string, items: string[], generated: any): string {
  return `Você é um auditor médico sênior. Avalie o mnemônico gerado com RIGOR CLÍNICO.

TEMA: "${topic}"
LISTA ORIGINAL:
${items.map((it, i) => `${i + 1}. ${it}`).join("\n")}

MNEMÔNICO GERADO:
- Sigla: ${generated.mnemonic_word}
- Frase: ${generated.phrase}
- Mapeamento: ${JSON.stringify(generated.items_mapped)}

VERIFIQUE:
1. OMISSÃO: Algum item da lista original foi omitido ou mal representado?
2. DISTORÇÃO: Algum conceito médico foi simplificado de forma que mude seu significado clínico?
3. ASSOCIAÇÃO FALSA: Algum símbolo visual pode induzir associação médica incorreta?
4. RISCO CLÍNICO: O mnemônico pode levar alguém a memorizar algo errado que cause erro clínico?
5. FIDELIDADE: Cada item do mnemônico corresponde fielmente ao item original?

Responda APENAS em JSON válido:
{
  "approved": true/false,
  "score": 0-100,
  "critical_risk": true/false,
  "issues": [
    {"type": "omission|distortion|false_association|clinical_risk|fidelity", "item": "qual item", "description": "descrição do problema", "severity": "low|medium|high|critical"}
  ],
  "summary": "resumo da avaliação médica"
}`;
}

// ══════════════════════════════════════════════════
// STEP 4 — PEDAGOGICAL/VISUAL AUDITOR PROMPT
// ══════════════════════════════════════════════════

function buildPedagogicalAuditorPrompt(topic: string, items: string[], generated: any): string {
  return `Você é um auditor pedagógico especializado em técnicas de memorização visual para provas médicas.

TEMA: "${topic}"
LISTA ORIGINAL (${items.length} itens):
${items.map((it, i) => `${i + 1}. ${it}`).join("\n")}

MNEMÔNICO GERADO:
- Sigla: ${generated.mnemonic_word}
- Frase: ${generated.phrase}
- Cena: ${generated.scene_description}
- Símbolos: ${JSON.stringify(generated.items_mapped?.map((m: any) => ({ item: m.original_item, symbol: m.symbol })))}

AVALIE:
1. CLAREZA: Um aluno consegue entender a cena visual em menos de 10 segundos?
2. REVISABILIDADE: Serve para revisão rápida pré-prova?
3. MEMORABILIDADE: A frase é fácil de lembrar e falar?
4. POLUIÇÃO VISUAL: A cena tem elementos demais ou sobrepostos?
5. AMBIGUIDADE: Dois símbolos podem ser confundidos entre si?
6. UTILIDADE REAL: Isso ajuda a decorar para prova ou é só efeito visual?

Responda APENAS em JSON válido:
{
  "approved": true/false,
  "score": 0-100,
  "issues": [
    {"type": "clarity|revisability|memorability|visual_pollution|ambiguity|low_utility", "description": "descrição do problema", "severity": "low|medium|high"}
  ],
  "summary": "resumo da avaliação pedagógica"
}`;
}

// ══════════════════════════════════════════════════
// STEP 5 — RECONCILER
// ══════════════════════════════════════════════════

interface AuditResult {
  approved: boolean;
  score: number;
  critical_risk?: boolean;
  issues: Array<{ type: string; severity: string; description: string }>;
  summary: string;
}

function reconcileMnemonicAudit(
  medical: AuditResult, pedagogical: AuditResult
): { verdict: "approve" | "reject" | "regenerate"; score: number; reason: string } {
  // RULE 1: Critical medical risk → always reject
  if (medical.critical_risk) {
    return { verdict: "reject", score: 0, reason: `Risco clínico crítico: ${medical.summary}` };
  }

  // RULE 2: Both reject → reject
  if (!medical.approved && !pedagogical.approved) {
    return { verdict: "reject", score: Math.round((medical.score + pedagogical.score) / 2), reason: "Reprovado por ambos auditores." };
  }

  const avgScore = Math.round((medical.score + pedagogical.score) / 2);

  // RULE 3: Medical reject → reject (medical always has veto)
  if (!medical.approved) {
    return { verdict: "reject", score: avgScore, reason: `Auditor médico reprovou: ${medical.summary}` };
  }

  // RULE 4: Pedagogical reject with low score → regenerate
  if (!pedagogical.approved && avgScore < 60) {
    return { verdict: "regenerate", score: avgScore, reason: `Qualidade pedagógica insuficiente: ${pedagogical.summary}` };
  }

  // RULE 5: Both approve but low combined score → regenerate
  if (avgScore < 65) {
    return { verdict: "regenerate", score: avgScore, reason: "Score combinado abaixo do mínimo (65)." };
  }

  // RULE 6: High-severity issues from either → regenerate
  const criticalIssues = [
    ...medical.issues.filter(i => i.severity === "high" || i.severity === "critical"),
    ...pedagogical.issues.filter(i => i.severity === "high"),
  ];
  if (criticalIssues.length >= 2) {
    return { verdict: "regenerate", score: avgScore, reason: `${criticalIssues.length} problemas graves detectados.` };
  }

  // RULE 7: Approved
  return { verdict: "approve", score: avgScore, reason: "Aprovado por ambos auditores." };
}

// ══════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { topic, items, contentType } = body as {
      topic: string; items: string[]; contentType: string;
    };

    if (!topic || !items || !Array.isArray(items) || !contentType) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: topic, items (array), contentType" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── STEP 1: ELIGIBILITY ──
    const elig = validateMnemonicEligibility(items, contentType, topic);
    if (!elig.ok) {
      return new Response(JSON.stringify({ error: elig.reason, blocked: true }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // ── STEP 2: GENERATE MNEMONIC ──
    const genResult = await callAI(LOVABLE_API_KEY, buildGeneratorPrompt(topic, items));
    if (!genResult.ok) {
      if (genResult.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (genResult.status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("Generator AI error");
    }

    const generated = extractJSON(genResult.text || "");
    if (!generated || !generated.items_mapped) {
      // FAIL-CLOSED: parser failure = reject
      return new Response(JSON.stringify({ error: "Falha ao interpretar resposta do gerador. Tente novamente.", rejected: true }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Basic structural check before auditors
    if (generated.items_mapped.length !== items.length) {
      return new Response(JSON.stringify({ error: `Gerador produziu ${generated.items_mapped.length} itens, esperado ${items.length}. Tente novamente.`, rejected: true }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── STEPS 3+4: DUAL AUDIT (parallel) ──
    const [medicalResult, pedagogicalResult] = await Promise.all([
      callAI(LOVABLE_API_KEY, buildMedicalAuditorPrompt(topic, items, generated)),
      callAI(LOVABLE_API_KEY, buildPedagogicalAuditorPrompt(topic, items, generated)),
    ]);

    // FAIL-CLOSED: if either auditor call fails, reject
    if (!medicalResult.ok || !pedagogicalResult.ok) {
      console.error("Auditor call failed", { medical: medicalResult.status, pedagogical: pedagogicalResult.status });
      return new Response(JSON.stringify({ error: "Falha na auditoria. Tente novamente.", rejected: true }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const medicalAudit = extractJSON(medicalResult.text || "");
    const pedagogicalAudit = extractJSON(pedagogicalResult.text || "");

    // FAIL-CLOSED: if either audit JSON parse fails, reject
    if (!medicalAudit || !pedagogicalAudit) {
      console.error("Audit JSON parse failed");
      return new Response(JSON.stringify({ error: "Falha ao processar auditorias. Tente novamente.", rejected: true }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize audit results
    const medical: AuditResult = {
      approved: !!medicalAudit.approved,
      score: Number(medicalAudit.score) || 0,
      critical_risk: !!medicalAudit.critical_risk,
      issues: Array.isArray(medicalAudit.issues) ? medicalAudit.issues : [],
      summary: medicalAudit.summary || "",
    };
    const pedagogical: AuditResult = {
      approved: !!pedagogicalAudit.approved,
      score: Number(pedagogicalAudit.score) || 0,
      issues: Array.isArray(pedagogicalAudit.issues) ? pedagogicalAudit.issues : [],
      summary: pedagogicalAudit.summary || "",
    };

    // ── STEP 5: RECONCILE ──
    const verdict = reconcileMnemonicAudit(medical, pedagogical);

    if (verdict.verdict === "reject") {
      return new Response(JSON.stringify({
        rejected: true,
        error: verdict.reason,
        audit: { medical_score: medical.score, pedagogical_score: pedagogical.score, combined_score: verdict.score },
      }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (verdict.verdict === "regenerate") {
      return new Response(JSON.stringify({
        rejected: true,
        error: `Qualidade insuficiente (${verdict.score}/100): ${verdict.reason}. Tente novamente.`,
        audit: { medical_score: medical.score, pedagogical_score: pedagogical.score, combined_score: verdict.score },
      }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── STEP 6: IMAGE GENERATION (only if approved) ──
    const symbols = (generated.items_mapped || []).map((v: any) => `- ${v.symbol} (representando ${v.original_item})`).join("\n");
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

    // ── BUILD OUTPUT ──
    const warning = verdict.score < 80
      ? "⚠️ Mnemônico aprovado com ressalvas. Revise antes de usar."
      : null;

    const output = {
      topic,
      mnemonic: generated.mnemonic_word,
      phrase: generated.phrase,
      items_map: (generated.items_mapped || []).map((im: any) => ({
        letter: im.letter,
        word: im.word,
        original_item: im.original_item,
        symbol: im.symbol || null,
        symbol_reason: im.symbol_reason || null,
      })),
      scene_description: generated.scene_description || "",
      image_url: imageUrl,
      quality_score: verdict.score,
      warning,
      review_question: `Usando o mnemônico "${generated.mnemonic_word}", quais são os ${items.length} itens de "${topic}"?`,
      audit: {
        medical_score: medical.score,
        pedagogical_score: pedagogical.score,
        medical_summary: medical.summary,
        pedagogical_summary: pedagogical.summary,
        verdict: verdict.verdict,
      },
    };

    return new Response(JSON.stringify(output), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-mnemonic error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno", rejected: true }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
