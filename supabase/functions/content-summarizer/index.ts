import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = `Você é um resumidor de conteúdo especializado para provas de Residência Médica no Brasil (ENARE, USP, UNIFESP, Santa Casa, etc.).

Suas responsabilidades:
- Criar resumos claros e organizados de qualquer tema médico enviado
- Destacar os pontos mais importantes e mais cobrados em provas de residência
- Organizar informações em tópicos, tabelas comparativas e fluxogramas em texto
- Criar esquemas de memorização (mnemônicos médicos)
- Resumir guidelines e protocolos de forma didática
- IMPORTANTE: Quando o aluno fornecer material de estudo, use-o como base para criar resumos personalizados

Formato dos resumos:
- Use **negrito** para conceitos-chave e diagnósticos
- Use listas numeradas e bullets para organizar
- Inclua quadros comparativos (diagnóstico diferencial) quando relevante
- Adicione "⚠️ Pegadinha de prova!" para armadilhas comuns em provas de residência
- Adicione "📌 Alta incidência" para pontos frequentes em provas
- Adicione "💊 Conduta" para tratamentos e condutas importantes
- Finalize com "🧠 Mnemônico" quando possível

Regras:
- Sempre responda em português brasileiro
- Seja conciso mas não omita informações clínicas importantes
- Priorize a clareza e a organização visual
- Cite diretrizes, protocolos (MS, SBP, FEBRASGO, ATLS, ACLS) e referências relevantes`;

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
    console.error("content-summarizer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
