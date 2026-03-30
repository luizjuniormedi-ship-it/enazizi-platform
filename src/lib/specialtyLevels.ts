/**
 * Specialty Level System
 * Calculates real performance-based levels per medical specialty.
 */

export interface SpecialtyLevel {
  specialty: string;
  level: number; // 0-5
  levelName: string;
  progress: number; // 0-100 progress toward next level
  compositeScore: number; // 0-100
  details: {
    accuracy: number;
    volume: number;
    retention: number;
    consistency: number;
    practical: number;
  };
}

const LEVEL_THRESHOLDS = [0, 15, 30, 50, 70, 85];
const LEVEL_NAMES = [
  "Iniciante",
  "Fundamental",
  "Em evolução",
  "Competente",
  "Avançado",
  "Alto domínio",
];

const CORE_SPECIALTIES = [
  "Clínica Médica",
  "Pediatria",
  "Cirurgia",
  "Ginecologia e Obstetrícia",
  "Medicina Preventiva",
];

export function getLevelFromScore(score: number): { level: number; levelName: string; progress: number } {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (score >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[level];
  const nextThreshold = level < LEVEL_THRESHOLDS.length - 1
    ? LEVEL_THRESHOLDS[level + 1]
    : 100;
  const range = nextThreshold - currentThreshold;
  const progress = range > 0
    ? Math.round(((score - currentThreshold) / range) * 100)
    : 100;

  return {
    level,
    levelName: LEVEL_NAMES[level],
    progress: Math.min(100, Math.max(0, progress)),
  };
}

export function calculateSpecialtyLevel(domain: {
  domain_score: number;
  questions_answered: number;
  correct_answers: number;
  reviews_count: number;
  errors_count: number;
  clinical_cases_score: number;
  specialty: string;
}): SpecialtyLevel {
  // 1. Accuracy (0-100) — 30% weight
  const accuracy = domain.questions_answered > 0
    ? (domain.correct_answers / domain.questions_answered) * 100
    : 0;

  // 2. Volume (0-100) — 20% weight
  // 100 questions = max volume score, with diminishing returns
  const volumeRaw = Math.min(domain.questions_answered / 100, 1) * 100;
  const volume = volumeRaw;

  // 3. Retention (0-100) — 20% weight
  // Based on reviews completed and error recovery
  const reviewScore = Math.min(domain.reviews_count / 20, 1) * 100;
  const errorPenalty = domain.questions_answered > 0
    ? Math.min(domain.errors_count / domain.questions_answered, 0.5) * 40
    : 0;
  const retention = Math.max(0, reviewScore - errorPenalty);

  // 4. Consistency (domain_score from backend) — 15% weight
  const consistency = Math.max(0, Math.min(100, domain.domain_score));

  // 5. Practical (clinical cases) — 15% weight
  const practical = Math.max(0, Math.min(100, domain.clinical_cases_score));

  // Composite with stability: require minimum volume to advance
  const volumeGate = domain.questions_answered >= 5 ? 1 : domain.questions_answered / 5;
  const rawScore =
    accuracy * 0.30 +
    volume * 0.20 +
    retention * 0.20 +
    consistency * 0.15 +
    practical * 0.15;

  const compositeScore = Math.round(rawScore * volumeGate);

  const { level, levelName, progress } = getLevelFromScore(compositeScore);

  return {
    specialty: domain.specialty,
    level,
    levelName,
    progress,
    compositeScore,
    details: {
      accuracy: Math.round(accuracy),
      volume: Math.round(volume),
      retention: Math.round(retention),
      consistency: Math.round(consistency),
      practical: Math.round(practical),
    },
  };
}

export function getLevelColor(level: number): string {
  switch (level) {
    case 0: return "text-muted-foreground";
    case 1: return "text-blue-500";
    case 2: return "text-cyan-500";
    case 3: return "text-emerald-500";
    case 4: return "text-amber-500";
    case 5: return "text-primary";
    default: return "text-muted-foreground";
  }
}

export function getLevelBgColor(level: number): string {
  switch (level) {
    case 0: return "bg-muted";
    case 1: return "bg-blue-500/10";
    case 2: return "bg-cyan-500/10";
    case 3: return "bg-emerald-500/10";
    case 4: return "bg-amber-500/10";
    case 5: return "bg-primary/10";
    default: return "bg-muted";
  }
}

export { CORE_SPECIALTIES, LEVEL_NAMES };
