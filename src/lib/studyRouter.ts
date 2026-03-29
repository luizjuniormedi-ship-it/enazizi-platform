import type { StudyRecommendation } from "@/lib/studyEngine";
import {
  type StudyContext,
  type StudySource,
  encodeStudyContext,
  objectiveFromTaskType,
} from "@/lib/studyContext";

/**
 * Build a StudyContext from a StudyRecommendation + source info.
 */
export function buildStudyContext(
  rec: StudyRecommendation,
  source: StudySource = "mission"
): StudyContext {
  return {
    source,
    specialty: rec.specialty,
    topic: rec.topic,
    taskType: rec.type,
    objective: objectiveFromTaskType(rec.type),
    priority: rec.priority,
    reason: rec.reason,
  };
}

/**
 * Builds the navigation path for a study recommendation,
 * including query params so the target module can auto-start.
 */
export function buildStudyPath(
  rec: StudyRecommendation,
  source: StudySource = "mission"
): string {
  const ctx = buildStudyContext(rec, source);
  const params = encodeStudyContext(ctx);

  // Legacy compat params
  params.set("origin", "guided");
  if (rec.topic) params.set("topic", rec.topic);
  if (rec.specialty) params.set("specialty", rec.specialty);

  switch (rec.targetModule) {
    case "tutor":
      return `/dashboard/chatgpt?${params}`;

    case "questoes":
      return `/dashboard/banco-questoes?${params}`;

    case "flashcards":
      return `/dashboard/flashcards?${params}`;

    case "simulado":
      return `/dashboard/simulados?${params}`;

    case "plantao":
      params.set("difficulty", "intermediário");
      return `/dashboard/simulacao-clinica?${params}`;

    case "anamnese":
      params.set("difficulty", "intermediário");
      return `/dashboard/anamnese?${params}`;

    case "banco-erros":
      return `/dashboard/banco-erros?${params}`;

    case "cronograma":
      return `/dashboard/planner?${params}`;

    default:
      return rec.targetPath;
  }
}
