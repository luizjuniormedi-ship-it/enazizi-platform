/**
 * Mnemonic Pre-Validation — Client-side checks BEFORE calling the edge function.
 * Catches predictable rejections (redundancy, incompleteness, conflicts) to save AI costs.
 */

// ══════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════

export interface PreValidationResult {
  valid: boolean;
  error?: string;
  reason?: "tamanho" | "redundancia" | "incompleto" | "conflito" | "generico" | "duplicado";
  suggestion?: string;
  cleanedItems?: string[];
}

// ══════════════════════════════════════════════════
// EQUIVALENCE PAIRS — deterministic redundancy detection
// ══════════════════════════════════════════════════

const EQUIVALENCE_PAIRS: Array<[string[], string]> = [
  [["pr prolongado", "bav 1 grau", "bav de 1o grau", "bloqueio av de primeiro grau", "bav primeiro grau", "bloqueio av 1o grau"], "BAV 1º grau / PR prolongado"],
  [["hiperglicemia", "glicose elevada", "glicemia elevada"], "hiperglicemia / glicose elevada"],
  [["hipoglicemia", "glicose baixa", "glicemia baixa"], "hipoglicemia / glicose baixa"],
  [["stemi", "iam com supra", "infarto com supra", "iam com supra de st", "infarto com supradesnivelamento de st"], "STEMI / IAM com supra"],
  [["nstemi", "iam sem supra", "infarto sem supra"], "NSTEMI / IAM sem supra"],
  [["fibrilação atrial", "fa"], "FA / fibrilação atrial"],
  [["fibrilação ventricular", "fv"], "FV / fibrilação ventricular"],
  [["taquicardia ventricular", "tv"], "TV / taquicardia ventricular"],
  [["taquicardia supraventricular", "tsv", "tsvp"], "TSV / taquicardia supraventricular"],
  [["flutter atrial", "fla"], "Flutter atrial"],
  [["edema agudo de pulmão", "eap", "edema pulmonar agudo"], "EAP / edema agudo de pulmão"],
  [["insuficiência cardíaca congestiva", "insuficiencia cardiaca congestiva", "icc"], "ICC"],
  [["tromboembolismo pulmonar", "tep", "embolia pulmonar"], "TEP / tromboembolismo pulmonar"],
  [["acidente vascular cerebral", "avc", "ave", "acidente vascular encefalico"], "AVC"],
  [["doença pulmonar obstrutiva crônica", "doenca pulmonar obstrutiva cronica", "dpoc"], "DPOC"],
  [["síndrome coronariana aguda", "sindrome coronariana aguda", "sca"], "SCA"],
  [["pressão arterial elevada", "pa elevada", "pressão alta", "has", "hipertensão", "hipertensao"], "HAS / hipertensão"],
  [["wenckebach", "mobitz i", "bav mobitz i", "bloqueio av mobitz i"], "Mobitz I / Wenckebach"],
  [["bavt", "bav total", "bav 3 grau", "bav de 3o grau", "bav terceiro grau", "bloqueio av total"], "BAV total"],
  [["bloqueio av mobitz ii", "bav mobitz ii", "mobitz ii"], "Mobitz II"],
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ══════════════════════════════════════════════════
// MINIMUM EXPECTED ITEMS for known clinical topics
// ══════════════════════════════════════════════════

interface TopicMinimum {
  topicPatterns: RegExp[];
  requiredAnchors: string[]; // at least ONE item must match each anchor
  label: string;
}

const CLINICAL_MINIMUMS: TopicMinimum[] = [
  {
    topicPatterns: [/\biam\b.*\b(ecg|eletro|supra)\b/, /\becg\b.*\biam\b/, /\biam com supra\b/],
    requiredAnchors: ["supra|supradesnivelamento", "onda q|q patologic", "bloqueio.*ramo.*esquerdo|bre"],
    label: "IAM / ECG",
  },
  {
    topicPatterns: [/\bkillip\b/],
    requiredAnchors: ["killip i|sem sinais", "killip ii|estertores|b3", "killip iii|edema.*pulm", "killip iv|choque"],
    label: "Classificação de Killip",
  },
  {
    topicPatterns: [/\bjones\b/, /\bfebre reumatica\b/],
    requiredAnchors: ["cardite", "artrite|poliartrite", "coreia", "eritema|nodulos"],
    label: "Critérios de Jones",
  },
];

const STRICT_CONTENT_TYPES = new Set([
  "criterios", "classificacao", "sinais_classicos", "diagnostico_diferencial_curto", "componentes",
]);

// ══════════════════════════════════════════════════
// MAIN VALIDATION FUNCTION
// ══════════════════════════════════════════════════

export function validateMnemonicInputBeforeGeneration(params: {
  topic: string;
  items: string[];
  contentType: string;
}): PreValidationResult {
  const { topic, items, contentType } = params;

  // 1. SIZE (pre-dedup)
  if (items.length < 3) {
    return { valid: false, reason: "tamanho", error: "Informe pelo menos 3 itens (um por linha).", suggestion: "Adicione mais itens à lista." };
  }
  if (items.length > 7) {
    return { valid: false, reason: "tamanho", error: "Máximo de 7 itens para mnemônico visual.", suggestion: "Reduza a lista para no máximo 7 itens principais." };
  }

  // 2. NORMALIZE + DEDUP
  const normalizedItems = items.map(normalize);
  const seen = new Set<string>();
  const deduped: string[] = [];
  const dedupedOriginal: string[] = [];
  for (let i = 0; i < normalizedItems.length; i++) {
    if (seen.has(normalizedItems[i])) continue;
    seen.add(normalizedItems[i]);
    deduped.push(normalizedItems[i]);
    dedupedOriginal.push(items[i]);
  }
  if (deduped.length < items.length && deduped.length < 3) {
    return { valid: false, reason: "duplicado", error: "Itens duplicados detectados. Após remoção, restam menos de 3.", suggestion: "Remova duplicatas e adicione itens distintos." };
  }

  // 3. GENERIC ITEMS
  const genericCheck = detectGenericItems(deduped);
  if (genericCheck) {
    return { valid: false, reason: "generico", error: genericCheck, suggestion: "Substitua por termos clínicos específicos." };
  }

  // 4. REDUNDANCY
  const redundancyCheck = detectRedundancy(deduped);
  if (redundancyCheck) {
    return { valid: false, reason: "redundancia", error: `Itens redundantes detectados: ${redundancyCheck}.`, suggestion: "Remova um dos itens equivalentes." };
  }

  // 5. COMPLETENESS (strict clinical types)
  if (STRICT_CONTENT_TYPES.has(contentType)) {
    const completenessCheck = detectIncompleteness(normalize(topic), deduped);
    if (completenessCheck) {
      return { valid: false, reason: "incompleto", error: completenessCheck.error, suggestion: completenessCheck.suggestion };
    }
  }

  // 6. CONCEPTUAL CONFLICT
  const conflictCheck = detectConflict(deduped);
  if (conflictCheck) {
    return { valid: false, reason: "conflito", error: conflictCheck, suggestion: "Mantenha itens do mesmo nível conceitual." };
  }

  return { valid: true, cleanedItems: dedupedOriginal };
}

// ══════════════════════════════════════════════════
// REDUNDANCY DETECTION
// ══════════════════════════════════════════════════

function detectRedundancy(normalizedItems: string[]): string | null {
  for (const [synonyms, label] of EQUIVALENCE_PAIRS) {
    const matches = normalizedItems.filter((item) =>
      synonyms.some((syn) => item === syn || item.includes(syn) || syn.includes(item))
    );
    if (matches.length >= 2) {
      return label;
    }
  }

  // Exact duplicate check
  const seen = new Set<string>();
  for (const item of normalizedItems) {
    if (seen.has(item)) return `"${item}" aparece mais de uma vez`;
    seen.add(item);
  }

  return null;
}

// ══════════════════════════════════════════════════
// INCOMPLETENESS DETECTION
// ══════════════════════════════════════════════════

function detectIncompleteness(
  normalizedTopic: string,
  normalizedItems: string[]
): { error: string; suggestion: string } | null {
  for (const min of CLINICAL_MINIMUMS) {
    const topicMatches = min.topicPatterns.some((p) => p.test(normalizedTopic));
    if (!topicMatches) continue;

    const missing: string[] = [];
    for (const anchorPattern of min.requiredAnchors) {
      const regex = new RegExp(anchorPattern, "i");
      const found = normalizedItems.some((item) => regex.test(item));
      if (!found) {
        missing.push(anchorPattern.split("|")[0]);
      }
    }

    if (missing.length > 0) {
      return {
        error: `Lista incompleta para ${min.label}. Critérios ausentes: ${missing.join(", ")}.`,
        suggestion: `Adicione os critérios faltantes ou revise os itens para garantir cobertura completa de ${min.label}.`,
      };
    }
  }

  return null;
}

// ══════════════════════════════════════════════════
// GENERIC ITEMS DETECTION
// ══════════════════════════════════════════════════

const GENERIC_TERMS = new Set([
  "alteracao", "problema", "doenca", "grave", "leve", "moderado",
  "outro", "outros", "etc", "geral", "diverso", "varios", "variado",
  "coisa", "algo", "situacao", "quadro", "caso",
]);

function detectGenericItems(normalizedItems: string[]): string | null {
  for (const item of normalizedItems) {
    const tokens = item.split(" ").filter(Boolean);
    // If entire item is a single generic word
    if (tokens.length === 1 && GENERIC_TERMS.has(tokens[0])) {
      return `O item "${item}" é genérico demais para gerar um mnemônico útil.`;
    }
  }
  return null;
}

// ══════════════════════════════════════════════════
// CONFLICT DETECTION — lightweight heuristic
// ══════════════════════════════════════════════════

const DEFINITION_MARKERS = ["é quando", "definição", "consiste em", "significa"];
const CLASSIFICATION_MARKERS = ["tipo i", "tipo ii", "tipo 1", "tipo 2", "grau i", "grau ii", "classe i", "classe ii"];

function detectConflict(normalizedItems: string[]): string | null {
  let hasDefinition = false;
  let hasClassification = false;

  for (const item of normalizedItems) {
    if (DEFINITION_MARKERS.some((m) => item.includes(m))) hasDefinition = true;
    if (CLASSIFICATION_MARKERS.some((m) => item.includes(m))) hasClassification = true;
  }

  if (hasDefinition && hasClassification) {
    return "A lista mistura definições e classificações. Use itens do mesmo nível conceitual.";
  }

  return null;
}
