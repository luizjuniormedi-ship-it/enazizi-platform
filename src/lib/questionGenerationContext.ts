/**
 * Camada de controle de contexto para geração de questões.
 * Garante que toda geração tenha specialty, topic e language definidos.
 */

export type QuestionObjective = "review" | "correction" | "reinforcement" | "new_content" | "practice";
export type QuestionDifficulty = "easy" | "medium" | "hard" | "mixed";
export type StudentLevel = "iniciante" | "intermediario" | "avancado";

export interface QuestionGenerationContext {
  specialty: string;
  topic: string;
  subtopic?: string;
  objective: QuestionObjective;
  difficulty: QuestionDifficulty;
  studentLevel?: StudentLevel;
  language: "pt-BR";
  source?: string;
}

const SAFE_FALLBACK: QuestionGenerationContext = {
  specialty: "Clínica Médica",
  topic: "Clínica Médica Geral",
  objective: "practice",
  difficulty: "medium",
  language: "pt-BR",
  source: "fallback",
};

/**
 * Build a generation context from available data, with fallback chain:
 * 1. Explicit params (specialty/topic)
 * 2. Safe fallback (Clínica Médica)
 */
export function buildGenerationContext(params?: {
  specialty?: string;
  topic?: string;
  subtopic?: string;
  objective?: QuestionObjective;
  difficulty?: QuestionDifficulty;
  studentLevel?: StudentLevel;
  source?: string;
}): QuestionGenerationContext {
  const specialty = params?.specialty?.trim() || SAFE_FALLBACK.specialty;
  const topic = params?.topic?.trim() || params?.specialty?.trim() || SAFE_FALLBACK.topic;

  return {
    specialty,
    topic,
    subtopic: params?.subtopic?.trim() || undefined,
    objective: params?.objective || "practice",
    difficulty: params?.difficulty || "medium",
    studentLevel: params?.studentLevel,
    language: "pt-BR",
    source: params?.source || (params?.specialty ? "explicit" : "fallback"),
  };
}

/**
 * Validates that a context has the minimum required fields.
 * Returns true if valid, false if it should be rejected.
 */
export function validateContextBeforeGeneration(ctx: QuestionGenerationContext): boolean {
  if (!ctx.specialty || ctx.specialty.length < 2) return false;
  if (!ctx.topic || ctx.topic.length < 2) return false;
  if (ctx.language !== "pt-BR") return false;
  return true;
}

// ── Post-generation validation ──

const ENGLISH_QUESTION_PATTERN = /\b(the patient|which of the following|a \d+-year-old|presents with|physical examination|most likely|treatment of choice|year-old male|year-old female|diagnosis is|management of|regarding the|concerning the|history of presenting|laboratory findings|clinical presentation|what is the|correct answer|following statements|chest x-ray shows|blood pressure is|heart rate is|all of the following|except which|best describes)\b/i;

const IMAGE_REF_PATTERN = /\b(imagem abaixo|figura abaixo|observe a imagem|na imagem|na figura|texto abaixo|radiografia abaixo|fotografia|ECG abaixo|tomografia abaixo|observe o gráfico|observe a figura|observe a foto|imagem a seguir|figura a seguir|vide imagem|conforme a imagem|conforme a figura|de acordo com a imagem|de acordo com a figura)\b/i;

export interface GeneratedQuestion {
  statement?: string;
  options?: any[];
  correct_index?: number;
  topic?: string;
  explanation?: string;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate a generated question against the expected context.
 * Returns { valid: true } or { valid: false, reason: "..." }.
 */
export function validateQuestionContext(
  question: GeneratedQuestion,
  expectedContext: QuestionGenerationContext
): ValidationResult {
  const statement = question.statement || "";
  const topic = question.topic || "";
  const fullText = `${statement} ${topic} ${question.explanation || ""} ${(question.options || []).join(" ")}`;

  // A. Language check — reject English content
  if (ENGLISH_QUESTION_PATTERN.test(statement)) {
    return { valid: false, reason: "english_content" };
  }

  // B. Image reference check
  if (IMAGE_REF_PATTERN.test(statement)) {
    return { valid: false, reason: "image_reference" };
  }

  // C. Structure check
  if (!statement || statement.length < 50) {
    return { valid: false, reason: "statement_too_short" };
  }
  if (!Array.isArray(question.options) || question.options.length < 4 || question.options.length > 5) {
    return { valid: false, reason: "invalid_options_count" };
  }
  if (typeof question.correct_index !== "number" || question.correct_index < 0 || question.correct_index >= question.options.length) {
    return { valid: false, reason: "invalid_correct_index" };
  }

  // D. Specialty/topic match (loose — the topic field should mention the expected specialty)
  const expectedSpecLower = expectedContext.specialty.toLowerCase();
  const topicLower = topic.toLowerCase();
  const statementLower = statement.toLowerCase();

  // Skip topic match for very broad specialties like "Clínica Médica"
  const isBroadSpecialty = ["clínica médica", "clinica medica", "medicina"].some(s => expectedSpecLower.includes(s));
  if (!isBroadSpecialty) {
    // Check if either topic or statement mentions the expected specialty
    const specWords = expectedSpecLower.split(/\s+/).filter(w => w.length > 3);
    const matchesSpec = specWords.some(w => topicLower.includes(w) || statementLower.includes(w));
    if (!matchesSpec) {
      return { valid: false, reason: "specialty_mismatch" };
    }
  }

  return { valid: true };
}

/**
 * Log a generation rejection for debugging.
 */
export function logGenerationRejection(
  reason: string,
  expected: { specialty: string; topic: string },
  snippet: string
): void {
  console.warn(`[QuestionFilter] REJECTED | reason=${reason} | expected=${expected.specialty}/${expected.topic} | snippet="${snippet.slice(0, 100)}"`);
}
