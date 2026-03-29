import type { StudyRecommendation } from "@/lib/studyEngine";

/**
 * Builds the navigation path for a study recommendation,
 * including query params so the target module can auto-start.
 */
export function buildStudyPath(rec: StudyRecommendation): string {
  const params = new URLSearchParams();
  params.set("origin", "guided");

  if (rec.topic) params.set("topic", rec.topic);
  if (rec.specialty) params.set("specialty", rec.specialty);

  switch (rec.targetModule) {
    case "tutor":
      // Tutor auto-starts when topic + specialty are in query
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
