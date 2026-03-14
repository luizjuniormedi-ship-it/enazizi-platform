import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NON_MEDICAL_CONTENT_REGEX = /(direito|jur[ií]d|penal|constitucional|processo penal|inquérito|inqu[eé]rito|stf|stj|delegad|advogad|pol[ií]cia federal|c[oó]digo penal|a[cç][aã]o penal|inform[aá]tica|tecnologia da informa[cç][aã]o|engenharia|contabil|economia|administra[cç][aã]o)/i;
const MEDICAL_CONTENT_REGEX = /(medicin|sa[uú]de|paciente|diagn[oó]st|tratament|sintom|doen[cç]|fisiopat|farmac|anatom|cl[íi]nic|cirurg|pediatr|ginec|obstetr|preventiva|resid[eê]ncia|enare|revalida|protocolo|diretriz|sus)/i;

const isMedicalContent = (text: string) => MEDICAL_CONTENT_REGEX.test(text) && !NON_MEDICAL_CONTENT_REGEX.test(text);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use service role to bypass RLS for DB ops, and validate user via getUser with the token
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error("Auth error:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = user.id;

    // Client scoped to user for RLS queries
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { examDate, hoursPerDay, daysPerWeek, editalText, currentPlanId } = await req.json();

    if (!examDate || !hoursPerDay || !daysPerWeek) {
      return new Response(JSON.stringify({ error: "Missing required fields: examDate, hoursPerDay, daysPerWeek" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const editalPreview = String(editalText || "").slice(0, 8000);
    if (editalPreview && !isMedicalContent(editalPreview)) {
      return new Response(JSON.stringify({ error: "Edital rejeitado: somente conteúdo médico é permitido para gerar cronograma." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const daysUntilExam = Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const prompt = `Você é um especialista em planejamento de estudos para provas de Residência Médica no Brasil (ENARE, USP, UNIFESP, Santa Casa, etc.).

⛔ RESTRIÇÃO ABSOLUTA DE ESCOPO:
Você só pode montar planos de estudo de MEDICINA, SAÚDE e CIÊNCIAS BIOMÉDICAS.
Se identificar tema não médico, responda com JSON de erro sem gerar plano.

Dados do aluno:
- Data da prova: ${examDate} (${daysUntilExam} dias restantes)
- Horas disponíveis por dia: ${hoursPerDay}
- Dias de estudo por semana: ${daysPerWeek}
${editalPreview ? `\nConteúdo programático/edital:\n${editalPreview}` : ""}

Gere um cronograma semanal de estudos otimizado para residência médica. Retorne APENAS um JSON válido (sem markdown) no formato:
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
- As matérias principais são: Clínica Médica, Cirurgia, Pediatria, Ginecologia e Obstetrícia, Medicina Preventiva/Saúde Coletiva
- NUNCA incluir Direito, Engenharia, Informática ou qualquer área não médica
- Distribua as matérias proporcionalmente ao peso nas provas (Clínica Médica geralmente tem maior peso)
- Inclua revisões, resolução de questões e simulados
- Respeite o limite de horas/dia
- Use os dias da semana: Seg, Ter, Qua, Qui, Sex, Sáb, Dom (apenas ${daysPerWeek} dias)
- Tipos: "estudo", "revisao", "simulado", "questoes"
- Considere que o aluno pode ter plantões/internato e precisa de flexibilidade`;

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
        response_format: { type: "json_object" },
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
      // Try direct parse first
      planJson = JSON.parse(raw);
    } catch {
      try {
        // Try extracting from markdown code blocks
        const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          planJson = JSON.parse(codeBlockMatch[1].trim());
        } else {
          // Try extracting any JSON object
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            planJson = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("No JSON found in response");
          }
        }
      } catch {
        console.error("Failed to parse AI response:", raw);
        return new Response(JSON.stringify({ error: "Falha ao processar resposta da IA. Tente novamente." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const safeSubjects = Array.isArray(planJson?.subjects)
      ? planJson.subjects.map(String).filter((s: string) => isMedicalContent(s))
      : [];

    const safeWeeklySchedule = Array.isArray(planJson?.weeklySchedule)
      ? planJson.weeklySchedule
          .map((day: any) => ({
            day: String(day?.day || ""),
            tasks: Array.isArray(day?.tasks)
              ? day.tasks
                  .map((t: any) => ({
                    time: String(t?.time || ""),
                    subject: String(t?.subject || ""),
                    duration: String(t?.duration || ""),
                    type: String(t?.type || "estudo"),
                  }))
                  .filter((t: any) => isMedicalContent(`${t.subject} ${t.type}`))
              : [],
          }))
          .filter((d: any) => d.tasks.length > 0)
      : [];

    if (safeWeeklySchedule.length === 0) {
      return new Response(JSON.stringify({ error: "A IA retornou um cronograma sem conteúdo médico válido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save to DB
    const planData = {
      user_id: userId,
      plan_json: {
        ...planJson,
        subjects: safeSubjects,
        weeklySchedule: safeWeeklySchedule,
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