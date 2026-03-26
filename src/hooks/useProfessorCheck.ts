import { useUserRoles } from "./useUserRoles";

export const useProfessorCheck = () => {
  const { isProfessor, loading } = useUserRoles();
  return { isProfessor, loading };
};
