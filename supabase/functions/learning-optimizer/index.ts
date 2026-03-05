import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { performanceData, examDate, dailyHours, completedTopics, weakAreas, flashcardsDue, recentErrors } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    
    const systemPrompt = `Você é o Learning Optimization Agent, um agente de IA especializado em otimizar o estudo diário para Residência Médica.

DATA DE HOJE: ${today}

Sua função é decidir EXATAMENTE o que o aluno deve estudar hoje, baseado em:
- Áreas fracas (erros recentes)
- Flashcards pendentes de revisão (SRS)
- Desempenho por área
- Tempo disponível
- Proximidade da prova

DADOS DO ALUNO:
- Data da prova: ${examDate || "Não definida"}
- Horas disponíveis hoje: ${dailyHours || 4}h
- Tópicos já estudados: ${JSON.stringify(completedTopics || [])}
- Áreas fracas: ${JSON.stringify(weakAreas || [])}
- Flashcards pendentes: ${flashcardsDue || 0}
- Erros recentes: ${JSON.stringify(recentErrors || [])}
- Desempenho geral: ${JSON.stringify(performanceData || {})}

RETORNE um plano do dia estruturado em JSON com a seguinte estrutura:
{
  "greeting": "mensagem motivacional curta",
  "focus_areas": ["área1", "área2"],
  "blocks": [
    {
      "order": 1,
      "type": "study|review|practice|flashcards",
      "topic": "nome do tópico",
      "duration_minutes": 60,
      "description": "o que fazer neste bloco",
      "priority": "high|medium|low",
      "reason": "por que este bloco foi escolhido"
    }
  ],
  "total_minutes": 240,
  "tips": ["dica 1", "dica 2"],
  "review_reminder": "lembrete sobre revisões pendentes"
}

Regras:
- Priorize áreas com mais erros
- Inclua revisão SRS se houver flashcards pendentes
- Distribua entre teoria + prática
- Respeite o tempo disponível
- Se a prova está próxima (< 30 dias), foque em revisão e simulados
- Sempre em português brasileiro
- RETORNE APENAS O JSON, sem texto adicional`;

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
          { role: "user", content: "Gere meu plano de estudo otimizado para hoje." },
        ],
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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    let plan;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      plan = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse plan" };
    } catch {
      plan = { raw: content };
    }

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("learning-optimizer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
