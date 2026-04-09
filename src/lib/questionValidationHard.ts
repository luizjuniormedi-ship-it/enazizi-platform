/**
 * ENAZIZI — Hard Deterministic Validation (re-export)
 * Centraliza a importação da engine de validação determinística.
 */
export {
  validateQuestionHard,
  type QuestionLike,
  type AssetLike,
  type ValidationResult,
} from "./validateQuestionHard";

export { isImageUrlClinical, isMultimodalSafe } from "./multimodalSafetyGate";
