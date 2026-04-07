/**
 * Pipeline determinístico de geração e seleção de questões com imagem médica.
 * Opera exclusivamente com dados curados do banco medical_image_assets.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ImageAsset {
  id: string;
  asset_code: string;
  image_url: string;
  thumbnail_url: string | null;
  image_type: string;
  specialty: string;
  subtopic: string;
  diagnosis: string;
  clinical_findings: string[];
  distractors: string[];
  difficulty: string;
  tri_a: number;
  tri_b: number;
  tri_c: number;
  incidence_weight: number;
}

export interface ImageQuestion {
  id: string;
  asset_id: string;
  question_code: string;
  statement: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string | null;
  correct_index: number;
  explanation: string;
  difficulty: string;
  tri_a: number;
  tri_b: number;
  tri_c: number;
  exam_style: string;
  image_url?: string;
  image_type?: string;
}

export interface ImageQuestionSlot {
  imageType?: string;
  specialty?: string;
  difficulty?: string;
  examStyle?: string;
}

/**
 * PASSO 1: Selecionar questões publicadas que atendem aos critérios.
 */
export async function selectImageQuestions(
  slots: ImageQuestionSlot[],
  excludeIds: string[] = []
): Promise<ImageQuestion[]> {
  const results: ImageQuestion[] = [];

  for (const slot of slots) {
    let query = supabase
      .from("medical_image_questions")
      .select(`
        id, asset_id, question_code, statement, 
        option_a, option_b, option_c, option_d, option_e,
        correct_index, explanation, difficulty, 
        tri_a, tri_b, tri_c, exam_style,
        medical_image_assets!inner(image_url, image_type)
      `)
      .eq("status", "published")
      .eq("language_code", "pt-BR");

    if (slot.difficulty) {
      query = query.eq("difficulty", slot.difficulty);
    }
    if (slot.examStyle && slot.examStyle !== "generico") {
      query = query.eq("exam_style", slot.examStyle);
    }
    if (slot.imageType) {
      query = query.eq("medical_image_assets.image_type", slot.imageType);
    }
    if (slot.specialty) {
      query = query.eq("medical_image_assets.specialty", slot.specialty);
    }
    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    query = query.limit(5);

    const { data, error } = await query;
    if (error || !data || data.length === 0) continue;

    // Selecionar aleatoriamente uma das disponíveis
    const pick = data[Math.floor(Math.random() * data.length)] as any;
    const asset = pick.medical_image_assets;

    results.push({
      id: pick.id,
      asset_id: pick.asset_id,
      question_code: pick.question_code,
      statement: pick.statement,
      option_a: pick.option_a,
      option_b: pick.option_b,
      option_c: pick.option_c,
      option_d: pick.option_d,
      option_e: pick.option_e,
      correct_index: pick.correct_index,
      explanation: pick.explanation,
      difficulty: pick.difficulty,
      tri_a: pick.tri_a,
      tri_b: pick.tri_b,
      tri_c: pick.tri_c,
      exam_style: pick.exam_style,
      image_url: asset?.image_url,
      image_type: asset?.image_type,
    });

    excludeIds.push(pick.id);
  }

  return results;
}

/**
 * Converter ImageQuestion para formato SimQuestion compatível com o simulado.
 */
export function imageQuestionToSimQuestion(iq: ImageQuestion): {
  statement: string;
  options: string[];
  correct_index: number;
  explanation: string;
  topic: string;
  difficulty: string;
  image_url?: string;
  image_type?: string;
  _isImageQuestion: boolean;
  _imageQuestionId: string;
} {
  const options = [iq.option_a, iq.option_b, iq.option_c, iq.option_d];
  if (iq.option_e) options.push(iq.option_e);

  return {
    statement: iq.statement,
    options,
    correct_index: iq.correct_index,
    explanation: iq.explanation,
    topic: iq.image_type || "Imagem Médica",
    difficulty: iq.difficulty,
    image_url: iq.image_url,
    image_type: iq.image_type,
    _isImageQuestion: true,
    _imageQuestionId: iq.id,
  };
}

/**
 * Calcular slots de imagem com base na configuração do simulado.
 */
export function calculateImageSlots(
  totalQuestions: number,
  imagePercent: number,
  imageTypeDistribution?: Record<string, number>
): ImageQuestionSlot[] {
  const imageCount = Math.round(totalQuestions * (imagePercent / 100));
  if (imageCount === 0) return [];

  const defaultDistribution: Record<string, number> = {
    ecg: 0.25,
    xray: 0.25,
    ct: 0.15,
    dermatology: 0.15,
    ophthalmology: 0.08,
    pathology: 0.06,
    us: 0.06,
  };

  const dist = imageTypeDistribution || defaultDistribution;
  const slots: ImageQuestionSlot[] = [];

  for (const [type, weight] of Object.entries(dist)) {
    const count = Math.round(imageCount * weight);
    for (let i = 0; i < count; i++) {
      slots.push({ imageType: type });
    }
  }

  // Ajustar para total exato
  while (slots.length < imageCount) {
    slots.push({ imageType: "ecg" });
  }
  while (slots.length > imageCount) {
    slots.pop();
  }

  return slots;
}

/**
 * Registrar uso de questão com imagem em simulado.
 */
export async function recordImageQuestionUsage(
  questionId: string,
  userId: string,
  simuladoId: string,
  answeredCorrectly: boolean,
  responseTimeSeconds: number
) {
  await supabase.from("exam_question_usage").insert({
    question_id: questionId,
    simulado_id: simuladoId,
    user_id: userId,
    answered_correctly: answeredCorrectly,
    response_time_seconds: responseTimeSeconds,
  });
}
