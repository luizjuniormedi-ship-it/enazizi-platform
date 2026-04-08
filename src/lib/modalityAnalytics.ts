/**
 * Analytics passivos por modalidade para o simulado do ENAZIZI.
 * Rastreia desempenho em questões image vs text vs fallback.
 */

import { supabase } from "@/integrations/supabase/client";

export interface QuestionAnalyticsEvent {
  userId: string;
  simuladoSessionId?: string;
  questionIndex: number;
  questionId?: string;
  bankQuestionId?: string;
  imageQuestionId?: string;
  mode: "image" | "text" | "fallback_text";
  imageType?: string;
  specialty?: string;
  subtopic?: string;
  difficulty?: string;
  examStyle?: string;
  selectedAnswer?: number;
  correctAnswer: number;
  isCorrect: boolean;
  responseTimeSeconds?: number;
  viewedExplanation?: boolean;
  usedZoom?: boolean;
  changedAnswer?: boolean;
  retriedImage?: boolean;
}

/**
 * Registrar evento de analytics por questão — chamado ao finalizar o simulado.
 * Batch insert para minimizar round-trips.
 */
export async function recordQuestionAnalyticsBatch(events: QuestionAnalyticsEvent[]) {
  if (!events.length) return;

  const rows = events.map((e) => ({
    user_id: e.userId,
    simulado_session_id: e.simuladoSessionId || null,
    question_index: e.questionIndex,
    question_id: e.questionId || null,
    bank_question_id: e.bankQuestionId || null,
    image_question_id: e.imageQuestionId || null,
    mode: e.mode,
    image_type: e.imageType || null,
    specialty: e.specialty || null,
    subtopic: e.subtopic || null,
    difficulty: e.difficulty || null,
    exam_style: e.examStyle || null,
    selected_answer: e.selectedAnswer ?? null,
    correct_answer: e.correctAnswer,
    is_correct: e.isCorrect,
    response_time_seconds: e.responseTimeSeconds || null,
    viewed_explanation: e.viewedExplanation ?? false,
    used_zoom: e.usedZoom ?? false,
    changed_answer: e.changedAnswer ?? false,
    retried_image: e.retriedImage ?? false,
  }));

  const { error } = await (supabase as any)
    .from("simulado_question_analytics")
    .insert(rows);

  if (error) {
    console.error("[ModalityAnalytics] Error recording batch:", error);
  }
}

/**
 * Classificar a modalidade de uma questão do simulado.
 */
export function classifyQuestionMode(
  question: any
): { mode: "image" | "text" | "fallback_text"; imageType?: string } {
  if (question._isImageQuestion && question.image_url) {
    return { mode: "image", imageType: question.image_type || undefined };
  }
  if (question._isImageQuestion && !question.image_url) {
    return { mode: "fallback_text", imageType: question.image_type || undefined };
  }
  return { mode: "text" };
}

// ─── Aggregation queries for dashboards ───

export interface ModalityStats {
  mode: string;
  imageType: string | null;
  totalQuestions: number;
  correctCount: number;
  accuracyPercent: number;
  avgResponseTime: number;
}

export async function fetchUserModalityStats(userId: string): Promise<ModalityStats[]> {
  const { data, error } = await (supabase as any).rpc("get_user_modality_stats", {
    p_user_id: userId,
  });

  if (error || !data) {
    // Fallback: client-side aggregation
    const { data: raw } = await (supabase as any)
      .from("simulado_question_analytics")
      .select("mode, image_type, is_correct, response_time_seconds")
      .eq("user_id", userId);

    if (!raw) return [];

    const grouped: Record<string, { total: number; correct: number; time: number; count: number }> = {};
    for (const r of raw) {
      const key = `${r.mode}|${r.image_type || "none"}`;
      if (!grouped[key]) grouped[key] = { total: 0, correct: 0, time: 0, count: 0 };
      grouped[key].total++;
      if (r.is_correct) grouped[key].correct++;
      if (r.response_time_seconds) {
        grouped[key].time += r.response_time_seconds;
        grouped[key].count++;
      }
    }

    return Object.entries(grouped).map(([key, v]) => {
      const [mode, imageType] = key.split("|");
      return {
        mode,
        imageType: imageType === "none" ? null : imageType,
        totalQuestions: v.total,
        correctCount: v.correct,
        accuracyPercent: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
        avgResponseTime: v.count > 0 ? Math.round((v.time / v.count) * 10) / 10 : 0,
      };
    });
  }

  return data;
}

