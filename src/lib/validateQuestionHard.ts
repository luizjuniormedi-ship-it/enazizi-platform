// ── ENAZIZI Hard Deterministic Validation Engine ──────────────────
// A IA gera. O sistema decide. 100% regras determinísticas.

export type QuestionLike = {
  statement?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  option_e?: string;
  correct_index?: number;
  explanation?: string;
  rationale_map?: Record<string, string>;
  difficulty?: "easy" | "medium" | "hard" | string;
  exam_style?: string;
};

export type AssetLike = {
  image_type?: string;
  diagnosis?: string;
  clinical_findings?: string[] | string | null;
  image_url?: string | null;
  asset_origin?: string | null;
  validation_level?: string | null;
  review_status?: string | null;
  integrity_status?: string | null;
  clinical_confidence?: number | null;
  is_active?: boolean | null;
};

export type ValidationResult = {
  approved: boolean;
  blocked: boolean;
  score: number;
  mode: "multimodal" | "text_only" | "blocked";
  reasons: string[];
  breakdown: {
    structure: number;
    image: number;
    multimodal: number;
    pedagogy: number;
  };
};

const BLOCK_PATTERNS = [
  "laptop","notebook","dashboard","screen","ui","interface","website",
  "landing-page","mockup","placeholder","shutterstock","unsplash","stock",
  "portrait","selfie","avatar","person","office","room","illustration",
  "vector","cartoon","clipart","diagram","drawing"
];

const ENGLISH_WORDS = [
  "however","therefore","management","patient presents","follow-up",
  "rash","history of present illness","chief complaint","because",
  "imaging findings","treatment"
];

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function hasBlockedUrl(url?: string | null): boolean {
  if (!url) return true;
  const u = url.toLowerCase();
  return BLOCK_PATTERNS.some(p => u.includes(p));
}

function isSafeAsset(asset: AssetLike): boolean {
  return (
    asset.is_active === true &&
    ["real_medical", "validated_medical"].includes(asset.asset_origin || "") &&
    ["gold", "silver"].includes(asset.validation_level || "") &&
    asset.review_status === "published" &&
    asset.integrity_status === "ok" &&
    Number(asset.clinical_confidence || 0) >= 0.9 &&
    !hasBlockedUrl(asset.image_url)
  );
}

function hasEnglishLeak(text: string): boolean {
  const t = text.toLowerCase();
  return ENGLISH_WORDS.filter(w => t.includes(w)).length >= 2;
}

function hasAllOptions(q: QuestionLike): boolean {
  return (["option_a","option_b","option_c","option_d","option_e"] as const)
    .every(k => normalizeText(q[k]).length > 0);
}

function rationaleComplete(q: QuestionLike): boolean {
  const rm = q.rationale_map || {};
  return ["A","B","C","D","E"].every(k => normalizeText(rm[k]).length >= 10);
}

function optionsAreDistinct(q: QuestionLike): boolean {
  const options = [
    q.option_a, q.option_b, q.option_c, q.option_d, q.option_e
  ].map(normalizeText).map(v => v.toLowerCase());
  return new Set(options).size === 5;
}

function obviousOptionLengths(q: QuestionLike): boolean {
  const lengths = [
    q.option_a, q.option_b, q.option_c, q.option_d, q.option_e
  ].map(normalizeText).map(v => v.length);
  const max = Math.max(...lengths);
  const min = Math.min(...lengths);
  return max - min > 220;
}

function mentionsImageDependence(text: string): boolean {
  const t = text.toLowerCase();
  return [
    "achados do exame",
    "exame realizado",
    "ultrassonografia",
    "radiografia",
    "tomografia",
    "eletrocardiograma",
    "dermatoscopia",
    "fundo de olho",
    "lâmina histológica",
    "ao exame de imagem"
  ].some(x => t.includes(x));
}

function fakeMultimodalByContent(asset: AssetLike, q: QuestionLike): boolean {
  const statement = normalizeText(q.statement).toLowerCase();
  const diagnosis = normalizeText(asset.diagnosis).toLowerCase();

  if (!mentionsImageDependence(statement)) return true;

  const textOnlySignals = [
    ["amenorreia", "beta-hcg", "sangramento vaginal"],
    ["prurido", "escamas", "couro cabeludo"],
    ["dor torácica", "dispneia", "sudorese"],
    ["palpitações", "taquicardia", "síncope"]
  ];

  const matchesTextOnly = textOnlySignals.some(group =>
    group.every(term => statement.includes(term))
  );

  if (matchesTextOnly && !statement.includes("achado visual")) return true;

  const findingsText = Array.isArray(asset.clinical_findings)
    ? asset.clinical_findings.join(" ").toLowerCase()
    : normalizeText(asset.clinical_findings).toLowerCase();

  const someFindingReferenced =
    findingsText.length > 0 &&
    findingsText
      .split(/[;,]/)
      .map(s => s.trim())
      .filter(Boolean)
      .some(f => f.length >= 6 && statement.includes(f.slice(0, Math.min(f.length, 20)).trim()));

  if (!someFindingReferenced && diagnosis.length > 0 && !statement.includes(diagnosis.split(" ")[0])) {
    return true;
  }

  return false;
}

