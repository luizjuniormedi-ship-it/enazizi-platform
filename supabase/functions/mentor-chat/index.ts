import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import ENAZIZI_PROMPT from "../_shared/enazizi-prompt.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";
import { searchPubMed, formatPubMedForPrompt, extractSearchTopic } from "../_shared/pubmed-search.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userContext } = await req.json();

    let systemPrompt = ENAZIZI_PROMPT;
    if (userContext) {
      systemPrompt += `\n\n--- MATERIAL DE ESTUDO DO ALUNO ---\n${userContext}\n--- FIM DO MATERIAL ---`;
    }

    // Search PubMed for relevant articles based on user's question
    const topic = extractSearchTopic(messages || []);
    if (topic.length >= 3) {
      try {
        const articles = await searchPubMed(topic, 3);
        const pubmedBlock = formatPubMedForPrompt(articles);
        if (pubmedBlock) {
          systemPrompt += pubmedBlock;
          systemPrompt += `\n\nINSTRUÇÃO OBRIGATÓRIA: Inclua uma seção "🔬 ARTIGOS CIENTÍFICOS (PubMed/NLM)" ao final da resposta citando os artigos acima com título, autores, periódico, ano e link. Estes são artigos REAIS da Biblioteca Nacional de Medicina (NLM/NIH).`;
        }
      } catch (e) {
        console.error("PubMed enrichment failed (non-blocking):", e);
      }
    }

    const response = await aiFetch({
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("mentor-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
