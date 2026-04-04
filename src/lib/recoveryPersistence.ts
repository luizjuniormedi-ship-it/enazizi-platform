/**
 * Recovery Mode persistence layer.
 * Manages recovery_runs and recovery_events in the database,
 * with localStorage migration on first load.
 *
 * Strategy: DB is source of truth. localStorage used only as
 * migration bridge (read once, write to DB, clear).
 */
import { supabase } from "@/integrations/supabase/client";

const HEAVY_RECOVERY_STORAGE_KEY = "enazizi-heavy-recovery";

export type RecoveryMode = "normal" | "heavy";

export interface ActiveRecoveryRun {
  id: string;
  mode: RecoveryMode;
  phase: number;
  reason: string | null;
  started_at: string;
}

/* ── Read ── */

export async function loadActiveRecoveryRun(userId: string): Promise<ActiveRecoveryRun | null> {
  try {
    const { data, error } = await supabase
      .from("recovery_runs")
      .select("id, mode, phase, reason, started_at")
      .eq("user_id", userId)
      .eq("active", true)
      .maybeSingle();

    if (error || !data) {
      // Migration bridge: check localStorage for heavy recovery
      return migrateFromLocalStorage(userId);
    }

    return data as ActiveRecoveryRun;
  } catch {
    return null;
  }
}

/* ── Migration from localStorage (one-time) ── */

async function migrateFromLocalStorage(userId: string): Promise<ActiveRecoveryRun | null> {
  try {
    const raw = localStorage.getItem(HEAVY_RECOVERY_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.startedAt) return null;

    // Migrate to DB
    const run = await startRecoveryRun(userId, "heavy", "Migrado do localStorage", parsed.startedAt);

    // Clear localStorage after successful migration
    if (run) {
      localStorage.removeItem(HEAVY_RECOVERY_STORAGE_KEY);
      await logRecoveryEvent(run.id, userId, "entered_heavy_recovery", "Migrado do localStorage para banco", {
        migratedFrom: "localStorage",
        originalStartedAt: parsed.startedAt,
      });
    }

    return run;
  } catch {
    return null;
  }
}

/* ── Start a recovery run ── */

export async function startRecoveryRun(
  userId: string,
  mode: RecoveryMode,
  reason: string,
  startedAt?: string
): Promise<ActiveRecoveryRun | null> {
  try {
    const { data, error } = await supabase
      .from("recovery_runs")
      .insert({
        user_id: userId,
        mode,
        phase: 1,
        active: true,
        reason,
        started_at: startedAt || new Date().toISOString(),
      } as any)
      .select("id, mode, phase, reason, started_at")
      .single();

    if (error) {
      // Unique constraint conflict = already has active run
      if (error.code === "23505") {
        const { data: existing } = await supabase
          .from("recovery_runs")
          .select("id, mode, phase, reason, started_at")
          .eq("user_id", userId)
          .eq("active", true)
          .maybeSingle();
        return existing as ActiveRecoveryRun | null;
      }
      console.warn("[RecoveryPersistence] startRecoveryRun:", error.message);
      return null;
    }

    return data as ActiveRecoveryRun;
  } catch {
    return null;
  }
}

/* ── Update phase ── */

export async function updateRecoveryPhase(
  runId: string,
  userId: string,
  newPhase: number
): Promise<void> {
  try {
    await supabase
      .from("recovery_runs")
      .update({ phase: newPhase } as any)
      .eq("id", runId);

    await logRecoveryEvent(runId, userId, "heavy_recovery_phase_changed", `Fase alterada para ${newPhase}`, { phase: newPhase });
  } catch {
    // silent
  }
}

/* ── End a recovery run ── */

export async function endRecoveryRun(
  runId: string,
  userId: string,
  mode: RecoveryMode
): Promise<void> {
  try {
    await supabase
      .from("recovery_runs")
      .update({ active: false, ended_at: new Date().toISOString() } as any)
      .eq("id", runId);

    const eventType = mode === "heavy" ? "exited_heavy_recovery" : "exited_recovery";
    await logRecoveryEvent(runId, userId, eventType, `Saiu do recovery ${mode}`);

    // Also clear localStorage as safety net
    localStorage.removeItem(HEAVY_RECOVERY_STORAGE_KEY);
  } catch {
    // silent
  }
}

/* ── Log event ── */

export async function logRecoveryEvent(
  runId: string,
  userId: string,
  eventType: string,
  description?: string,
  payload?: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from("recovery_events")
      .insert({
        recovery_run_id: runId,
        user_id: userId,
        event_type: eventType,
        description: description || null,
        payload_json: payload || {},
      } as any);
  } catch {
    // silent — events are best-effort audit trail
  }
}
