import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const SESSION_KEY = "proficiency-gate-visited";

export function usePendingProficiency() {
  const { user } = useAuth();
  const [hasVisited, setHasVisited] = useState(() => sessionStorage.getItem(SESSION_KEY) === "true");

  // Check if user is pure staff (admin only — médicos with professor role should still see proficiency)
  const { data: isStaff = false } = useQuery({
    queryKey: ["is-staff-proficiency", user?.id],
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin");
      if ((roles || []).length > 0) return true;

      // Professors who are NOT médicos are staff (skip proficiency)
      const { data: profRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "professor");
      if ((profRoles || []).length === 0) return false;

      // Has professor role — check if user_type is medico (médicos should NOT be skipped)
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", user!.id)
        .single();
      return profile?.user_type !== "medico";
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
