import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SessionOrigin = "manual" | "guided" | "assigned";
export type SessionType = "simulation" | "anamnesis";

interface StartSessionParams {
  type: SessionType;
  userId: string;
  specialty: string;
  difficulty: string;
  origin: SessionOrigin;
  scenarioId?: string;
}

interface CompleteSessionParams {
  finalScore?: number;
  sessionData?: Record<string, unknown>;
  categoriesCovered?: unknown[];
}

export function useSessionTracking() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<SessionOrigin>("manual");

  const startSession = useCallback(async (params: StartSessionParams) => {
    try {
      const table = params.type === "simulation" ? "simulation_sessions" : "anamnesis_sessions";
      const row: Record<string, unknown> = {
        user_id: params.userId,
        specialty: params.specialty,
        difficulty: params.difficulty,
        session_origin: params.origin,
        status: "in_progress",
      };
      if (params.scenarioId) row.scenario_id = params.scenarioId;
      if (params.type === "anamnesis") row.categories_covered = [];

      const { data, error } = await supabase
        .from(table as any)
        .insert(row as any)
        .select("id")
        .single();

      if (error) {
        console.error(`[SessionTracking] Error starting ${params.type} session:`, error);
        return null;
      }
      const id = (data as any)?.id ?? null;
      setSessionId(id);
      setOrigin(params.origin);
      return id;
    } catch (e) {
      console.error("[SessionTracking] Unexpected error:", e);
      return null;
    }
  }, []);

  const completeSession = useCallback(async (
    type: SessionType,
    params: CompleteSessionParams = {}
  ) => {
    if (!sessionId) return;
    try {
      const table = type === "simulation" ? "simulation_sessions" : "anamnesis_sessions";
      const update: Record<string, unknown> = {
        status: "completed",
        finished_at: new Date().toISOString(),
      };
      if (params.finalScore !== undefined) update.final_score = params.finalScore;
      if (type === "simulation" && params.sessionData) update.session_data = params.sessionData;
      if (type === "anamnesis" && params.categoriesCovered) update.categories_covered = params.categoriesCovered;

      await supabase.from(table as any).update(update as any).eq("id", sessionId);
    } catch (e) {
      console.error("[SessionTracking] Error completing session:", e);
    }
  }, [sessionId]);

  const abandonSession = useCallback(async (type: SessionType) => {
    if (!sessionId) return;
    try {
      const table = type === "simulation" ? "simulation_sessions" : "anamnesis_sessions";
      await supabase.from(table as any).update({ status: "abandoned", finished_at: new Date().toISOString() } as any).eq("id", sessionId);
    } catch (e) {
      console.error("[SessionTracking] Error abandoning session:", e);
    }
  }, [sessionId]);

  return { sessionId, origin, setOrigin, startSession, completeSession, abandonSession };
}
