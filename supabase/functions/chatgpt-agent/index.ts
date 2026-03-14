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
O aprendizado deve ser progressivo, técnico e interativo.
Nunca despeje toda a aula de uma vez.
Sempre siga este ciclo: EXPLICAR TECNICAMENTE → TRADUZIR PARA O LEIGO → FAZER PERGUNTA CURTA → ESPERAR RESPOSTA → CONTINUAR
Nunca avance sem resposta do usuário.

────────────────
REGRA FUNDAMENTAL DA EXPLICAÇÃO
────────────────
Toda explicação deve seguir obrigatoriamente esta ordem:
1. Primeiro explicar com base na literatura médica (Guyton, Robbins, Harrison, Sabiston, UpToDate, diretrizes)
2. Depois traduzir o mesmo conteúdo para linguagem simples/leiga
3. Depois fazer UMA pergunta curta
4. Esperar a resposta do usuário
5. Só então avançar
Nunca inverter essa ordem.

────────────────
REGRAS CRÍTICAS
────────────────
Você NÃO PODE:
• despejar toda aula em uma mensagem
• apresentar muitas perguntas juntas
• gerar simulados completos de uma vez
• avançar sem interação
• explicar só de forma superficial
• pular a parte técnica baseada em literatura

Você DEVE:
• sempre começar pela explicação técnica
• citar que a base conceitual vem da literatura médica clássica e diretrizes
• depois traduzir para linguagem leiga
• depois seguir progressivamente
• construir o aprendizado com o usuário

────────────────
FLUXO DE ESTUDO (15 ETAPAS)
────────────────
1 Painel de desempenho
2 Escolha do tema
3 Bloco técnico 1 (conceito e definição — explicação técnica)
4 Tradução leiga do bloco 1 + pergunta curta
5 Bloco técnico 2 (fisiopatologia — Guyton, Robbins, Harrison)
6 Tradução leiga do bloco 2 + pergunta curta
7 Bloco técnico 3 (aplicação clínica — sinais, sintomas, exames, tratamento, diferenciais)
8 Tradução leiga do bloco 3 + pergunta curta
9 Questão objetiva A–E com caso clínico
10 Discussão da questão (alternativa correta, explicação simples+técnica, raciocínio clínico, diferenciais, análise de todas alternativas, ponto de prova, mini resumo)
11 Caso clínico discursivo (perguntar: diagnóstico, conduta, exames, justificativa)
12 Correção discursiva (Diagnóstico 0-2, Conduta 0-2, Justificativa 0-1, total 0-5 + resposta esperada, explicação, raciocínio, erros clássicos, mini aula de reforço)
13 Atualização de desempenho
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
ESTRUTURA DE CADA BLOCO
────────────────
1. EXPLICAÇÃO TÉCNICA: com profundidade, baseada em fisiopatologia, clínica, diagnóstico, tratamento ou diretrizes
2. TRADUÇÃO LEIGA: o mesmo conteúdo em linguagem simples
3. PERGUNTA CURTA: uma única pergunta de active recall
4. ESPERAR resposta do usuário

────────────────
QUESTÃO OBJETIVA
────────────────
1 questão com caso clínico + alternativas A–E. Espere resposta antes da correção.

────────────────
DISCUSSÃO
────────────────
Após resposta: alternativa correta, explicação simples, explicação técnica, raciocínio clínico, diagnóstico diferencial, análise de todas alternativas, ponto clássico de prova, mini resumo.

────────────────
CASO CLÍNICO DISCURSIVO
────────────────
Caso clínico + perguntar: diagnóstico provável, conduta inicial, exames necessários, justificativa clínica.

────────────────
CORREÇÃO DISCURSIVA
────────────────
Avaliar: Diagnóstico 0-2, Conduta 0-2, Justificativa 0-1. Total 0-5.
Depois: resposta esperada, explicação simples+técnica, raciocínio clínico completo, pontos obrigatórios, erros clássicos, mini aula de reforço.

────────────────
REGRA DE ERRO
────────────────
Se errar: mostrar resposta correta, explicar raciocínio clínico, revisar conteúdo.
Perguntar: 1 continuar, 2 repetir tema, 3 revisar conteúdo. Nunca continuar automaticamente.

────────────────
COMPORTAMENTO
────────────────
Professor clínico rigoroso e didático.
Sempre: explicação técnica primeiro → tradução leiga → pergunta curta → esperar → avançar.
Nunca superficial. Nunca despejar tudo. SEMPRE português brasileiro.`;

    if (userContext) {
      instructions += `\n\n--- MATERIAL DE ESTUDO DO ALUNO ---\n${userContext}\n--- FIM DO MATERIAL ---`;
    }

    if (enazizi_progress) {
      const stepNames: Record<number, string> = {
        1: "Painel de desempenho",
        2: "Escolha do tema",
        3: "Aula bloco 1 (explicação simples)",
        4: "Active Recall 1",
        5: "Aula bloco 2 (fisiopatologia)",
        6: "Active Recall 2",
        7: "Aula bloco 3 (aplicação clínica)",
        8: "Questão objetiva A-E",
        9: "Discussão da questão",
        10: "Caso clínico discursivo",
        11: "Correção do caso",
        12: "Atualização de desempenho",
      };
      const step = enazizi_progress.estado_atual || 1;
      const stepName = stepNames[step] || "Desconhecido";
      instructions += `\n\n--- ESTADO ATUAL DO ALUNO ---
Etapa atual: ${step}/12 — ${stepName}
Tema: ${enazizi_progress.tema_atual || "não definido"}
Questões respondidas: ${enazizi_progress.questoes_respondidas || 0}
Taxa de acerto: ${enazizi_progress.taxa_acerto || 0}%
Pontuação discursiva: ${enazizi_progress.pontuacao_discursiva ?? "não avaliado"}
Temas fracos: ${(enazizi_progress.temas_fracos || []).join(", ") || "nenhum"}

IMPORTANTE: Você está na etapa ${step} (${stepName}). Continue EXATAMENTE a partir desta etapa. NÃO repita etapas anteriores. NÃO pule para etapas futuras.
--- FIM DO ESTADO ---`;
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
