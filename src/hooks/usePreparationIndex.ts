import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PreparationBreakdown {
  cronograma: number;   // 0-100
  desempenho: number;   // 0-100
  revisoes: number;     // 0-100
  pratica: number;      // 0-100
}

export type PreparationZone = "base_fraca" | "em_construcao" | "competitivo" | "forte";

export interface PreparationIndexData {
  score: number;        // 0-100
  zone: PreparationZone;
  weeklyDelta: number;  // change from 7 days ago
  breakdown: PreparationBreakdown;
  message: string;
  nextGoal: string;
}

const ZONE_THRESHOLDS: { max: number; zone: PreparationZone }[] = [
  { max: 40, zone: "base_fraca" },
  { max: 70, zone: "em_construcao" },
  { max: 85, zone: "competitivo" },
  { max: 101, zone: "forte" },
];

function getZone(score: number): PreparationZone {
  for (const t of ZONE_THRESHOLDS) {
    if (score < t.max) return t.zone;
  }
  return "forte";
}

function getNextZoneInfo(score: number): { nextZone: string; pointsNeeded: number } | null {
  if (score >= 85) return null;
  if (score < 40) return { nextZone: "Em construção", pointsNeeded: 40 - score };
  if (score < 70) return { nextZone: "Competitivo", pointsNeeded: 70 - score };
  return { nextZone: "Forte para aprovação", pointsNeeded: 85 - score };
}

function generateMessage(zone: PreparationZone, breakdown: PreparationBreakdown, delta: number): string {
  if (delta >= 5) return "Você está evoluindo bem! Continue assim.";
  if (delta < -3) return "Seu índice caiu. Foque em revisões e questões.";

  if (breakdown.revisoes < 40) return "Foque em revisões para subir mais rápido.";
  if (breakdown.cronograma < 30) return "Amplie a cobertura do cronograma.";
  if (breakdown.desempenho < 40) return "Pratique mais questões para melhorar o desempenho.";
  if (breakdown.pratica < 30 && zone !== "base_fraca") return "Inclua prática clínica para fortalecer sua preparação.";

  if (zone === "forte") return "Excelente! Mantenha a consistência até a prova.";
  if (zone === "competitivo") return "Você está em zona competitiva. Refine os pontos fracos.";
  if (zone === "em_construcao") return "Seu desempenho está consistente. Continue focado.";
  return "Construa sua base com revisões e questões diárias.";
}

