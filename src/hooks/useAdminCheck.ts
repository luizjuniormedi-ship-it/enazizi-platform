import { useUserRoles } from "./useUserRoles";

export const useAdminCheck = () => {
  const { isAdmin, loading } = useUserRoles();
  return { isAdmin, loading };
};
