import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch } from "../_shared/ai-fetch.ts";

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
        const prompt = `Gere exatamente ${count} questões objetivas de múltipla escolha (A-E) para residência médica sobre: ${topicList}.

Para cada questão, retorne APENAS um array JSON válido no formato:
[
  {
    "statement": "Texto do enunciado com caso clínico",
    "options": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
    "correct_index": 0,
    "explanation": "Explicação detalhada da resposta correta",
    "topic": "Tema da questão"
  }
]

REGRAS:
- Cada questão deve ter um caso clínico curto
- 5 alternativas (A-E)
- correct_index é o índice (0-4) da alternativa correta
- Baseie-se em provas reais de residência (ENARE, USP, UNIFESP)
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
        const content = aiData.choices?.[0]?.message?.content || "";

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

      default:
        return new Response(JSON.stringify({ error: `Ação desconhecida: ${action}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e) {
    console.error("professor-simulado error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
