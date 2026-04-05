import { useState, useCallback, useEffect, useRef } from "react";
import { useStudyEngine, type StudyRecommendation } from "./useStudyEngine";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { markTaskCompleted } from "@/lib/markTaskCompleted";
import { completeStudyAction, type StudyActionType } from "@/lib/completeStudyAction";

export type MissionStatus = "idle" | "active" | "paused" | "completed";

export interface MissionState {
  status: MissionStatus;
  tasks: StudyRecommendation[];
  currentIndex: number;
  completedIds: string[];
  completionSources: Record<string, "auto" | "manual">;
  startedAt: string | null;
  pausedAt: string | null;
  dbId: string | null; // user_missions row id
}

const STORAGE_KEY = "enazizi-mission-state";
const IDLE_STATE: MissionState = {
  status: "idle",
  tasks: [],
  currentIndex: 0,
  completedIds: [],
  completionSources: {},
  startedAt: null,
  pausedAt: null,
  dbId: null,
};

/* ── localStorage fallback ── */
function loadLocal(): MissionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as MissionState;
    if (s.startedAt && Date.now() - new Date(s.startedAt).getTime() > 24 * 3600_000) return null;
    return { ...s, completionSources: s.completionSources || {}, dbId: s.dbId || null };
  } catch { return null; }
}

