import { useState, useCallback, useEffect } from "react";
import { useStudyEngine, type StudyRecommendation } from "./useStudyEngine";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export type MissionStatus = "idle" | "active" | "paused" | "completed";

export interface MissionState {
  status: MissionStatus;
  tasks: StudyRecommendation[];
  currentIndex: number;
  completedIds: string[];
  startedAt: string | null;
  pausedAt: string | null;
}

const STORAGE_KEY = "enazizi-mission-state";

function loadPersistedState(): MissionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as MissionState;
    // Expire after 24h
    if (state.startedAt) {
      const elapsed = Date.now() - new Date(state.startedAt).getTime();
      if (elapsed > 24 * 60 * 60 * 1000) return null;
    }
    return state;
  } catch {
    return null;
  }
}

function persistState(state: MissionState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useMissionMode() {
  const { user } = useAuth();
  const { data: recommendations, isLoading: engineLoading } = useStudyEngine();

  const [state, setState] = useState<MissionState>(() => {
    return loadPersistedState() || {
      status: "idle",
      tasks: [],
      currentIndex: 0,
      completedIds: [],
      startedAt: null,
      pausedAt: null,
    };
  });

  // Persist on change
  useEffect(() => {
    if (state.status !== "idle") {
      persistState(state);
    }
  }, [state]);

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
      startedAt: new Date().toISOString(),
      pausedAt: null,
    };
    setState(newState);
  }, [recommendations]);

  const completeCurrentTask = useCallback(() => {
    setState(prev => {
      const task = prev.tasks[prev.currentIndex];
      if (!task) return prev;
      const newCompleted = [...prev.completedIds, task.id];
      const nextIdx = prev.currentIndex + 1;
      const isFinished = nextIdx >= prev.tasks.length;
      return {
        ...prev,
        completedIds: newCompleted,
        currentIndex: isFinished ? prev.currentIndex : nextIdx,
        status: isFinished ? "completed" : "active",
      };
    });
  }, []);

  const skipCurrentTask = useCallback(() => {
    setState(prev => {
      const nextIdx = prev.currentIndex + 1;
      if (nextIdx >= prev.tasks.length) {
        return { ...prev, status: "completed" };
      }
      return { ...prev, currentIndex: nextIdx };
    });
  }, []);

  const pauseMission = useCallback(() => {
    setState(prev => ({ ...prev, status: "paused", pausedAt: new Date().toISOString() }));
  }, []);

  const resumeMission = useCallback(() => {
    setState(prev => ({ ...prev, status: "active", pausedAt: null }));
  }, []);

  const endMission = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      status: "idle",
      tasks: [],
      currentIndex: 0,
      completedIds: [],
      startedAt: null,
      pausedAt: null,
    });
  }, []);

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
