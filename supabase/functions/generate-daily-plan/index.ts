import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authErr,
    } = await userClient.auth.getUser();
    if (authErr || !user)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });

    const adminClient = createClient(supabaseUrl, serviceKey);
    const userId = user.id;
    const today = new Date().toISOString().split("T")[0];

    // Fetch inputs in parallel
    const [revisoesRes, errorsRes, desempenhoRes, temasRes, profilesRes] =
      await Promise.all([
        adminClient
          .from("revisoes")
          .select(
            "id, tema_id, data_revisao, prioridade, risco_esquecimento, status, temas_estudados(tema, especialidade)"
          )
          .eq("user_id", userId)
          .eq("status", "pendente")
          .lte("data_revisao", today)
          .order("prioridade", { ascending: false })
          .limit(10),
        adminClient
          .from("error_bank")
          .select("id, tema, subtema, vezes_errado, categoria_erro")
          .eq("user_id", userId)
          .eq("dominado", false)
          .order("vezes_errado", { ascending: false })
          .limit(10),
        adminClient
          .from("desempenho_questoes")
          .select(
            "tema_id, taxa_acerto, questoes_feitas, temas_estudados(tema, especialidade)"
          )
          .eq("user_id", userId)
          .order("taxa_acerto", { ascending: true })
          .limit(15),
        adminClient
          .from("temas_estudados")
          .select("id, tema, especialidade, dificuldade, status")
          .eq("user_id", userId)
          .eq("status", "ativo")
          .order("data_estudo", { ascending: false })
          .limit(20),
        adminClient
          .from("user_topic_profiles")
          .select("topic, accuracy, mastery_level, next_review_at")
          .eq("user_id", userId),
      ]);

    // Build task list with priorities
    interface DailyTask {
      type: "review" | "error_fix" | "practice" | "new_topic";
      topic: string;
      specialty: string;
      priority: number;
      reason: string;
      suggested_module: string;
      estimated_minutes: number;
      meta?: Record<string, unknown>;
    }

    const tasks: DailyTask[] = [];

    // 1. Overdue reviews (highest priority)
    for (const rev of (revisoesRes.data || []) as any[]) {
      const tema = rev.temas_estudados?.tema || "Revisão";
      const spec = rev.temas_estudados?.especialidade || "Geral";
      const isHighRisk = rev.risco_esquecimento === "alto";
      tasks.push({
        type: "review",
        topic: tema,
        specialty: spec,
        priority: 90 + (isHighRisk ? 5 : 0),
        reason: `Revisão atrasada${isHighRisk ? " (alto risco de esquecimento)" : ""}`,
        suggested_module: "cronograma",
        estimated_minutes: 15,
        meta: { revisao_id: rev.id, tema_id: rev.tema_id },
      });
    }

    // 2. Error bank items
    for (const err of (errorsRes.data || []) as any[]) {
      tasks.push({
        type: "error_fix",
        topic: err.tema,
        specialty: err.subtema || "Geral",
        priority: 70 + Math.min(err.vezes_errado * 3, 15),
        reason: `Errou ${err.vezes_errado}x — precisa revisar`,
        suggested_module: "banco-erros",
        estimated_minutes: 10,
        meta: { error_id: err.id },
      });
    }

    // 3. Weak topics (low accuracy)
    const weakTopics = ((desempenhoRes.data || []) as any[]).filter(
      (d: any) => d.taxa_acerto < 60 && d.questoes_feitas >= 3
    );
    for (const w of weakTopics) {
      const tema = w.temas_estudados?.tema || "Tema";
      const spec = w.temas_estudados?.especialidade || "Geral";
      // Avoid duplicates with reviews
      if (tasks.some((t) => t.topic === tema)) continue;
      tasks.push({
        type: "practice",
        topic: tema,
        specialty: spec,
        priority: 55 + Math.round((60 - w.taxa_acerto) / 2),
        reason: `Acerto de ${Math.round(w.taxa_acerto)}% — pratique mais questões`,
        suggested_module: "questoes",
        estimated_minutes: 20,
        meta: { tema_id: w.tema_id },
      });
    }

    // 4. New topics from active temas
    const coveredTopics = new Set(tasks.map((t) => t.topic));
    for (const tema of (temasRes.data || []) as any[]) {
      if (coveredTopics.has(tema.tema)) continue;
      // Check if topic profile shows it needs review
      const profile = ((profilesRes.data || []) as any[]).find(
        (p: any) => p.topic === tema.tema
      );
      if (profile && profile.mastery_level >= 4) continue; // already mastered
      tasks.push({
        type: "new_topic",
        topic: tema.tema,
        specialty: tema.especialidade,
        priority: 30,
        reason: "Tema ativo no cronograma",
        suggested_module: "tutor",
        estimated_minutes: 25,
        meta: { tema_id: tema.id },
      });
      if (tasks.filter((t) => t.type === "new_topic").length >= 3) break;
    }

    // Sort and limit to manageable daily load (~8 tasks)
    tasks.sort((a, b) => b.priority - a.priority);
    const dailyTasks = tasks.slice(0, 8);

    // Upsert into daily_plans
    const planData = {
      user_id: userId,
      plan_date: today,
      plan_json: dailyTasks,
      total_blocks: dailyTasks.length,
      completed_count: 0,
      completed_blocks: [],
    };

    const { error: upsertErr } = await adminClient
      .from("daily_plans")
      .upsert(planData, { onConflict: "user_id,plan_date" });

    // If upsert fails due to no unique constraint, try insert
    if (upsertErr) {
      // Check if plan already exists
      const { data: existing } = await adminClient
        .from("daily_plans")
        .select("id")
        .eq("user_id", userId)
        .eq("plan_date", today)
        .maybeSingle();

      if (existing) {
        await adminClient
          .from("daily_plans")
          .update({
            plan_json: dailyTasks,
            total_blocks: dailyTasks.length,
          })
          .eq("id", existing.id);
      } else {
        await adminClient.from("daily_plans").insert(planData);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        total_tasks: dailyTasks.length,
        tasks: dailyTasks,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
