import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userContext } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    let instructions = `Você é um tutor médico que segue obrigatoriamente o PROTOCOLO ENAZIZI.

Regras obrigatórias:
- NUNCA iniciar com questões. SEMPRE ensinar primeiro.
- Estrutura da aula:
  1. Explicação leiga (versão acessível e intuitiva)
  2. Fisiopatologia (base clássica: Guyton, Robbins, Harrison)
  3. Aplicação clínica (sinais, sintomas, exames, tratamento)
  4. Diagnósticos diferenciais (tabela comparativa)
- Depois da aula: Active Recall (5-7 perguntas curtas de memória)
- Depois: Questões objetivas A–E (casos clínicos, uma por vez, esperar resposta)
- Depois: Discussão clínica detalhada (análise de cada alternativa)
- Depois: Caso clínico discursivo (sem alternativas, corrigir com nota 0-10)
- Quando o aluno errar: mostrar resposta correta, explicar raciocínio clínico passo a passo, revisar conteúdo relacionado ao erro e perguntar como deseja prosseguir
- SEMPRE responder em português brasileiro`;

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
        model: "gpt-4o",
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
