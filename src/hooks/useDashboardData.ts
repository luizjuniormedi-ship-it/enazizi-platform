import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DashboardStats {
  flashcards: number;
  uploads: number;
  completedTasks: number;
  totalTasks: number;
  totalStudyHours: number;
  subjects: string[];
  subjectHours: Record<string, number>;
  upcomingReviews: { topic: string; next: string }[];
  daysUntilExam: number | null;
  weeklyChart: { week: string; hours: number; timestamp: number }[];
  streak: number;
  todayCompleted: number;
  todayTotal: number;
}

export interface DashboardMetrics {
  questionsAnswered: number;
  accuracy: number;
  errorsCount: number;
  pendingRevisoes: number;
  simuladosCompleted: number;
  discursivasCompleted: number;
  gamificationStreak: number;
  gamificationXp: number;
  gamificationLevel: number;
  globalFlashcards: number;
  globalQuestions: number;
  questionsCreated: number;
  clinicalSimulations: number;
  anamnesisCompleted: number;
  summariesCreated: number;
}

interface PlanJson {
  weeklySchedule?: { day: string; tasks: { time: string; subject: string; duration: string; type?: string }[] }[];
  subjects?: string[];
  tips?: string;
  config?: { examDate: string; hoursPerDay: number; daysPerWeek: number };
}

