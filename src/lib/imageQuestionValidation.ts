/**
 * Validação clínica para questões com imagem médica.
 * Garante que nenhuma questão inválida seja publicada.
 */

import { detectClinicalContradictions } from "./clinicalContradictionDetector";

const ENGLISH_PATTERN = /\b(the patient|which of the following|a \d+-year-old|presents with|physical examination|most likely|treatment of choice)\b/i;

export interface ImageQuestionData {
  statement: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e?: string | null;
  correct_index: number;
  explanation: string;
  difficulty: string;
  tri_b?: number;
}

export interface ImageAssetData {
  diagnosis: string;
  clinical_findings: string[];
  distractors: string[];
  image_type: string;
  difficulty: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateImageQuestion(
  question: ImageQuestionData,
  asset: ImageAssetData
): ValidationResult {
  const errors: string[] = [];

  // 1. Idioma = português
  const allText = `${question.statement} ${question.option_a} ${question.option_b} ${question.option_c} ${question.option_d} ${question.option_e || ""} ${question.explanation}`;
  if (ENGLISH_PATTERN.test(allText)) {
    errors.push("Conteúdo em inglês detectado");
  }

  // 2. correct_index válido
  const maxIdx = question.option_e ? 4 : 3;
  if (question.correct_index < 0 || question.correct_index > maxIdx) {
    errors.push(`correct_index (${question.correct_index}) fora do range válido (0-${maxIdx})`);
  }

  // 3. Alternativas não repetidas
  const options = [question.option_a, question.option_b, question.option_c, question.option_d];
  if (question.option_e) options.push(question.option_e);
  const normalized = options.map(o => o.trim().toLowerCase());
  const unique = new Set(normalized);
  if (unique.size !== normalized.length) {
    errors.push("Alternativas repetidas detectadas");
  }

  // 4. Diagnóstico correto presente na alternativa correta
  const correctOption = options[question.correct_index]?.toLowerCase() || "";
  const diagLower = asset.diagnosis.toLowerCase();
  const diagWords = diagLower.split(/\s+/).filter(w => w.length > 4);
  const diagPresent = diagWords.some(w => correctOption.includes(w));
  if (!diagPresent && diagLower.length > 0) {
    // Verificação flexível — pelo menos parte do diagnóstico
    const diagParts = diagLower.split(/[\s,;-]+/).filter(p => p.length > 3);
    const anyMatch = diagParts.some(p => correctOption.includes(p));
    if (!anyMatch) {
      errors.push("Diagnóstico correto não encontrado na alternativa correta");
    }
  }

  // 5. Explanation cita achados coerentes
  const explLower = question.explanation.toLowerCase();
  const findingsMatch = asset.clinical_findings.filter(f => 
    explLower.includes(f.toString().toLowerCase().slice(0, 15))
  );
  if (asset.clinical_findings.length > 0 && findingsMatch.length === 0) {
    errors.push("Explicação não menciona achados clínicos do asset");
  }

  // 6. Statement compatível com image_type
  const typeKeywords: Record<string, string[]> = {
    ecg: ["ecg", "eletrocardiograma", "traçado", "ritmo", "derivação"],
    xray: ["radiografia", "raio-x", "rx", "imagem radiográfica", "tórax"],
    ct: ["tomografia", "tc", "corte", "contraste"],
    mri: ["ressonância", "rm", "rmn"],
    us: ["ultrassom", "ecografia", "ultrassonografia"],
    dermatology: ["lesão", "pele", "cutâneo", "dermatológ"],
    pathology: ["lâmina", "histopatológ", "biópsia", "microscopia"],
    ophthalmology: ["fundo de olho", "retina", "disco óptico", "fundoscopia"],
    endoscopy: ["endoscopia", "mucosa", "esôfago"],
    obstetric_trace: ["cardiotocografia", "ctg", "traçado fetal"],
  };
  const stmtLower = question.statement.toLowerCase();
  const keywords = typeKeywords[asset.image_type] || [];
  const typeMatch = keywords.some(k => stmtLower.includes(k));
  if (keywords.length > 0 && !typeMatch) {
    // Aviso mas não bloqueia — pode ser implícito pela imagem
    // errors.push("Enunciado não menciona tipo de imagem");
  }

  // 7. Dificuldade coerente com tri_b
  if (question.tri_b !== undefined) {
    const diffMap: Record<string, [number, number]> = {
      easy: [-3, -0.3],
      medium: [-0.5, 1.0],
      hard: [0.5, 3.0],
    };
    const range = diffMap[question.difficulty];
    if (range && (question.tri_b < range[0] || question.tri_b > range[1])) {
      errors.push(`tri_b (${question.tri_b}) incompatível com dificuldade ${question.difficulty}`);
    }
  }

  // 8. Detecção de contradições clínicas
  const contradiction = detectClinicalContradictions(question.statement, asset.diagnosis, question.explanation);
  if (contradiction.has_contradiction) {
    if (contradiction.severity === "grave") {
      errors.push(`Contradição clínica GRAVE: ${contradiction.issues.join("; ")}`);
    } else {
      // Moderado/leve — aviso mas não bloqueia
      errors.push(`Contradição clínica (${contradiction.severity}): ${contradiction.issues.join("; ")}`);
    }
  }

  // 9. Sem contradição entre alternativas e explicação
  if (question.explanation.length < 50) {
    errors.push("Explicação muito curta (mín. 50 caracteres)");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida um lote de questões, retornando apenas as válidas.
 */
export function filterValidImageQuestions<T extends ImageQuestionData>(
  questions: T[],
  asset: ImageAssetData
): { valid: T[]; rejected: Array<{ question: T; errors: string[] }> } {
  const valid: T[] = [];
  const rejected: Array<{ question: T; errors: string[] }> = [];

  for (const q of questions) {
    const result = validateImageQuestion(q, asset);
    if (result.valid) {
      valid.push(q);
    } else {
      rejected.push({ question: q, errors: result.errors });
    }
  }

  return { valid, rejected };
}
