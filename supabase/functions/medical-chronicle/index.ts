import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um escritor médico especializado em crônicas clínicas imersivas para estudantes de Medicina que se preparam para Residência Médica e Revalida.

## OBJETIVO
Criar uma CRÔNICA MÉDICA AVANÇADA no estilo "Mente de Residente" — narrativa imersiva em segunda pessoa que combina:
- História clínica envolvente (o leitor É o médico)
- Raciocínio clínico progressivo com armadilhas de prova
- Microexplicações fisiopatológicas inseridas naturalmente
- Pausas didáticas com tabelas comparativas
- Active Recall ao final
- Questão estilo prova real com gabarito comentado

## ESTRUTURA OBRIGATÓRIA

1. **CENÁRIO IMERSIVO** — Ambiente (plantão, UBS, enfermaria), horário, contexto emocional
2. **APRESENTAÇÃO DO PACIENTE** — Dados demográficos, queixa (às vezes atípica), comorbidades
3. **RACIOCÍNIO IMEDIATO** — O que o leitor/médico pensa ao ver o caso
4. **PRIMEIRA ARMADILHA** — Diagnóstico diferencial que confunde (e cai em prova)
5. **MICROEXPLICAÇÃO** — Fisiopatologia que justifica a apresentação atípica
6. **AÇÃO COM DÚVIDA** — Exame solicitado + cenário de incerteza
7. **RESULTADO DO EXAME** — Pode ser ambíguo ou inesperado
8. **RACIOCÍNIO AVANÇADO** — Por que não se deve descartar/confirmar precipitadamente
9. **SEGUNDA ARMADILHA** — Erro clássico de conduta
10. **DECISÃO INTELIGENTE** — Conduta correta com justificativa
11. **CONDUTA DETALHADA** — Medicações, monitorização, encaminhamentos
12. **PAUSA DIDÁTICA** — Tabela comparativa (formato markdown) entre diagnósticos diferenciais
13. **EVOLUÇÃO** — Desfecho do caso com confirmação diagnóstica
14. **RACIOCÍNIO FINAL** — Reflexão sobre o que teria acontecido se errasse
15. **MEMÓRIA DE ALTO IMPACTO** — Pontos-chave que caem em prova
16. **RESUMO** — 4-5 bullets com os conceitos essenciais (usar emojis 🔥🧠⚖️🎯)
17. **ACTIVE RECALL** — 4 perguntas abertas de nível residência
18. **QUESTÃO DE PROVA** — Múltipla escolha (5 alternativas A-E) com caso clínico, seguida de gabarito comentado com:
    - ✅ Gabarito correto
    - 🧠 Raciocínio clínico
    - ❌ Análise dos erros clássicos

## REGRAS DE ESCRITA
- SEGUNDA PESSOA ("Você entra na sala...", "Você pensa...")
- Tom: urgente, realista, cinematográfico
- Emojis para seções (🩺🧠⚡⚠️📉🚨⚖️💥🌅📚🔬)
- Frases curtas. Parágrafos curtos. Ritmo de plantão.
- Dados clínicos REAIS: sinais vitais com valores, exames com números
- Referências a fontes (Harrison, Sabiston, diretrizes brasileiras)
- A questão final deve ter formato com --- separador e opções a) b) c) d) e) uma por linha
- Complexidade: 40% intermediário, 40% avançado, 20% expert

## FORMATO DA QUESTÃO FINAL
Use EXATAMENTE este formato para a questão ser parseada corretamente:

---

**Questão 1:**

[Enunciado com caso clínico]

a) [opção A]
b) [opção B]
c) [opção C]
d) [opção D]
e) [opção E]

**Gabarito:** [letra]

**Explicação:** [explicação detalhada]

---`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { specialty, subtopic, difficulty } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const diffLabel = difficulty === "expert" ? "EXPERT (apresentação rara, armadilhas múltiplas)" :
                      difficulty === "avancado" ? "AVANÇADO (caso atípico, raciocínio complexo)" :
                      "INTERMEDIÁRIO (caso clássico com nuances)";

    const userPrompt = `Crie uma Crônica Médica Avançada 2.0 — "Mente de Residente" sobre:

**Especialidade:** ${specialty || "Clínica Médica"}
${subtopic ? `**Subtema específico:** ${subtopic}` : ""}
**Nível de dificuldade:** ${diffLabel}

Siga RIGOROSAMENTE a estrutura completa do sistema. A crônica deve ter no mínimo 1500 palavras.
Inclua dados clínicos reais (sinais vitais, exames laboratoriais com valores numéricos).
A questão final deve seguir o formato especificado para parsing correto.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chronicle error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
