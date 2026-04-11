/**
 * Mnemonic Intelligence Layer — CLS, RFS, and Orchestrator
 * Provides cognitive load scoring, risk prediction, and intervention decisions.
 */
import { supabase } from "@/integrations/supabase/client";

// ══════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════

export interface CLSResult {
  score: number;
  level: "leve" | "moderado" | "alto";
  factors: {
    tempo_resposta: number;
    erros_recentes: number;
    dificuldade: number;
    fadiga: number;
  };
}

export interface RFSResult {
  score: number;
  risk_level: "low" | "medium" | "high";
  predicted_error: boolean;
  factors: {
    accuracy_gap: number;
    response_time: number;
    error_recurrence: number;
    time_since_review: number;
    cls_medio: number;
    historical_weakness: number;
  };
}

export type InterventionAction = "none" | "hint" | "mnemonic" | "review" | "reduce_difficulty" | "tutor";

export interface InterventionDecision {
  action: InterventionAction;
  priority: number;
  reason: string;
}

// ══════════════════════════════════════════════════
// NÍVEL 2 — COGNITIVE LOAD SCORE (CLS)
// ══════════════════════════════════════════════════

export async function calculateCLS(userId: string, topic: string): Promise<CLSResult> {
  // FIX #3: Fetch performance data ONLY for the current topic
  // First resolve tema_id for the topic
  const { data: temaRows } = await supabase
    .from("temas_estudados")
    .select("id")
    .eq("user_id", userId)
    .ilike("tema", `%${topic}%`);

  const temaIds = temaRows?.map(r => r.id) || [];

  const [perfResult, errResult, sessionResult] = await Promise.all([
    temaIds.length > 0
      ? supabase
          .from("desempenho_questoes")
          .select("tempo_gasto, taxa_acerto, created_at")
          .eq("user_id", userId)
          .in("tema_id", temaIds)
          .order("created_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("error_bank")
      .select("vezes_errado, dificuldade")
      .eq("user_id", userId)
      .eq("tema", topic)
      .eq("dominado", false),
    supabase
      .from("study_action_events")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 3600000).toISOString())
      .order("created_at", { ascending: false }),
  ]);

  const perfs = perfResult.data || [];
  const errors = errResult.data || [];
  const recentActions = sessionResult.data || [];

  // Factor 1: Response time (normalized 0-1, >180s = 1.0)
  const avgTime = perfs.length > 0
    ? perfs.reduce((s, p) => s + (p.tempo_gasto || 60), 0) / perfs.length
    : 60;
  const tempoFactor = Math.min(avgTime / 180, 1.0);

  // Factor 2: Recent errors (normalized 0-1)
  const totalErrors = errors.reduce((s, e) => s + (e.vezes_errado || 1), 0);
  const errosFactor = Math.min(totalErrors / 10, 1.0);

  // Factor 3: Difficulty (normalized 0-1)
  const avgDifficulty = errors.length > 0
    ? errors.reduce((s, e) => s + (e.dificuldade || 5), 0) / errors.length
    : 5;
  const dificuldadeFactor = Math.min(avgDifficulty / 10, 1.0);

  // Factor 4: Fatigue (actions in last hour, normalized 0-1)
  const fadigaFactor = Math.min(recentActions.length / 30, 1.0);

  const score = (tempoFactor * 0.4) + (errosFactor * 0.3) + (dificuldadeFactor * 0.2) + (fadigaFactor * 0.1);

  const level: CLSResult["level"] = score < 0.4 ? "leve" : score <= 0.7 ? "moderado" : "alto";

  return {
    score: Math.round(score * 100) / 100,
    level,
    factors: {
      tempo_resposta: Math.round(tempoFactor * 100) / 100,
      erros_recentes: Math.round(errosFactor * 100) / 100,
      dificuldade: Math.round(dificuldadeFactor * 100) / 100,
      fadiga: Math.round(fadigaFactor * 100) / 100,
    },
  };
}

// ══════════════════════════════════════════════════
// NÍVEL 3 — RISK FACTOR SCORE (RFS)
// ══════════════════════════════════════════════════

