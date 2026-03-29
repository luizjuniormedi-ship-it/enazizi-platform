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

export function adjustPlanByApprovalScore(score: number): PlanWeights {
  if (score < 50) {
    // CRITICAL — heavy review, almost no new content
    return {
      reviewWeight: 0.40,
      theoryWeight: 0.15,
      questionsWeight: 0.35,
      practicalWeight: 0.10,
      maxNewTopics: 1,
      phase: "critico",
    };
  }

  if (score < 70) {
    // ATTENTION — strong reviews + targeted questions
    return {
      reviewWeight: 0.30,
      theoryWeight: 0.15,
      questionsWeight: 0.30,
      practicalWeight: 0.25,
      maxNewTopics: 2,
      phase: "atencao",
    };
  }

  if (score < 85) {
    // COMPETITIVE — more simulations and clinical
    return {
      reviewWeight: 0.20,
      theoryWeight: 0.10,
      questionsWeight: 0.25,
      practicalWeight: 0.45,
      maxNewTopics: 3,
      phase: "competitivo",
    };
  }

  // READY — prioritize exams and maintenance
  return {
    reviewWeight: 0.15,
    theoryWeight: 0.05,
    questionsWeight: 0.20,
    practicalWeight: 0.60,
    maxNewTopics: 2,
    phase: "pronto",
  };
}
