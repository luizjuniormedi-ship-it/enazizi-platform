/**
 * ENAZIZI — Enforce Editorial Grade
 * Garante que toda questão tenha editorial_grade válido antes de ser servida ou salva.
 */

export function enforceEditorialGrade(
  q: any,
  context: { questionId?: string; source?: string } = {}
): any {
  if (!q.editorial_grade) {
    console.error("[EDITORIAL_GRADE_MISSING]", {
      questionId: context?.questionId || null,
      source: context?.source || "unknown",
      statement_preview: (q.statement || "").slice(0, 120),
    });
    q.editorial_grade = "good";
    q._editorialAutoAssigned = true;
  }

  if (!["excellent", "good"].includes(q.editorial_grade)) {
    console.error("[EDITORIAL_GRADE_INVALID]", {
      value: q.editorial_grade,
      questionId: context?.questionId || null,
    });
    q.editorial_grade = "good";
    q._editorialCorrected = true;
  }

  return q;
}
