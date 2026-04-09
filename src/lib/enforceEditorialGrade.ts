export type EditorialGrade = "excellent" | "good" | "weak";

export interface EditorialContext {
  questionId?: string;
  source?: string;
}

export interface QuestionWithEditorial {
  id?: string;
  statement?: string;
  editorial_grade?: string | null;
  _editorialAutoAssigned?: boolean;
  _editorialCorrected?: boolean;
  [key: string]: unknown;
}

export const ALLOWED_EDITORIAL_GRADES: ReadonlyArray<EditorialGrade> = [
  "excellent",
  "good",
  "weak",
];

function isValidEditorialGrade(value: unknown): value is EditorialGrade {
  return (
    typeof value === "string" &&
    ALLOWED_EDITORIAL_GRADES.includes(value as EditorialGrade)
  );
}

export function enforceEditorialGrade(
  q: QuestionWithEditorial,
  context: EditorialContext = {}
): QuestionWithEditorial & { editorial_grade: EditorialGrade } {
  const questionId = context.questionId ?? q.id ?? null;
  const source = context.source ?? "unknown";

  if (!q.editorial_grade || q.editorial_grade.trim() === "") {
    console.error("[EDITORIAL_GRADE_MISSING]", {
      questionId,
      source,
      statement_preview: (q.statement ?? "").slice(0, 120),
    });
    q.editorial_grade = "good";
    q._editorialAutoAssigned = true;
  } else if (!isValidEditorialGrade(q.editorial_grade)) {
    console.error("[EDITORIAL_GRADE_INVALID]", {
      value: q.editorial_grade,
      questionId,
      source,
    });
    q.editorial_grade = "good";
    q._editorialCorrected = true;
  }

  return q as QuestionWithEditorial & { editorial_grade: EditorialGrade };
}
