import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch, sanitizeAiContent } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NON_MEDICAL_CONTENT_REGEX = /(direito\s+(penal|civil|constitucional|tributário)|jur[ií]dic|processo\s+penal|stf|stj|delegad[oa]|advogad[oa]|pol[ií]cia\s+federal|c[oó]digo\s+penal|a[cç][aã]o\s+penal|engenharia\s+(civil|elétrica|mecânica)|contabilidade|ciências\s+contábeis)/i;

// For edital/cronograma: only reject clearly non-medical content, accept everything else
// Medical subjects often have generic names (e.g., "Atenção Básica", "Saúde da Família", "Urgência")
const isNonMedicalContent = (text: string) => NON_MEDICAL_CONTENT_REGEX.test(text);

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
    if (editalPreview && isNonMedicalContent(editalPreview)) {
      return new Response(JSON.stringify({ error: "Edital rejeitado: somente conteúdo médico é permitido para gerar cronograma." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const daysUntilExam = Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const prompt = `Você é um especialista em planejamento de estudos médicos.

⛔ RESTRIÇÃO: Somente conteúdo de MEDICINA, SAÚDE e CIÊNCIAS BIOMÉDICAS.

Dados do aluno:
- Data da prova: ${examDate} (${daysUntilExam} dias restantes)
- Horas disponíveis por dia: ${hoursPerDay}
- Dias de estudo por semana: ${daysPerWeek}
${editalPreview ? `\n📋 CONTEÚDO PROGRAMÁTICO / CRONOGRAMA ENVIADO PELO ALUNO:\n---\n${editalPreview}\n---` : ""}

🎯 INSTRUÇÕES CRÍTICAS:

1. **EXTRAIA TODOS OS TEMAS**: Leia o conteúdo acima linha por linha. CADA tópico mencionado (ex: "Bronquiolite", "ITU", "Pneumonias I", "Cardiopatias Congênitas II", "Piodermites", "Síndrome Nefrótica", "Meningoencefalites") DEVE aparecer no plano. NÃO IGNORE NENHUM TEMA.

2. **IDENTIFIQUE A ESPECIALIDADE**: O documento pode ser de uma disciplina específica (ex: Pediatria, Clínica Médica). Identifique e use como contexto.

3. **RESPEITE A ORDEM CRONOLÓGICA**: Se houver datas no documento, organize os temas na mesma sequência temporal.

4. **ROTEIRO CLARO**: Cada bloco de estudo deve ter:
   - O tema específico (não genérico)
   - Tempo dedicado
   - Tipo de atividade (estudo teórico, questões, revisão, simulado)

5. **DISTRIBUA AS ATIVIDADES**:
   - Estudo teórico do tema novo
   - Resolução de questões sobre o tema
   - Revisões espaçadas de temas anteriores
   - Simulados periódicos

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`) no formato:
{
  "detectedSpecialty": "Pediatria",
  "subjects": ["Infecções de Vias Aéreas Superiores", "Bronquiolite", "Asma Brônquica", ...TODOS os temas],
  "weeklySchedule": [
    {
      "day": "Seg",
      "tasks": [
        { "time": "08:00", "subject": "Bronquiolite", "duration": "2h", "type": "estudo", "details": "Estudar etiologia (VSR), fisiopatologia, quadro clínico e manejo" },
        { "time": "10:00", "subject": "Questões - Bronquiolite", "duration": "1h", "type": "questoes", "details": "Resolver 20 questões sobre bronquiolite" }
      ]
    }
  ],
  "tips": "Dica geral sobre a estratégia",
  "totalTopicsExtracted": 12
}

Regras:
- O campo "details" é OBRIGATÓRIO em cada task - explique O QUE estudar naquele bloco
- Use os dias: Seg, Ter, Qua, Qui, Sex, Sáb, Dom (apenas ${daysPerWeek} dias)
- Tipos válidos: "estudo", "revisao", "simulado", "questoes"
- TODOS os temas do documento DEVEM estar distribuídos no cronograma
- Respeite o limite de ${hoursPerDay}h/dia
- Se não houver edital, use temas padrão de residência médica`;

    const aiResp = await aiFetch({
      messages: [{ role: "user", content: prompt }],
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), { status: aiResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResp.json();
    const raw = sanitizeAiContent(aiData.choices?.[0]?.message?.content || "");

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
      ? planJson.subjects.map(String).filter((s: string) => !isNonMedicalContent(s))
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
                  .filter((t: any) => !isNonMedicalContent(`${t.subject}`))
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

    // Build suggested simulado config based on subject distribution
    const subjectCounts: Record<string, number> = {};
    for (const day of safeWeeklySchedule) {
      for (const task of day.tasks) {
        const subj = task.subject;
        subjectCounts[subj] = (subjectCounts[subj] || 0) + 1;
      }
    }
    const totalTasks = Object.values(subjectCounts).reduce((s, c) => s + c, 0);
    const suggestedSimulado = {
      totalQuestions: 40,
      timeMinutes: 120,
      distribution: Object.entries(subjectCounts).map(([subject, count]) => ({
        subject,
        questions: Math.max(1, Math.round((count / totalTasks) * 40)),
      })).sort((a, b) => b.questions - a.questions),
    };

    // Save to DB
    const planData = {
      user_id: userId,
      plan_json: {
        ...planJson,
        subjects: safeSubjects,
        weeklySchedule: safeWeeklySchedule,
        suggestedSimulado,
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