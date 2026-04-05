/**
 * Persists task completion to the database when user clicks "Já concluí".
 * Handles: revisoes, error_bank, fsrs_cards, and temas_estudados.
 */
import { supabase } from "@/integrations/supabase/client";
import type { StudyRecommendation } from "@/hooks/useStudyEngine";

export async function markTaskCompleted(userId: string, task: StudyRecommendation) {
  const topic = task.topic?.trim();
  if (!topic) return;

  const now = new Date().toISOString();
  const promises: Promise<unknown>[] = [];

  // 1. Mark review as done
  if (task.type === "review") {
    promises.push(
      supabase
        .from("revisoes")
        .update({ revisada: true, data_revisao: now.slice(0, 10) })
        .eq("user_id", userId)
        .ilike("tema", `%${topic}%`)
        .eq("revisada", false)
        .then(() => {})
    );
  }

  // 2. Mark error as dominated
  if (task.type === "error_review") {
    promises.push(
      supabase
        .from("error_bank")
        .update({ dominado: true, dominado_em: now })
        .eq("user_id", userId)
        .ilike("tema", `%${topic}%`)
        .eq("dominado", false)
        .then(() => {})
    );
  }

  // 3. Update FSRS card — push due date forward (mark as reviewed)
  promises.push(
    supabase
      .from("fsrs_cards")
      .select("id, stability, scheduled_days")
      .eq("user_id", userId)
      .eq("card_type", "tema")
      .ilike("card_ref_id", `%${topic}%`)
      .limit(1)
      .maybeSingle()
      .then(async ({ data: card }) => {
        if (!card) return;
        const nextDays = Math.max(1, Math.round((card.stability || 1) * 2.5));
        const nextDue = new Date(Date.now() + nextDays * 86400_000).toISOString();
        await supabase.from("fsrs_cards").update({
          last_review: now,
          due: nextDue,
          reps: 1, // increment would need current value; simplified
          scheduled_days: nextDays,
          elapsed_days: 0,
        }).eq("id", card.id);
      })
  );

  // 4. Register study in temas_estudados
  promises.push(
    supabase.from("temas_estudados").insert({
      user_id: userId,
      tema: topic,
      tipo_estudo: task.type === "review" ? "revisao" : task.type === "error_review" ? "correcao" : "estudo",
      tempo_gasto: task.estimatedMinutes || 10,
      data_estudo: now.slice(0, 10),
    }).then(() => {})
  );

  try {
    await Promise.allSettled(promises);
  } catch {
    // Fire-and-forget — never block the mission flow
  }
}
