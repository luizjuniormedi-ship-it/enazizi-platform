import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { totalQuestions, correctAnswers, areaBreakdown, studyHoursPerWeek, daysUntilExam, diagnosticScore, streakDays, flashcardsReviewed, simuladoScores } = await req.json();
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é o Performance Predictor Agent, especializado em prever o desempenho de candidatos a Residência Médica.

DADOS DO CANDIDATO:
- Questões respondidas: ${totalQuestions || 0}
- Acertos: ${correctAnswers || 0} (${totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0}%)
- Desempenho por área: ${JSON.stringify(areaBreakdown || {})}
- Horas de estudo/semana: ${studyHoursPerWeek || 0}
- Dias até a prova: ${daysUntilExam || "Não definido"}
- Score diagnóstico: ${diagnosticScore || "Não realizado"}
- Streak de estudos: ${streakDays || 0} dias
- Flashcards revisados: ${flashcardsReviewed || 0}
- Scores de simulados: ${JSON.stringify(simuladoScores || [])}

CALCULE e retorne um JSON com:
{
  "approval_probability": 0.0 a 1.0,
  "estimated_score": 0 a 100,
  "estimated_ranking_percentile": 0 a 100,
  "trend": "improving|stable|declining",
  "strongest_areas": ["área1", "área2"],
  "weakest_areas": ["área1", "área2"],
  "risk_factors": ["fator1", "fator2"],
  "recommendations": ["recomendação1", "recomendação2"],
  "confidence_level": "low|medium|high",
  "message": "mensagem personalizada sobre o desempenho"
}

Regras:
- Seja realista e baseado em dados
- Considere que a média de aprovação no ENARE é ~65-70%
- Se poucos dados, confidence_level = "low"
- Considere consistência (streak, simulados regulares)
- Sempre em português brasileiro
- RETORNE APENAS O JSON`;

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
          { role: "user", content: "Calcule minha previsão de desempenho para a prova de residência." },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido." }), {
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
    
    let prediction;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      prediction = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse prediction" };
    } catch {
      prediction = { raw: content };
    }

    return new Response(JSON.stringify(prediction), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("performance-predictor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
