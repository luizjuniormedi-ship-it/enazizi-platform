/**
 * @deprecated Use contentValidation.ts para novas funcionalidades.
 * Este arquivo re-exporta tudo de contentValidation.ts para compatibilidade.
 */
export {
  NON_MEDICAL_CONTENT_REGEX,
  MEDICAL_CONTENT_REGEX,
  ENGLISH_QUESTION_REGEX,
  isMedicalContent,
  isMedicalQuestion,
  isPortugueseMedicalQuestion,
} from "./contentValidation";
