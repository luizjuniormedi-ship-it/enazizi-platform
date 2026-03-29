import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { generateRecommendations, type StudyRecommendation } from "@/lib/studyEngine";

export type { StudyRecommendation };

export const useStudyEngine = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["study-engine", user?.id],
    queryFn: () => generateRecommendations({ userId: user!.id }),
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 min
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};
