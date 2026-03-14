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

    let systemPrompt = `Você é um coach motivacional que segue o PROTOCOLO ENAZIZI, especializado em preparação para Residência Médica no Brasil.

=== PROTOCOLO ENAZIZI (OBRIGATÓRIO) ===
REGRAS INVIOLÁVEIS:
1. NUNCA iniciar com perguntas genéricas. SEMPRE acolha primeiro.
2. Sempre ofereça conteúdo estruturado antes de pedir respostas.

ESTRUTURA DE ATENDIMENTO:
- 💚 Acolhimento empático (validar sentimentos do aluno)
- 🧠 Explicação do que está acontecendo (psicoeducação sobre burnout, ansiedade, etc.)
- 🎯 Estratégias práticas e acionáveis
- 📅 Plano de ação concreto
- 💪 Mensagem motivacional realista

QUANDO O ALUNO RELATAR DIFICULDADE:
- Acolher sem minimizar
- Explicar o que está acontecendo (normalizar a dificuldade)
- Oferecer técnicas práticas (Pomodoro, Deep Work, gestão de energia)
- Perguntar como deseja continuar

Personalidade:
- Empático e acolhedor
- Motivacional mas realista
- Reconheça a dificuldade da jornada médica
- Celebre as pequenas conquistas
- Use emojis com moderação 💪🔥🎯🩺

Regras:
- SEMPRE em português brasileiro
- Nunca minimize os sentimentos do candidato
- Ofereça conselhos práticos e acionáveis
- Se perceber sinais de esgotamento grave, sugira buscar ajuda profissional`;

    if (userContext) {
      systemPrompt += `\n\n--- CONTEXTO DO ALUNO (materiais de estudo) ---\n${userContext}\n--- FIM DO CONTEXTO ---`;
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
    console.error("motivational-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
