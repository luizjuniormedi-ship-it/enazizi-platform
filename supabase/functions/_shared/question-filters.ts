/**
 * Shared filters for question quality enforcement across all edge functions.
 */

/** Rejects questions that reference images/figures we cannot display */
export const IMAGE_REF_PATTERN = /\b(imagem abaixo|figura abaixo|observe a imagem|na imagem|na figura|texto abaixo|radiografia abaixo|fotografia|ECG abaixo|tomografia abaixo|observe o gráfico|observe a figura|observe a foto|imagem a seguir|figura a seguir|vide imagem|conforme a imagem|conforme a figura|de acordo com a imagem|de acordo com a figura)\b/i;

/** Rejects English-language questions */
export const ENGLISH_PATTERN = /\b(the patient|which of the following|a \d+-year-old|presents with|physical examination|most likely|treatment of choice|year-old male|year-old female|diagnosis|management|regarding|concerning|history of|laboratory findings|clinical presentation|what is the|correct answer|following statements|chest x-ray shows|blood pressure|heart rate)\b/i;

/** Validates a question meets minimum quality standards */
export function isValidQuestion(q: { statement?: string; options?: any[]; correct_index?: number }): boolean {
  if (!q.statement || !Array.isArray(q.options) || typeof q.correct_index !== "number") return false;
  if (q.statement.length < 400) return false;
  if (q.options.length < 4 || q.options.length > 5) return false;
  if (IMAGE_REF_PATTERN.test(q.statement)) return false;
  if (ENGLISH_PATTERN.test(q.statement)) return false;
  return true;
}

/** Checks if statement has minimum clinical context (age/time pattern + length) */
export function hasMinimumContext(statement: string): boolean {
  if (!statement || statement.length < 400) return false;
  return /\d+\s*(anos?|meses|dias|horas|semanas)/i.test(statement);
}
