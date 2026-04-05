import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { invalidateDashboardSnapshot } from "@/lib/dashboardSnapshot";
import { useRefreshUserState } from "./useRefreshUserState";

/**
 * Shared hook for invalidating all dashboard-related caches.
 * `invalidateAll` now delegates to the central `useRefreshUserState` hook
 * so every study module gets the same comprehensive cache bust.
 */
export function useDashboardInvalidation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { refreshAll } = useRefreshUserState();

  /** Full invalidation — use after any study action */
  const invalidateAll = useCallback(() => {
    refreshAll();
  }, [refreshAll]);

  /** Lighter invalidation — dashboard-only */
  const invalidateDashboard = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    if (user?.id) {
      invalidateDashboardSnapshot(user.id);
    }
  }, [queryClient, user?.id]);

  return { invalidateAll, invalidateDashboard };
}
