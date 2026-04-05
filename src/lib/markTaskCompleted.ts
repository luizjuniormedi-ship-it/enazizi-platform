/**
 * Persists task completion to the database when user clicks "Já concluí".
 * Handles: revisoes, error_bank, fsrs_cards, temas_estudados, and daily_plan_tasks.
 */
import { supabase } from "@/integrations/supabase/client";
import type { StudyRecommendation } from "@/hooks/useStudyEngine";

export async function markTaskCompleted(userId: string, task: StudyRecommendation) {
  const topic = task.topic?.trim();
  if (!topic) return;

  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  try {
    // 1. Mark review as done (revisoes table)
    if (task.type === "review") {
      const { data: temaRow } = await supabase
        .from("temas_estudados")
        .select("id")
        .eq("user_id", userId)
        .ilike("tema", `%${topic}%`)
        .limit(1)
        .maybeSingle();

      if (temaRow) {
        await supabase
          .from("revisoes")
          .update({ status: "concluida" as any, concluida_em: now } as any)
          .eq("user_id", userId)
          .eq("tema_id", temaRow.id)
          .eq("status", "pendente");
      }
    }

    // 2. Mark error as dominated (error_bank)
    if (task.type === "error_review") {
      await supabase
        .from("error_bank")
        .update({ dominado: true, dominado_em: now })
        .eq("user_id", userId)
        .ilike("tema", `%${topic}%`)
        .eq("dominado", false);
    }

    // 3. Update FSRS card — push due date forward
    const { data: card } = await supabase
      .from("fsrs_cards")
      .select("id, stability, scheduled_days")
      .eq("user_id", userId)
      .eq("card_type", "tema")
      .ilike("card_ref_id", `%${topic}%`)
      .limit(1)
      .maybeSingle();

    if (card) {
      const nextDays = Math.max(1, Math.round((card.stability || 1) * 2.5));
      const nextDue = new Date(Date.now() + nextDays * 86400_000).toISOString();
      await supabase.from("fsrs_cards").update({
        last_review: now,
        due: nextDue,
        scheduled_days: nextDays,
        elapsed_days: 0,
      }).eq("id", card.id);
    }

    // 4. Register study in temas_estudados
    const specialty = (task as any).specialty || "Geral";
    await supabase.from("temas_estudados").insert({
      user_id: userId,
      tema: topic,
      especialidade: specialty,
      fonte: "mission_manual",
      data_estudo: today,
      status: "concluido",
    });

    // 5. Mark matching daily_plan_task as completed (plano semanal sync)
    const { data: todayPlan } = await supabase
      .from("daily_plans")
      .select("id")
      .eq("user_id", userId)
      .eq("plan_date", today)
      .limit(1)
      .maybeSingle();

    if (todayPlan) {
      // Find uncompleted task matching topic in today's plan
      await supabase
        .from("daily_plan_tasks")
        .update({ completed: true, completed_at: now } as any)
        .eq("daily_plan_id", todayPlan.id)
        .eq("user_id", userId)
        .eq("completed", false)
        .ilike("title", `%${topic}%`);

      // Update completed_count on the daily_plan
      const { count } = await supabase
        .from("daily_plan_tasks")
        .select("id", { count: "exact", head: true })
        .eq("daily_plan_id", todayPlan.id)
        .eq("completed", true);

      if (count !== null) {
        await supabase
          .from("daily_plans")
          .update({ completed_count: count, updated_at: now } as any)
          .eq("id", todayPlan.id);
      }
    }
  } catch {
    // Fire-and-forget — never block the mission flow
  }
}
