import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { invalidateDashboardSnapshot } from "@/lib/dashboardSnapshot";

/**
 * Central hook for refreshing ALL user-facing state after any study action.
 * Invalidates every cache that feeds dashboard, mission, pending reviews, etc.
 *
 * Use after: finishing questions, reviews, simulados, flashcards, tutor sessions,
 * clinical simulations, anamnesis, practical exams, and any study module completion.
 */
export function useRefreshUserState() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const refreshAll = useCallback(() => {
    // Core data sources
    queryClient.invalidateQueries({ queryKey: ["core-data"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    queryClient.invalidateQueries({ queryKey: ["study-engine"] });

    // Readiness & progress
    queryClient.invalidateQueries({ queryKey: ["exam-readiness"] });
    queryClient.invalidateQueries({ queryKey: ["weekly-goals"] });
    queryClient.invalidateQueries({ queryKey: ["preparation-index"] });

    // Mission & plan
    queryClient.invalidateQueries({ queryKey: ["mission-mode"] });
    queryClient.invalidateQueries({ queryKey: ["daily-plan"] });

    // Module-specific caches
    queryClient.invalidateQueries({ queryKey: ["smart-notifications"] });
    queryClient.invalidateQueries({ queryKey: ["gamification"] });

    // Persistent snapshot
    if (user?.id) {
      invalidateDashboardSnapshot(user.id);
    }

    // Async snapshot rebuild (fire-and-forget)
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.functions.invoke("dashboard-snapshot", {
        body: { action: "update" },
      }).catch(() => {});
    });
  }, [queryClient, user?.id]);

  return { refreshAll };
}
