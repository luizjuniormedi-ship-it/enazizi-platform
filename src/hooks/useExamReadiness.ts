import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { calculateAllExamReadiness, type ExamReadiness, type ReadinessInput } from "@/lib/examReadiness";

async function fetchReadinessData(userId: string): Promise<ExamReadiness[]> {
  // Fetch all needed data in parallel
  const [profileRes, practiceRes, domainRes, examRes, reviewsRes, gamRes, anamnesisRes, practicalRes, temasRes] = await Promise.all([
    supabase.from("profiles").select("target_exams, target_exam").eq("user_id", userId).maybeSingle(),
    supabase.from("practice_attempts").select("correct, created_at, question_id, questions_bank(topic)").eq("user_id", userId),
    supabase.from("medical_domain_map").select("specialty, domain_score, questions_answered, correct_answers").eq("user_id", userId),
    supabase.from("exam_sessions").select("score, finished_at").eq("user_id", userId).eq("status", "finished").order("finished_at", { ascending: false }).limit(10),
    supabase.from("revisoes").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "pendente"),
    supabase.from("user_gamification").select("current_streak").eq("user_id", userId).maybeSingle(),
    supabase.from("anamnesis_results").select("final_score").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    supabase.from("practical_exam_results").select("final_score").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    supabase.from("temas_estudados").select("tema").eq("user_id", userId),
  ]);

  const ep = profileRes.data as any;
  let targetExams: string[] = [];
  if (Array.isArray(ep?.target_exams) && ep.target_exams.length > 0) {
    targetExams = ep.target_exams;
  } else if (ep?.target_exam) {
    targetExams = [ep.target_exam];
  }
  if (targetExams.length === 0) return [];

  const attempts = practiceRes.data || [];
  const totalCorrect = attempts.filter((a: any) => a.correct).length;
  const totalQuestions = attempts.length;

  // Accuracy by specialty from domain map
  const accuracyBySpecialty: Record<string, { correct: number; total: number }> = {};
  for (const d of (domainRes.data || []) as any[]) {
    accuracyBySpecialty[d.specialty] = {
      correct: d.correct_answers || 0,
      total: d.questions_answered || 0,
    };
  }

  // Recent accuracy (last 50)
  const recent = attempts.slice(0, 50);
  const recentCorrect = recent.filter((a: any) => a.correct).length;
  const recentAccuracy = recent.length > 0 ? (recentCorrect / recent.length) * 100 : 0;

  // Approval score (simplified)
  const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  const domains = domainRes.data || [];
  const avgDomain = domains.length > 0
    ? (domains as any[]).reduce((s: number, d: any) => s + (d.domain_score || 0), 0) / domains.length
    : 0;
  const volumeScore = Math.min((totalQuestions / 500) * 100, 100);
  const approvalScore = Math.round(accuracy * 0.35 + avgDomain * 0.25 + volumeScore * 0.20 + 20 * 0.20);

  // Studied topics for coverage calculation
  const studiedTopics = (temasRes.data || []).map((t: any) => ((t.tema as string) || "").toLowerCase());

  const input: ReadinessInput = {
    approvalScore,
    accuracyBySpecialty,
    simuladoScores: (examRes.data || []).map((e: any) => e.score || 0),
    practicalScores: [
      ...(anamnesisRes.data || []).map((a: any) => a.final_score || 0),
      ...(practicalRes.data || []).map((p: any) => p.final_score || 0),
    ],
    overdueReviews: reviewsRes.count || 0,
    totalQuestionsAnswered: totalQuestions,
    streak: gamRes.data?.current_streak || 0,
    recentAccuracy,
    studiedTopics,
  };

  return calculateAllExamReadiness(input, targetExams);
}

export const useExamReadiness = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["exam-readiness", user?.id],
    queryFn: () => fetchReadinessData(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};
