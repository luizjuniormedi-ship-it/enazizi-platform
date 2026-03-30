import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface InstitutionMembership {
  institution_id: string;
  role: string;
  institution: {
    id: string;
    name: string;
    type: string;
    logo_url: string | null;
  };
}

export const useInstitution = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["institution-membership", user?.id],
    queryFn: async () => {
      const { data: membership } = await supabase
        .from("institution_members")
        .select("institution_id, role, institutions(id, name, type, logo_url)")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!membership) return null;

      return {
        institution_id: membership.institution_id,
        role: membership.role,
        institution: (membership as any).institutions,
      } as InstitutionMembership;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  const isStaff = data?.role === "professor" || data?.role === "coordinator" || data?.role === "institutional_admin";
  const isCoordinator = data?.role === "coordinator" || data?.role === "institutional_admin";

  return {
    membership: data ?? null,
    institutionId: data?.institution_id ?? null,
    institutionRole: data?.role ?? null,
    isStaff,
    isCoordinator,
    loading: isLoading,
  };
};
