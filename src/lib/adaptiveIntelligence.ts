/**
 * Adaptive Intelligence Layer — ENAZIZI
 * Analyses performance data and generates actionable insights.
 */

// ── Types ──

export interface PerformanceInput {
  by_modality: Record<string, number>;
  by_difficulty: Record<string, number>;
  response_time: Record<string, number>;
  error_patterns: string[];
}

export type WeaknessLevel = "FRAQUEZA_CRITICA" | "FRAQUEZA_MODERADA" | "ESTAVEL" | "FORTE";

export interface ModalityClassification {
  modality: string;
  accuracy: number;
  level: WeaknessLevel;
}

export interface PriorityWeakness {
  modality: string;
  accuracy: number;
  responseTime: number;
  inErrorPatterns: boolean;
  compositeScore: number;
}

export interface TrendEntry {
  modality: string;
  history: number[];
  trend: "melhorando" | "piorando" | "estavel";
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

export interface AdaptiveOutput {
  weaknesses: ModalityClassification[];
  priority_weaknesses: PriorityWeakness[];
  trends: TrendEntry[];
  slow_modalities: SlowModality[];
  error_patterns_detected: ErrorPatternDetection[];
  profile: string;
  profile_emoji: string;
  next_simulado_focus: string;
  insights: string[];
}

// ── Labels ──

const LABELS: Record<string, string> = {
  ecg: "ECG", xray: "RX", dermatology: "Dermatologia",
  ct: "Tomografia", us: "Ultrassom", pathology: "Patologia",
  ophthalmology: "Oftalmologia", text: "Textual",
};
function l(m: string) { return LABELS[m] || m.toUpperCase(); }

// ── Classification ──

function classifyLevel(acc: number): WeaknessLevel {
  if (acc < 50) return "FRAQUEZA_CRITICA";
  if (acc < 65) return "FRAQUEZA_MODERADA";
  if (acc < 80) return "ESTAVEL";
  return "FORTE";
}

// ── Core analysis ──

export function analyzePerformance(
  perf: PerformanceInput,
  history?: number[][] // each entry = array of accuracies per session, newest last
): AdaptiveOutput {
  // 3.1 Classification
  const weaknesses: ModalityClassification[] = Object.entries(perf.by_modality)
    .map(([mod, acc]) => ({ modality: mod, accuracy: acc, level: classifyLevel(acc) }))
    .sort((a, b) => a.accuracy - b.accuracy);

  // 3.2 Priority weaknesses (composite: low acc + high time + in error_patterns)
  const priority_weaknesses: PriorityWeakness[] = Object.entries(perf.by_modality)
    .map(([mod, acc]) => {
      const rt = perf.response_time[mod] || 0;
      const inErr = perf.error_patterns.some(p => p.toLowerCase().includes(mod.toLowerCase()));
      const composite = (100 - acc) * 0.5 + Math.min(rt / 3, 50) * 0.3 + (inErr ? 20 : 0);
      return { modality: mod, accuracy: acc, responseTime: rt, inErrorPatterns: inErr, compositeScore: Math.round(composite) };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 3);

  // 3.3 Trends (from history if available, else empty)
  const trends: TrendEntry[] = [];
  if (history && history.length >= 2) {
    const mods = Object.keys(perf.by_modality);
    for (let i = 0; i < mods.length; i++) {
      const h = history.map(session => session[i]).filter(v => v !== undefined && v !== null);
      if (h.length >= 2) {
        const first = h[0];
        const last = h[h.length - 1];
        const delta = last - first;
        trends.push({
          modality: mods[i],
          history: h,
          trend: delta > 5 ? "melhorando" : delta < -5 ? "piorando" : "estavel",
        });
      }
    }
  }

  // 3.4 Slow modalities
  const slow_modalities: SlowModality[] = Object.entries(perf.response_time)
    .map(([mod, seconds]) => ({
      modality: mod,
      seconds,
      alertLevel: seconds > 180 ? "critico" as const : seconds > 150 ? "moderado" as const : "normal" as const,
    }))
    .sort((a, b) => b.seconds - a.seconds);

  // 3.5 Error pattern detection
  const error_patterns_detected: ErrorPatternDetection[] = perf.error_patterns.map(p => {
    const lower = p.toLowerCase();
    if (["imagem", "visual", "ecg", "rx", "xray", "ct", "us", "derma", "oftalm", "pato"].some(k => lower.includes(k)))
      return { pattern: p, category: "visual" as const, label: "Dificuldade em interpretação visual" };
    if (["conduta", "tratamento", "manejo", "terapêutica"].some(k => lower.includes(k)))
      return { pattern: p, category: "decisorio" as const, label: "Erro em decisão clínica" };
    if (["diagnóstico", "diagnos", "diferencial", "raciocínio"].some(k => lower.includes(k)))
      return { pattern: p, category: "raciocinio" as const, label: "Falha de raciocínio diagnóstico" };
    return { pattern: p, category: "outro" as const, label: "Padrão de erro identificado" };
  });

  // 4. Profile
  const modAccs = Object.values(perf.by_modality);
  const avgAcc = modAccs.length > 0 ? modAccs.reduce((a, b) => a + b, 0) / modAccs.length : 50;
  const imageMods = Object.entries(perf.by_modality).filter(([m]) => m !== "text");
  const avgImage = imageMods.length > 0 ? imageMods.reduce((a, [, v]) => a + v, 0) / imageMods.length : 50;
  const textAcc = perf.by_modality["text"] ?? 50;
  const times = Object.values(perf.response_time);
  const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 60;

  const hasVisualErr = error_patterns_detected.some(e => e.category === "visual");
  const hasDecisionErr = error_patterns_detected.some(e => e.category === "decisorio");

  let profile: string;
  let profile_emoji: string;

  if (hasVisualErr && avgImage < 55) {
    profile = "Aluno com dificuldade em interpretação de imagem";
    profile_emoji = "🖼️";
  } else if (textAcc > avgImage + 15) {
    profile = "Perfil clínico forte, dificuldade em imagem";
    profile_emoji = "🧠";
  } else if (hasDecisionErr && avgAcc >= 60) {
    profile = "Bom diagnóstico, falha em conduta";
    profile_emoji = "🎯";
  } else if (avgTime > 150 && avgAcc >= 65) {
    profile = "Lento porém consistente";
    profile_emoji = "🐢";
  } else if (avgTime < 60 && avgAcc < 55) {
    profile = "Rápido porém com erros conceituais";
    profile_emoji = "⚡";
  } else if (avgAcc >= 75) {
    const worstMod = weaknesses[0];
    if (worstMod && worstMod.accuracy < 70) {
      profile = `Perfil equilibrado com leve fraqueza em ${l(worstMod.modality)}`;
      profile_emoji = "📊";
    } else {
      profile = "Desempenho consistente e sólido";
      profile_emoji = "🎯";
    }
  } else {
    profile = "Em desenvolvimento — foco nos fundamentos";
    profile_emoji = "📚";
  }

  // 5. Next focus
  const focusMod = priority_weaknesses[0];
  const focusDifficulty = focusMod && focusMod.accuracy < 50 ? "médio" : "alto";
  const focusType = error_patterns_detected.some(e => e.category === "decisorio")
    ? "decisão clínica"
    : "diagnóstico diferencial";
  const next_simulado_focus = focusMod
    ? `Próximo simulado focará em ${l(focusMod.modality)} com questões de ${focusType} em nível ${focusDifficulty}.`
    : "Continue praticando para gerar recomendações personalizadas.";

  // 6. Insights
  const insights: string[] = [];

  // Trends
  for (const t of trends) {
    if (t.trend === "melhorando") insights.push(`Você está melhorando em ${l(t.modality)}.`);
  }

  // Worst modality
  if (focusMod && focusMod.accuracy < 60) {
    insights.push(`Seu maior ponto fraco atual é ${l(focusMod.modality)}.`);
  }

  // Slow times
  for (const s of slow_modalities) {
    if (s.alertLevel === "critico") {
      insights.push(`Seu tempo de resposta está alto em ${l(s.modality)} (${s.seconds}s).`);
    }
  }

  // Error patterns
  if (hasVisualErr) insights.push("Você precisa focar mais em interpretação de imagens.");
  if (hasDecisionErr) insights.push("Você precisa focar mais em decisões clínicas.");

  // Declining
  for (const t of trends) {
    if (t.trend === "piorando") insights.push(`Atenção: desempenho em ${l(t.modality)} está caindo.`);
  }

  // Positive overall
  if (avgAcc >= 70 && trends.every(t => t.trend !== "piorando")) {
    insights.push("Você está evoluindo de forma consistente.");
  }

  // Difficulty analysis
  const diffEntries = Object.entries(perf.by_difficulty);
  const hardAcc = perf.by_difficulty["hard"];
  if (hardAcc !== undefined && hardAcc < 40) {
    insights.push("Seu desempenho em questões difíceis precisa de atenção.");
  }

  return {
    weaknesses,
    priority_weaknesses,
    trends,
    slow_modalities,
    error_patterns_detected,
    profile,
    profile_emoji,
    next_simulado_focus,
    insights,
  };
}
