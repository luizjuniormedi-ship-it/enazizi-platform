import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { usePreparationIndex, PreparationZone } from "./usePreparationIndex";
import { useDashboardData } from "./useDashboardData";

export interface WeeklyGoal {
  key: string;
  label: string;
  icon: string;
  target: number;
  current: number;
  percent: number;
  carryover: number;
}

export interface WeeklyGoalsData {
  goals: WeeklyGoal[];
  overallPercent: number;
  message: string;
  weekLabel: string;
}

function getMonday(offset = 0): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getSunday(monday: Date): Date {
  const sun = new Date(monday);
  sun.setDate(monday.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return sun;
}

function zoneMultiplier(zone: PreparationZone): number {
  switch (zone) {
    case "base_fraca": return 0.7;
    case "em_construcao": return 1.0;
    case "competitivo": return 1.2;
    case "forte": return 1.2;
  }
}

function generateMessage(percent: number, zone: PreparationZone): string {
  if (percent >= 100) return "Parabéns! Você bateu todas as metas da semana! 🎉";
  if (percent >= 80) return "Quase lá! Mantenha o ritmo para fechar a semana.";
  if (percent >= 50) return "Você está no caminho certo. Continue focado!";
  if (percent >= 25) return "Acelere para atingir suas metas semanais.";
  return "Comece agora para construir sua semana de estudos.";
}

async function fetchWeeklyProgress(userId: string) {
  const monday = getMonday();
  const mondayISO = monday.toISOString();

  const [questionsRes, revisoesRes, temasRes, simRes, anamnesisRes, osceRes] = await Promise.all([
    supabase
      .from("practice_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", mondayISO),
    supabase
      .from("revisoes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "concluida")
      .gte("updated_at", mondayISO),
    supabase
      .from("temas_estudados")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", mondayISO),
    supabase
      .from("simulation_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "finished")
      .gte("created_at", mondayISO),
    supabase
      .from("anamnesis_results")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", mondayISO),
    supabase
      .from("chronicle_osce_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", mondayISO),
  ]);

  return {
    questions: questionsRes.count || 0,
    revisoes: revisoesRes.count || 0,
    temas: temasRes.count || 0,
    pratica: (simRes.count || 0) + (anamnesisRes.count || 0) + (osceRes.count || 0),
  };
}

export function useWeeklyGoals() {
  const { user } = useAuth();
  const { data: prepData } = usePreparationIndex();
  const { data: dashData } = useDashboardData();

  return useQuery<WeeklyGoalsData>({
    queryKey: ["weekly-goals", user?.id],
    queryFn: async () => {
      const userId = user!.id;
      const progress = await fetchWeeklyProgress(userId);

      const zone = prepData?.zone || "em_construcao";
      const breakdown = prepData?.breakdown || { cronograma: 50, desempenho: 50, revisoes: 50, pratica: 50 };
      const daysUntilExam = dashData?.stats?.daysUntilExam ?? null;
      const pendingRevisoes = dashData?.metrics?.pendingRevisoes ?? 0;
      const mult = zoneMultiplier(zone);
      const examUrgency = daysUntilExam !== null && daysUntilExam < 30 ? 1.5 : 1;

      // Questions target: base 30/day * 7 = 210, adapted by zone
      const questionsTarget = Math.round(210 * mult);

      // Revisões target: pending + buffer, adapted by exam proximity
      const revisoesTarget = Math.max(
        Math.round((pendingRevisoes + 10) * examUrgency),
        15
      );

      // Temas: 3-7 based on coverage
      let temasTarget = 5;
      if (breakdown.cronograma > 80) temasTarget = 2;
      else if (breakdown.cronograma > 60) temasTarget = 3;
      else if (breakdown.cronograma < 30) temasTarget = 7;

      // Prática clínica: 1-4 sessions
      let praticaTarget = 2;
      if (zone === "competitivo" || zone === "forte") praticaTarget = 3;
      if (zone === "base_fraca") praticaTarget = 1;
      if (daysUntilExam !== null && daysUntilExam < 30) praticaTarget = Math.min(praticaTarget + 1, 4);

      const goals: WeeklyGoal[] = [
        {
          key: "questoes",
          label: "Questões",
          icon: "📝",
          target: questionsTarget,
          current: progress.questions,
          percent: questionsTarget > 0 ? Math.min(Math.round((progress.questions / questionsTarget) * 100), 100) : 0,
        },
        {
          key: "revisoes",
          label: "Revisões",
          icon: "🔄",
          target: revisoesTarget,
          current: progress.revisoes,
          percent: revisoesTarget > 0 ? Math.min(Math.round((progress.revisoes / revisoesTarget) * 100), 100) : 0,
        },
        {
          key: "temas",
          label: "Temas novos",
          icon: "📚",
          target: temasTarget,
          current: progress.temas,
          percent: temasTarget > 0 ? Math.min(Math.round((progress.temas / temasTarget) * 100), 100) : 0,
        },
        {
          key: "pratica",
          label: "Prática clínica",
          icon: "🏥",
          target: praticaTarget,
          current: progress.pratica,
          percent: praticaTarget > 0 ? Math.min(Math.round((progress.pratica / praticaTarget) * 100), 100) : 0,
        },
      ];

      const overallPercent = Math.round(goals.reduce((sum, g) => sum + g.percent, 0) / goals.length);

      const monday = getMonday();
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      const weekLabel = `${fmt(monday)} – ${fmt(sunday)}`;

      return {
        goals,
        overallPercent,
        message: generateMessage(overallPercent, zone),
        weekLabel,
      };
    },
    enabled: !!user,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
