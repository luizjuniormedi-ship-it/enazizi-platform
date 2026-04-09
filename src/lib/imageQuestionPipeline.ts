/**
 * Pipeline determinístico de geração e seleção de questões com imagem médica.
 * Opera exclusivamente com dados curados do banco medical_image_assets.
 */

import { supabase } from "@/integrations/supabase/client";
import { isImageUrlClinical } from "@/lib/multimodalSafetyGate";

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
    // Query usando RPC ou raw para tabelas não tipadas ainda
    let query = (supabase as any)
      .from("medical_image_questions")
      .select(`
        id, asset_id, question_code, statement, 
        option_a, option_b, option_c, option_d, option_e,
        correct_index, explanation, difficulty, 
        tri_a, tri_b, tri_c, exam_style,
        senior_audit_score, editorial_grade,
        medical_image_assets!inner(image_url, image_type, clinical_confidence, review_status, integrity_status, validation_level, asset_origin, is_active)
      `)
      .eq("status", "published")
      .eq("language_code", "pt-BR")
      // BLOQUEIO CLÍNICO: somente assets gold/silver, publicados, com confiança >= 0.90
      .eq("medical_image_assets.is_active", true)
      .eq("medical_image_assets.review_status", "published")
      .eq("medical_image_assets.integrity_status", "ok")
      .gte("medical_image_assets.clinical_confidence", 0.90)
      .in("medical_image_assets.validation_level", ["gold", "silver"])
      .in("medical_image_assets.asset_origin", ["real_medical", "validated_medical"])
      // BLOQUEIO EDITORIAL: nunca servir questões fracas
      .neq("editorial_grade", "weak");

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

    // Priorizar excellent para simulados, good para treino
    query = query.order("senior_audit_score", { ascending: false, nullsFirst: false });
    query = query.limit(5);

    const { data, error } = await query;
    if (error || !data || data.length === 0) continue;

    // Preferir questões excellent quando disponíveis
    const excellent = (data as any[]).filter((d: any) => d.editorial_grade === "excellent");
    const pool = excellent.length > 0 ? excellent : data;
    const pick = pool[Math.floor(Math.random() * pool.length)] as any;
    const asset = pick.medical_image_assets;

    // Final URL safety check — skip if image URL is suspicious
    const imgUrl = asset?.image_url;
    if (!isImageUrlClinical(imgUrl)) {
      console.warn(`[ImagePipeline] URL suspeita detectada para ${pick.question_code}, servindo como textual`);
      // Still include question but without image (text fallback)
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
        image_url: undefined, // Hide suspicious image
        image_type: asset?.image_type,
      });
    } else {
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
        image_url: imgUrl,
        image_type: asset?.image_type,
      });
    }

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

  const hasValidImage = isImageUrlClinical(iq.image_url);

  return {
    statement: iq.statement,
    options,
    correct_index: iq.correct_index,
    explanation: iq.explanation,
    topic: iq.image_type || "Imagem Médica",
    difficulty: iq.difficulty,
    image_url: hasValidImage ? iq.image_url : undefined,
    image_type: iq.image_type,
    _isImageQuestion: hasValidImage,
    _imageQuestionId: iq.id,
  };
}

/**
 * Especialidades liberadas para questões com imagem em produção.
 * TC, US, Patologia e Oftalmologia ficam bloqueadas até reconstrução do acervo.
 */
const ALLOWED_IMAGE_TYPES = ["ecg", "xray", "dermatology", "ct", "us", "pathology", "ophthalmology"];

/**
 * Calcular slots de imagem com base na configuração do simulado.
 * Apenas tipos liberados são incluídos; tipos bloqueados geram fallback textual.
 */
export function calculateImageSlots(
  totalQuestions: number,
  imagePercent: number,
  imageTypeDistribution?: Record<string, number>
): { slots: ImageQuestionSlot[]; fallbackCount: number } {
  const imageCount = Math.round(totalQuestions * (imagePercent / 100));
  if (imageCount === 0) return { slots: [], fallbackCount: 0 };

  const defaultDistribution: Record<string, number> = {
    ecg: 0.20,
    xray: 0.20,
    dermatology: 0.15,
    ct: 0.15,
    us: 0.10,
    pathology: 0.10,
    ophthalmology: 0.10,
  };

  const dist = imageTypeDistribution || defaultDistribution;
  const slots: ImageQuestionSlot[] = [];
  let fallbackCount = 0;

  for (const [type, weight] of Object.entries(dist)) {
    const count = Math.round(imageCount * weight);
    if (ALLOWED_IMAGE_TYPES.includes(type)) {
      for (let i = 0; i < count; i++) {
        slots.push({ imageType: type });
      }
    } else {
      fallbackCount += count;
      console.warn(`[ImagePipeline] Fallback textual: ${count} questões de ${type} (especialidade bloqueada)`);
    }
  }

  // Ajustar para total exato (apenas tipos liberados)
  const targetSlots = imageCount - fallbackCount;
  while (slots.length < targetSlots) {
    slots.push({ imageType: "ecg" });
  }
  while (slots.length > targetSlots) {
    slots.pop();
  }

  return { slots, fallbackCount };
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
  await (supabase as any).from("exam_question_usage").insert({
    question_id: questionId,
    simulado_id: simuladoId,
    user_id: userId,
    answered_correctly: answeredCorrectly,
    response_time_seconds: responseTimeSeconds,
  });
}
