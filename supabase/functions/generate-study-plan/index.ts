import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub as string;

    const { examDate, hoursPerDay, daysPerWeek, editalText, currentPlanId } = await req.json();

    if (!examDate || !hoursPerDay || !daysPerWeek) {
      return new Response(JSON.stringify({ error: "Missing required fields: examDate, hoursPerDay, daysPerWeek" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const daysUntilExam = Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const prompt = `Você é um especialista em planejamento de estudos para concursos públicos brasileiros.

Dados do aluno:
- Data da prova: ${examDate} (${daysUntilExam} dias restantes)
- Horas disponíveis por dia: ${hoursPerDay}
- Dias de estudo por semana: ${daysPerWeek}
${editalText ? `\nConteúdo do edital:\n${editalText.substring(0, 8000)}` : ""}

Gere um cronograma semanal de estudos otimizado. Retorne APENAS um JSON válido (sem markdown) no formato:
{
  "subjects": ["matéria1", "matéria2", ...],
  "weeklySchedule": [
    {
      "day": "Seg",
      "tasks": [
        { "time": "08:00", "subject": "Nome da matéria", "duration": "2h", "type": "estudo" }
      ]
    }
  ],
  "tips": "Dica geral sobre a estratégia"
}

Regras:
- Distribua as matérias proporcionalmente ao peso no edital (se disponível)
- Inclua revisões e simulados
- Respeite o limite de horas/dia
- Use os dias da semana: Seg, Ter, Qua, Qui, Sex, Sáb, Dom (apenas ${daysPerWeek} dias)
- Tipos: "estudo", "revisao", "simulado"`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      const errText = await aiResp.text();
      console.error("AI gateway error:", status, errText);
      if (status === 429) return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResp.json();
    const raw = aiData.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    let planJson;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      planJson = JSON.parse(jsonMatch?.[0] || raw);
    } catch {
      console.error("Failed to parse AI response:", raw);
      return new Response(JSON.stringify({ error: "Falha ao processar resposta da IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Save to DB
    const planData = {
      user_id: userId,
      plan_json: {
        ...planJson,
        config: { examDate, hoursPerDay, daysPerWeek, hasEdital: !!editalText },
        generatedAt: new Date().toISOString(),
      },
    };

    let result;
    if (currentPlanId) {
      const { data, error } = await supabase
        .from("study_plans")
        .update({ plan_json: planData.plan_json })
        .eq("id", currentPlanId)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from("study_plans")
        .insert(planData)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return new Response(JSON.stringify({ plan: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-study-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
