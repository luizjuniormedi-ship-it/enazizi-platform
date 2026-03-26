import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useUserRoles = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      const roles = (data || []).map((r: any) => r.role as string);
      return {
        roles,
        isAdmin: roles.includes("admin"),
        isProfessor: roles.includes("professor"),
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 15,
  });

  return {
    isAdmin: data?.isAdmin ?? false,
    isProfessor: data?.isProfessor ?? false,
    roles: data?.roles ?? [],
    loading: isLoading,
  };
};
