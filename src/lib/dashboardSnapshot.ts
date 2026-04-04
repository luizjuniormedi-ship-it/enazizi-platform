/**
 * Dashboard snapshot layer.
 * - saveDashboardSnapshot: persist computed dashboard data (upsert, validated)
 * - loadDashboardSnapshot: fast-path read with staleness + shape validation
 * - invalidateDashboardSnapshot: mark snapshot stale on critical events
 *
 * Staleness rule: snapshot older than 10 minutes is considered stale.
 * 
 * IMPORTANT: approval_score, prep_index, chance_score come from approval_scores table,
 * NOT from the accuracy metric. If unavailable, persist null — never a wrong value.
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

/* ── Validation ── */

const REQUIRED_STAT_KEYS: (keyof DashboardStats)[] = [
  "flashcards", "completedTasks", "totalTasks", "questionsToday", "hasStudyPlan",
];
const REQUIRED_METRIC_KEYS: (keyof DashboardMetrics)[] = [
  "questionsAnswered", "accuracy", "pendingRevisoes", "simuladosCompleted",
];

function isValidPayload(p: SnapshotPayload): boolean {
  if (!p.stats || typeof p.stats !== "object") return false;
  if (!p.metrics || typeof p.metrics !== "object") return false;
  for (const k of REQUIRED_STAT_KEYS) {
    if (p.stats[k] === undefined) return false;
  }
  for (const k of REQUIRED_METRIC_KEYS) {
    if (p.metrics[k] === undefined) return false;
  }
  return true;
}

/* ── Save (upsert, validated, fire-and-forget) ── */

export function saveDashboardSnapshot(userId: string, payload: SnapshotPayload): void {
  (async () => {
    try {
      if (!isValidPayload(payload)) {
        console.warn("[DashboardSnapshot] payload inválido — save ignorado");
        return;
      }

      const now = new Date().toISOString();
      const snapshotJson = {
        stats: payload.stats,
        metrics: payload.metrics,
        displayName: payload.displayName,
        hasCompletedDiagnostic: payload.hasCompletedDiagnostic,
        targetExams: payload.targetExams,
      };

      // Use upsert on user_id (unique constraint already exists)
      await supabase
        .from("dashboard_snapshots")
        .upsert(
          {
            user_id: userId,
            snapshot_json: snapshotJson as any,
            // approval_score, prep_index, chance_score → null here.
            // They are populated by the edge function or approval calculation,
            // NEVER derived from accuracy.
            pending_reviews: payload.metrics.pendingRevisoes ?? null,
            current_objective: payload.stats.hasStudyPlan ? "study_plan_active" : null,
            updated_at: now,
          },
          { onConflict: "user_id" }
        );
    } catch (e) {
      console.warn("[DashboardSnapshot] save failed:", e);
    }
  })();
}

/* ── Load (validated + stale check) ── */

export async function loadDashboardSnapshot(
  userId: string
): Promise<SnapshotPayload | null> {
  try {
    const { data, error } = await supabase
      .from("dashboard_snapshots")
      .select("snapshot_json, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;

    // Staleness check
    const age = Date.now() - new Date(data.updated_at).getTime();
    if (age > STALE_MS) return null;

    const json = data.snapshot_json as any;
    if (!json?.stats || !json?.metrics) return null;

    const payload: SnapshotPayload = {
      stats: json.stats,
      metrics: json.metrics,
      displayName: json.displayName ?? null,
      hasCompletedDiagnostic: json.hasCompletedDiagnostic ?? false,
      targetExams: json.targetExams ?? [],
    };

    // Shape validation before returning
    if (!isValidPayload(payload)) {
      console.warn("[DashboardSnapshot] snapshot shape inválido — fallback");
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/* ── Invalidation (touch updated_at far into past to force staleness) ── */

export function invalidateDashboardSnapshot(userId: string): void {
  (async () => {
    try {
      // Set updated_at to epoch → forces staleness on next read
      await supabase
        .from("dashboard_snapshots")
        .update({ updated_at: "2000-01-01T00:00:00Z" })
        .eq("user_id", userId);
    } catch {
      // silent — invalidation is best-effort
    }
  })();
}
