import { supabase } from "@/integrations/supabase/client";

export type ActivityEvent =
  | "login"
  | "mission_started"
  | "mission_completed"
  | "mission_abandoned"
  | "task_completed"
  | "task_skipped"
  | "session_started"
  | "session_ended"
  | "returned_next_day"
  | "streak_broken"
  | "freeze_used";
  | "study_action_completed";

/**
 * Logs a user activity event (fire-and-forget, never blocks UI).
 */
export function logActivity(
  userId: string,
  event: ActivityEvent,
  data?: Record<string, unknown>
) {
  supabase
    .from("user_activity_log")
    .insert({ user_id: userId, event_type: event, event_data: (data || {}) as any })
    .then(() => {});
}

/**
 * Updates the streak in user_gamification.
 * Called after any study action via refreshAll.
 * Returns the updated streak count.
 */
export async function updateStreak(userId: string): Promise<number> {
  try {
    const { data: gam } = await supabase
      .from("user_gamification")
      .select("current_streak, longest_streak, last_activity_date, freeze_available")
      .eq("user_id", userId)
      .maybeSingle();

    if (!gam) return 0;

    const today = new Date().toISOString().slice(0, 10);
    const lastDate = gam.last_activity_date;

    // Already counted today
    if (lastDate === today) return gam.current_streak;

    const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
    let newStreak = gam.current_streak;
    let newLongest = gam.longest_streak;
    let freeze = gam.freeze_available ?? 1;

    if (lastDate === yesterday) {
      // Consecutive day
      newStreak += 1;
    } else if (lastDate) {
      // Missed days — check if freeze available
      const missedDays = Math.floor(
        (new Date(today).getTime() - new Date(lastDate).getTime()) / 86400_000
      );
      if (missedDays === 2 && freeze > 0) {
        // 1 day missed, use freeze
        freeze -= 1;
        newStreak += 1;
        logActivity(userId, "freeze_used", { missedDays: 1 });
      } else {
        // Streak broken
        logActivity(userId, "streak_broken", { previousStreak: newStreak, missedDays });
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    if (newStreak > newLongest) newLongest = newStreak;

    await supabase.from("user_gamification").update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_activity_date: today,
      freeze_available: freeze,
    }).eq("user_id", userId);

    return newStreak;
  } catch {
    return 0;
  }
}
