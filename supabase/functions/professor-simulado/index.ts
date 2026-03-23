import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch, sanitizeAiContent } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await sb.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check professor role
    const { data: roleData } = await sb.from("user_roles").select("role").eq("user_id", user.id).in("role", ["professor", "admin"]);
    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Apenas professores podem usar esta função." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action, ...params } = await req.json();
    const ok = (data: unknown) => new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    switch (action) {
      case "generate_questions": {
        const { topics, count = 10 } = params;
        if (!topics || !topics.length) throw new Error("Selecione pelo menos um tema");

        const topicList = topics.join(", ");
        const perTopic = Math.max(1, Math.floor(count / topics.length));
        const prompt = `Gere exatamente ${count} questões objetivas de múltipla escolha (A-E) para residência médica sobre: ${topicList}.

${topics.length > 1 ? `ORGANIZAÇÃO POR BLOCOS: Distribua as questões proporcionalmente entre os temas (~${perTopic} por tema). Cada questão DEVE ter o campo "block" indicando o bloco temático ao qual pertence (ex: "Cardiologia", "Farmacologia").` : `Todas as questões pertencem ao bloco "${topics[0]}". Cada questão DEVE ter o campo "block" com o valor "${topics[0]}".`}

Para cada questão, retorne APENAS um array JSON válido no formato:
[
  {
    "block": "Nome do bloco temático",
    "statement": "Texto do enunciado com caso clínico",
    "options": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
    "correct_index": 0,
    "explanation": "Explicação detalhada da resposta correta",
    "topic": "Tema/subtema específico da questão"
  }
]

REGRAS:
- OBRIGATÓRIO: No mínimo 70% das questões (${Math.ceil(count * 0.7)} de ${count}) devem ser baseadas em CASOS CLÍNICOS com apresentação de paciente, história, exame físico e/ou exames complementares
- As demais (até 30%) podem ser questões teóricas diretas
- 5 alternativas (A-E)
- correct_index é o índice (0-4) da alternativa correta
- Baseie-se em provas reais de residência (ENARE, USP, UNIFESP)
- Agrupe as questões por bloco temático no array (todas de um bloco juntas, depois o próximo bloco)
- REGRA DE GABARITO: NUNCA repita a mesma letra de resposta correta em questões consecutivas. Distribua equilibradamente entre A(0), B(1), C(2), D(3) e E(4). Em cada bloco de 5 questões, use pelo menos 3 letras diferentes.

ANAMNESE ÚNICA POR QUESTÃO (REGRA ABSOLUTA):
- NUNCA repita nome, idade, sexo ou perfil de paciente entre questões
- Cada questão DEVE ter um paciente COMPLETAMENTE DIFERENTE
- Variar: nomes regionais brasileiros, idades de 0 a 95 anos, profissões diversas
- Alternar cenários: PS, enfermaria, UTI, UBS, SAMU, ambulatório, domicílio
- Variar comorbidades: DM, HAS, IRC, HIV, tabagismo, etilismo, gestante
- Variar queixa principal e tempo de evolução (horas, dias, semanas, meses)
- PROIBIDO: dois pacientes com mesmo perfil demográfico no mesmo bloco
- Retorne APENAS o JSON, sem texto adicional`;

        const response = await aiFetch({
          messages: [{ role: "user", content: prompt }],
          model: "google/gemini-2.5-flash",
        });

        if (!response.ok) {
          const t = await response.text();
          console.error("AI error:", t);
          throw new Error("Erro ao gerar questões");
        }

        const aiData = await response.json();
        const content = sanitizeAiContent(aiData.choices?.[0]?.message?.content || "");

        // Parse JSON from response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("Erro ao processar questões geradas");

        const questions = JSON.parse(jsonMatch[0]);
        return ok({ questions });
      }

      case "create_simulado": {
        const { title, description, topics, faculdade_filter, periodo_filter, total_questions, time_limit_minutes, questions_json } = params;

        const { data: simulado, error } = await sb.from("teacher_simulados").insert({
          professor_id: user.id,
          title: title || "Simulado",
          description,
          topics: topics || [],
          faculdade_filter: faculdade_filter || null,
          periodo_filter: periodo_filter || null,
          total_questions: total_questions || questions_json?.length || 10,
          time_limit_minutes: time_limit_minutes || 60,
          questions_json: questions_json || [],
          status: "published",
        }).select("id").single();

        if (error) throw new Error(error.message);

        // Find matching students and create pending results
        let studentQuery = sb.from("profiles").select("user_id").eq("status", "active");
        if (faculdade_filter) studentQuery = studentQuery.eq("faculdade", faculdade_filter);
        if (periodo_filter) studentQuery = studentQuery.eq("periodo", periodo_filter);

        const { data: students } = await studentQuery;

        if (students && students.length > 0) {
          const results = students.map((s: any) => ({
            simulado_id: simulado.id,
            student_id: s.user_id,
            total_questions: questions_json?.length || total_questions,
            status: "pending",
          }));
          await sb.from("teacher_simulado_results").insert(results);
        }

        return ok({ success: true, simulado_id: simulado.id, students_assigned: students?.length || 0 });
      }

      case "list_simulados": {
        const { data: simulados } = await sb
          .from("teacher_simulados")
          .select("*")
          .eq("professor_id", user.id)
          .order("created_at", { ascending: false });

        // Get result counts
        const simIds = (simulados || []).map((s: any) => s.id);
        let resultsBySimulado: Record<string, { total: number; completed: number; avgScore: number }> = {};

        if (simIds.length > 0) {
          const { data: results } = await sb
            .from("teacher_simulado_results")
            .select("simulado_id, status, score")
            .in("simulado_id", simIds);

          for (const r of (results || [])) {
            if (!resultsBySimulado[r.simulado_id]) {
              resultsBySimulado[r.simulado_id] = { total: 0, completed: 0, avgScore: 0 };
            }
            resultsBySimulado[r.simulado_id].total++;
            if (r.status === "completed") {
              resultsBySimulado[r.simulado_id].completed++;
              resultsBySimulado[r.simulado_id].avgScore += (r.score || 0);
            }
          }

          // Calculate averages
          for (const key of Object.keys(resultsBySimulado)) {
            const d = resultsBySimulado[key];
            if (d.completed > 0) d.avgScore = Math.round(d.avgScore / d.completed);
          }
        }

        return ok({ simulados: (simulados || []).map((s: any) => ({ ...s, results_summary: resultsBySimulado[s.id] || { total: 0, completed: 0, avgScore: 0 } })) });
      }

      case "get_simulado_results": {
        const { simulado_id } = params;
        if (!simulado_id) throw new Error("simulado_id obrigatório");

        const { data: results } = await sb
          .from("teacher_simulado_results")
          .select("*")
          .eq("simulado_id", simulado_id)
          .order("score", { ascending: false });

        // Enrich with student names
        const studentIds = (results || []).map((r: any) => r.student_id);
        const { data: profiles } = await sb.from("profiles").select("user_id, display_name, email, faculdade, periodo").in("user_id", studentIds);

        const enriched = (results || []).map((r: any) => {
          const p = (profiles || []).find((p: any) => p.user_id === r.student_id);
          return { ...r, student_name: p?.display_name || "Sem nome", student_email: p?.email || "", faculdade: p?.faculdade, periodo: p?.periodo };
        });

        return ok({ results: enriched });
      }

      case "get_students": {
        const { faculdade, periodo } = params;
        let query = sb.from("profiles").select("user_id, display_name, email, faculdade, periodo, status").eq("status", "active");
        if (faculdade) query = query.eq("faculdade", faculdade);
        if (periodo) query = query.eq("periodo", periodo);

        const { data: students } = await query.order("display_name");
        return ok({ students: students || [] });
      }

      case "class_analytics": {
        const { faculdade, periodo } = params;

        // Get students matching filters
        let sQuery = sb.from("profiles").select("user_id, display_name, email, faculdade, periodo").eq("status", "active");
        if (faculdade) sQuery = sQuery.eq("faculdade", faculdade);
        if (periodo) sQuery = sQuery.eq("periodo", periodo);
        const { data: students } = await sQuery.order("display_name");
        if (!students || students.length === 0) return ok({ students: [], weakTopics: [], topPerformers: [] });

        const studentIds = students.map((s: any) => s.user_id);

        // Get domain scores for all students
        const { data: domains } = await sb.from("medical_domain_map")
          .select("user_id, specialty, domain_score, questions_answered, correct_answers, errors_count")
          .in("user_id", studentIds);

        // Get error bank aggregates
        const { data: errors } = await sb.from("error_bank")
          .select("user_id, tema, vezes_errado")
          .in("user_id", studentIds);

        // Get study performance
        const { data: perfData } = await sb.from("study_performance")
          .select("user_id, questoes_respondidas, taxa_acerto")
          .in("user_id", studentIds);

        // Build per-student stats
        const studentStats = students.map((s: any) => {
          const sDomains = (domains || []).filter((d: any) => d.user_id === s.user_id);
          const sErrors = (errors || []).filter((e: any) => e.user_id === s.user_id);
          const sPerf = (perfData || []).find((p: any) => p.user_id === s.user_id);
          const avgScore = sDomains.length > 0
            ? Math.round(sDomains.reduce((sum: number, d: any) => sum + d.domain_score, 0) / sDomains.length)
            : 0;
          const totalErrors = sErrors.reduce((sum: number, e: any) => sum + e.vezes_errado, 0);

          return {
            user_id: s.user_id,
            display_name: s.display_name || s.email,
            faculdade: s.faculdade,
            periodo: s.periodo,
            avg_domain_score: avgScore,
            questions_answered: sPerf?.questoes_respondidas || 0,
            accuracy: sPerf?.taxa_acerto ? Math.round(sPerf.taxa_acerto * 100) : 0,
            total_errors: totalErrors,
            specialties_studied: sDomains.length,
          };
        });

        // Weak topics across the class
        const topicErrorMap: Record<string, number> = {};
        (errors || []).forEach((e: any) => {
          topicErrorMap[e.tema] = (topicErrorMap[e.tema] || 0) + e.vezes_errado;
        });
        const weakTopics = Object.entries(topicErrorMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([topic, count]) => ({ topic, error_count: count }));

        // Top performers
        const topPerformers = [...studentStats]
          .sort((a, b) => b.avg_domain_score - a.avg_domain_score)
          .slice(0, 5);

        return ok({ students: studentStats, weakTopics, topPerformers });
      }

      case "student_detail": {
        const { student_id } = params;
        if (!student_id) throw new Error("student_id obrigatório");

        // Profile
        const { data: profile } = await sb.from("profiles")
          .select("user_id, display_name, email, faculdade, periodo")
          .eq("user_id", student_id).single();
        if (!profile) throw new Error("Aluno não encontrado");

        // Domain scores
        const { data: domains } = await sb.from("medical_domain_map")
          .select("specialty, domain_score, questions_answered, correct_answers, errors_count")
          .eq("user_id", student_id);

        // Error bank
        const { data: errors } = await sb.from("error_bank")
          .select("tema, vezes_errado, categoria_erro")
          .eq("user_id", student_id)
          .order("vezes_errado", { ascending: false })
          .limit(15);

        // Study performance
        const { data: perf } = await sb.from("study_performance")
          .select("questoes_respondidas, taxa_acerto")
          .eq("user_id", student_id).maybeSingle();

        // Gamification
        const { data: gam } = await sb.from("user_gamification")
          .select("xp, level, current_streak")
          .eq("user_id", student_id).maybeSingle();

        // Simulado results
        const { data: simResults } = await sb.from("teacher_simulado_results")
          .select("simulado_id, score, status, finished_at")
          .eq("student_id", student_id)
          .order("created_at", { ascending: false })
          .limit(20);

        // Enrich with simulado titles
        const simIds = (simResults || []).map((r: any) => r.simulado_id);
        let simTitles: Record<string, string> = {};
        if (simIds.length > 0) {
          const { data: sims } = await sb.from("teacher_simulados").select("id, title").in("id", simIds);
          for (const s of (sims || [])) simTitles[s.id] = s.title;
        }

        // Quotas
        const { data: quotas } = await sb.from("user_quotas")
          .select("questions_used, questions_limit")
          .eq("user_id", student_id).maybeSingle();

        return ok({
          profile,
          domain_scores: domains || [],
          error_topics: errors || [],
          study_performance: perf ? { questoes_respondidas: perf.questoes_respondidas, taxa_acerto: Math.round((perf.taxa_acerto || 0) * 100) } : null,
          gamification: gam || null,
          simulado_results: (simResults || []).map((r: any) => ({
            title: simTitles[r.simulado_id] || "Simulado",
            score: r.score != null ? Math.round(r.score) : null,
            status: r.status,
            finished_at: r.finished_at,
          })),
          quotas: quotas || null,
        });
      }

      // ========== CLINICAL CASES (Plantão) ==========

      case "generate_clinical_case": {
        const { specialty = "Clínica Médica", difficulty = "intermediário" } = params;

        const CLINICAL_PROMPT = `Você é o simulador de PLANTÃO MÉDICO. Gere um caso clínico de pronto-socorro/plantão com:
- Queixa principal do paciente (em 1ª pessoa, como paciente falaria)
- Sinais vitais básicos
- Cenário do atendimento (PS, enfermaria, UTI)
- NÃO revele o diagnóstico ao aluno

Especialidade: ${specialty}
Dificuldade: ${difficulty}

Responda APENAS em JSON válido:
{
  "patient_presentation": "texto da apresentação do paciente em 1ª pessoa",
  "vitals": { "PA": "...", "FC": "...", "FR": "...", "Temp": "...", "SpO2": "..." },
  "setting": "Pronto-Socorro / UTI / Enfermaria",
  "triage_color": "vermelho/amarelo/verde",
  "hidden_diagnosis": "diagnóstico correto (NÃO mostrar ao aluno)",
  "hidden_key_findings": ["achado1", "achado2", "achado3"],
  "difficulty_score": 1-5
}

REGRAS:
- Seja realista e variado
- Inclua doenças tropicais, emergências, apresentações atípicas
- Use diretrizes médicas atualizadas (2024-2026)
- Variar faixa etária, sexo, comorbidades, cenário`;

        const response = await aiFetch({
          messages: [{ role: "user", content: CLINICAL_PROMPT }],
          model: "google/gemini-2.5-flash",
        });

        if (!response.ok) {
          const t = await response.text();
          console.error("AI error:", t);
          throw new Error("Erro ao gerar caso clínico");
        }

        const aiData = await response.json();
        const content = sanitizeAiContent(aiData.choices?.[0]?.message?.content || "");
        const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const caseData = JSON.parse(jsonStr);

        return ok({ case_data: caseData, specialty, difficulty });
      }

      case "create_clinical_case": {
        const { title, specialty, difficulty, time_limit_minutes, case_prompt, faculdade_filter, periodo_filter, student_ids } = params;

        if (!case_prompt || !specialty) throw new Error("Dados do caso são obrigatórios");

        const { data: clinicalCase, error } = await sb.from("teacher_clinical_cases").insert({
          professor_id: user.id,
          title: title || `Plantão - ${specialty}`,
          specialty,
          difficulty: difficulty || "intermediário",
          time_limit_minutes: time_limit_minutes || 20,
          case_prompt,
          faculdade_filter: faculdade_filter || null,
          periodo_filter: periodo_filter || null,
          status: "published",
        }).select("id").single();

        if (error) throw new Error(error.message);

        // Find students and create pending results
        let studentIds: string[] = student_ids || [];

        if (studentIds.length === 0) {
          let studentQuery = sb.from("profiles").select("user_id").eq("status", "active");
          if (faculdade_filter) studentQuery = studentQuery.eq("faculdade", faculdade_filter);
          if (periodo_filter) studentQuery = studentQuery.eq("periodo", periodo_filter);
          const { data: students } = await studentQuery;
          studentIds = (students || []).map((s: any) => s.user_id);
        }

        if (studentIds.length > 0) {
          const results = studentIds.map((sid: string) => ({
            case_id: clinicalCase.id,
            student_id: sid,
            status: "pending",
          }));
          await sb.from("teacher_clinical_case_results").insert(results);
        }

        return ok({ success: true, case_id: clinicalCase.id, students_assigned: studentIds.length });
      }

      case "list_clinical_cases": {
        const { data: cases } = await sb
          .from("teacher_clinical_cases")
          .select("*")
          .eq("professor_id", user.id)
          .order("created_at", { ascending: false });

        const caseIds = (cases || []).map((c: any) => c.id);
        let resultsByCaseId: Record<string, { total: number; completed: number; avgScore: number }> = {};

        if (caseIds.length > 0) {
          const { data: results } = await sb
            .from("teacher_clinical_case_results")
            .select("case_id, status, final_score")
            .in("case_id", caseIds);

          for (const r of (results || [])) {
            if (!resultsByCaseId[r.case_id]) resultsByCaseId[r.case_id] = { total: 0, completed: 0, avgScore: 0 };
            resultsByCaseId[r.case_id].total++;
            if (r.status === "completed") {
              resultsByCaseId[r.case_id].completed++;
              resultsByCaseId[r.case_id].avgScore += (r.final_score || 0);
            }
          }

          for (const key of Object.keys(resultsByCaseId)) {
            const d = resultsByCaseId[key];
            if (d.completed > 0) d.avgScore = Math.round(d.avgScore / d.completed);
          }
        }

        return ok({
          cases: (cases || []).map((c: any) => ({
            ...c,
            results_summary: resultsByCaseId[c.id] || { total: 0, completed: 0, avgScore: 0 },
          })),
        });
      }

      case "get_clinical_case_results": {
        const { case_id } = params;
        if (!case_id) throw new Error("case_id obrigatório");

        const { data: results } = await sb
          .from("teacher_clinical_case_results")
          .select("*")
          .eq("case_id", case_id)
          .order("final_score", { ascending: false });

        const studentIds = (results || []).map((r: any) => r.student_id);
        const { data: profiles } = await sb.from("profiles")
          .select("user_id, display_name, email, faculdade, periodo")
          .in("user_id", studentIds);

        const enriched = (results || []).map((r: any) => {
          const p = (profiles || []).find((p: any) => p.user_id === r.student_id);
          return {
            ...r,
            student_name: p?.display_name || "Sem nome",
            student_email: p?.email || "",
            faculdade: p?.faculdade,
            periodo: p?.periodo,
          };
        });

        return ok({ results: enriched });
      }

      // ========== STUDY ASSIGNMENTS ==========

      case "create_study_assignment": {
        const { title, specialty, topics_to_cover, material_url, material_filename, faculdade_filter, periodo_filter, student_ids } = params;

        if (!title || !specialty || !topics_to_cover) throw new Error("Título, especialidade e tópicos são obrigatórios");

        const { data: assignment, error } = await sb.from("teacher_study_assignments").insert({
          professor_id: user.id,
          title,
          specialty,
          topics_to_cover,
          material_url: material_url || null,
          material_filename: material_filename || null,
          faculdade_filter: faculdade_filter || null,
          periodo_filter: periodo_filter || null,
          status: "active",
        }).select("id").single();

        if (error) throw new Error(error.message);

        // Find students
        let studentIds: string[] = student_ids || [];
        if (studentIds.length === 0) {
          let studentQuery = sb.from("profiles").select("user_id").eq("status", "active");
          if (faculdade_filter) studentQuery = studentQuery.eq("faculdade", faculdade_filter);
          if (periodo_filter) studentQuery = studentQuery.eq("periodo", periodo_filter);
          const { data: students } = await studentQuery;
          studentIds = (students || []).map((s: any) => s.user_id);
        }

        if (studentIds.length > 0) {
          const results = studentIds.map((sid: string) => ({
            assignment_id: assignment.id,
            student_id: sid,
            status: "pending",
          }));
          await sb.from("teacher_study_assignment_results").insert(results);
        }

        return ok({ success: true, assignment_id: assignment.id, students_assigned: studentIds.length });
      }

      case "list_study_assignments": {
        const { data: assignments } = await sb
          .from("teacher_study_assignments")
          .select("*")
          .eq("professor_id", user.id)
          .order("created_at", { ascending: false });

        const assignmentIds = (assignments || []).map((a: any) => a.id);
        let resultsByAssignment: Record<string, { total: number; completed: number; studying: number }> = {};

        if (assignmentIds.length > 0) {
          const { data: results } = await sb
            .from("teacher_study_assignment_results")
            .select("assignment_id, status")
            .in("assignment_id", assignmentIds);

          for (const r of (results || [])) {
            if (!resultsByAssignment[r.assignment_id]) resultsByAssignment[r.assignment_id] = { total: 0, completed: 0, studying: 0 };
            resultsByAssignment[r.assignment_id].total++;
            if (r.status === "completed") resultsByAssignment[r.assignment_id].completed++;
            if (r.status === "studying") resultsByAssignment[r.assignment_id].studying++;
          }
        }

        return ok({
          assignments: (assignments || []).map((a: any) => ({
            ...a,
            results_summary: resultsByAssignment[a.id] || { total: 0, completed: 0, studying: 0 },
          })),
        });
      }

      case "get_study_assignment_results": {
        const { assignment_id } = params;
        if (!assignment_id) throw new Error("assignment_id obrigatório");

        const { data: results } = await sb
          .from("teacher_study_assignment_results")
          .select("*")
          .eq("assignment_id", assignment_id);

        const studentIds = (results || []).map((r: any) => r.student_id);
        const { data: profiles } = await sb.from("profiles")
          .select("user_id, display_name, email")
          .in("user_id", studentIds);

        const enriched = (results || []).map((r: any) => {
          const p = (profiles || []).find((p: any) => p.user_id === r.student_id);
          return { ...r, student_name: p?.display_name || "Sem nome", student_email: p?.email || "" };
        });

        return ok({ results: enriched });
      }

      default:
        return new Response(JSON.stringify({ error: `Ação desconhecida: ${action}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e) {
    console.error("professor-simulado error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
