/**
 * ENAZIZI — Multimodal Safety Gate
 * Central function to determine if an asset is safe for multimodal use.
 * Used by both frontend (pipeline) and referenced by backend (edge functions).
 */

/** URL patterns that indicate non-clinical images */
const SUSPICIOUS_URL_PATTERNS = [
  // UI/tech artifacts
  "mockup", "screenshot", "placeholder", "laptop", "dashboard",
  "notebook", "landing-page", "landing_page", "wireframe",
  "ui-design", "ui_design", "template", "stock-photo", "stockphoto",
  "infographic", "chart-image", "graph-image", "quality-index",
  "life-quality", "life_quality", "questionnaire", "survey",
  "hero-image", "feature-image", "banner-image",
  "certificate", "badge-image", "award-image",
  // Social media / stock
  "social-media", "facebook", "twitter", "instagram",
  "shutterstock", "gettyimages", "istockphoto", "dreamstime",
  "unsplash.com", "pexels.com", "pixabay.com",
  "youtube.com/", "vimeo.com/",
  // Human face / portrait / selfie
  "portrait", "selfie", "headshot", "face-photo", "face_photo",
  "profile-photo", "profile_photo", "profile-pic", "profile_pic",
  "avatar", "person-photo", "person_photo", "people-photo",
  // Institutional / marketing
  "logo", "branding", "institutional", "team-photo", "team_photo",
  "about-us", "about_us", "staff-photo", "staff_photo",
  "corporate", "company-photo", "company_photo",
  // Non-clinical visuals
  "icon-", "icon_", "emoji", "sticker", "clipart", "cartoon",
  "illustration", "vector", "flat-design", "flat_design",
];

export interface SafetyCheckResult {
  safe: boolean;
  reason: string;
  gate: string; // which check failed
}

/**
 * Validates if a medical image asset meets all safety criteria for multimodal use.
 * Returns safe=true only if ALL criteria pass.
 */
export function isMultimodalSafe(asset: {
  asset_origin?: string | null;
  validation_level?: string | null;
  review_status?: string | null;
  integrity_status?: string | null;
  clinical_confidence?: number | null;
  is_active?: boolean | null;
  image_url?: string | null;
  multimodal_ready?: boolean | null;
}): SafetyCheckResult {
  // 1. Origin check
  const validOrigins = ["real_medical", "validated_medical"];
  if (!asset.asset_origin || !validOrigins.includes(asset.asset_origin)) {
    return { safe: false, reason: `Origem inválida: ${asset.asset_origin || "null"}`, gate: "asset_origin" };
  }

  // 2. Validation level
  const validLevels = ["gold", "silver"];
  if (!asset.validation_level || !validLevels.includes(asset.validation_level)) {
    return { safe: false, reason: `Nível de validação insuficiente: ${asset.validation_level || "null"}`, gate: "validation_level" };
  }

  // 3. Review status
  if (asset.review_status !== "published") {
    return { safe: false, reason: `Status de revisão: ${asset.review_status || "null"}`, gate: "review_status" };
  }

  // 4. Integrity status
  if (asset.integrity_status !== "ok") {
    return { safe: false, reason: `Integridade: ${asset.integrity_status || "null"}`, gate: "integrity_status" };
  }

  // 5. Clinical confidence
  if (typeof asset.clinical_confidence !== "number" || asset.clinical_confidence < 0.90) {
    return { safe: false, reason: `Confiança clínica baixa: ${asset.clinical_confidence ?? "null"}`, gate: "clinical_confidence" };
  }

  // 6. Active
  if (!asset.is_active) {
    return { safe: false, reason: "Asset inativo", gate: "is_active" };
  }

  // 7. Image URL exists and is valid
  if (!asset.image_url || typeof asset.image_url !== "string" || asset.image_url.trim().length < 10) {
    return { safe: false, reason: "URL de imagem ausente ou inválida", gate: "image_url" };
  }

  // 8. Image URL not suspicious
  const urlLower = asset.image_url.toLowerCase();
  for (const pattern of SUSPICIOUS_URL_PATTERNS) {
    if (urlLower.includes(pattern)) {
      return { safe: false, reason: `URL suspeita: contém "${pattern}"`, gate: "suspicious_url" };
    }
  }

  return { safe: true, reason: "Todos os critérios atendidos", gate: "passed" };
}

/**
 * Quick check if an image URL looks like a real medical image.
 * Used by frontend to decide whether to show image or fallback.
 */
export function isImageUrlClinical(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string" || url.trim().length < 10) return false;
  const lower = url.toLowerCase();
  // Block suspicious patterns
  for (const pattern of SUSPICIOUS_URL_PATTERNS) {
    if (lower.includes(pattern)) return false;
  }
  // Must be an image URL
  if (!lower.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i) && !lower.includes("/storage/") && !lower.includes("/question-images/")) {
    return false;
  }
  return true;
}
