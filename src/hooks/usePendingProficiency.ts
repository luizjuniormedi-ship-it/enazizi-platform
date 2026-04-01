import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const SESSION_KEY = "proficiency-gate-visited";

export function usePendingProficiency() {
  const { user } = useAuth();
  const [hasVisited, setHasVisited] = useState(() => sessionStorage.getItem(SESSION_KEY) === "true");

  // Check if user is staff (professor/admin)
  const { data: isStaff = false } = useQuery({
    queryKey: ["is-staff-role", user?.id],
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .in("role", ["admin", "professor"]);
      return (data || []).length > 0;
    },
  });

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-proficiency", user?.id],
    enabled: !!user?.id && !isStaff,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const uid = user!.id;
      const [sim, clin, study] = await Promise.all([
        supabase.from("teacher_simulado_results").select("id", { count: "exact", head: true }).eq("student_id", uid).eq("status", "pending"),
        supabase.from("teacher_clinical_case_results").select("id", { count: "exact", head: true }).eq("student_id", uid).eq("status", "pending"),
        supabase.from("teacher_study_assignment_results").select("id", { count: "exact", head: true }).eq("student_id", uid).eq("status", "pending"),
      ]);
      return (sim.count ?? 0) + (clin.count ?? 0) + (study.count ?? 0);
    },
  });

  const markVisited = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, "true");
    setHasVisited(true);
  }, []);

  const hasPending = pendingCount > 0;
  const isBlocked = hasPending && !hasVisited && !isStaff;

  return { hasPending, pendingCount, hasVisited, markVisited, isBlocked };
}
