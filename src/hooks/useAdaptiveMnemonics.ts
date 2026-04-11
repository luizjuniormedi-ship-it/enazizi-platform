import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getPendingMnemonics, type PendingMnemonic } from "@/lib/mnemonicAdaptiveService";

/**
 * Hook to fetch pending adaptive mnemonics for the current user.
 * Use in study pages to show mnemonics at the right moment.
 */
export const useAdaptiveMnemonics = (currentTopic?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["adaptive-mnemonics", user?.id, currentTopic],
    queryFn: () => getPendingMnemonics(user!.id, currentTopic),
    enabled: !!user,
    staleTime: 60_000, // 1 min
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
};

export type { PendingMnemonic };
