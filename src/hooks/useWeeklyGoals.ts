import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { usePreparationIndex, PreparationZone } from "./usePreparationIndex";
import { useDashboardData } from "./useDashboardData";
import { useStudyEngine } from "./useStudyEngine";
import { useCoreData } from "./useCoreData";

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

/** Derive current week progress from coreData (client-side filtering) */
function deriveCurrentWeekProgress(
  coreData: { practiceAttempts: any[]; revisoes: any[]; temasEstudados: any[]; anamnesisResults: any[]; osceScores: any[] },
  mondayISO: string,
) {
  const questions = coreData.practiceAttempts.filter(a => a.created_at >= mondayISO).length;
  // revisoes: concluida_em not in coreData, but we can approximate with created_at filter on status=concluida
  // Since coreData.revisoes has all revisoes, filter concluida status created this week
  const revisoes = coreData.revisoes.filter((r: any) => r.status === "concluida" && r.created_at >= mondayISO).length;
  const temas = coreData.temasEstudados.filter(t => t.created_at >= mondayISO).length;
  const anamnesis = coreData.anamnesisResults.filter(a => a.created_at >= mondayISO).length;
  const osce = coreData.osceScores.length; // osceScores doesn't have created_at, count all
  // simulation_sessions not in coreData — use count 0 as approximation (minor)
  const pratica = anamnesis;

  return { questions, revisoes, temas, pratica };
}

/** Fetch previous week progress (only carryover — reduced to counts) */
async function fetchPrevWeekCounts(userId: string, fromISO: string, toISO: string) {
  const [questionsRes, revisoesRes, temasRes, praticaRes] = await Promise.all([
    supabase
      .from("practice_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", fromISO)
      .lte("created_at", toISO),
    supabase
      .from("revisoes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "concluida")
      .gte("created_at", fromISO)
      .lte("created_at", toISO),
    supabase
      .from("temas_estudados")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", fromISO)
      .lte("created_at", toISO),
    supabase
      .from("anamnesis_results")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", fromISO)
      .lte("created_at", toISO),
  ]);

  return {
    questions: questionsRes.count || 0,
    revisoes: revisoesRes.count || 0,
    temas: temasRes.count || 0,
    pratica: praticaRes.count || 0,
  };
}

export function useWeeklyGoals() {
  const { user } = useAuth();
  const { data: prepData } = usePreparationIndex();
  const { data: dashData } = useDashboardData();
  const { adaptive } = useStudyEngine();
  const { data: coreData } = useCoreData();

  return useQuery<WeeklyGoalsData>({
    queryKey: ["weekly-goals", user?.id, !!coreData],
    queryFn: async () => {
      const userId = user!.id;
      const monday = getMonday();
      const prevMonday = getMonday(-1);
      const prevSunday = getSunday(prevMonday);

      // Current week: derive from coreData (0 queries!)
      const progress = coreData
        ? deriveCurrentWeekProgress(coreData, monday.toISOString())
        : { questions: 0, revisoes: 0, temas: 0, pratica: 0 };

      // Previous week: only 4 count queries for carryover
      const prevProgress = await fetchPrevWeekCounts(
        userId,
        prevMonday.toISOString(),
        prevSunday.toISOString(),
      );

      const zone = prepData?.zone || "em_construcao";
      const breakdown = prepData?.breakdown || { cronograma: 50, desempenho: 50, revisoes: 50, pratica: 50 };
      const daysUntilExam = dashData?.stats?.daysUntilExam ?? null;
      const pendingRevisoes = dashData?.metrics?.pendingRevisoes ?? 0;
      const mult = zoneMultiplier(zone);
      const examUrgency = daysUntilExam !== null && daysUntilExam < 30 ? 1.5 : 1;

      // Heavy recovery multipliers per phase
      const hr = adaptive?.heavyRecovery;
      const hrMult = hr?.active
        ? hr.phase === 1 ? 0.3
        : hr.phase === 2 ? 0.5
        : hr.phase === 3 ? 0.7
        : 0.9
        : 1;

      // Base targets (adjusted by heavy recovery)
      const questionsBase = Math.round(210 * mult * hrMult);
      const revisoesBase = Math.max(Math.round((pendingRevisoes + 10) * examUrgency * (hr?.active ? Math.min(hrMult + 0.3, 1) : 1)), hr?.active ? 10 : 15);
      let temasBase = 5;
      if (breakdown.cronograma > 80) temasBase = 2;
      else if (breakdown.cronograma > 60) temasBase = 3;
      else if (breakdown.cronograma < 30) temasBase = 7;
      if (hr?.active) temasBase = hr.maxNewTopics;
      let praticaBase = 2;
      if (zone === "competitivo" || zone === "forte") praticaBase = 3;
      if (zone === "base_fraca") praticaBase = 1;
      if (daysUntilExam !== null && daysUntilExam < 30) praticaBase = Math.min(praticaBase + 1, 4);
      if (hr?.active && hr.phase <= 2) praticaBase = 0;
      else if (hr?.active && hr.phase === 3) praticaBase = Math.min(praticaBase, 1);

      // Carryover: 50% of previous week deficit, capped at 1.5x base
      // During heavy recovery phases 1-2, disable carryover to avoid overload
      const calcCarryover = (base: number, prevActual: number) => {
        if (hr?.active && hr.phase <= 2) return 0;
        const prevTarget = base;
        const deficit = Math.max(0, prevTarget - prevActual);
        const carry = Math.round(deficit * 0.5);
        return Math.min(carry, Math.round(base * 0.5));
      };

      const qCarry = calcCarryover(questionsBase, prevProgress.questions);
      const rCarry = calcCarryover(revisoesBase, prevProgress.revisoes);
      const tCarry = calcCarryover(temasBase, prevProgress.temas);
      const pCarry = calcCarryover(praticaBase, prevProgress.pratica);

      const questionsTarget = questionsBase + qCarry;
      const revisoesTarget = revisoesBase + rCarry;
      const temasTarget = temasBase + tCarry;
      const praticaTarget = praticaBase + pCarry;

      const mkGoal = (key: string, label: string, icon: string, target: number, current: number, carryover: number): WeeklyGoal => ({
        key, label, icon, target, current, carryover,
        percent: target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0,
      });

      const goals: WeeklyGoal[] = [
        mkGoal("questoes", "Questões", "📝", questionsTarget, progress.questions, qCarry),
        mkGoal("revisoes", "Revisões", "🔄", revisoesTarget, progress.revisoes, rCarry),
        mkGoal("temas", "Temas novos", "📚", temasTarget, progress.temas, tCarry),
        mkGoal("pratica", "Prática clínica", "🏥", praticaTarget, progress.pratica, pCarry),
      ];

      const overallPercent = Math.round(goals.reduce((sum, g) => sum + g.percent, 0) / goals.length);

      const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      const weekSunday = getSunday(monday);
      const weekLabel = `${fmt(monday)} – ${fmt(weekSunday)}`;

      return {
        goals,
        overallPercent,
        message: generateMessage(overallPercent, zone),
        weekLabel,
      };
    },
    enabled: !!user && !!coreData,
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
