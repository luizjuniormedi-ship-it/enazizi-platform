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
  const today = now.slice(0, 10);

  try {
    // 1. Mark review as done
    if (task.type === "review") {
      await (supabase
        .from("revisoes")
        .update({ revisada: true, data_revisao: today } as any)
        .eq("user_id", userId)
        .ilike("tema", `%${topic}%`) as any);
    }

    // 2. Mark error as dominated
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
  } catch {
    // Fire-and-forget — never block the mission flow
  }
}