export interface ModalityInsight {
  type: "strength" | "weakness" | "info" | "alert";
  message: string;
}

export function generateModalityInsights(stats: ModalityStats[]): ModalityInsight[] {
  const insights: ModalityInsight[] = [];
  
  const imageStats = stats.filter((s) => s.mode === "image");
  const textStats = stats.filter((s) => s.mode === "text");
  const fallbackStats = stats.filter((s) => s.mode === "fallback_text");

  const imageTotal = imageStats.reduce((a, s) => a + s.totalQuestions, 0);
  const imageCorrect = imageStats.reduce((a, s) => a + s.correctCount, 0);
  const textTotal = textStats.reduce((a, s) => a + s.totalQuestions, 0);
  const textCorrect = textStats.reduce((a, s) => a + s.correctCount, 0);
  const fallbackTotal = fallbackStats.reduce((a, s) => a + s.totalQuestions, 0);

  const imageAcc = imageTotal > 0 ? (imageCorrect / imageTotal) * 100 : 0;
  const textAcc = textTotal > 0 ? (textCorrect / textTotal) * 100 : 0;

  if (imageTotal >= 5 && textTotal >= 5) {
    if (textAcc > imageAcc + 10) {
      insights.push({
        type: "weakness",
        message: `Você tem desempenho melhor em questões textuais (${Math.round(textAcc)}%) do que em questões com imagem (${Math.round(imageAcc)}%).`,
      });
    } else if (imageAcc > textAcc + 10) {
      insights.push({
        type: "strength",
        message: `Excelente! Seu desempenho em questões com imagem (${Math.round(imageAcc)}%) supera as textuais (${Math.round(textAcc)}%).`,
      });
    }
  }

  // Per-modality weakness
  const modalityLabels: Record<string, string> = {
    ecg: "ECG", xray: "RX", dermatology: "Dermatologia",
    ct: "TC", us: "US", pathology: "Patologia", ophthalmology: "Oftalmologia",
  };

  let worst: ModalityStats | null = null;
  let best: ModalityStats | null = null;
  for (const s of imageStats) {
    if (s.totalQuestions < 3) continue;
    if (!worst || s.accuracyPercent < worst.accuracyPercent) worst = s;
    if (!best || s.accuracyPercent > best.accuracyPercent) best = s;
  }

  if (worst && worst.accuracyPercent < 50) {
    const label = modalityLabels[worst.imageType || ""] || worst.imageType || "imagem";
    insights.push({
      type: "weakness",
      message: `Seu pior desempenho multimodal está em ${label} (${worst.accuracyPercent}% de acerto).`,
    });
  }

  if (best && best.accuracyPercent >= 70) {
    const label = modalityLabels[best.imageType || ""] || best.imageType || "imagem";
    insights.push({
      type: "strength",
      message: `Ponto forte: ${label} com ${best.accuracyPercent}% de acerto.`,
    });
  }

  // Time insights
  const slowest = imageStats.filter(s => s.totalQuestions >= 3).sort((a, b) => b.avgResponseTime - a.avgResponseTime)[0];
  if (slowest && slowest.avgResponseTime > 0) {
    const label = modalityLabels[slowest.imageType || ""] || slowest.imageType || "";
    insights.push({
      type: "info",
      message: `Você gasta mais tempo em ${label} (${slowest.avgResponseTime}s por questão).`,
    });
  }

  // Fallback alert
  if (fallbackTotal > 5) {
    const totalAll = imageTotal + textTotal + fallbackTotal;
    const fallbackPct = Math.round((fallbackTotal / totalAll) * 100);
    if (fallbackPct > 20) {
      insights.push({
        type: "alert",
        message: `Há alta dependência de fallback textual (${fallbackPct}% das questões). Algumas modalidades ainda não têm imagens.`,
      });
    }
  }

  return insights;
}

// ─── Admin aggregation ───

export interface AdminModalityCoverage {
  imageType: string;
  totalAssets: number;
  publishedAssets: number;
  blockedAssets: number;
  totalQuestions: number;
  publishedQuestions: number;
  coveragePercent: number;
  avgStudentAccuracy: number;
  fallbackRate: number;
}

