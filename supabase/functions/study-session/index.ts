import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import ENAZIZI_PROMPT from "../_shared/enazizi-prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getPhasePrompt(phase: string, topic: string, performanceData: unknown): string {
  const base = ENAZIZI_PROMPT;

  switch (phase) {
    case "performance":
      return `${base}
FASE ATUAL: STATE 0 — PAINEL DE DESEMPENHO

Dados do aluno:
${JSON.stringify(performanceData || {}, null, 2)}

Mostre o painel organizado:
## 📊 Painel ENAZIZI
- Questões respondidas, Taxa de acerto, Pontuação discursiva
- Raciocínio clínico, Conduta terapêutica
- Nível estimado, Estimativa de preparo para residência
## 🧠 Domínio por Especialidade
## ⚠️ Temas Fracos
## 📈 Recomendação
Se não houver dados, informe e sugira começar.`;

    case "lesson":
      return `${base}
FASE ATUAL: BLOCOS TÉCNICOS (STATES 2-6)
Tema: "${topic || "solicitado pelo aluno"}"

ENSINE seguindo RIGOROSAMENTE o MARCADOR DE BLOCO.
NUNCA faça perguntas nesta fase até o final do bloco (active recall).
Ao final: "Quando estiver pronto, avance para o Active Recall!"`;

    case "active-recall":
      return `${base}
FASE ATUAL: ACTIVE RECALL (STATES 3/5)
Tema: "${topic}"

Faça 5-7 perguntas CURTAS de recuperação ativa da memória.
Apresente TODAS numeradas. O aluno responderá e você corrigirá.
Foque em: mecanismos, diagnósticos, condutas, pontos de prova.
Se o aluno errar: resposta correta + raciocínio + revisão + ponto de prova.`;

    case "questions":
      return `${base}
FASE ATUAL: QUESTÃO OBJETIVA (STATE 7)
Tema: "${topic}"

Crie UM caso clínico com questão de múltipla escolha (A-E).
Nível residência médica/Revalida. Apenas UMA questão. NÃO revele a resposta.
Diga: "Qual sua resposta? (A, B, C, D ou E)"`;

    case "discussion":
      return `${base}
FASE ATUAL: DISCUSSÃO DA QUESTÃO (STATE 8)
Tema: "${topic}"

Analise com TODOS estes elementos: alternativa correta, explicação simples, explicação técnica,
raciocínio clínico, diagnóstico diferencial, análise de CADA alternativa, ponto clássico de prova.
Se errou: informar incorreto → corrigir → revisar.
Perguntar: 1) continuar, 2) outra questão, 3) revisar conteúdo.`;

    case "discursive":
      return `${base}
FASE ATUAL: CASO CLÍNICO DISCURSIVO (STATE 9)
Tema: "${topic}"

Apresente caso clínico completo. Pergunte:
1. Diagnóstico mais provável? Justifique.
2. Conduta inicial?
3. Exames complementares necessários?
4. Justifique a conduta adotada.
Aguarde a resposta. Depois corrija com nota 0-5.`;

    case "scoring":
      return `${base}
FASE ATUAL: CORREÇÃO DISCURSIVA + ATUALIZAÇÃO (STATES 10-11)
Tema: "${topic}"

Dados da sessão:
${JSON.stringify(performanceData || {}, null, 2)}

Correção: diagnóstico 0-2, conduta 0-2, justificativa 0-1. Total X/5.
Depois: resposta esperada, explicação, raciocínio, erros clássicos, reforço.
Mostrar desempenho atualizado + temas fracos + próximo passo + mensagem motivacional.`;

    default:
      return `${base}
Siga o fluxo pedagógico dos STATES 0-12.
REGRA: NUNCA comece com questões. Sempre ensine primeiro. Nunca pule estados.`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, phase, topic, userContext, performanceData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = getPhasePrompt(phase, topic, performanceData);

    if (userContext) {
      systemPrompt += `\n\n--- MATERIAL DE ESTUDO DO ALUNO ---\n${userContext}\n--- FIM DO MATERIAL ---`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("study-session error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