async function fetchDashboardData(userId: string) {
  const [
    flashcardsRes, uploadsRes, tasksRes, plansRes, reviewsRes, profileRes,
    practiceRes, errorBankRes, pendingRevisoesRes, simuladosRes, discursivasRes,
    gamificationRes, globalFlashRes, globalQuestRes,
    questionsCreatedRes, clinicalSimRes, anamnesisRes, summariesRes,
  ] = await Promise.all([
    supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("uploads").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("study_tasks").select("completed, created_at, task_json").eq("user_id", userId),
    supabase.from("study_plans").select("plan_json").eq("user_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("reviews").select("next_review, flashcard_id, flashcards(topic)").eq("user_id", userId).gte("next_review", new Date().toISOString()).order("next_review", { ascending: true }).limit(5),
    supabase.from("profiles").select("display_name").eq("user_id", userId).maybeSingle(),
    supabase.from("practice_attempts").select("correct").eq("user_id", userId),
    supabase.from("error_bank").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("revisoes").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "pendente"),
    supabase.from("exam_sessions").select("id, total_questions, score", { count: "exact" }).eq("user_id", userId).eq("status", "finished"),
    supabase.from("discursive_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId).not("finished_at", "is", null),
    supabase.from("user_gamification").select("current_streak, xp, level").eq("user_id", userId).maybeSingle(),
    supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("is_global", true),
    supabase.from("questions_bank").select("id", { count: "exact", head: true }).eq("is_global", true),
    supabase.from("questions_bank").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("simulation_history").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("anamnesis_results").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("summaries").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const [teacherSimuladoRes, teacherClinicalRes] = await Promise.all([
    supabase.from("teacher_simulado_results").select("total_questions, score").eq("student_id", userId),
    supabase.from("teacher_clinical_case_results").select("id", { count: "exact", head: true }).eq("student_id", userId),
  ]);

  const displayName = profileRes.data?.display_name || null;

  // Calculate accuracy
  const practiceAttempts = practiceRes.data || [];
  const practiceCorrect = practiceAttempts.filter((a: any) => a.correct).length;
  const practiceTotal = practiceAttempts.length;

  const examData = simuladosRes.data || [];
  const examQuestionsTotal = examData.reduce((sum: number, e: any) => sum + (e.total_questions || 0), 0);
  const examCorrectTotal = examData.reduce((sum: number, e: any) => {
    const total = e.total_questions || 0;
    return sum + Math.round(((e.score || 0) / 100) * total);
  }, 0);

  const teacherSimData = teacherSimuladoRes.data || [];
  const teacherQuestionsTotal = teacherSimData.reduce((sum: number, e: any) => sum + (e.total_questions || 0), 0);
  const teacherCorrectTotal = teacherSimData.reduce((sum: number, e: any) => {
    const total = e.total_questions || 0;
    return sum + Math.round(((e.score || 0) / 100) * total);
  }, 0);

  const teacherClinicalCount = teacherClinicalRes.count || 0;
  const questionsAnswered = practiceTotal + examQuestionsTotal + teacherQuestionsTotal;
  const totalCorrect = practiceCorrect + examCorrectTotal + teacherCorrectTotal;
  const accuracy = questionsAnswered > 0 ? Math.min(Math.round((totalCorrect / questionsAnswered) * 100), 100) : 0;

  const totalSimulados = (simuladosRes.count || 0) + teacherSimData.length;
  const totalClinical = (clinicalSimRes.count || 0) + teacherClinicalCount;
  const gamData = gamificationRes.data;

  const metrics: DashboardMetrics = {
    questionsAnswered,
    accuracy,
    errorsCount: errorBankRes.count || 0,
    pendingRevisoes: pendingRevisoesRes.count || 0,
    simuladosCompleted: totalSimulados,
    discursivasCompleted: discursivasRes.count || 0,
    gamificationStreak: gamData?.current_streak || 0,
    gamificationXp: gamData?.xp || 0,
    gamificationLevel: gamData?.level || 1,
    globalFlashcards: globalFlashRes.count || 0,
    globalQuestions: globalQuestRes.count || 0,
    questionsCreated: questionsCreatedRes.count || 0,
    clinicalSimulations: totalClinical,
    anamnesisCompleted: anamnesisRes.count || 0,
    summariesCreated: summariesRes.count || 0,
  };

  // Build stats
  const tasks = tasksRes.data || [];
  const completedTasks = tasks.filter((t: any) => t.completed).length;

  const weekMap: Record<string, { hours: number; timestamp: number }> = {};
  for (const task of tasks) {
    if (!(task as any).completed) continue;
    const date = new Date((task as any).created_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const key = `${String(weekStart.getDate()).padStart(2, "0")}/${String(weekStart.getMonth() + 1).padStart(2, "0")}`;
    const taskJson = (task as any).task_json as any;
    const durationMatch = taskJson?.duration?.match?.(/(\d+(?:\.\d+)?)/);
    const hours = durationMatch ? parseFloat(durationMatch[1]) : 1;
    if (!weekMap[key]) weekMap[key] = { hours: 0, timestamp: weekStart.getTime() };
    weekMap[key].hours += hours;
  }
  const weeklyChart = Object.entries(weekMap)
    .sort((a, b) => a[1].timestamp - b[1].timestamp)
    .map(([week, { hours, timestamp }]) => ({ week, hours: Math.round(hours * 10) / 10, timestamp }));

  const plan = plansRes.data?.plan_json as PlanJson | null;
  const subjects = plan?.subjects || [];
  const subjectHours: Record<string, number> = {};
  let totalStudyHours = 0;

  if (plan?.weeklySchedule) {
    for (const day of plan.weeklySchedule) {
      for (const task of day.tasks) {
        const match = task.duration.match(/(\d+(?:\.\d+)?)/);
        const hours = match ? parseFloat(match[1]) : 1;
        subjectHours[task.subject] = (subjectHours[task.subject] || 0) + hours;
        totalStudyHours += hours;
      }
    }
  }

  let daysUntilExam: number | null = null;
  if (plan?.config?.examDate) {
    const diff = new Date(plan.config.examDate).getTime() - Date.now();
    if (diff > 0) daysUntilExam = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const upcomingReviews = (reviewsRes.data || []).map((r: any) => ({
    topic: r.flashcards?.topic || "Sem tópico",
    next: r.next_review,
  }));

  const DAY_MAP: Record<string, number> = { Dom: 0, Seg: 1, Ter: 2, Qua: 3, Qui: 4, Sex: 5, "Sáb": 6, Sab: 6 };
  const todayDow = new Date().getDay();
  const todaySchedule = plan?.weeklySchedule?.find((d) => DAY_MAP[d.day] === todayDow);
  const todayTotal = todaySchedule?.tasks.length || 0;
  const completedToday = tasks.filter((t: any) => {
    if (!t.completed) return false;
    const d = new Date(t.created_at);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });

  const stats: DashboardStats = {
    flashcards: flashcardsRes.count || 0,
    uploads: uploadsRes.count || 0,
    completedTasks,
    totalTasks: tasks.length,
    totalStudyHours,
    subjects,
    subjectHours,
    upcomingReviews,
    daysUntilExam,
    weeklyChart,
    streak: gamData?.current_streak || 0,
    todayCompleted: completedToday.length,
    todayTotal,
  };

  return { stats, metrics, displayName };
}

export const useDashboardData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-data", user?.id],
    queryFn: () => fetchDashboardData(user!.id),
    enabled: !!user,
    staleTime: 3 * 60 * 1000, // 3 min cache
    gcTime: 10 * 60 * 1000,
  });
};