export async function fetchAdminModalityCoverage(): Promise<AdminModalityCoverage[]> {
  // Asset coverage
  const { data: assetData } = await (supabase as any)
    .from("medical_image_assets")
    .select("image_type, review_status");

  // Question coverage
  const { data: questionData } = await (supabase as any)
    .from("medical_image_questions")
    .select("asset_id, status, medical_image_assets!inner(image_type)");

  // Student analytics
  const { data: analyticsData } = await (supabase as any)
    .from("simulado_question_analytics")
    .select("mode, image_type, is_correct");

  const types = ["ecg", "xray", "dermatology", "ct", "us", "pathology", "ophthalmology"];
  const result: AdminModalityCoverage[] = [];

  for (const t of types) {
    const assets = (assetData || []).filter((a: any) => a.image_type === t);
    const published = assets.filter((a: any) => a.review_status === "published").length;
    const blocked = assets.filter((a: any) => a.review_status === "blocked_clinical").length;

    const questions = (questionData || []).filter((q: any) => q.medical_image_assets?.image_type === t);
    const pubQ = questions.filter((q: any) => q.status === "published").length;

    const analytics = (analyticsData || []).filter((a: any) => a.image_type === t);
    const imageAnalytics = analytics.filter((a: any) => a.mode === "image");
    const fallbackAnalytics = analytics.filter((a: any) => a.mode === "fallback_text");
    const correct = imageAnalytics.filter((a: any) => a.is_correct).length;

    result.push({
      imageType: t,
      totalAssets: assets.length,
      publishedAssets: published,
      blockedAssets: blocked,
      totalQuestions: questions.length,
      publishedQuestions: pubQ,
      coveragePercent: assets.length > 0 ? Math.round((published / assets.length) * 100) : 0,
      avgStudentAccuracy: imageAnalytics.length > 0 ? Math.round((correct / imageAnalytics.length) * 100) : 0,
      fallbackRate: (imageAnalytics.length + fallbackAnalytics.length) > 0
        ? Math.round((fallbackAnalytics.length / (imageAnalytics.length + fallbackAnalytics.length)) * 100)
        : 0,
    });
  }

  return result;
}

// Quality alerts
export interface QualityAlert {
  severity: "critical" | "warning" | "info";
  imageType: string;
  message: string;
  metric: string;
  value: number;
}

export function detectQualityAlerts(
  coverage: AdminModalityCoverage[],
  studentStats?: ModalityStats[]
): QualityAlert[] {
  const alerts: QualityAlert[] = [];

  for (const c of coverage) {
    if (c.fallbackRate > 50) {
      alerts.push({
        severity: "critical",
        imageType: c.imageType,
        message: `Fallback textual excessivo em ${c.imageType.toUpperCase()} (${c.fallbackRate}%)`,
        metric: "fallback_rate",
        value: c.fallbackRate,
      });
    }

    if (c.avgStudentAccuracy > 0 && c.avgStudentAccuracy < 30) {
      alerts.push({
        severity: "critical",
        imageType: c.imageType,
        message: `Acerto anormalmente baixo em ${c.imageType.toUpperCase()} (${c.avgStudentAccuracy}%). Possível problema de clareza pedagógica.`,
        metric: "low_accuracy",
        value: c.avgStudentAccuracy,
      });
    }

    if (c.coveragePercent < 30 && c.totalAssets > 0) {
      alerts.push({
        severity: "warning",
        imageType: c.imageType,
        message: `Acervo fraco em ${c.imageType.toUpperCase()}: apenas ${c.coveragePercent}% dos assets publicados.`,
        metric: "low_coverage",
        value: c.coveragePercent,
      });
    }
  }

  // Time-based alerts from student stats
  if (studentStats) {
    for (const s of studentStats) {
      if (s.mode === "image" && s.avgResponseTime > 180 && s.totalQuestions >= 5) {
        alerts.push({
          severity: "warning",
          imageType: s.imageType || "unknown",
          message: `Tempo médio anormalmente alto em ${(s.imageType || "").toUpperCase()} (${s.avgResponseTime}s). Possível dificuldade de interpretação.`,
          metric: "high_response_time",
          value: s.avgResponseTime,
        });
      }
    }
  }

  return alerts;
}
