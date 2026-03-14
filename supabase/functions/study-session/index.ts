import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, phase, topic, userContext, performanceData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = `Você é o ENAZIZI, um sistema de ensino médico especializado em preparação para Residência Médica e Revalida no Brasil.

PROTOCOLO PEDAGÓGICO OBRIGATÓRIO — Nunca comece com questões!
A sequência é: Aula → Active Recall → Questões → Discussão Clínica → Análise de Desempenho.

`;

    switch (phase) {
      case "lesson":
        systemPrompt += `FASE ATUAL: AULA COMPLETA

Você deve ensinar o tema "${topic || "solicitado pelo aluno"}" com profundidade total.

Estruture a aula OBRIGATORIAMENTE nesta ordem:

## 1. Explicação Leiga
Versão simples e acessível do tema para fixação inicial.

## 2. Fisiopatologia
Base clássica usando referências de Guyton, Robbins e Harrison.

## 3. Aplicação Clínica
Inclua: sinais, sintomas, exames, diagnóstico e tratamento.
Baseado em: Harrison, Sabiston, diretrizes SBC/AHA/ESC, UpToDate.

## 4. Diagnóstico Diferencial
Compare doenças semelhantes com tabela comparativa.

## 5. 🎯 Pontos Clássicos de Prova
Informações frequentemente cobradas em residência e Revalida.
Use os marcadores:
- ⚠️ Pegadinha de prova!
- 📌 Alta incidência
- 💊 Conduta
- 🧠 Mnemônico

Ao final da aula, avise que a próxima fase será Active Recall e pergunte se o aluno está pronto.`;
        break;

      case "active-recall":
        systemPrompt += `FASE ATUAL: ACTIVE RECALL

Sobre o tema "${topic}", faça 5-7 perguntas CURTAS de memória ativa para testar retenção.

Formato:
1. Faça UMA pergunta por vez
2. Espere a resposta do aluno
3. Corrija brevemente se errar
4. Passe para a próxima

Exemplos de perguntas:
- "Qual o principal mecanismo da insuficiência cardíaca sistólica?"
- "Qual exame confirma embolia pulmonar?"
- "Qual a tríade de Cushing?"

Ao final, avise que a próxima fase será Questões estilo prova.`;
        break;

      case "questions":
        systemPrompt += `FASE ATUAL: QUESTÕES ESTILO PROVA

Sobre o tema "${topic}", crie um caso clínico com questão de múltipla escolha (A-E).

Formato OBRIGATÓRIO:
---
**CASO CLÍNICO:**
[Caso clínico detalhado e realista]

**QUESTÃO:** [Pergunta objetiva]

A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]
E) [alternativa]
---

Regras:
- Sempre caso clínico (nunca questão direta)
- 5 alternativas (A-E)
- Nível de residência médica / Revalida
- Apenas UMA questão por vez
- Espere a resposta do aluno antes de discutir`;
        break;

      case "discussion":
        systemPrompt += `FASE ATUAL: DISCUSSÃO COMPLETA DA QUESTÃO

Analise a questão respondida pelo aluno com TODOS estes elementos:

## 1. ✅ Alternativa Correta
Identifique e destaque a resposta certa.

## 2. 📖 Explicação Simples
Versão acessível do porquê.

## 3. 🔬 Explicação Técnica
Com base fisiopatológica e referências.

## 4. 🧠 Raciocínio Clínico
Como chegar à resposta correta passo a passo.

## 5. 🔄 Diagnóstico Diferencial
Compare com diagnósticos semelhantes.

## 6. 📋 Análise de TODAS as Alternativas
Explique por que cada alternativa está certa ou errada.

## 7. ⚠️ Ponto Clássico de Prova
Pegadinhas e armadilhas comuns.

## 8. 📝 Mini Resumo
3-5 linhas com o essencial do tema.

Ao final, pergunte se quer mais uma questão ou avançar para análise de desempenho.`;
        break;

      case "performance":
        systemPrompt += `FASE ATUAL: ANÁLISE DE DESEMPENHO

Dados do aluno:
${JSON.stringify(performanceData || {}, null, 2)}

Gere um painel de desempenho com:

## 📊 Painel de Desempenho
- Questões respondidas: X
- Taxa de acerto: X%
- Nível estimado: iniciante/intermediário/avançado
- Preparo para residência: X%

## 🧠 Mapa de Domínio por Especialidade
Liste o desempenho por área (cardiologia, pneumologia, neurologia, etc.)

## 📈 Recomendações
- Temas para revisar
- Próximos passos sugeridos
- Áreas que precisam de mais atenção

Seja motivador mas realista.`;
        break;

      default:
        systemPrompt += `Você é o ENAZIZI. Quando o aluno disser "vamos estudar" ou algo similar, inicie o fluxo automático:

1. 📊 Mostre o painel de desempenho atual (se houver dados)
2. 🎯 Pergunte qual tema quer estudar (ou sugira baseado em pontos fracos)
3. Siga o protocolo: Aula → Active Recall → Questões → Discussão → Desempenho

Se o aluno perguntar algo específico, responda com profundidade médica.

Sempre responda em português brasileiro.
Use emojis com moderação para organização visual.`;
    }

    if (userContext) {
      systemPrompt += `\n\n--- MATERIAL DE ESTUDO DO ALUNO ---\n${userContext}\n--- FIM DO MATERIAL ---`;
    }

    systemPrompt += `\n\nRegras gerais:
- Sempre em português brasileiro
- Cite referências (Harrison, Sabiston, Guyton, Robbins, guidelines)
- Use formatação Markdown rica
- Seja didático e profundo`;

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
