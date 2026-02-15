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

    let systemPrompt = `Você é o MentorMed, um mentor IA especializado na preparação para provas de Residência Médica no Brasil (ENARE, USP, UNIFESP, Santa Casa, UERJ, entre outras).

Suas responsabilidades:
- Responder dúvidas sobre as grandes áreas da medicina cobradas nas provas (Clínica Médica, Cirurgia, Pediatria, Ginecologia e Obstetrícia, Medicina Preventiva/Saúde Coletiva)
- Sugerir estratégias de estudo e cronogramas para residência médica
- Explicar conceitos médicos de forma clara e didática, com foco no que é cobrado nas provas
- Indicar temas mais cobrados em provas anteriores (ENARE, USP, UNIFESP, etc.)
- Motivar e orientar o candidato na jornada de preparação
- Abordar temas de urgência/emergência, farmacologia, semiologia e diagnóstico diferencial

Regras:
- Sempre responda em português brasileiro
- Seja conciso mas completo
- Use casos clínicos como exemplos quando possível
- Cite diretrizes, protocolos e guidelines relevantes (MS, SBP, FEBRASGO, etc.)
- Se não tiver certeza sobre algo, diga claramente
- IMPORTANTE: Quando o aluno perguntar sobre um tema, use o material de estudo dele (fornecido abaixo) como base para a resposta, citando trechos quando relevante.`;

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
    console.error("mentor-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
