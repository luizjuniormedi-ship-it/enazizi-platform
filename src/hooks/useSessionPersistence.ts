import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SessionData {
  id: string;
  session_data: Record<string, any>;
  updated_at: string;
  status: string;
}

interface UseSessionPersistenceOptions {
  moduleKey: string;
  enabled?: boolean;
  intervalMs?: number;
}

export const useSessionPersistence = ({ moduleKey, enabled = true, intervalMs = 30000 }: UseSessionPersistenceOptions) => {
  const { user } = useAuth();
  const [pendingSession, setPendingSession] = useState<SessionData | null>(null);
  const [checked, setChecked] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const getStateRef = useRef<(() => Record<string, any>) | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Check for existing active session
  const checkForSession = useCallback(async () => {
    if (!user || !enabled) { setChecked(true); return null; }
    try {
      const { data } = await supabase
        .from("module_sessions")
        .select("id, session_data, updated_at, status")
        .eq("user_id", user.id)
        .eq("module_key", moduleKey)
        .eq("status", "active")
        .maybeSingle();

      if (data) {
        setPendingSession(data as SessionData);
        sessionIdRef.current = data.id;
      }
      setChecked(true);
      return data as SessionData | null;
    } catch {
      setChecked(true);
      return null;
    }
  }, [user, moduleKey, enabled]);

  // Save session
  const saveSession = useCallback(async (sessionData: Record<string, any>) => {
    if (!user || !enabled) return;
    try {
      if (sessionIdRef.current) {
        await supabase
          .from("module_sessions")
          .update({ session_data: sessionData as any, updated_at: new Date().toISOString() })
          .eq("id", sessionIdRef.current);
      } else {
        const { data } = await supabase
          .from("module_sessions")
          .insert({
            user_id: user.id,
            module_key: moduleKey,
            session_data: sessionData as any,
            status: "active",
          })
          .select("id")
          .single();
        if (data) sessionIdRef.current = data.id;
      }
    } catch {
      // silent fail
    }
  }, [user, moduleKey, enabled]);

  // Complete session
  const completeSession = useCallback(async () => {
    if (!sessionIdRef.current) return;
    try {
      await supabase
        .from("module_sessions")
        .update({ status: "completed" })
        .eq("id", sessionIdRef.current);
      sessionIdRef.current = null;
      setPendingSession(null);
    } catch {}
  }, []);

  // Abandon session
  const abandonSession = useCallback(async () => {
    if (!sessionIdRef.current && !pendingSession) return;
    const id = sessionIdRef.current || pendingSession?.id;
    if (!id) return;
    try {
      await supabase
        .from("module_sessions")
        .update({ status: "abandoned" })
        .eq("id", id);
      sessionIdRef.current = null;
      setPendingSession(null);
    } catch {}
  }, [pendingSession]);

  // Register getState callback for auto-save
  const registerAutoSave = useCallback((getState: () => Record<string, any>) => {
    getStateRef.current = getState;
  }, []);

  // Auto-save interval
  useEffect(() => {
    if (!enabled || !user) return;

    intervalRef.current = setInterval(() => {
      if (getStateRef.current) {
        const state = getStateRef.current();
        if (state && Object.keys(state).length > 0) {
          saveSession(state);
        }
      }
    }, intervalMs);

    const handleBeforeUnload = () => {
      if (getStateRef.current) {
        const state = getStateRef.current();
        if (state && Object.keys(state).length > 0) {
          // Use sendBeacon for reliability on page close
          const payload = JSON.stringify({
            session_data: state,
            updated_at: new Date().toISOString(),
          });
          // Fallback: just save via supabase (may not complete)
          saveSession(state);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, user, intervalMs, saveSession]);

  // Check on mount
  useEffect(() => {
    checkForSession();
  }, [checkForSession]);

  return {
    pendingSession,
    checked,
    saveSession,
    completeSession,
    abandonSession,
    registerAutoSave,
    clearPending: () => setPendingSession(null),
  };
};
