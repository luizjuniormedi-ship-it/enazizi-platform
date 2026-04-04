import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Shared hook for invalidating all dashboard-related caches.
 * Use after any user action that changes study data (reviews, questions, simulados, etc.)
 */
export function useDashboardInvalidation() {
  const queryClient = useQueryClient();

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    queryClient.invalidateQueries({ queryKey: ["study-engine"] });
    queryClient.invalidateQueries({ queryKey: ["exam-readiness"] });
  }, [queryClient]);

  const invalidateDashboard = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
  }, [queryClient]);

  return { invalidateAll, invalidateDashboard };
}
