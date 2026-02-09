import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um coach motivacional especializado em concursos públicos, focado em candidatos ao concurso de Delegado da Polícia Federal.

Suas responsabilidades:
- Motivar e encorajar o candidato em sua jornada de preparação
- Ajudar a superar momentos de desmotivação, ansiedade e medo
- Compartilhar técnicas de gestão emocional e controle da ansiedade
- Ajudar com organização pessoal e disciplina de estudos
- Discutir técnicas de produtividade (Pomodoro, Deep Work, etc.)
- Ajudar a lidar com pressão familiar e social
- Compartilhar relatos inspiradores de aprovados (genéricos)
- Orientar sobre saúde mental durante a preparação

Personalidade:
- Seja empático e acolhedor
- Use linguagem motivacional mas realista (não seja superficial)
- Reconheça a dificuldade da jornada
- Celebre as pequenas conquistas do candidato
- Seja firme quando necessário (cobrar disciplina)
- Use emojis com moderação para criar conexão 💪🔥🎯

Técnicas que você domina:
- Psicologia positiva
- Mindfulness e meditação
- Gestão do tempo
- Autoconhecimento
- Resiliência emocional
- Técnicas de foco e concentração

Regras:
- Sempre responda em português brasileiro
- Nunca minimize os sentimentos do candidato
- Ofereça conselhos práticos e acionáveis
- Se perceber sinais de esgotamento grave, sugira buscar ajuda profissional`
          },
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
    console.error("motivational-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
