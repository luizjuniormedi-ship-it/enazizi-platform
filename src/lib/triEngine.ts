/**
 * Motor TRI (Teoria de Resposta ao Item) — Modelo Logístico de 3 Parâmetros (3PL)
 *
 * P(θ) = c + (1 - c) / (1 + e^(-a(θ - b)))
 *
 * Onde:
 *   θ = habilidade do aluno (escala: -3 a +3)
 *   a = discriminação do item (tipicamente 0.5 a 2.5)
 *   b = dificuldade do item (mesma escala de θ)
 *   c = probabilidade de acerto ao acaso (chute), ~0.2 para 5 alternativas
 */

export interface TRIParams {
  tri_a: number; // discriminação
  tri_b: number; // dificuldade
  tri_c: number; // chute
}

export interface TRIQuestionResult {
  index: number;
  correct: boolean;
  params: TRIParams;
  probability: number; // P(θ) no momento da resposta
  informationValue: number; // contribuição informacional
}

/** Probabilidade de acerto dado θ e parâmetros TRI */
export function triProbability(theta: number, { tri_a, tri_b, tri_c }: TRIParams): number {
  const exp = Math.exp(-tri_a * (theta - tri_b));
  return tri_c + (1 - tri_c) / (1 + exp);
}

/** Função de informação do item — mede o quão bem o item discrimina naquele θ */
export function itemInformation(theta: number, { tri_a, tri_b, tri_c }: TRIParams): number {
  const p = triProbability(theta, { tri_a, tri_b, tri_c });
  const q = 1 - p;
  if (p <= tri_c || q <= 0) return 0;
  const numerator = tri_a * tri_a * Math.pow(p - tri_c, 2) * q;
  const denominator = Math.pow(1 - tri_c, 2) * p;
  return denominator > 0 ? numerator / denominator : 0;
}

/**
 * Atribui parâmetros TRI a uma questão com base na dificuldade declarada.
 * Em produção esses valores viriam de calibração real; aqui usamos
 * distribuições realistas por nível.
 */
export function assignTRIParams(difficulty: "facil" | "intermediario" | "dificil"): TRIParams {
  const jitter = () => (Math.random() - 0.5) * 0.3;

  switch (difficulty) {
    case "facil":
      return { tri_a: 0.8 + jitter() * 0.4, tri_b: -1.2 + jitter(), tri_c: 0.20 };
    case "intermediario":
      return { tri_a: 1.2 + jitter() * 0.4, tri_b: 0.0 + jitter(), tri_c: 0.20 };
    case "dificil":
      return { tri_a: 1.8 + jitter() * 0.4, tri_b: 1.5 + jitter(), tri_c: 0.20 };
    default:
      return { tri_a: 1.0, tri_b: 0.0, tri_c: 0.20 };
  }
}

/**
 * Estima θ do aluno usando Maximum Likelihood Estimation (MLE)
 * com método de Newton-Raphson.
 */
export function estimateTheta(results: TRIQuestionResult[]): number {
  if (results.length === 0) return 0;

  // Caso todos certos ou todos errados: clamp
  const allCorrect = results.every(r => r.correct);
  const allWrong = results.every(r => !r.correct);
  if (allCorrect) return 2.5;
  if (allWrong) return -2.5;

  let theta = 0; // initial estimate
  const MAX_ITER = 30;
  const TOLERANCE = 0.001;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    let numerator = 0;
    let denominator = 0;

    for (const r of results) {
      const { tri_a, tri_b, tri_c } = r.params;
      const p = triProbability(theta, r.params);
      const q = 1 - p;
      const w = (p - tri_c) / ((1 - tri_c) * p);
      const u = r.correct ? 1 : 0;

      numerator += tri_a * w * (u - p);
      denominator += tri_a * tri_a * w * w * p * q;
    }

    if (Math.abs(denominator) < 1e-10) break;
    const delta = numerator / denominator;
    theta += delta;

    // Clamp θ ∈ [-3, +3]
    theta = Math.max(-3, Math.min(3, theta));

    if (Math.abs(delta) < TOLERANCE) break;
  }

  return Math.round(theta * 100) / 100;
}

/**
 * Calcula θ inicial do aluno baseado em histórico (simulados anteriores, FSRS, etc.)
 */
export function estimateInitialTheta(history: {
  avgAccuracy?: number;      // 0..1, média de acerto em simulados
  totalSimulados?: number;
  fsrsAvgDifficulty?: number; // média de dificuldade FSRS (0..10)
}): number {
  const { avgAccuracy = 0.5, totalSimulados = 0, fsrsAvgDifficulty } = history;

  // Sem histórico: θ = 0 (médio)
  if (totalSimulados === 0 && !fsrsAvgDifficulty) return 0;

  // Mapeamento acurácia → θ (linear interpolation)
  // 0% → -2.5, 50% → 0, 100% → +2.5
  let theta = (avgAccuracy - 0.5) * 5;

  // Ajuste pelo FSRS: dificuldade alta → reduz θ levemente
  if (fsrsAvgDifficulty !== undefined) {
    const fsrsAdjust = (fsrsAvgDifficulty - 5) * 0.1; // -0.5 a +0.5
    theta -= fsrsAdjust;
  }

  // Confiança: com poucos simulados, aproxima do centro
  const confidence = Math.min(1, totalSimulados / 10);
  theta = theta * confidence;

  return Math.max(-3, Math.min(3, Math.round(theta * 100) / 100));
}

