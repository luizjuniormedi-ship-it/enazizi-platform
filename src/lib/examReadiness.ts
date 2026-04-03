/**
 * Exam Readiness Calculator
 * Estimates approval chance per target exam/banca based on real user data.
 */

import { EXAM_PROFILES, type ExamProfile, getExamProfile } from "./examProfiles";

export type ReadinessLabel = "muito_baixa" | "em_construcao" | "competitiva" | "alta";

export interface ExamReadiness {
  examKey: string;
  examName: string;
  readinessScore: number; // 0-100
  readinessLabel: ReadinessLabel;
  insight: string;
  strongAreas: string[];
  weakAreas: string[];
  /** What's helping most */
  topPositive: string;
  /** What's dragging score down */
  topNegative: string;
}

export interface ReadinessInput {
  approvalScore: number;
  accuracyBySpecialty: Record<string, { correct: number; total: number }>;
  simuladoScores: number[]; // last N scores (0-100)
  practicalScores: number[]; // OSCE/anamnesis scores (0-100)
  overdueReviews: number;
  totalQuestionsAnswered: number;
  streak: number;
  recentAccuracy: number; // last 50 questions accuracy %
}

function getLabel(score: number): ReadinessLabel {
  if (score < 35) return "muito_baixa";
  if (score < 55) return "em_construcao";
  if (score < 75) return "competitiva";
  return "alta";
}

const LABEL_PT: Record<ReadinessLabel, string> = {
  muito_baixa: "Muito baixa",
  em_construcao: "Em construção",
  competitiva: "Competitiva",
  alta: "Alta",
};

export function getLabelText(label: ReadinessLabel): string {
  return LABEL_PT[label];
}

/**
 * Calculate readiness for a single exam profile
 */
export function calculateExamReadiness(
  input: ReadinessInput,
  examKey: string,
): ExamReadiness {
  const profile = getExamProfile(examKey);
  const weights = profile.specialtyWeights;

  // 1. Weighted accuracy by banca specialty emphasis (35%)
  let weightedAcc = 0;
  let totalWeight = 0;
  const strongAreas: string[] = [];
  const weakAreas: string[] = [];

  for (const [spec, weight] of Object.entries(weights)) {
    const data = input.accuracyBySpecialty[spec];
    if (data && data.total >= 3) {
      const acc = (data.correct / data.total) * 100;
      weightedAcc += acc * (weight / 100);
      totalWeight += weight / 100;
      if (acc >= 70) strongAreas.push(spec);
      else if (acc < 50) weakAreas.push(spec);
    }
  }
  const specScore = totalWeight > 0 ? weightedAcc / totalWeight : input.approvalScore;

  // 2. Base approval score component (25%)
  const baseScore = input.approvalScore;

  // 3. Simulado performance adjusted by difficulty (15%)
  const simAvg = input.simuladoScores.length > 0
    ? input.simuladoScores.reduce((a, b) => a + b, 0) / input.simuladoScores.length
    : 0;
  // Harder bancas penalize more if sim scores are low
  const difficultyPenalty = (profile.difficulty - 3) * 3; // -6 to +6
  const simScore = Math.max(0, simAvg - difficultyPenalty);

  // 4. Practical performance for OSCE-heavy bancas (10%)
  const practAvg = input.practicalScores.length > 0
    ? input.practicalScores.reduce((a, b) => a + b, 0) / input.practicalScores.length
    : 0;
  const practicalMultiplier = profile.osceEmphasis ? 1.3 : 0.7;
  const practScore = practAvg * practicalMultiplier;

  // 5. Consistency & volume (10%)
  const volumeScore = Math.min((input.totalQuestionsAnswered / 500) * 100, 100);
  const streakBonus = Math.min(input.streak * 2, 20);
  const consistencyScore = Math.min(volumeScore * 0.7 + streakBonus + input.recentAccuracy * 0.1, 100);

  // 6. Review penalty (5%)
  const reviewPenalty = Math.min(input.overdueReviews * 2, 30);

  // Combine
  const raw =
    specScore * 0.35 +
    baseScore * 0.25 +
    simScore * 0.15 +
    Math.min(practScore, 100) * 0.10 +
    consistencyScore * 0.10 -
    reviewPenalty * 0.05;

  const readinessScore = Math.max(0, Math.min(100, Math.round(raw)));
  const readinessLabel = getLabel(readinessScore);

  // Generate insight
  const insight = generateInsight(profile, input, strongAreas, weakAreas, readinessScore);

  // Top positive/negative
  const factors: { label: string; value: number }[] = [
    { label: "Acurácia por especialidade", value: specScore },
    { label: "Score de aprovação geral", value: baseScore },
    { label: "Simulados", value: simScore },
    { label: "Prática clínica", value: Math.min(practScore, 100) },
    { label: "Consistência e volume", value: consistencyScore },
  ];
  factors.sort((a, b) => b.value - a.value);
  const topPositive = factors[0]?.label || "Estudo consistente";
  const topNegative = factors[factors.length - 1]?.label || "Volume de questões";

  return {
    examKey,
    examName: profile.label,
    readinessScore,
    readinessLabel,
    insight,
    strongAreas: strongAreas.slice(0, 3),
    weakAreas: weakAreas.slice(0, 3),
    topPositive,
    topNegative,
  };
}

function generateInsight(
  profile: ExamProfile,
  input: ReadinessInput,
  strongAreas: string[],
  weakAreas: string[],
  score: number,
): string {
  if (input.totalQuestionsAnswered < 30) {
    return `Continue praticando para termos dados suficientes sobre sua preparação para ${profile.label}.`;
  }

  if (score >= 75 && strongAreas.length >= 2) {
    const top = strongAreas[0];
    return `Seu desempenho em ${top} fortalece sua chance na ${profile.label}.`;
  }

  if (input.overdueReviews > 10) {
    return `Revisões pendentes estão reduzindo sua projeção para ${profile.label}.`;
  }

  if (weakAreas.length >= 2) {
    return `Foque em ${weakAreas.slice(0, 2).join(" e ")} para melhorar na ${profile.label}.`;
  }

  if (input.simuladoScores.length === 0) {
    return `Faça simulados para refinar sua projeção na ${profile.label}.`;
  }

  if (profile.osceEmphasis && input.practicalScores.length === 0) {
    return `A ${profile.label} cobra prova prática — pratique OSCE e anamnese.`;
  }

  return `Seu bom volume de questões favorece sua preparação para ${profile.label}.`;
}

/**
 * Calculate readiness for all target exams
 */
export function calculateAllExamReadiness(
  input: ReadinessInput,
  targetExams: string[],
): ExamReadiness[] {
  if (!targetExams || targetExams.length === 0) return [];
  return targetExams.map((key) => calculateExamReadiness(input, key));
}