function pedagogicalWeakness(q: QuestionLike): string[] {
  const reasons: string[] = [];
  const statement = normalizeText(q.statement);
  const explanation = normalizeText(q.explanation);

  if (statement.length < 400) reasons.push("enunciado_curto");
  if (explanation.length < 120) reasons.push("explicacao_curta");
  if (wordCount(statement) < 65) reasons.push("caso_pouco_desenvolvido");
  if (!optionsAreDistinct(q)) reasons.push("alternativas_repetidas");
  if (obviousOptionLengths(q)) reasons.push("alternativas_desequilibradas");
  if (!rationaleComplete(q)) reasons.push("rationale_incompleto");
  if (hasEnglishLeak(`${statement} ${explanation}`)) reasons.push("vazamento_ingles");

  return reasons;
}

export function validateQuestionHard(
  asset: AssetLike,
  q: QuestionLike
): ValidationResult {
  const reasons: string[] = [];
  let structure = 0;
  let image = 0;
  let multimodal = 0;
  let pedagogy = 0;

  // ── BLOQUEIO IMEDIATO: asset inseguro ──
  if (!isSafeAsset(asset)) {
    return {
      approved: false,
      blocked: true,
      score: 0,
      mode: "blocked",
      reasons: ["asset_inseguro_ou_imagem_nao_clinica"],
      breakdown: { structure, image, multimodal, pedagogy }
    };
  }

  // ── BLOQUEIO IMEDIATO: alternativas incompletas ──
  if (!hasAllOptions(q)) {
    return {
      approved: false,
      blocked: true,
      score: 0,
      mode: "blocked",
      reasons: ["alternativas_incompletas"],
      breakdown: { structure, image, multimodal, pedagogy }
    };
  }

  // ── BLOQUEIO IMEDIATO: correct_index inválido ──
  if (typeof q.correct_index !== "number" || q.correct_index < 0 || q.correct_index > 4) {
    return {
      approved: false,
      blocked: true,
      score: 0,
      mode: "blocked",
      reasons: ["correct_index_invalido"],
      breakdown: { structure, image, multimodal, pedagogy }
    };
  }

  // ── BLOCO 1: ESTRUTURA (max 25) ──
  const statement = normalizeText(q.statement);
  const explanation = normalizeText(q.explanation);

  if (statement.length >= 400) structure += 10;
  else reasons.push("enunciado_abaixo_minimo");

  if (explanation.length >= 120) structure += 5;
  else reasons.push("explicacao_abaixo_minimo");

  if (["easy", "medium", "hard"].includes(normalizeText(q.difficulty))) structure += 3;
  else reasons.push("difficulty_invalida");

  if (normalizeText(q.exam_style).length >= 3) structure += 2;
  else reasons.push("exam_style_ausente");

  if (rationaleComplete(q)) structure += 5;
  else reasons.push("rationale_incompleto");

  // ── BLOCO 2: IMAGEM (max 25) ──
  if (!hasBlockedUrl(asset.image_url)) image += 10;
  if (["gold", "silver"].includes(asset.validation_level || "")) image += 5;
  if (["real_medical", "validated_medical"].includes(asset.asset_origin || "")) image += 5;
  if (Number(asset.clinical_confidence || 0) >= 0.95) image += 5;
  else if (Number(asset.clinical_confidence || 0) >= 0.9) image += 3;

  // ── BLOCO 3: MULTIMODAL REAL (max 25) ──
  if (mentionsImageDependence(statement)) multimodal += 10;
  else reasons.push("nao_depende_de_imagem");

  if (!fakeMultimodalByContent(asset, q)) multimodal += 15;
  else reasons.push("fake_multimodal");

  // ── BLOCO 4: PEDAGOGIA (max 25) ──
  const pWeak = pedagogicalWeakness(q);
  if (pWeak.length === 0) pedagogy = 25;
  else {
    pedagogy = Math.max(0, 25 - pWeak.length * 5);
    reasons.push(...pWeak);
  }

  // ── DECISÃO FINAL ──
  const score = structure + image + multimodal + pedagogy;

  if (reasons.includes("fake_multimodal") || reasons.includes("nao_depende_de_imagem")) {
    return {
      approved: score >= 70,
      blocked: false,
      score,
      mode: "text_only",
      reasons,
      breakdown: { structure, image, multimodal, pedagogy }
    };
  }

  if (score < 70) {
    return {
      approved: false,
      blocked: true,
      score,
      mode: "blocked",
      reasons,
      breakdown: { structure, image, multimodal, pedagogy }
    };
  }

  return {
    approved: true,
    blocked: false,
    score,
    mode: "multimodal",
    reasons,
    breakdown: { structure, image, multimodal, pedagogy }
  };
}
