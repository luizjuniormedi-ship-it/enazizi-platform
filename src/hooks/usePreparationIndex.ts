import { useMemo } from "react";
import { useCoreData, CoreDataResult } from "./useCoreData";

export interface PreparationBreakdown {
  cronograma: number;
  desempenho: number;
  revisoes: number;
  pratica: number;
}

export type PreparationZone = "base_fraca" | "em_construcao" | "competitivo" | "forte";

export interface PreparationIndexData {
  score: number;
  zone: PreparationZone;
  weeklyDelta: number;
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

function calculateFromCoreData(cd: CoreDataResult): PreparationIndexData {
  const weekAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  // ═══ CRONOGRAMA (40%) ═══
  const TOTAL_CURRICULUM = 338; // matches curriculum_matrix total
  const cronograma = Math.min(Math.round((cd.temasCount / TOTAL_CURRICULUM) * 100), 100);

  // ═══ DESEMPENHO (35%) ═══
  const attempts = cd.practiceAttempts;
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter(a => a.correct).length;
  const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
  const volumeBonus = Math.min((totalAttempts / 500) * 20, 20);
  const desempenho = Math.min(Math.round(accuracy * 0.8 + volumeBonus), 100);

  // ═══ REVISÕES (15%) ═══
  const allRevisoes = cd.revisoes;
  const totalRevisoes = allRevisoes.length;
  const pendentes = allRevisoes.filter(r => r.status === "pendente").length;
  const concluidas = allRevisoes.filter(r => r.status === "concluida").length;
  let revisoes = 0;
  if (totalRevisoes > 0) {
    const completionRate = (concluidas / totalRevisoes) * 100;
    const pendingPenalty = Math.min(pendentes * 2, 40);
    revisoes = Math.max(0, Math.min(Math.round(completionRate - pendingPenalty), 100));
  }

  // ═══ PRÁTICA (10%) ═══
  const examSessions = cd.examSessions;
  const examCount = examSessions.length;
  const avgExamScore = examCount > 0
    ? examSessions.reduce((s, e) => s + (e.score || 0), 0) / examCount : 0;

  const anamnesisScores = cd.anamnesisResults.map(a => a.final_score || 0);
  const osceScores = cd.osceScores.map(o => o.score || 0);
  const clinicalCount = cd.simulationSessionsCount;

  const practicalVolume = Math.min((examCount + anamnesisScores.length + osceScores.length + clinicalCount) / 20 * 40, 40);
  const allPracticalScores = [...anamnesisScores, ...osceScores];
  const avgPracticalScore = allPracticalScores.length > 0
    ? allPracticalScores.reduce((a, b) => a + b, 0) / allPracticalScores.length : 0;
  const pratica = Math.min(Math.round(practicalVolume + avgExamScore * 0.3 + avgPracticalScore * 0.3), 100);

  // ═══ SCORE FINAL ═══
  const score = Math.max(0, Math.min(100, Math.round(
    cronograma * 0.40 + desempenho * 0.35 + revisoes * 0.15 + pratica * 0.10
  )));

  // ═══ WEEKLY DELTA ═══
  const approvalScores = cd.approvalScores;
  let weeklyDelta = 0;
  if (approvalScores.length >= 2) {
    const recent = approvalScores[0]?.score || 0;
    const weekAgo = approvalScores.find(s => s.created_at < weekAgoStr) || approvalScores[approvalScores.length - 1];
    weeklyDelta = Math.round(recent - (weekAgo?.score || 0));
  } else {
    const recentAttempts = attempts.filter(a => a.created_at >= weekAgoStr).length;
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
  const { data: coreData, isLoading, error } = useCoreData();

  const data = useMemo(() => {
    if (!coreData) return undefined;
    return calculateFromCoreData(coreData);
  }, [coreData]);

  return { data, isLoading, error, isError: !!error };
}
