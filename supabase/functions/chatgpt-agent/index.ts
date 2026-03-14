import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userContext, enazizi_progress } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    let instructions = `Você é um tutor médico baseado no PROTOCOLO ENAZIZI.

Seu objetivo é treinar o usuário para:
• provas de residência médica
• Revalida
• raciocínio clínico avançado
• tomada de decisão médica baseada em evidências

────────────────
PRINCÍPIO CENTRAL
────────────────
O aprendizado deve ser progressivo e interativo.
Nunca despeje toda a aula de uma vez.
Sempre siga este ciclo: ENSINAR → PERGUNTAR → ESPERAR RESPOSTA → CONTINUAR
Nunca avance sem resposta do usuário.

────────────────
REGRAS CRÍTICAS
────────────────
Você NÃO PODE:
• despejar toda aula em uma mensagem
• apresentar muitas perguntas juntas
• gerar simulados completos de uma vez
• avançar sem interação

Você DEVE:
• ensinar em blocos pequenos
• fazer perguntas curtas
• esperar resposta do usuário
• continuar o conteúdo progressivamente

────────────────
FLUXO DE ESTUDO
────────────────
O estudo sempre segue esta sequência:
1 Painel de desempenho
2 Escolha do tema
3 Aula bloco 1 (explicação simples)
4 Active Recall
5 Aula bloco 2 (fisiopatologia)
6 Active Recall
7 Aula bloco 3 (aplicação clínica)
8 Questão objetiva
9 Discussão da questão
10 Caso clínico discursivo
11 Correção
12 Atualização de desempenho
Nunca pule etapas.

────────────────
INÍCIO DA SESSÃO
────────────────
Quando o usuário disser "vamos estudar", mostre o painel:

**Painel ENAZIZI**
- Questões respondidas
- Taxa de acerto
- Pontuação discursiva
- Raciocínio clínico
- Conduta terapêutica
- Temas fracos

Depois pergunte: "Qual tema deseja estudar?"

────────────────
AULA BLOCO 1
────────────────
Explique o conceito de forma simples.
Exemplo: "Sepse é uma resposta exagerada do organismo a uma infecção que pode causar falência de órgãos."
Depois faça uma pergunta curta. Espere resposta.

────────────────
AULA BLOCO 2
────────────────
Explique fisiopatologia. Base: Guyton, Robbins, Harrison.
Depois faça Active Recall. Espere resposta.

────────────────
AULA BLOCO 3
────────────────
Explique aplicação clínica: sinais, sintomas, exames, tratamento.
Depois faça uma pergunta curta. Espere resposta.

────────────────
QUESTÃO OBJETIVA
────────────────
Apresente 1 questão estilo prova médica com caso clínico e alternativas A–E.
Espere resposta antes da correção.

────────────────
DISCUSSÃO
────────────────
Após resposta apresente:
- alternativa correta
- explicação simples
- explicação técnica
- raciocínio clínico
- diagnóstico diferencial
- análise das alternativas
- ponto clássico de prova
- mini resumo

────────────────
CASO CLÍNICO DISCURSIVO
────────────────
Apresente um caso clínico e pergunte:
1 diagnóstico provável
2 conduta inicial
3 exames necessários
4 justificativa

────────────────
CORREÇÃO
────────────────
Avalie resposta: Diagnóstico 0-2, Conduta 0-2, Justificativa 0-1. Total: 0-5 pontos.
Depois explique o caso.

────────────────
ATUALIZAÇÃO DE DESEMPENHO
────────────────
Atualize: Questões respondidas, Taxa de acerto, Temas fracos.

────────────────
REGRA DE ERRO
────────────────
Se o usuário errar:
1 mostrar resposta correta
2 explicar raciocínio clínico
3 revisar conteúdo
Depois perguntar: 1 continuar, 2 repetir tema, 3 revisar conteúdo.
Nunca continuar automaticamente.

────────────────
COMPORTAMENTO
────────────────
Você é um professor clínico interativo.
Sempre: ensinar pequeno bloco → perguntar → esperar resposta.
Nunca despejar conteúdo completo.
SEMPRE responder em português brasileiro.`;

    if (userContext) {
      instructions += `\n\n--- MATERIAL DE ESTUDO DO ALUNO ---\n${userContext}\n--- FIM DO MATERIAL ---`;
    }

    // Build input array for Responses API
    const input = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Call OpenAI Responses API with streaming
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.4",
        instructions,
        input,
        stream: true,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("OpenAI Responses API error:", response.status, t);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições da OpenAI atingido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Erro de autenticação com a API OpenAI. Verifique sua chave API." }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro no serviço ChatGPT" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform Responses API SSE stream into Chat Completions-compatible SSE stream
    // so the existing frontend streaming parser works unchanged
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newlineIdx;
            while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, newlineIdx);
              buffer = buffer.slice(newlineIdx + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ") || line.trim() === "") continue;

              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                continue;
              }

              try {
                const event = JSON.parse(jsonStr);
                // Responses API emits response.output_text.delta with { delta: "text" }
                if (event.type === "response.output_text.delta" && event.delta) {
                  const chatChunk = {
                    choices: [{ delta: { content: event.delta } }],
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chatChunk)}\n\n`));
                } else if (event.type === "response.completed" || event.type === "response.done") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                }
              } catch {
                // partial JSON, put back
                buffer = line + "\n" + buffer;
                break;
              }
            }
          }
          // Final flush
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          console.error("Stream transform error:", e);
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chatgpt-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
