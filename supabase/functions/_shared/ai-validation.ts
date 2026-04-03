/**
 * Global AI output validation layer for edge functions.
 * Validates language, structure, context and coherence of all AI outputs.
 */

// ── Anti-English patterns ──

const ENGLISH_PATTERN = /\b(the patient|which of the following|a \d+-year-old|presents with|physical examination|most likely|treatment of choice|year-old male|year-old female|diagnosis is|management of|regarding the|concerning the|history of presenting|laboratory findings|clinical presentation|what is the|correct answer|following statements|chest x-ray shows|blood pressure is|heart rate is|all of the following|except which|best describes|chief complaint|past medical history|social history|family history|review of systems|upon examination)\b/i;

const NON_MEDICAL_PATTERN = /(direito|jur[ií]d|penal|constitucional|processo penal|stf|stj|delegad|advogad|pol[ií]cia federal|c[oó]digo penal|inform[aá]tica|tecnologia da informa[cç][aã]o|engenharia|contabil|economia|administra[cç][aã]o)/i;

const IMAGE_REF_PATTERN = /\b(imagem abaixo|figura abaixo|observe a imagem|na imagem|na figura|texto abaixo|radiografia abaixo|ECG abaixo|tomografia abaixo|observe a figura|imagem a seguir|figura a seguir|vide imagem|conforme a imagem|conforme a figura)\b/i;

// ── Types ──

export type AIOutputType = "question" | "tutor" | "flashcard" | "discursiva" | "simulado" | "general";

export interface ValidationContext {
  specialty?: string;
  topic?: string;
  subtopic?: string;
  language?: string;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  details?: string;
}

// ── Core validation function ──

export function validateAIOutput(
  output: any,
  context: ValidationContext,
  type: AIOutputType
): ValidationResult {
  if (!output) return { valid: false, reason: "empty_output" };

  switch (type) {
    case "question":
    case "simulado":
      return validateQuestion(output, context);
    case "tutor":
    case "general":
      return validateTextOutput(output, context);
    case "flashcard":
      return validateFlashcard(output, context);
    case "discursiva":
      return validateDiscursiva(output, context);
    default:
      return validateTextOutput(output, context);
  }
}

// ── Question validation ──

function validateQuestion(q: any, ctx: ValidationContext): ValidationResult {
  const statement = typeof q === "string" ? q : (q.statement || q.question || "");
  const options = q.options || [];
  const correctIndex = q.correct_index ?? q.correctIndex;

  // Language check
  if (ENGLISH_PATTERN.test(statement)) {
    return { valid: false, reason: "english_content", details: "Questão contém termos em inglês" };
  }

  // Non-medical check
  if (NON_MEDICAL_PATTERN.test(statement)) {
    return { valid: false, reason: "non_medical_content", details: "Questão fora do escopo médico" };
  }

  // Image reference check
  if (IMAGE_REF_PATTERN.test(statement)) {
    return { valid: false, reason: "image_reference", details: "Questão referencia imagem/figura indisponível" };
  }

  // Structure check
  if (!statement || statement.length < 50) {
    return { valid: false, reason: "statement_too_short", details: `Enunciado com ${statement.length} chars (mín: 50)` };
  }

  if (Array.isArray(options)) {
    if (options.length < 4 || options.length > 5) {
      return { valid: false, reason: "invalid_options_count", details: `${options.length} alternativas (esperado: 4-5)` };
    }
    if (typeof correctIndex === "number" && (correctIndex < 0 || correctIndex >= options.length)) {
      return { valid: false, reason: "invalid_correct_index" };
    }
  }

  // Specialty match (loose)
  if (ctx.specialty) {
    const specLower = ctx.specialty.toLowerCase();
    const isBroad = ["clínica médica", "clinica medica", "medicina"].some(s => specLower.includes(s));
    if (!isBroad) {
      const qTopic = (q.topic || "").toLowerCase();
      const stmtLower = statement.toLowerCase();
      const specWords = specLower.split(/\s+/).filter((w: string) => w.length > 3);
      const matches = specWords.some((w: string) => qTopic.includes(w) || stmtLower.includes(w));
      if (!matches) {
        return { valid: false, reason: "specialty_mismatch", details: `Esperado: ${ctx.specialty}, encontrado: ${q.topic || "?"}` };
      }
    }
  }

  return { valid: true };
}

