/**
 * Validação de conteúdo genérica parametrizada por domínio.
 * Substitui medicalValidation.ts para suportar múltiplos domínios.
 * 
 * COMPATIBILIDADE: Exporta as mesmas funções que medicalValidation.ts
 * para que os imports existentes continuem funcionando.
 */

import { getDomainConfig, type DomainConfig } from "./domainConfig";

// ── Heurística anti-inglês (mantida global) ──────────────────────
export const ENGLISH_QUESTION_REGEX = /\b(the|which|following|patient|diagnosis|treatment|management|most likely|except|all of the following|correct answer|best option)\b/i;

// ── Validação parametrizada por domínio ──────────────────────────

export function isDomainContent(text: string, domainSlug?: string | null): boolean {
  const config = getDomainConfig(domainSlug);
  const matchesDomain = config.contentRegex.test(text);
  const isOffTopic = config.offTopicRegex ? config.offTopicRegex.test(text) : false;
  return matchesDomain && !isOffTopic;
}

export function isDomainQuestion(
  q: { statement?: string; topic?: string; explanation?: string; options?: string[] },
  domainSlug?: string | null
): boolean {
  const text = `${q.topic || ""} ${q.statement || ""} ${q.explanation || ""} ${(q.options || []).join(" ")}`;
  return isDomainContent(text, domainSlug);
}

export function isPortugueseDomainQuestion(
  q: { statement?: string; topic?: string; explanation?: string; options?: string[] },
  domainSlug?: string | null
): boolean {
  const text = `${q.topic || ""} ${q.statement || ""} ${q.explanation || ""} ${(q.options || []).join(" ")}`;
  return isDomainQuestion(q, domainSlug) && !ENGLISH_QUESTION_REGEX.test(text);
}

// ── Backward compatibility (medicina como default) ───────────────
// Esses exports garantem que os imports existentes de medicalValidation
// continuem funcionando sem quebrar nada.

export const NON_MEDICAL_CONTENT_REGEX = getDomainConfig("medicina").offTopicRegex!;
export const MEDICAL_CONTENT_REGEX = getDomainConfig("medicina").contentRegex;

export function isMedicalContent(text: string): boolean {
  return isDomainContent(text, "medicina");
}

export function isMedicalQuestion(q: { statement?: string; topic?: string; explanation?: string; options?: string[] }): boolean {
  return isDomainQuestion(q, "medicina");
}

export function isPortugueseMedicalQuestion(q: { statement?: string; topic?: string; explanation?: string; options?: string[] }): boolean {
  return isPortugueseDomainQuestion(q, "medicina");
}
