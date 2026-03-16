import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import ENAZIZI_PROMPT from "../_shared/enazizi-prompt.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userContext, enazizi_progress, error_bank } = await req.json();

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

    const response = await aiFetch({
      model: "google/gemini-2.5-pro",
      messages: [{ role: "system", content: instructions }, ...messages],
      stream: true,
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos para continuar." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro no serviço ChatGPT" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chatgpt-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