function saveLocal(s: MissionState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

/* ── DB helpers (fire-and-forget with error swallow) ── */
async function upsertMissionDB(userId: string, state: MissionState): Promise<string | null> {
  try {
    if (state.dbId) {
      await supabase.from("user_missions").update({
        current_tasks: state.tasks as any,
        completed_tasks: state.completedIds as any,
        current_index: state.currentIndex,
        status: state.status === "idle" ? "completed" : state.status,
        completion_sources: state.completionSources as any,
        started_at: state.startedAt || new Date().toISOString(),
      }).eq("id", state.dbId);
      return state.dbId;
    }
    // Insert new
    const { data } = await supabase.from("user_missions").insert({
      user_id: userId,
      current_tasks: state.tasks as any,
      completed_tasks: state.completedIds as any,
      current_index: state.currentIndex,
      status: state.status === "idle" ? "active" : state.status,
      completion_sources: state.completionSources as any,
      started_at: state.startedAt || new Date().toISOString(),
    }).select("id").single();
    return data?.id || null;
  } catch {
    return state.dbId;
  }
}

async function loadMissionDB(userId: string): Promise<MissionState | null> {
  try {
    const { data } = await supabase
      .from("user_missions")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "paused"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;

    // Expire after 24h
    const elapsed = Date.now() - new Date(data.started_at).getTime();
    if (elapsed > 24 * 3600_000) {
      await supabase.from("user_missions").update({ status: "completed" }).eq("id", data.id);
      return null;
    }

    return {
      status: data.status as MissionStatus,
      tasks: (data.current_tasks || []) as unknown as StudyRecommendation[],
      currentIndex: data.current_index,
      completedIds: (data.completed_tasks || []) as unknown as string[],
      completionSources: (data.completion_sources || {}) as Record<string, "auto" | "manual">,
      startedAt: data.started_at,
      pausedAt: null,
      dbId: data.id,
    };
  } catch {
    return null;
  }
}

async function completeMissionDB(dbId: string | null) {
  if (!dbId) return;
  try {
    await supabase.from("user_missions").update({ status: "completed" }).eq("id", dbId);
  } catch {}
}

export function useMissionMode() {
  const { user } = useAuth();
  const { data: recommendations, isLoading: engineLoading } = useStudyEngine();
  const dbSyncRef = useRef(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const [state, setState] = useState<MissionState>(() => loadLocal() || IDLE_STATE);

  // ── Load from DB on mount (DB takes priority over localStorage) ──
  useEffect(() => {
    if (!user?.id || dbSyncRef.current) return;
    dbSyncRef.current = true;

    loadMissionDB(user.id).then((dbState) => {
      if (dbState && dbState.status !== "idle") {
        setState(dbState);
        saveLocal(dbState);
      } else {
        // If local has state but DB doesn't, migrate local → DB
        const local = loadLocal();
        if (local && local.status !== "idle") {
          upsertMissionDB(user.id, local).then((id) => {
            if (id) setState(prev => ({ ...prev, dbId: id }));
          });
        }
      }
    });
  }, [user?.id]);

  // ── Sync to DB + localStorage on every state change (debounced) ──
  useEffect(() => {
    if (state.status === "idle") return;
    saveLocal(state);

    if (!user?.id) return;
    clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      upsertMissionDB(user.id, state).then((id) => {
        if (id && id !== state.dbId) {
          setState(prev => prev.dbId === id ? prev : { ...prev, dbId: id });
        }
      });
    }, 500); // debounce 500ms

    return () => clearTimeout(syncTimeoutRef.current);
  }, [state.status, state.currentIndex, state.completedIds.length, user?.id]);

  const currentTask = state.tasks[state.currentIndex] || null;
  const nextTask = state.tasks[state.currentIndex + 1] || null;
  const progress = state.tasks.length > 0
    ? Math.round((state.completedIds.length / state.tasks.length) * 100)
    : 0;
  const totalMinutes = state.tasks.reduce((s, t) => s + (t.estimatedMinutes || 0), 0);
  const completedMinutes = state.tasks
    .filter(t => state.completedIds.includes(t.id))
    .reduce((s, t) => s + (t.estimatedMinutes || 0), 0);

  const startMission = useCallback(() => {
    const tasks = recommendations || [];
    if (tasks.length === 0) return;
    const newState: MissionState = {
      status: "active",
      tasks,
      currentIndex: 0,
      completedIds: [],
      completionSources: {},
      startedAt: new Date().toISOString(),
      pausedAt: null,
      dbId: null,
    };
    setState(newState);
    if (user?.id) {
      import("@/lib/activityLogger").then(({ logActivity }) => {
        logActivity(user.id, "mission_started", { taskCount: tasks.length });
      });
    }
  }, [recommendations, user?.id]);

  const completeCurrentTask = useCallback((source: "auto" | "manual" = "auto") => {
    setState(prev => {
      const task = prev.tasks[prev.currentIndex];
      if (!task) return prev;
      const newCompleted = [...prev.completedIds, task.id];
      const newSources = { ...prev.completionSources, [task.id]: source };
      const nextIdx = prev.currentIndex + 1;
      const isFinished = nextIdx >= prev.tasks.length;

      // Persist to DB (fire-and-forget)
      if (user?.id) {
        completeStudyAction({
          userId: user.id,
          missionId: prev.dbId,
          taskId: task.id,
          taskType: (task.type || "content") as StudyActionType,
          topic: task.topic || "",
          subtopic: task.subtopic,
          specialty: (task as any).specialty,
          source,
          originModule: "mission",
        });

        import("@/lib/activityLogger").then(({ logActivity }) => {
          logActivity(user.id, "task_completed", {
            taskId: task.id, type: task.type, topic: task.topic, source,
          });
          if (isFinished) {
            logActivity(user.id, "mission_completed", { total: prev.tasks.length });
          }
        });
      }

      return {
        ...prev,
        completedIds: newCompleted,
        completionSources: newSources,
        currentIndex: isFinished ? prev.currentIndex : nextIdx,
        status: isFinished ? "completed" : "active",
      };
    });
  }, [user?.id]);

  const skipCurrentTask = useCallback(() => {
    setState(prev => {
      const task = prev.tasks[prev.currentIndex];
      if (user?.id && task) {
        import("@/lib/activityLogger").then(({ logActivity }) => {
          logActivity(user.id, "task_skipped", { taskId: task.id, type: task.type });
        });
      }
      const nextIdx = prev.currentIndex + 1;
      if (nextIdx >= prev.tasks.length) {
        return { ...prev, status: "completed" };
      }
      return { ...prev, currentIndex: nextIdx };
    });
  }, [user?.id]);

  const pauseMission = useCallback(() => {
    setState(prev => ({ ...prev, status: "paused", pausedAt: new Date().toISOString() }));
  }, []);

  const resumeMission = useCallback(() => {
    setState(prev => ({ ...prev, status: "active", pausedAt: null }));
  }, []);

  const endMission = useCallback(() => {
    if (user?.id) {
      import("@/lib/activityLogger").then(({ logActivity }) => {
        logActivity(user.id, "mission_abandoned", {
          completed: state.completedIds.length,
          total: state.tasks.length,
        });
      });
    }
    completeMissionDB(state.dbId);
    localStorage.removeItem(STORAGE_KEY);
    setState(IDLE_STATE);
  }, [state.dbId, state.completedIds.length, state.tasks.length, user?.id]);

  return {
    state,
    currentTask,
    nextTask,
    progress,
    totalMinutes,
    completedMinutes,
    engineLoading,
    hasTasks: (recommendations || []).length > 0,
    startMission,
    completeCurrentTask,
    skipCurrentTask,
    pauseMission,
    resumeMission,
    endMission,
  };
}
