/**
 * Dashboard snapshot layer.
 * - saveDashboardSnapshot: persist computed dashboard data
 * - loadDashboardSnapshot: fast-path read with staleness check
 *
 * Staleness rule: snapshot older than 10 minutes is considered stale.
 */
import { supabase } from "@/integrations/supabase/client";
import type { DashboardStats, DashboardMetrics } from "@/hooks/useDashboardData";

const STALE_MS = 10 * 60 * 1000; // 10 minutes

export interface SnapshotPayload {
  stats: DashboardStats;
  metrics: DashboardMetrics;
  displayName: string | null;
  hasCompletedDiagnostic: boolean;
  targetExams: string[];
}

/**
 * Save/update a dashboard snapshot. Fire-and-forget.
 */
export function saveDashboardSnapshot(userId: string, payload: SnapshotPayload): void {
  (async () => {
    try {
      const now = new Date().toISOString();
      const snapshotJson = {
        stats: payload.stats,
        metrics: payload.metrics,
        displayName: payload.displayName,
        hasCompletedDiagnostic: payload.hasCompletedDiagnostic,
        targetExams: payload.targetExams,
      };

      const { data: existing } = await supabase
        .from("dashboard_snapshots")
        .select("id")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("dashboard_snapshots")
          .update({
            snapshot_json: snapshotJson as any,
            approval_score: payload.metrics.accuracy ?? null,
            pending_reviews: payload.metrics.pendingRevisoes ?? null,
            current_objective: payload.stats.hasStudyPlan ? "study_plan_active" : null,
            updated_at: now,
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("dashboard_snapshots")
          .insert({
            user_id: userId,
            snapshot_json: snapshotJson as any,
            approval_score: payload.metrics.accuracy ?? null,
            pending_reviews: payload.metrics.pendingRevisoes ?? null,
            current_objective: payload.stats.hasStudyPlan ? "study_plan_active" : null,
            updated_at: now,
          });
      }
    } catch (e) {
      console.warn("[DashboardSnapshot] save failed:", e);
    }
  })();
}

/**
 * Load the most recent dashboard snapshot for a user.
 * Returns null if no snapshot, stale, or incomplete.
 */
export async function loadDashboardSnapshot(
  userId: string
): Promise<SnapshotPayload | null> {
  try {
    const { data, error } = await supabase
      .from("dashboard_snapshots")
      .select("snapshot_json, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    // Staleness check
    const age = Date.now() - new Date(data.updated_at).getTime();
    if (age > STALE_MS) return null;

    const json = data.snapshot_json as any;
    if (!json?.stats || !json?.metrics) return null;

    return {
      stats: json.stats,
      metrics: json.metrics,
      displayName: json.displayName ?? null,
      hasCompletedDiagnostic: json.hasCompletedDiagnostic ?? false,
      targetExams: json.targetExams ?? [],
    };
  } catch {
    return null;
  }
}
