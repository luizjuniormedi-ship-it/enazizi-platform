import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { invalidateDashboardSnapshot } from "@/lib/dashboardSnapshot";

/**
 * Shared hook for invalidating all dashboard-related caches.
 * Use after any user action that changes study data (reviews, questions, simulados, etc.)
 */
export function useDashboardInvalidation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["core-data"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    queryClient.invalidateQueries({ queryKey: ["study-engine"] });
    queryClient.invalidateQueries({ queryKey: ["exam-readiness"] });
    queryClient.invalidateQueries({ queryKey: ["weekly-goals"] });
    queryClient.invalidateQueries({ queryKey: ["mission-mode"] });

    // Invalidate persistent snapshot so next dashboard load does full recompute
    if (user?.id) {
      invalidateDashboardSnapshot(user.id);
    }

    // Trigger async snapshot rebuild via edge function (fire-and-forget)
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.functions.invoke("dashboard-snapshot", {
        body: { action: "update" },
      }).catch(() => {});
    });
  }, [queryClient, user?.id]);

  const invalidateDashboard = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    if (user?.id) {
      invalidateDashboardSnapshot(user.id);
    }
  }, [queryClient, user?.id]);

  return { invalidateAll, invalidateDashboard };
}
