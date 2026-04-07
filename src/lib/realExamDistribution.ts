/**
 * Distribuição de temas por incidência real em provas de residência médica.
 * Baseado em análise de provas ENARE, USP-SP, UNIFESP, SUS-SP (2020-2025).
 */

export interface TopicWeight {
  topic: string;
  weight: number; // percentual 0-100
}

export interface ExamProfile {
  name: string;
  totalQuestions: number;
  timeMinutes: number;
  cutoffEstimate: number; // % de acerto para aprovação (estimativa)
  topicWeights: TopicWeight[];
  difficultyMix: { easy: number; medium: number; hard: number }; // percentuais
}

/** Perfis de provas reais de residência */
export const EXAM_PROFILES: Record<string, ExamProfile> = {
  ENARE: {
    name: "ENARE",
    totalQuestions: 100,
    timeMinutes: 300,
    cutoffEstimate: 62,
    difficultyMix: { easy: 25, medium: 50, hard: 25 },
    topicWeights: [
      { topic: "Clínica Médica", weight: 25 },
      { topic: "Cirurgia", weight: 20 },
      { topic: "Pediatria", weight: 15 },
      { topic: "Ginecologia e Obstetrícia", weight: 15 },
      { topic: "Medicina Preventiva", weight: 10 },
      { topic: "Medicina de Emergência", weight: 10 },
      { topic: "Terapia Intensiva", weight: 5 },
    ],
  },
  "USP-SP": {
    name: "USP-SP",
    totalQuestions: 100,
    timeMinutes: 300,
    cutoffEstimate: 68,
    difficultyMix: { easy: 20, medium: 45, hard: 35 },
    topicWeights: [
      { topic: "Clínica Médica", weight: 25 },
      { topic: "Cirurgia", weight: 20 },
      { topic: "Pediatria", weight: 15 },
      { topic: "Ginecologia e Obstetrícia", weight: 15 },
      { topic: "Medicina Preventiva", weight: 10 },
      { topic: "Medicina de Emergência", weight: 8 },
      { topic: "Ortopedia", weight: 4 },
      { topic: "Oftalmologia", weight: 3 },
    ],
  },
  UNIFESP: {
    name: "UNIFESP",
    totalQuestions: 100,
    timeMinutes: 300,
    cutoffEstimate: 65,
    difficultyMix: { easy: 25, medium: 50, hard: 25 },
    topicWeights: [
      { topic: "Clínica Médica", weight: 25 },
      { topic: "Cirurgia", weight: 20 },
      { topic: "Pediatria", weight: 15 },
      { topic: "Ginecologia e Obstetrícia", weight: 15 },
      { topic: "Medicina Preventiva", weight: 10 },
      { topic: "Medicina de Emergência", weight: 10 },
      { topic: "Psiquiatria", weight: 5 },
    ],
  },
  "SUS-SP": {
    name: "SUS-SP",
    totalQuestions: 100,
    timeMinutes: 300,
    cutoffEstimate: 60,
    difficultyMix: { easy: 30, medium: 50, hard: 20 },
    topicWeights: [
      { topic: "Clínica Médica", weight: 25 },
      { topic: "Cirurgia", weight: 18 },
      { topic: "Pediatria", weight: 15 },
      { topic: "Ginecologia e Obstetrícia", weight: 15 },
      { topic: "Medicina Preventiva", weight: 12 },
      { topic: "Medicina de Emergência", weight: 10 },
      { topic: "Psiquiatria", weight: 5 },
    ],
  },
  REVALIDA: {
    name: "REVALIDA",
    totalQuestions: 100,
    timeMinutes: 300,
    cutoffEstimate: 55,
    difficultyMix: { easy: 30, medium: 50, hard: 20 },
    topicWeights: [
      { topic: "Clínica Médica", weight: 25 },
      { topic: "Cirurgia", weight: 15 },
      { topic: "Pediatria", weight: 15 },
      { topic: "Ginecologia e Obstetrícia", weight: 15 },
      { topic: "Medicina Preventiva", weight: 15 },
      { topic: "Medicina de Emergência", weight: 10 },
      { topic: "Psiquiatria", weight: 5 },
    ],
  },
  GERAL: {
    name: "Prova Geral",
    totalQuestions: 100,
    timeMinutes: 300,
    cutoffEstimate: 60,
    difficultyMix: { easy: 30, medium: 50, hard: 20 },
    topicWeights: [
      { topic: "Clínica Médica", weight: 25 },
      { topic: "Cirurgia", weight: 20 },
      { topic: "Pediatria", weight: 15 },
      { topic: "Ginecologia e Obstetrícia", weight: 15 },
      { topic: "Medicina Preventiva", weight: 10 },
      { topic: "Medicina de Emergência", weight: 10 },
      { topic: "Terapia Intensiva", weight: 5 },
    ],
  },
};

