/**
 * Validação de integridade clínica para assets de imagem médica.
 * Garante que nenhum asset com imagem incompatível chegue a produção.
 */

/** Regras de confiança clínica para publicação */
export type ClinicalStatus = "published" | "needs_review" | "blocked_clinical" | "experimental_only";

export function classifyClinicalConfidence(confidence: number): ClinicalStatus {
  if (confidence >= 0.80) return "published";
  if (confidence >= 0.60) return "needs_review";
  return "blocked_clinical";
}

/** Tipo de problema de integridade */
export type IntegrityIssue =
  | "mismatch_type"        // imagem de tipo errado (ex: RX para TC)
  | "mismatch_diagnosis"   // imagem não sustenta o diagnóstico
  | "generic_image"        // imagem genérica compartilhada com muitos diagnósticos
  | "duplicate_unresolved" // duplicata não resolvida
  | "ok"                   // sem problemas
  | "pending";             // ainda não auditado

/** Mapa de fallbacks proibidos entre tipos de imagem */
const FORBIDDEN_FALLBACKS: Record<string, string[]> = {
  ct: ["xray", "us", "dermatology", "pathology", "ophthalmology", "endoscopy"],
  us: ["xray", "ct", "dermatology", "pathology", "ophthalmology"],
  pathology: ["xray", "ct", "us", "dermatology", "ophthalmology", "ecg"],
  ophthalmology: ["xray", "ct", "dermatology", "pathology", "ecg"],
  endoscopy: ["xray", "ct", "dermatology", "pathology", "ecg", "ophthalmology"],
  obstetric_trace: ["ecg", "xray", "ct", "dermatology"],
  mri: ["xray", "ct", "us", "dermatology", "pathology"],
  ecg: ["xray", "dermatology", "pathology", "ophthalmology"],
  xray: ["ecg", "dermatology", "pathology", "ophthalmology"],
  dermatology: ["ecg", "xray", "ct", "pathology", "ophthalmology"],
};

/**
 * Verifica se uma URL de imagem é compatível com o tipo declarado.
 * Heurística baseada em keywords na URL do storage.
 */
export function isImageUrlCompatibleWithType(imageUrl: string, declaredType: string): boolean {
  const url = imageUrl.toLowerCase();
  const typeKeywords: Record<string, string[]> = {
    ecg: ["ecg", "eletrocardiograma"],
    xray: ["xray", "raio", "radiografia", "rx"],
    ct: ["ct", "tomografia", "tc"],
    mri: ["mri", "rm", "ressonancia"],
    us: ["us", "ultrassom", "ecografia"],
    dermatology: ["dermato", "pele", "cutane"],
    pathology: ["patologia", "histopatologia", "lamina"],
    ophthalmology: ["oftalmo", "retina", "fundoscopia"],
    endoscopy: ["endoscopia", "endosco"],
    obstetric_trace: ["ctg", "cardiotoco", "fetal"],
  };

  // Se a URL contém keyword de OUTRO tipo, é incompatível
  for (const [type, keywords] of Object.entries(typeKeywords)) {
    if (type === declaredType) continue;
    if (keywords.some(k => url.includes(k))) {
      const forbidden = FORBIDDEN_FALLBACKS[declaredType] || [];
      if (forbidden.includes(type)) return false;
    }
  }
  return true;
}

/** Asset origin types */
export type AssetOrigin = "real_medical" | "validated_medical" | "educational_ai" | "generic_ai" | "blocked_clinical" | "unknown";

/** Validation levels */
export type ValidationLevel = "gold" | "silver" | "bronze" | "blocked";

/** Origins allowed for multimodal generation */
const MULTIMODAL_ALLOWED_ORIGINS: AssetOrigin[] = ["real_medical", "validated_medical"];
const MULTIMODAL_ALLOWED_LEVELS: ValidationLevel[] = ["gold", "silver"];

/**
 * Verifica se um asset pode ser exibido em simulados de produção.
 */
export function isAssetProductionReady(asset: {
  clinical_confidence: number;
  review_status: string;
  is_active: boolean;
  integrity_status?: string;
}): boolean {
  return (
    asset.is_active === true &&
    asset.clinical_confidence >= 0.80 &&
    asset.review_status === "published" &&
    asset.integrity_status !== "mismatch_type" &&
    asset.integrity_status !== "generic_image" &&
    asset.integrity_status !== "mismatch_diagnosis"
  );
}

/**
 * Verifica se um asset está pronto para geração multimodal segura.
 * Regras estritas: somente real_medical/validated_medical com confiança >= 0.90.
 */
export function isAssetMultimodalReady(asset: {
  asset_origin?: string;
  validation_level?: string;
  review_status: string;
  integrity_status?: string;
  clinical_confidence: number;
  is_active: boolean;
  multimodal_ready?: boolean;
}): { ready: boolean; reason?: string } {
  if (!asset.is_active) return { ready: false, reason: "Asset inactive" };
  
  if (!MULTIMODAL_ALLOWED_ORIGINS.includes(asset.asset_origin as AssetOrigin)) {
    return { ready: false, reason: `Origin '${asset.asset_origin}' not allowed for multimodal` };
  }
  
  if (!MULTIMODAL_ALLOWED_LEVELS.includes(asset.validation_level as ValidationLevel)) {
    return { ready: false, reason: `Validation level '${asset.validation_level}' insufficient` };
  }
  
  if (asset.review_status !== "published") {
    return { ready: false, reason: `Review status '${asset.review_status}' — must be published` };
  }
  
  if (asset.integrity_status !== "ok") {
    return { ready: false, reason: `Integrity status '${asset.integrity_status}' — must be ok` };
  }
  
  if (asset.clinical_confidence < 0.90) {
    return { ready: false, reason: `Clinical confidence ${asset.clinical_confidence} < 0.90` };
  }
  
  return { ready: true };
}

/** Resumo de integridade por tipo */
export interface IntegritySummary {
  imageType: string;
  total: number;
  uniqueImages: number;
  published: number;
  needsReview: number;
  blocked: number;
  experimental: number;
  avgConfidence: number;
  integrityIssues: number;
  typeMismatches: number;
}
