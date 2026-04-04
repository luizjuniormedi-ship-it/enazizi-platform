import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export type ContentLockStatus = "blocked" | "limited" | "allowed";

export interface ContentLockState {
  status: ContentLockStatus;
  label: string;
  message: string;
  overdueReviews: number;
  reviewCompletionRate: number;
  approvalScore: number;
  recentErrorRate: number;
  reasons: string[];
}

async function computeContentLock(userId: string): Promise<ContentLockState> {
  const today = new Date().toISOString().split("T")[0];

  const [
    overdueRes,
    totalReviewsRes,
    completedReviewsRes,
    approvalRes,
    recentAttemptsRes,
    errorBankRes,
  ] = await Promise.all([
    // Count overdue reviews
    supabase
      .from("revisoes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pendente")
      .lte("data_revisao", today),
    // Total reviews in last 30 days
    supabase
      .from("revisoes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("data_revisao", new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]),
    // Completed reviews in last 30 days
    supabase
      .from("revisoes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "concluida")
      .gte("data_revisao", new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]),
    // Latest approval score
    supabase
      .from("approval_scores")
      .select("score")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Recent practice attempts (last 7 days)
    supabase
      .from("practice_attempts")
      .select("correct")
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    // Unmastered errors
    supabase
      .from("error_bank")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("dominado", false),
  ]);

  const overdueReviews = overdueRes.count || 0;
  const totalReviews = totalReviewsRes.count || 0;
  const completedReviews = completedReviewsRes.count || 0;
  const reviewCompletionRate = totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 100;
  const approvalScore = approvalRes.data?.score ?? 50;

  const recentAttempts = recentAttemptsRes.data || [];
  const recentTotal = recentAttempts.length;
  const recentErrors = recentAttempts.filter(a => !a.correct).length;
  const recentErrorRate = recentTotal > 0 ? Math.round((recentErrors / recentTotal) * 100) : 0;

  const reasons: string[] = [];

  // ── BLOCK conditions ──
  const blockConditions = [
    overdueReviews > 20,
    reviewCompletionRate < 40 && totalReviews >= 5,
    recentErrorRate > 70 && recentTotal >= 10,
  ];
  
  if (overdueReviews > 20) reasons.push(`${overdueReviews} revisões atrasadas`);
  if (reviewCompletionRate < 40 && totalReviews >= 5) reasons.push(`Taxa de revisão ${reviewCompletionRate}%`);
  if (recentErrorRate > 70 && recentTotal >= 10) reasons.push(`Taxa de erro ${recentErrorRate}% recente`);

  if (blockConditions.filter(Boolean).length >= 2) {
    return {
      status: "blocked",
      label: "Revisão Prioritária",
      message: "Você precisa concluir suas revisões antes de avançar para conteúdo novo.",
      overdueReviews,
      reviewCompletionRate,
      approvalScore,
      recentErrorRate,
      reasons,
    };
  }

  // ── LIMIT conditions ──
  const limitConditions = [
    overdueReviews >= 10,
    approvalScore < 50,
    recentErrorRate > 50 && recentTotal >= 5,
    reviewCompletionRate < 60 && totalReviews >= 3,
  ];

  if (overdueReviews >= 10) reasons.push(`${overdueReviews} revisões pendentes`);
  if (approvalScore < 50) reasons.push(`Approval Score ${approvalScore}%`);
  if (recentErrorRate > 50 && recentTotal >= 5) reasons.push(`Alto índice de erros recentes`);

  if (limitConditions.filter(Boolean).length >= 2) {
    return {
      status: "limited",
      label: "Modo Equilibrado",
      message: "Estamos priorizando revisões para fortalecer sua base antes de novos conteúdos.",
      overdueReviews,
      reviewCompletionRate,
      approvalScore,
      recentErrorRate,
      reasons,
    };
  }

  // ── ALLOWED ──
  return {
    status: "allowed",
    label: "Avanço Liberado",
    message: "Você está em dia! Continue avançando com novos conteúdos.",
    overdueReviews,
    reviewCompletionRate,
    approvalScore,
    recentErrorRate,
    reasons: [],
  };
}

export function useContentLock() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["content-lock", user?.id],
    queryFn: () => computeContentLock(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Returns adjusted maxNewTopics based on content lock status.
 * Used by Study Engine to modify plan generation.
 */
export function adjustNewTopicsByLock(
  currentMax: number,
  lockStatus: ContentLockStatus
): number {
  switch (lockStatus) {
    case "blocked":
      return 0;
    case "limited":
      return Math.max(1, Math.floor(currentMax / 2));
    case "allowed":
    default:
      return currentMax;
  }
}
