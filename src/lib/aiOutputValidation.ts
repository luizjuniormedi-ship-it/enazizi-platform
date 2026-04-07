/**
 * Client-side AI output validation layer.
 * Validates AI responses before rendering to the user.
 * Lightweight and fast (<5ms per validation).
 */

// ── Anti-English patterns (same as server-side for consistency) ──

const ENGLISH_PATTERN = /\b(the patient|which of the following|a \d+-year-old|presents with|physical examination|most likely|treatment of choice|year-old male|year-old female|diagnosis is|management of|regarding the|concerning the|correct answer|following statements|all of the following|except which|best describes|chief complaint)\b/i;

const NON_MEDICAL_PATTERN = /(direito|jur[ií]d|penal|constitucional|processo penal|stf|stj|delegad|advogad|pol[ií]cia federal|c[oó]digo penal|engenharia|contabil|economia|administra[cç][aã]o)/i;

const IMAGE_REF_PATTERN = /\b(imagem abaixo|figura abaixo|observe a imagem|na imagem|na figura|radiografia abaixo|ECG abaixo|tomografia abaixo|imagem a seguir|figura a seguir)\b/i;

// ── Types ──

export type AIContentType = "question" | "tutor" | "flashcard" | "discursiva" | "simulado" | "general";

export interface ClientValidationContext {
  specialty?: string;
  topic?: string;
}

export interface ClientValidationResult {
  valid: boolean;
  reason?: string;
}

// ── Main validation function ──

export function validateAIContent(
  content: any,
  context: ClientValidationContext = {},
  type: AIContentType = "general"
): ClientValidationResult {
  if (!content) return { valid: false, reason: "empty" };

  switch (type) {
    case "question":
    case "simulado":
      return validateQuestionClient(content, context);
    case "flashcard":
      return validateFlashcardClient(content);
    case "tutor":
    case "general":
      return validateTextClient(content);
    case "discursiva":
      return validateDiscursivaClient(content);
    default:
      return { valid: true };
  }
}

// ── Question validation ──

function validateQuestionClient(q: any, _ctx: ClientValidationContext): ClientValidationResult {
  const statement = q.statement || q.question || "";

  // Structural validation only — backend already handles content quality filters
  if (!statement || statement.length < 10) {
    return { valid: false, reason: "too_short" };
  }
  if (!Array.isArray(q.options) || q.options.length < 4 || q.options.length > 5) {
    return { valid: false, reason: "invalid_options" };
  }
  if (typeof q.correct_index !== "number" && typeof q.correct !== "number") {
    return { valid: false, reason: "no_correct_answer" };
  }

  return { valid: true };
}

// ── Text validation ──

function validateTextClient(output: any): ClientValidationResult {
  const text = typeof output === "string" ? output : (output.content || output.message || "");
  if (!text || text.trim().length < 5) return { valid: false, reason: "empty" };

  // Check for predominantly English content
  const words = text.split(/\s+/).slice(0, 80);
  const englishStopwords = words.filter((w: string) => /^(the|is|are|was|were|has|have|of|for|with|from|that|this|which|what|where|when|how)$/i.test(w));
  if (words.length > 10 && englishStopwords.length > words.length * 0.25) {
    return { valid: false, reason: "predominantly_english" };
  }

  return { valid: true };
}

// ── Flashcard validation ──

function validateFlashcardClient(fc: any): ClientValidationResult {
  const q = fc.question || fc.pergunta || fc.front || "";
  const a = fc.answer || fc.resposta || fc.back || "";

  if (!q || q.length < 5) return { valid: false, reason: "no_question" };
  if (!a || a.length < 3) return { valid: false, reason: "no_answer" };
  if (ENGLISH_PATTERN.test(q)) return { valid: false, reason: "english_content" };

  return { valid: true };
}

// ── Discursiva validation ──

function validateDiscursivaClient(output: any): ClientValidationResult {
  const caseText = output.case || output.caso || "";
  if (!caseText || caseText.length < 50) return { valid: false, reason: "case_too_short" };
  if (ENGLISH_PATTERN.test(caseText)) return { valid: false, reason: "english_content" };
  return { valid: true };
}

// ── Batch filter for question arrays ──

export function filterValidQuestions<T extends { statement?: string; question?: string; options?: any[] }>(
  questions: T[],
  context: ClientValidationContext = {}
): T[] {
  return questions.filter(q => {
    const result = validateAIContent(q, context, "question");
    if (!result.valid) {
      console.warn(`[AIValidation] Rejected question: ${result.reason} | "${(q.statement || q.question || "").slice(0, 80)}"`);
    }
    return result.valid;
  });
}
