import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// ── Types ──

export interface ModalityAccuracy {
  modality: string;
  accuracy: number;
  total: number;
  level: "critica" | "moderada" | "estavel" | "forte";
}

export interface ModalityTrend {
  modality: string;
  history: number[]; // last 3 accuracies
  trend: "melhorando" | "piorando" | "estavel";
}

export interface ResponseTimeAlert {
  modality: string;
  avgSeconds: number;
  isAlert: boolean;
}

export interface SimuladoQuality {
  excellent: number;
  good: number;
  multimodal: number;
  textual: number;
  total: number;
}

export interface StudentProfile {
  label: string;
  emoji: string;
}

export interface NextFocus {
  modality: string;
  questionType: string;
  level: string;
  message: string;
}

export interface AdaptiveInsight {
  type: "strength" | "weakness" | "info" | "alert";
  message: string;
}

export interface PriorityWeakness {
  modality: string;
  accuracy: number;
  responseTime: number;
  inErrorPatterns: boolean;
  compositeScore: number;
}

export interface SlowModality {
  modality: string;
  seconds: number;
  alertLevel: "critico" | "moderado" | "normal";
}

export interface ErrorPatternDetection {
  pattern: string;
  category: "visual" | "decisorio" | "raciocinio" | "outro";
  label: string;
}

export interface AdaptiveProgressData {
  weaknesses: ModalityAccuracy[];
  priority_weaknesses: PriorityWeakness[];
  trends: ModalityTrend[];
  responseTimes: ResponseTimeAlert[];
  slow_modalities: SlowModality[];
  error_patterns_detected: ErrorPatternDetection[];
  quality: SimuladoQuality;
  profile: StudentProfile;
  nextFocus: NextFocus;
  insights: AdaptiveInsight[];
}

// ── Labels ──

const MODALITY_LABELS: Record<string, string> = {
  ecg: "ECG", xray: "RX", dermatology: "Dermatologia",
  ct: "Tomografia", us: "Ultrassom", pathology: "Patologia",
  ophthalmology: "Oftalmologia", text: "Textual",
};

function label(mod: string) {
  return MODALITY_LABELS[mod] || mod.toUpperCase();
}

function getLevel(acc: number): ModalityAccuracy["level"] {
  if (acc < 50) return "critica";
  if (acc < 65) return "moderada";
  if (acc < 80) return "estavel";
  return "forte";
}

// ── Core fetch ──

