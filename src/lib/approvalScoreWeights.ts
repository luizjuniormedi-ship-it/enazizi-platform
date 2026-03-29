/**
 * adjustPlanByApprovalScore
 *
 * Outputs weights and limits that shape the daily plan based on the
 * student's current approval readiness score (0-100).
 *
 * Usable both client-side (studyEngine) and server-side (edge function).
 */

export interface PlanWeights {
  /** 0-1  fraction of daily time spent on reviews */
  reviewWeight: number;
  /** 0-1  fraction for theory / tutor */
  theoryWeight: number;
  /** 0-1  fraction for questions / error correction */
  questionsWeight: number;
  /** 0-1  fraction for clinical practice (plantão, anamnese, OSCE) */
  practicalWeight: number;
  /** max new topics allowed per day */
  maxNewTopics: number;
  /** descriptive label */
  phase: "critico" | "atencao" | "competitivo" | "pronto";
}

/** Human-readable adaptive mode info for Dashboard/Mission */
export interface AdaptiveMode {
  phase: PlanWeights["phase"];
  label: string;
  description: string;
  focusAreas: string[];
  icon: string;
}

const ADAPTIVE_MODES: Record<PlanWeights["phase"], Omit<AdaptiveMode, "phase">> = {
  critico: {
    label: "Modo Recuperação",
    description: "Foco em revisões e correção de erros para recuperar sua base.",
    focusAreas: ["Revisões prioritárias", "Correção de erros", "Reforço com Tutor IA"],
    icon: "🔴",
  },
  atencao: {
    label: "Modo Estabilização",
    description: "Fortalecendo áreas fracas e mantendo revisões em dia.",
    focusAreas: ["Revisões consistentes", "Questões direcionadas", "Conteúdo controlado"],
    icon: "🟡",
  },
  competitivo: {
    label: "Modo Competitivo",
    description: "Refinando desempenho com simulados e prática clínica.",
    focusAreas: ["Simulados realistas", "Prática clínica", "Temas de alto rendimento"],
    icon: "🟢",
  },
  pronto: {
    label: "Modo Prova",
    description: "Manutenção e pressão simulada para o dia da prova.",
    focusAreas: ["Simulados completos", "Cenários práticos", "Questões de alta dificuldade"],
    icon: "🏆",
  },
};

export function getAdaptiveMode(phase: PlanWeights["phase"]): AdaptiveMode {
  return { phase, ...ADAPTIVE_MODES[phase] };
}

export function adjustPlanByApprovalScore(score: number): PlanWeights {
  if (score < 50) {
    // ZONE A — CRÍTICO: recover foundation
    return {
      reviewWeight: 0.55,
      theoryWeight: 0.20,
      questionsWeight: 0.20,
      practicalWeight: 0.05,
      maxNewTopics: 1,
      phase: "critico",
    };
  }

  if (score < 70) {
    // ZONE B — ATENÇÃO: repair and stabilize
    return {
      reviewWeight: 0.40,
      theoryWeight: 0.20,
      questionsWeight: 0.25,
      practicalWeight: 0.15,
      maxNewTopics: 2,
      phase: "atencao",
    };
  }

  if (score < 85) {
    // ZONE C — COMPETITIVO: refine and increase realism
    return {
      reviewWeight: 0.25,
      theoryWeight: 0.20,
      questionsWeight: 0.30,
      practicalWeight: 0.25,
      maxNewTopics: 3,
      phase: "competitivo",
    };
  }

  // ZONE D — PRONTO: maintain sharpness
  return {
    reviewWeight: 0.20,
    theoryWeight: 0.10,
    questionsWeight: 0.35,
    practicalWeight: 0.35,
    maxNewTopics: 2,
    phase: "pronto",
  };
}
