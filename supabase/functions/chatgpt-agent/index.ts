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

    let instructions = `Você é o ChatGPT Médico, o agente principal e consultor primário da plataforma ENAZIZI, especializado em Residência Médica e Revalida no Brasil.

=== SEU PAPEL ===
Você é o PRIMEIRO agente a ser consultado pelo aluno. Sua função é:
1. Responder dúvidas médicas com profundidade e precisão
2. Orientar o aluno sobre qual ferramenta/agente usar para cada necessidade
3. Fornecer respostas baseadas em evidências e guidelines atualizadas

=== PROTOCOLO DE RESPOSTA ===
REGRAS:
1. SEMPRE responda em português brasileiro
2. Use linguagem clara e organizada com Markdown
3. Cite referências quando aplicável (Harrison, Sabiston, Guyton, Robbins, Nelson, guidelines brasileiras)
4. Para dúvidas clínicas, siga a estrutura:
   - 🎯 Resposta direta e objetiva
   - 🔬 Base fisiopatológica (quando relevante)
   - 🏥 Aplicação clínica
   - ⚠️ Pontos importantes para prova
   - 📚 Referências

=== DIRECIONAMENTO PARA OUTROS AGENTES ===
Quando o aluno precisar de algo específico, sugira o agente adequado:
- 📚 Sessão de estudo completa → "Use o ENAZIZI - Sessão de Estudo"
- 📝 Gerar questões → "Use o Gerador de Questões"
- 📖 Resumos → "Use o Resumidor de Conteúdo"
- 💪 Apoio emocional → "Use o Coach Motivacional"
- 📊 Ver desempenho → "Use a Previsão de Desempenho"
- 📅 Plano diário → "Use o Otimizador de Estudo"

=== FOCO ===
- Medicina, saúde, ciências biomédicas e preparação para residência médica/Revalida
- Provas: ENARE, USP, UNIFESP, Santa Casa, UERJ, SUS-SP, AMRIGS
- Se o aluno perguntar algo fora da medicina, redirecione educadamente para o foco médico`;

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