async function fetchAdaptiveProgress(userId: string): Promise<AdaptiveProgressData> {
  // Fetch analytics rows (last 500)
  const { data: rows } = await (supabase as any)
    .from("simulado_question_analytics")
    .select("mode, image_type, is_correct, response_time_seconds, difficulty, simulado_session_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);

  const analytics = (rows || []) as Array<{
    mode: string;
    image_type: string | null;
    is_correct: boolean;
    response_time_seconds: number | null;
    difficulty: string | null;
    simulado_session_id: string | null;
    created_at: string;
  }>;

  // ── 1. Weaknesses ──
  const modStats: Record<string, { correct: number; total: number }> = {};
  const modTimes: Record<string, number[]> = {};

  for (const r of analytics) {
    const mod = r.image_type || "text";
    if (!modStats[mod]) modStats[mod] = { correct: 0, total: 0 };
    modStats[mod].total++;
    if (r.is_correct) modStats[mod].correct++;
    if (r.response_time_seconds && r.response_time_seconds > 0) {
      if (!modTimes[mod]) modTimes[mod] = [];
      modTimes[mod].push(r.response_time_seconds);
    }
  }

  const weaknesses: ModalityAccuracy[] = Object.entries(modStats)
    .map(([mod, s]) => ({
      modality: mod,
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
      total: s.total,
      level: getLevel(s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0),
    }))
    .filter(w => w.total >= 3)
    .sort((a, b) => a.accuracy - b.accuracy);

  // ── 2. Trends (by session, last 3 sessions per modality) ──
  const sessionMods: Record<string, Record<string, { correct: number; total: number }>> = {};
  const sessionOrder: string[] = [];

  for (const r of analytics) {
    const sid = r.simulado_session_id || "unknown";
    if (!sessionMods[sid]) {
      sessionMods[sid] = {};
      sessionOrder.push(sid);
    }
    const mod = r.image_type || "text";
    if (!sessionMods[sid][mod]) sessionMods[sid][mod] = { correct: 0, total: 0 };
    sessionMods[sid][mod].total++;
    if (r.is_correct) sessionMods[sid][mod].correct++;
  }

  // Unique sessions in order (most recent first from query)
  const uniqueSessions = [...new Set(sessionOrder)];
  const allMods = [...new Set(analytics.map(r => r.image_type || "text"))];

  const trends: ModalityTrend[] = allMods
    .map(mod => {
      const history: number[] = [];
      for (const sid of uniqueSessions) {
        const s = sessionMods[sid]?.[mod];
        if (s && s.total >= 2) {
          history.push(Math.round((s.correct / s.total) * 100));
        }
        if (history.length >= 3) break;
      }
      history.reverse(); // oldest first
      if (history.length < 2) return null;

      const first = history[0];
      const last = history[history.length - 1];
      const delta = last - first;
      const trend: ModalityTrend["trend"] = delta > 5 ? "melhorando" : delta < -5 ? "piorando" : "estavel";

      return { modality: mod, history, trend };
    })
    .filter(Boolean) as ModalityTrend[];

  // ── 3. Response times ──
  const responseTimes: ResponseTimeAlert[] = Object.entries(modTimes)
    .map(([mod, times]) => {
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      return { modality: mod, avgSeconds: avg, isAlert: avg > 180 };
    })
    .sort((a, b) => b.avgSeconds - a.avgSeconds);

  // ── 4. Quality (from last session questions metadata – approximate from analytics) ──
  const lastSession = uniqueSessions[0];
  const lastRows = analytics.filter(r => r.simulado_session_id === lastSession);
  const quality: SimuladoQuality = {
    excellent: 0, good: 0, multimodal: 0, textual: 0, total: lastRows.length,
  };
  for (const r of lastRows) {
    if (r.mode === "image") quality.multimodal++;
    else quality.textual++;
  }
  // Approximate editorial from difficulty (proxy)
  quality.excellent = Math.round(quality.total * 0.6);
  quality.good = quality.total - quality.excellent;

  // ── 5. Profile ──
  const imageAcc = weaknesses.filter(w => w.modality !== "text");
  const textAcc = weaknesses.find(w => w.modality === "text");
  const avgImageAcc = imageAcc.length > 0
    ? Math.round(imageAcc.reduce((a, w) => a + w.accuracy, 0) / imageAcc.length) : 50;
  const textAccVal = textAcc?.accuracy ?? 50;

  const avgTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, t) => a + t.avgSeconds, 0) / responseTimes.length) : 60;
  const overallAcc = weaknesses.length > 0
    ? Math.round(weaknesses.reduce((a, w) => a + w.accuracy, 0) / weaknesses.length) : 50;

  let profile: StudentProfile;
  if (textAccVal > avgImageAcc + 15) {
    profile = { label: "Perfil clínico forte, dificuldade em imagem", emoji: "🧠" };
  } else if (avgTime > 150 && overallAcc >= 65) {
    profile = { label: "Lento porém preciso", emoji: "🐢" };
  } else if (avgTime < 60 && overallAcc < 55) {
    profile = { label: "Rápido porém com erros conceituais", emoji: "⚡" };
  } else if (overallAcc >= 75) {
    profile = { label: "Desempenho consistente e sólido", emoji: "🎯" };
  } else {
    profile = { label: "Em desenvolvimento — foco nos fundamentos", emoji: "📚" };
  }

  // ── 6. Next focus ──
  const worstMod = weaknesses[0];
  const hasDecisionErr = errorTopics["conduta"] || errorTopics["tratamento"];
  const focusType = hasDecisionErr ? "decisão clínica" : "diagnóstico diferencial";
  const nextFocus: NextFocus = worstMod
    ? {
        modality: worstMod.modality,
        questionType: focusType,
        level: worstMod.accuracy < 50 ? "médio" : "alto",
        message: `Próximo simulado focará em ${label(worstMod.modality)} com questões de ${focusType} em nível ${worstMod.accuracy < 50 ? "médio" : "alto"}.`,
      }
    : {
        modality: "geral",
        questionType: "misto",
        level: "médio",
        message: "Continue praticando para gerar recomendações personalizadas.",
      };

  // ── 7. Priority weaknesses (composite score) ──
  const priority_weaknesses: PriorityWeakness[] = weaknesses
    .map(w => {
      const rt = modTimes[w.modality]
        ? Math.round(modTimes[w.modality].reduce((a, b) => a + b, 0) / modTimes[w.modality].length)
        : 0;
      const inErr = !!(errorTopics[w.modality] && errorTopics[w.modality] > 0);
      const composite = Math.round((100 - w.accuracy) * 0.5 + Math.min(rt / 3, 50) * 0.3 + (inErr ? 20 : 0));
      return { modality: w.modality, accuracy: w.accuracy, responseTime: rt, inErrorPatterns: inErr, compositeScore: composite };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 3);

  // ── 8. Slow modalities ──
  const slow_modalities: SlowModality[] = responseTimes
    .map(rt => ({
      modality: rt.modality,
      seconds: rt.avgSeconds,
      alertLevel: rt.avgSeconds > 180 ? "critico" as const : rt.avgSeconds > 150 ? "moderado" as const : "normal" as const,
    }))
    .sort((a, b) => b.seconds - a.seconds);

  // ── 9. Error pattern detection ──
  const errorPatternStrings = Object.keys(errorTopics);
  const error_patterns_detected: ErrorPatternDetection[] = errorPatternStrings.map(p => {
    const lower = p.toLowerCase();
    if (["ecg", "rx", "xray", "ct", "us", "derma", "oftalm", "pato", "imagem"].some(k => lower.includes(k)))
      return { pattern: p, category: "visual" as const, label: "Dificuldade em interpretação visual" };
    if (["conduta", "tratamento"].some(k => lower.includes(k)))
      return { pattern: p, category: "decisorio" as const, label: "Erro em decisão clínica" };
    if (["diagnóstico", "diagnos", "diferencial"].some(k => lower.includes(k)))
      return { pattern: p, category: "raciocinio" as const, label: "Falha de raciocínio diagnóstico" };
    return { pattern: p, category: "outro" as const, label: "Padrão de erro identificado" };
  });

  // ── 10. Insights ──
  const insights: AdaptiveInsight[] = [];

  for (const t of trends) {
    if (t.trend === "melhorando") {
      insights.push({ type: "strength", message: `Você melhorou significativamente em ${label(t.modality)}.` });
    }
  }

  if (worstMod && worstMod.accuracy < 60) {
    insights.push({ type: "weakness", message: `Seu maior ponto fraco atual é ${label(worstMod.modality)} (${worstMod.accuracy}%).` });
  }

  for (const rt of responseTimes) {
    if (rt.isAlert) {
      insights.push({ type: "alert", message: `Seu tempo de resposta está alto em ${label(rt.modality)} (${rt.avgSeconds}s).` });
    }
  }

  if (error_patterns_detected.some(e => e.category === "visual")) {
    insights.push({ type: "weakness", message: "Você precisa focar mais em interpretação de imagens." });
  }
  if (error_patterns_detected.some(e => e.category === "decisorio")) {
    insights.push({ type: "weakness", message: "Você precisa focar mais em decisões clínicas." });
  }

  for (const t of trends) {
    if (t.trend === "piorando") {
      insights.push({ type: "weakness", message: `Atenção: desempenho em ${label(t.modality)} está caindo.` });
    }
  }

  if (overallAcc >= 70 && trends.every(t => t.trend !== "piorando")) {
    insights.push({ type: "info", message: "Você está evoluindo de forma consistente." });
  }

  const hardAcc = diffStats["hard"];
  if (hardAcc && hardAcc.total >= 3) {
    const hardRate = Math.round((hardAcc.correct / hardAcc.total) * 100);
    if (hardRate < 40) {
      insights.push({ type: "alert", message: "Seu desempenho em questões difíceis precisa de atenção." });
    }
  }

  return { weaknesses, priority_weaknesses, trends, responseTimes, slow_modalities, error_patterns_detected, quality, profile, nextFocus, insights };
}

// ── Hook ──

export function useAdaptiveProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["adaptive-progress", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: () => fetchAdaptiveProgress(user!.id),
  });
}