/**
 * Calcula nota TRI ponderada (escala 0-1000, tipo ENEM/ENARE)
 */
export function calculateTRIScore(
  theta: number,
  results: TRIQuestionResult[],
): {
  triScore: number;         // 0-1000
  equivalentPct: number;    // 0-100
  itemAnalysis: { index: number; weight: number; impact: number; correct: boolean; topic?: string }[];
} {
  // Mapeia θ [-3,+3] → escala 0-1000 (média 500, DP ~100)
  const triScore = Math.round(500 + (theta / 3) * 250);
  const clampedScore = Math.max(0, Math.min(1000, triScore));

  // Equivalente percentual simples
  const equivalentPct = Math.round((clampedScore / 1000) * 100);

  // Análise por item: peso proporcional à informação
  const totalInfo = results.reduce((s, r) => s + r.informationValue, 0);
  const itemAnalysis = results.map(r => {
    const weight = totalInfo > 0 ? r.informationValue / totalInfo : 1 / results.length;
    // Impacto: quanto esse item contribuiu (+ ou -) para o θ
    const impact = r.correct
      ? weight * (1 - r.probability) // ganhou pontos "difíceis"
      : -weight * r.probability;     // perdeu pontos "fáceis"
    return {
      index: r.index,
      weight: Math.round(weight * 1000) / 1000,
      impact: Math.round(impact * 1000) / 1000,
      correct: r.correct,
    };
  });

  return { triScore: clampedScore, equivalentPct, itemAnalysis };
}

/**
 * Estima nota de corte TRI para uma banca
 */
export function estimateTRICutoff(
  examProfile: string,
  candidatesPerSlot: number = 20,
): { cutoffScore: number; cutoffTheta: number } {
  const cutoffs: Record<string, number> = {
    ENARE: 580,
    "USP-SP": 650,
    UNIFESP: 620,
    "SUS-SP": 540,
    REVALIDA: 500,
    GERAL: 550,
  };

  // Ajuste pela concorrência
  const baseCutoff = cutoffs[examProfile] || 550;
  const competitionBonus = Math.min(50, Math.log2(candidatesPerSlot) * 10);
  const cutoffScore = Math.round(baseCutoff + competitionBonus);
  const cutoffTheta = ((cutoffScore - 500) / 250) * 3;

  return { cutoffScore, cutoffTheta: Math.round(cutoffTheta * 100) / 100 };
}

/**
 * Simula ranking do aluno usando distribuição normal dos candidatos
 */
export function simulateRanking(
  triScore: number,
  examProfile: string,
): {
  percentile: number;
  estimatedPosition: number;
  totalCandidates: number;
  distanceFromCutoff: number;
} {
  const populations: Record<string, number> = {
    ENARE: 35000,
    "USP-SP": 8000,
    UNIFESP: 6000,
    "SUS-SP": 12000,
    REVALIDA: 15000,
    GERAL: 10000,
  };

  const totalCandidates = populations[examProfile] || 10000;

  // Distribuição normal dos candidatos: μ=480, σ=100
  const mu = 480;
  const sigma = 100;
  const z = (triScore - mu) / sigma;

  // CDF normal (Abramowitz & Stegun)
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  const cdf = z > 0 ? 1 - p : p;

  const percentile = Math.min(99, Math.max(1, Math.round(cdf * 100)));
  const estimatedPosition = Math.max(1, Math.round(totalCandidates * (1 - cdf)));

  const { cutoffScore } = estimateTRICutoff(examProfile);
  const distanceFromCutoff = triScore - cutoffScore;

  return { percentile, estimatedPosition, totalCandidates, distanceFromCutoff };
}

/**
 * Diagnóstico TRI: identifica temas críticos com peso ponderado pela informação
 */
export function triDiagnosis(
  results: TRIQuestionResult[],
  topics: string[],
): {
  area: string;
  totalItems: number;
  correctItems: number;
  avgDifficulty: number;
  totalImpact: number;
  criticalLevel: "dominado" | "revisar" | "critico";
}[] {
  const areaMap = new Map<string, {
    items: TRIQuestionResult[];
    topic: string;
  }>();

  results.forEach((r, i) => {
    const topic = topics[i] || "Geral";
    if (!areaMap.has(topic)) areaMap.set(topic, { items: [], topic });
    areaMap.get(topic)!.items.push(r);
  });

  return Array.from(areaMap.values())
    .map(({ topic, items }) => {
      const correctItems = items.filter(i => i.correct).length;
      const avgDifficulty = items.reduce((s, i) => s + i.params.tri_b, 0) / items.length;
      const totalImpact = items.reduce((s, i) => {
        return s + (i.correct ? 0 : -i.informationValue);
      }, 0);
      const pct = (correctItems / items.length) * 100;

      return {
        area: topic,
        totalItems: items.length,
        correctItems,
        avgDifficulty: Math.round(avgDifficulty * 100) / 100,
        totalImpact: Math.round(totalImpact * 100) / 100,
        criticalLevel: pct >= 80 ? "dominado" as const : pct >= 60 ? "revisar" as const : "critico" as const,
      };
    })
    .sort((a, b) => a.totalImpact - b.totalImpact); // mais impacto negativo primeiro
}