/**
 * Calcula quantas questões de cada tema gerar, proporcional ao total solicitado.
 */
export function calculateTopicDistribution(
  profile: ExamProfile,
  totalQuestions: number
): { topic: string; count: number }[] {
  const raw = profile.topicWeights.map(tw => ({
    topic: tw.topic,
    count: Math.round((tw.weight / 100) * totalQuestions),
  }));

  // Ajusta para total exato
  const sum = raw.reduce((s, r) => s + r.count, 0);
  const diff = totalQuestions - sum;
  if (diff !== 0 && raw.length > 0) {
    // Distribui sobra/falta no maior
    raw.sort((a, b) => b.count - a.count);
    raw[0].count += diff;
  }

  return raw.filter(r => r.count > 0);
}

/**
 * Calcula distribuição de dificuldade com base no perfil.
 */
export function calculateDifficultySlots(
  profile: ExamProfile,
  totalQuestions: number
): { easy: number; medium: number; hard: number } {
  const easy = Math.round((profile.difficultyMix.easy / 100) * totalQuestions);
  const hard = Math.round((profile.difficultyMix.hard / 100) * totalQuestions);
  const medium = totalQuestions - easy - hard;
  return { easy, medium, hard };
}

/**
 * Estima percentil do aluno com base na nota e nota de corte.
 * Modelo simplificado usando distribuição normal.
 */
export function estimatePercentile(score: number, cutoff: number): number {
  // Média estimada dos candidatos: cutoff + 5%
  const mean = cutoff + 5;
  // Desvio padrão estimado: ~15%
  const std = 15;
  // Z-score
  const z = (score - mean) / std;
  // Aproximação da CDF normal (Abramowitz & Stegun)
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  const cdf = z > 0 ? 1 - p : p;
  return Math.min(99, Math.max(1, Math.round(cdf * 100)));
}

/**
 * Calcula nota estimada na escala da banca.
 */
export function estimateGrade(score: number, cutoff: number): {
  grade: string;
  label: string;
  approved: boolean;
  message: string;
} {
  const diff = score - cutoff;
  if (score >= cutoff + 15) {
    return { grade: "A+", label: "Excelente", approved: true, message: "Desempenho muito acima da nota de corte. Aprovação com folga." };
  }
  if (score >= cutoff + 5) {
    return { grade: "A", label: "Muito bom", approved: true, message: "Desempenho acima da nota de corte. Boa chance de aprovação." };
  }
  if (score >= cutoff) {
    return { grade: "B", label: "Aprovado na margem", approved: true, message: "Desempenho próximo à nota de corte. Aprovação possível, mas margem estreita." };
  }
  if (score >= cutoff - 5) {
    return { grade: "C", label: "Abaixo do corte", approved: false, message: "Muito próximo da nota de corte. Foco nas áreas fracas pode virar o jogo." };
  }
  if (score >= cutoff - 15) {
    return { grade: "D", label: "Precisa melhorar", approved: false, message: "Abaixo da nota de corte. Intensifique os estudos nas áreas críticas." };
  }
  return { grade: "F", label: "Insuficiente", approved: false, message: "Desempenho muito abaixo da nota de corte. Revisão completa necessária." };
}
