import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { generateRecommendations, type StudyRecommendation, type EngineResult, type AdaptiveState } from "@/lib/studyEngine";

export type { StudyRecommendation, AdaptiveState };

export const useStudyEngine = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["study-engine", user?.id],
    queryFn: () => generateRecommendations({ userId: user!.id }),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Unwrap EngineResult so consumers get the same array API
  const engineResult = query.data;
  const recommendations = engineResult?.recommendations;
  const adaptive = engineResult?.adaptive;

  return {
    ...query,
    /** The recommendation list (backward-compatible with old `data`) */
    data: recommendations,
    /** Full adaptive state */
    adaptive,
  };
};