// ── Text output validation (tutor, general) ──

function validateTextOutput(output: any, ctx: ValidationContext): ValidationResult {
  const text = typeof output === "string" ? output : (output.content || output.message || JSON.stringify(output));

  if (!text || text.trim().length < 10) {
    return { valid: false, reason: "empty_or_too_short" };
  }

  // Check if predominantly English (>50% English patterns)
  const words = text.split(/\s+/).slice(0, 100);
  const englishWords = words.filter((w: string) => /^(the|is|are|was|were|has|have|had|will|would|should|could|can|may|of|for|with|from|into|that|this|which|what|where|when|how|who|whom|whose)$/i.test(w));
  if (englishWords.length > words.length * 0.3) {
    return { valid: false, reason: "predominantly_english", details: `${englishWords.length}/${words.length} palavras em inglês` };
  }

  // Non-medical check
  if (NON_MEDICAL_PATTERN.test(text)) {
    return { valid: false, reason: "non_medical_content" };
  }

  return { valid: true };
}

// ── Flashcard validation ──

function validateFlashcard(fc: any, ctx: ValidationContext): ValidationResult {
  const question = fc.question || fc.pergunta || fc.front || "";
  const answer = fc.answer || fc.resposta || fc.back || "";

  if (!question || question.length < 10) {
    return { valid: false, reason: "flashcard_no_question" };
  }
  if (!answer || answer.length < 5) {
    return { valid: false, reason: "flashcard_no_answer" };
  }

  if (ENGLISH_PATTERN.test(question) || ENGLISH_PATTERN.test(answer)) {
    return { valid: false, reason: "english_content" };
  }

  if (NON_MEDICAL_PATTERN.test(question)) {
    return { valid: false, reason: "non_medical_content" };
  }

  return { valid: true };
}

// ── Discursiva validation ──

function validateDiscursiva(output: any, ctx: ValidationContext): ValidationResult {
  const caseText = output.case || output.caso || "";
  const questions = output.questions || [];

  if (!caseText || caseText.length < 100) {
    return { valid: false, reason: "discursiva_case_too_short" };
  }

  if (!Array.isArray(questions) || questions.length < 1) {
    return { valid: false, reason: "discursiva_no_questions" };
  }

  if (ENGLISH_PATTERN.test(caseText)) {
    return { valid: false, reason: "english_content" };
  }

  if (NON_MEDICAL_PATTERN.test(caseText)) {
    return { valid: false, reason: "non_medical_content" };
  }

  return { valid: true };
}

// ── Batch validation (for arrays of questions) ──

export function validateQuestionBatch(
  questions: any[],
  context: ValidationContext
): { valid: any[]; rejected: Array<{ question: any; reason: string }> } {
  const valid: any[] = [];
  const rejected: Array<{ question: any; reason: string }> = [];

  for (const q of questions) {
    const result = validateAIOutput(q, context, "question");
    if (result.valid) {
      valid.push(q);
    } else {
      rejected.push({ question: q, reason: result.reason || "unknown" });
      logValidationRejection("question", result.reason || "unknown", context, q.statement?.slice(0, 100) || "");
    }
  }

  return { valid, rejected };
}

// ── Structured logging ──

export function logValidationRejection(
  type: AIOutputType,
  reason: string,
  context: ValidationContext,
  snippet: string
): void {
  console.warn(JSON.stringify({
    event: "ai_validation_rejection",
    type,
    reason,
    specialty: context.specialty || "?",
    topic: context.topic || "?",
    snippet: snippet.slice(0, 120),
    timestamp: new Date().toISOString(),
  }));
}
