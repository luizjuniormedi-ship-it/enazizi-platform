import { supabase } from "@/integrations/supabase/client";

/**
 * Saves a weekly snapshot for the current user.
 * Called at end-of-day or end-of-week by the Study Engine / Dashboard refresh.
 * Uses UPSERT on (user_id, week_start) to avoid duplicates.
 */
export async function saveWeeklySnapshot(
  userId: string,
  opts: {
    plannedTasks: unknown[];
    completedTasks: unknown[];
    carryover: unknown[];
    approvalScore?: number;
    prepIndex?: number;
    summary?: string;
  }
) {
  // Monday of current week
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  const weekStart = monday.toISOString().slice(0, 10);

  try {
    await supabase.from("weekly_snapshots").upsert(
      {
        user_id: userId,
        week_start: weekStart,
        planned_tasks: opts.plannedTasks as any,
        completed_tasks: opts.completedTasks as any,
        carryover: opts.carryover as any,
        approval_score: opts.approvalScore ?? null,
        prep_index: opts.prepIndex ?? null,
        summary: opts.summary ?? null,
      },
      { onConflict: "user_id,week_start" }
    );
  } catch {
    // non-blocking
  }
}