export async function calculateRiskScore(userId: string, topic: string): Promise<RFSResult> {
  // FIX #4: Filter ALL queries by the current topic only
  const { data: temaRows } = await supabase
    .from("temas_estudados")
    .select("id")
    .eq("user_id", userId)
    .ilike("tema", `%${topic}%`);

  const temaIds = temaRows?.map(r => r.id) || [];

  const [perfResult, errResult, fsrsResult, clsResult] = await Promise.all([
    temaIds.length > 0
      ? supabase
          .from("desempenho_questoes")
          .select("taxa_acerto, tempo_gasto, created_at")
          .eq("user_id", userId)
          .in("tema_id", temaIds)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("error_bank")
      .select("vezes_errado, updated_at, dificuldade")
      .eq("user_id", userId)
      .eq("tema", topic)
      .eq("dominado", false),
    supabase
      .from("fsrs_cards")
      .select("due, stability, lapses")
      .eq("user_id", userId)
      .eq("card_type", "tema")
      .ilike("card_ref_id", `%${topic}%`)
      .limit(5),
    calculateCLS(userId, topic),
  ]);

  const perfs = perfResult.data || [];
  const errors = errResult.data || [];
  const fsrs = fsrsResult.data || [];

  // 1. Accuracy gap (1 - accuracy, normalized)
  const avgAccuracy = perfs.length > 0
    ? perfs.reduce((s, p) => s + (p.taxa_acerto || 0), 0) / perfs.length / 100
    : 0.5;
  const accuracyGap = 1 - avgAccuracy;

  // 2. Response time factor
  const avgTime = perfs.length > 0
    ? perfs.reduce((s, p) => s + (p.tempo_gasto || 60), 0) / perfs.length
    : 60;
  const timeFactor = Math.min(avgTime / 180, 1.0);

  // 3. Error recurrence
  const totalRecurrence = errors.reduce((s, e) => s + (e.vezes_errado || 1), 0);
  const recurrenceFactor = Math.min(totalRecurrence / 10, 1.0);

  // 4. Time since last review (days, normalized)
  const lastReview = errors.length > 0
    ? Math.max(...errors.map(e => {
        const d = e.updated_at ? new Date(e.updated_at).getTime() : Date.now();
        return (Date.now() - d) / 86400000;
      }))
    : 7;
  const reviewGapFactor = Math.min(lastReview / 30, 1.0);

  // 5. CLS average
  const clsFactor = clsResult.score;

  // 6. Historical weakness (FSRS lapses)
  const totalLapses = fsrs.reduce((s, c) => s + (c.lapses || 0), 0);
  const weaknessFactor = Math.min(totalLapses / 10, 1.0);

  const score =
    (accuracyGap * 0.30) +
    (timeFactor * 0.20) +
    (recurrenceFactor * 0.20) +
    (reviewGapFactor * 0.15) +
    (clsFactor * 0.10) +
    (weaknessFactor * 0.05);

  const risk_level: RFSResult["risk_level"] = score < 0.3 ? "low" : score <= 0.6 ? "medium" : "high";

  return {
    score: Math.round(score * 100) / 100,
    risk_level,
    predicted_error: score > 0.5,
    factors: {
      accuracy_gap: Math.round(accuracyGap * 100) / 100,
      response_time: Math.round(timeFactor * 100) / 100,
      error_recurrence: Math.round(recurrenceFactor * 100) / 100,
      time_since_review: Math.round(reviewGapFactor * 100) / 100,
      cls_medio: Math.round(clsFactor * 100) / 100,
      historical_weakness: Math.round(weaknessFactor * 100) / 100,
    },
  };
}

// ══════════════════════════════════════════════════
// NÍVEL 4 — ORCHESTRATOR: decideIntervention
// ══════════════════════════════════════════════════

export async function decideIntervention(
  userId: string,
  topic: string
): Promise<InterventionDecision> {
  const [cls, rfs] = await Promise.all([
    calculateCLS(userId, topic),
    calculateRiskScore(userId, topic),
  ]);

  // High risk + high cognitive load → mnemonic
  if (rfs.risk_level === "high" && cls.level === "alto") {
    return {
      action: "mnemonic",
      priority: 10,
      reason: `Risco alto (${rfs.score}) + carga cognitiva alta (${cls.score}) → gerar mnemônico para "${topic}"`,
    };
  }

  // High risk + moderate CL → mnemonic (lower priority)
  if (rfs.risk_level === "high" && cls.level === "moderado") {
    return {
      action: "mnemonic",
      priority: 8,
      reason: `Risco alto (${rfs.score}) + carga moderada → mnemônico recomendado para "${topic}"`,
    };
  }

  // High risk + low CL → review
  if (rfs.risk_level === "high" && cls.level === "leve") {
    return {
      action: "review",
      priority: 7,
      reason: `Risco alto (${rfs.score}) + carga leve → revisão direcionada para "${topic}"`,
    };
  }

  // Medium risk → hint
  if (rfs.risk_level === "medium") {
    return {
      action: "hint",
      priority: 4,
      reason: `Risco médio (${rfs.score}) → dica leve para "${topic}"`,
    };
  }

  // Low risk → no intervention
  return {
    action: "none",
    priority: 0,
    reason: `Risco baixo (${rfs.score}) → sem intervenção necessária`,
  };
}
