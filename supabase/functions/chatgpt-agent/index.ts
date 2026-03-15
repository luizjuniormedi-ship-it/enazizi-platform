import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import ENAZIZI_PROMPT from "../_shared/enazizi-prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_OUTPUT_TOKENS = 16384;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userContext, enazizi_progress, error_bank } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    let instructions = ENAZIZI_PROMPT;

    if (userContext) {
      instructions += `\n\n--- MATERIAL DE ESTUDO DO ALUNO ---\n${userContext}\n--- FIM DO MATERIAL ---`;
    }

    if (enazizi_progress) {
      const stepNames: Record<number, string> = {
        0: "Painel de desempenho",
        1: "Escolha do tema",
        2: "Bloco técnico 1 (conceito/definição/visão geral)",
        3: "Active Recall do bloco 1",
        4: "Bloco técnico 2 (fisiopatologia profunda)",
        5: "Active Recall do bloco 2",
        6: "Bloco técnico 3 (clínica, diagnóstico, tratamento, conduta)",
        7: "Questão objetiva (caso clínico + A-E)",
        8: "Discussão da questão",
        9: "Caso clínico discursivo",
        10: "Correção discursiva (nota 0-5)",
        11: "Atualização de desempenho",
        12: "Bloco de consolidação (5 questões sequenciais)",
      };
      const step = enazizi_progress.estado_atual || 0;
      const stepName = stepNames[step] || "Desconhecido";
      instructions += `\n\n--- ESTADO ATUAL DO ALUNO ---
Etapa atual: STATE ${step}/12 — ${stepName}
Tema: ${enazizi_progress.tema_atual || "não definido"}
Questões respondidas: ${enazizi_progress.questoes_respondidas || 0}
Taxa de acerto: ${enazizi_progress.taxa_acerto || 0}%
Pontuação discursiva: ${enazizi_progress.pontuacao_discursiva ?? "não avaliado"}
Temas fracos: ${(enazizi_progress.temas_fracos || []).join(", ") || "nenhum"}

IMPORTANTE: Você está no STATE ${step} (${stepName}). Continue EXATAMENTE a partir deste estado.
NÃO repita estados anteriores. NÃO pule para estados futuros. Avance apenas UM estado por interação.
--- FIM DO ESTADO ---`;
    }

    if (error_bank && Array.isArray(error_bank) && error_bank.length > 0) {
      instructions += `\n\n--- BANCO DE ERROS DO ALUNO ---\n`;
      const grouped = new Map<string, { subtemas: string[]; total: number; categorias: string[] }>();
      for (const e of error_bank) {
        if (!grouped.has(e.tema)) grouped.set(e.tema, { subtemas: [], total: 0, categorias: [] });
        const g = grouped.get(e.tema)!;
        g.total += e.vezes_errado || 1;
        if (e.subtema && !g.subtemas.includes(e.subtema)) g.subtemas.push(e.subtema);
        if (e.categoria_erro && !g.categorias.includes(e.categoria_erro)) g.categorias.push(e.categoria_erro);
      }
      for (const [tema, info] of grouped) {
        instructions += `\n🔴 ${tema} (${info.total}x erros)`;
        if (info.subtemas.length) instructions += `\n   Subtemas: ${info.subtemas.join(", ")}`;
        if (info.categorias.length) instructions += `\n   Tipos de erro: ${info.categorias.join(", ")}`;
      }
      instructions += `\nUSE esses dados para reforçar temas fracos, priorizar revisão e gerar questões focadas nos pontos de erro.`;
      instructions += `\n--- FIM DO BANCO DE ERROS ---`;
    }

    const input = messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

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
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Erro de autenticação com a API OpenAI." }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro no serviço ChatGPT" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reader = response.body!.getReader();
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
                if (event.type === "response.output_text.delta" && event.delta) {
                  const chatChunk = { choices: [{ delta: { content: event.delta } }] };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chatChunk)}\n\n`));
                } else if (event.type === "response.completed" || event.type === "response.done") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                }
              } catch {
                buffer = line + "\n" + buffer;
                break;
              }
            }
          }
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