async function fetchPreparationIndex(userId: string): Promise<PreparationIndexData> {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const weekAgoStr = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];

  // Parallel fetch all data sources
  const [
    temasRes, revisoesRes, practiceRes, examSessionsRes,
    anamnesisRes, osceRes, clinicalSimRes, approvalRes,
  ] = await Promise.all([
    // Cronograma coverage: temas_estudados count vs total curriculum
    supabase.from("temas_estudados").select("id", { count: "exact", head: true }).eq("user_id", userId),
    // Revisões: pending vs done ratio
    supabase.from("revisoes").select("status").eq("user_id", userId),
    // Desempenho: practice_attempts accuracy
    supabase.from("practice_attempts").select("correct, created_at").eq("user_id", userId),
    // Simulados completed
    supabase.from("exam_sessions").select("score, total_questions", { count: "exact" }).eq("user_id", userId).eq("status", "finished"),
    // Anamnesis
    supabase.from("anamnesis_results").select("final_score").eq("user_id", userId),
    // OSCE
    supabase.from("chronicle_osce_sessions").select("score").eq("user_id", userId),
    // Clinical simulation
    supabase.from("simulation_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "finished"),
    // Previous approval score for weekly delta
    supabase.from("approval_scores").select("score, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
  ]);

  // ═══ CRONOGRAMA (40%) ═══
  // Temas studied / ~250 total curriculum topics
  const temasCount = temasRes.count || 0;
  const TOTAL_CURRICULUM = 250;
  const cronograma = Math.min(Math.round((temasCount / TOTAL_CURRICULUM) * 100), 100);

  // ═══ DESEMPENHO (35%) ═══
  const attempts = practiceRes.data || [];
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a: any) => a.correct).length;
  const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
  // Volume bonus: more questions = higher score (caps at 500)
  const volumeBonus = Math.min((totalAttempts / 500) * 20, 20);
  const desempenho = Math.min(Math.round(accuracy * 0.8 + volumeBonus), 100);

  // ═══ REVISÕES (15%) ═══
  const allRevisoes = revisoesRes.data || [];
  const totalRevisoes = allRevisoes.length;
  const pendentes = allRevisoes.filter((r: any) => r.status === "pendente").length;
  const concluidas = allRevisoes.filter((r: any) => r.status === "concluida").length;
  let revisoes = 0;
  if (totalRevisoes > 0) {
    const completionRate = (concluidas / totalRevisoes) * 100;
    const pendingPenalty = Math.min(pendentes * 2, 40);
    revisoes = Math.max(0, Math.min(Math.round(completionRate - pendingPenalty), 100));
  }

  // ═══ PRÁTICA (10%) ═══
  const examSessions = examSessionsRes.data || [];
  const examCount = examSessions.length;
  const avgExamScore = examCount > 0
    ? examSessions.reduce((s: number, e: any) => s + (e.score || 0), 0) / examCount
    : 0;

  const anamnesisScores = (anamnesisRes.data || []).map((a: any) => a.final_score || 0);
  const osceScores = (osceRes.data || []).map((o: any) => o.score || 0);
  const clinicalCount = clinicalSimRes.count || 0;

  const practicalVolume = Math.min((examCount + anamnesisScores.length + osceScores.length + clinicalCount) / 20 * 40, 40);
  const allPracticalScores = [...anamnesisScores, ...osceScores];
  const avgPracticalScore = allPracticalScores.length > 0
    ? allPracticalScores.reduce((a, b) => a + b, 0) / allPracticalScores.length
    : 0;
  const pratica = Math.min(Math.round(practicalVolume + avgExamScore * 0.3 + avgPracticalScore * 0.3), 100);

  // ═══ SCORE FINAL ═══
  const score = Math.max(0, Math.min(100, Math.round(
    cronograma * 0.40 +
    desempenho * 0.35 +
    revisoes * 0.15 +
    pratica * 0.10
  )));

  // ═══ WEEKLY DELTA ═══
  const approvalScores = approvalRes.data || [];
  let weeklyDelta = 0;
  if (approvalScores.length >= 2) {
    const recent = approvalScores[0]?.score || 0;
    // Find score closest to 7 days ago
    const weekAgo = approvalScores.find((s: any) => s.created_at < weekAgoStr) || approvalScores[approvalScores.length - 1];
    weeklyDelta = recent - (weekAgo?.score || 0);
    // Scale delta to match our 0-100 scale
    weeklyDelta = Math.round(weeklyDelta);
  } else {
    // If no historical data, estimate based on activity this week
    const recentAttempts = attempts.filter((a: any) => a.created_at >= weekAgoStr).length;
    weeklyDelta = recentAttempts > 10 ? Math.min(Math.round(recentAttempts / 5), 8) : 0;
  }

  const zone = getZone(score);
  const breakdown: PreparationBreakdown = { cronograma, desempenho, revisoes, pratica };
  const message = generateMessage(zone, breakdown, weeklyDelta);

  const nextInfo = getNextZoneInfo(score);
  const nextGoal = nextInfo
    ? `Faltam ${nextInfo.pointsNeeded} pontos para a zona "${nextInfo.nextZone}"`
    : "Você está na zona mais alta! Mantenha o ritmo.";

  return { score, zone, weeklyDelta, breakdown, message, nextGoal };
}

export function usePreparationIndex() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["preparation-index", user?.id],
    queryFn: () => fetchPreparationIndex(user!.id),
    enabled: !!user,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
