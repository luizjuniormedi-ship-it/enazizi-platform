import { supabase } from "@/integrations/supabase/client";
import { adjustPlanByApprovalScore, getAdaptiveMode, type PlanWeights, type AdaptiveMode } from "./approvalScoreWeights";
import { adjustNewTopicsByLock, type ContentLockStatus } from "@/hooks/useContentLock";
import { retrievability as fsrsRetrievability, State as FsrsState } from "./fsrs";
import type { StudyTaskType, StudyObjective } from "./studyContext";

export type RecommendationType = "review" | "practice" | "clinical" | "new" | "error_review" | "simulado";
export type TargetModule = "tutor" | "questoes" | "flashcards" | "plantao" | "anamnese" | "simulado" | "cronograma" | "banco-erros";

export interface StudyRecommendation {
  id: string;
  type: RecommendationType;
  topic: string;
  specialty: string;
  subtopic?: string;
  priority: number; // 0-100
  reason: string;
  targetModule: TargetModule;
  targetPath: string;
  estimatedMinutes: number;
  difficulty?: string;
  objective?: StudyObjective;
  /** Category tag for anti-duplicate grouping */
  _groupKey?: string;
}

/** Adaptive state exposed to Dashboard/Mission/Mentor */
export interface AdaptiveState {
  approvalScore: number;
  weights: PlanWeights;
  mode: AdaptiveMode;
  lockStatus: ContentLockStatus;
  lockReasons: string[];
  /** Human-readable explanation of current focus */
  focusReason: string;
  /** Memory pressure: 0-100 based on overdue FSRS + reviews */
  memoryPressure: number;
  /** Overdue review count */
  overdueCount: number;
}

export interface EngineResult {
  recommendations: StudyRecommendation[];
  adaptive: AdaptiveState;
}

interface EngineInput {
  userId: string;
}

function id(prefix: string, idx: number) {
  return `${prefix}-${idx}`;
}

function cap(n: number, max = 100) {
  return Math.min(Math.max(Math.round(n), 0), max);
}

// ── Compute approval score (same logic as ApprovalScoreCard) ───
async function computeApprovalScore(userId: string, practiceData: any[], examData: any[], anamnesisData: any[], clinicalData: any[]): Promise<number> {
  const { data: domainData } = await supabase
    .from("medical_domain_map")
    .select("specialty, domain_score, questions_answered")
    .eq("user_id", userId);

  const specialties = domainData || [];
  const avgDomain = specialties.length > 0
    ? specialties.reduce((s, d) => s + (d.domain_score || 0), 0) / specialties.length
    : 0;

  const totalPractice = practiceData.length;
  const totalCorrect = practiceData.filter((a: any) => a.correct).length;
  const accuracy = totalPractice > 0 ? (totalCorrect / totalPractice) * 100 : 0;

  const volumeScore = Math.min((totalPractice / 500) * 100, 100);

  const activities = [
    totalPractice > 0,
    examData.length > 0,
    clinicalData.length > 0,
    anamnesisData.length > 0,
    false,
    false,
  ].filter(Boolean).length;
  const diversityScore = (activities / 6) * 100;

  return Math.round(
    accuracy * 0.35 +
    avgDomain * 0.25 +
    volumeScore * 0.20 +
    diversityScore * 0.20
  );
}

// ── Apply weights to limit slots per type ─────────────────────
function applyWeights(recs: StudyRecommendation[], weights: PlanWeights, maxTotal: number): StudyRecommendation[] {
  const slotReview = Math.max(1, Math.round(maxTotal * weights.reviewWeight));
  const slotQuestions = Math.max(1, Math.round(maxTotal * weights.questionsWeight));
  const slotClinical = Math.round(maxTotal * weights.practicalWeight);
  const slotNew = weights.maxNewTopics;

  const buckets: Record<string, number> = {
    review: 0, error_review: 0, practice: 0, clinical: 0, simulado: 0, new: 0,
  };
  const limits: Record<string, number> = {
    review: slotReview,
    error_review: slotQuestions,
    practice: slotQuestions,
    clinical: slotClinical,
    simulado: slotClinical,
    new: slotNew,
  };

  const result: StudyRecommendation[] = [];
  for (const rec of recs) {
    if (result.length >= maxTotal) break;
    const b = rec.type;
    if ((buckets[b] || 0) < (limits[b] || 2)) {
      result.push(rec);
      buckets[b] = (buckets[b] || 0) + 1;
    }
  }
  return result;
}

// ── Build focus reason ────────────────────────────────────────
function buildFocusReason(weights: PlanWeights, overdueCount: number, lockStatus: ContentLockStatus): string {
  if (lockStatus === "blocked") {
    return "Hoje o foco é revisão porque você tem muitas revisões atrasadas e precisa recuperar sua base.";
  }
  switch (weights.phase) {
    case "critico":
      return overdueCount > 5
        ? `Foco em revisões — ${overdueCount} revisões atrasadas e score abaixo de 50%.`
        : "Foco em revisões e correção de erros para recuperar sua base de conhecimento.";
    case "atencao":
      return "Hoje o sistema prioriza revisões e questões direcionadas para estabilizar seu desempenho.";
    case "competitivo":
      return "Hoje o sistema liberou simulados e prática clínica para refinar seu desempenho.";
    case "pronto":
      return "Fase final: simulados completos e cenários práticos para manter a prontidão.";
  }
}

// ── main engine ────────────────────────────────────────────────
export async function generateRecommendations({ userId }: EngineInput): Promise<EngineResult> {
 try {
  const recs: StudyRecommendation[] = [];

  // Individual queries with safe fallback — one failure never breaks the engine
  const safe = async <T>(fn: () => PromiseLike<{ data: T | null; error: any }>, label: string): Promise<T | null> => {
    try {
      const { data, error } = await fn();
      if (error) console.warn(`[StudyEngine] ${label}:`, error.message);
      return data;
    } catch (e) {
      console.warn(`[StudyEngine] ${label} failed silently:`, e);
      return null;
    }
  };

  const [
    revisoesData,
    errorBankData,
    desempenhoData,
    temasData,
    practiceData,
    examData,
    anamnesisData,
    clinicalSimData,
    fsrsDueData,
    mentorTargets,
    practicalExamData,
    profileData,
  ] = await Promise.all([
    safe(() => supabase
      .from("revisoes")
      .select("id, tema_id, data_revisao, status, prioridade, risco_esquecimento, temas_estudados(tema, especialidade)")
      .eq("user_id", userId)
      .eq("status", "pendente")
      .order("prioridade", { ascending: false })
      .limit(20), "revisoes"),
    safe(() => supabase
      .from("error_bank")
      .select("id, tema, subtema, vezes_errado, dominado, categoria_erro")
      .eq("user_id", userId)
      .eq("dominado", false)
      .order("vezes_errado", { ascending: false })
      .limit(20), "error_bank"),
    safe(() => supabase
      .from("desempenho_questoes")
      .select("tema_id, taxa_acerto, questoes_feitas, temas_estudados(tema, especialidade)")
      .eq("user_id", userId)
      .order("taxa_acerto", { ascending: true })
      .limit(20), "desempenho"),
    safe(() => supabase
      .from("temas_estudados")
      .select("id, tema, especialidade, data_estudo, status, dificuldade")
      .eq("user_id", userId)
      .order("data_estudo", { ascending: false })
      .limit(50), "temas"),
    safe(() => supabase
      .from("practice_attempts")
      .select("correct, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200), "practice"),
    safe(() => supabase
      .from("exam_sessions")
      .select("id, score, total_questions, finished_at")
      .eq("user_id", userId)
      .eq("status", "finished")
      .order("finished_at", { ascending: false })
      .limit(10), "exams"),
    safe(() => supabase
      .from("anamnesis_results")
      .select("id, specialty, final_score, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10), "anamnesis"),
    safe(() => supabase
      .from("anamnesis_sessions")
      .select("id, specialty, final_score, created_at")
      .eq("user_id", userId)
      .eq("status", "finished")
      .order("created_at", { ascending: false })
      .limit(10), "clinical_sim"),
    safe(() => supabase
      .from("fsrs_cards")
      .select("id, card_type, card_ref_id, stability, difficulty, state, due, lapses")
      .eq("user_id", userId)
      .lte("due", new Date().toISOString())
      .order("due", { ascending: true })
      .limit(30), "fsrs"),
    // Mentor theme plans targeting this student
    safe(() => supabase
      .from("mentor_theme_plan_targets")
      .select("plan_id")
      , "mentor_targets"),
    // Practical exam results for OSCE integration
    safe(() => supabase
      .from("practical_exam_results")
      .select("final_score, specialty, scores_json, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10), "practical_exams"),
    // Profile for exam_date
    safe(() => supabase
      .from("profiles")
      .select("exam_date")
      .eq("user_id", userId)
      .single(), "profile"),
  ]);

  // ── Load mentor topics if any active mentorships ───────────────
  let mentorTopics: string[] = [];
  const targetPlans = (mentorTargets || []) as any[];
  if (targetPlans.length > 0) {
    const planIds = [...new Set(targetPlans.map((t: any) => t.plan_id))];
    const activePlans = await safe(() => supabase
      .from("mentor_theme_plans")
      .select("id")
      .in("id", planIds)
      .eq("status", "active"), "mentor_active_plans");
    if (activePlans && (activePlans as any[]).length > 0) {
      const activeIds = (activePlans as any[]).map((p: any) => p.id);
      const topicsData = await safe(() => supabase
        .from("mentor_theme_plan_topics")
        .select("topic")
        .in("plan_id", activeIds), "mentor_topics");
      mentorTopics = [...new Set((topicsData as any[] || []).map((t: any) => t.topic))];
    }
  }

  // ── Compute approval score & weights ─────────────────────────
  const practiceAttempts = (practiceData || []) as any[];
  const exams = (examData || []) as any[];
  const anamnesisResults = (anamnesisData || []) as any[];
  const clinicalSims = (clinicalSimData || []) as any[];

  const approvalScore = await computeApprovalScore(userId, practiceAttempts, exams, anamnesisResults, clinicalSims);
  const weights = adjustPlanByApprovalScore(approvalScore);

  // ── Content Lock — compute inline for engine use ─────────────
  const today = new Date().toISOString().split("T")[0];
  const pendingReviews = (revisoesData || []) as any[];
  const overdueCount = pendingReviews.filter((r: any) => r.data_revisao <= today).length;
  const recentTotal = practiceAttempts.length;
  const recentErrors = practiceAttempts.filter((a: any) => !a.correct).length;
  const recentErrorRate = recentTotal > 0 ? (recentErrors / recentTotal) * 100 : 0;

  let lockStatus: ContentLockStatus = "allowed";
  const lockReasons: string[] = [];
  const blockHits = [overdueCount > 20, recentErrorRate > 70 && recentTotal >= 10].filter(Boolean).length;
  if (blockHits >= 2) {
    lockStatus = "blocked";
    if (overdueCount > 20) lockReasons.push(`${overdueCount} revisões atrasadas`);
    if (recentErrorRate > 70) lockReasons.push(`Taxa de erro ${Math.round(recentErrorRate)}%`);
  } else {
    const limitHits = [overdueCount >= 10, approvalScore < 50, recentErrorRate > 50 && recentTotal >= 5].filter(Boolean).length;
    if (limitHits >= 2) {
      lockStatus = "limited";
      if (overdueCount >= 10) lockReasons.push(`${overdueCount} revisões pendentes`);
      if (approvalScore < 50) lockReasons.push(`Score de aprovação ${approvalScore}%`);
      if (recentErrorRate > 50) lockReasons.push("Alto índice de erros recentes");
    }
  }
  // Adjust max new topics based on content lock
  weights.maxNewTopics = adjustNewTopicsByLock(weights.maxNewTopics, lockStatus);

  // ── FSRS memory pressure ─────────────────────────────────────
  const fsrsDue = (fsrsDueData || []) as any[];
  const memoryPressure = cap(
    (overdueCount / 20) * 50 + (fsrsDue.length / 30) * 50,
    100
  );

  // ── Build adaptive state ─────────────────────────────────────
  const mode = getAdaptiveMode(weights.phase);
  const focusReason = buildFocusReason(weights, overdueCount, lockStatus);
  const adaptive: AdaptiveState = {
    approvalScore,
    weights,
    mode,
    lockStatus,
    lockReasons,
    focusReason,
    memoryPressure,
    overdueCount,
  };

  // ── 1. Overdue / pending reviews ─────────────────────────────
  const seenTopics = new Set<string>();
  const addRec = (rec: StudyRecommendation) => {
    const groupKey = rec._groupKey || `${rec.type}:${rec.topic}`;
    if (seenTopics.has(groupKey)) return;
    seenTopics.add(groupKey);
    recs.push(rec);
  };

  for (let i = 0; i < Math.min(pendingReviews.length, 5); i++) {
    const rev = pendingReviews[i];
    const isOverdue = rev.data_revisao <= today;
    const tema = rev.temas_estudados?.tema || "Tema";
    const spec = rev.temas_estudados?.especialidade || "Geral";
    const basePriority = isOverdue ? 95 : 80;
    const riskBonus = rev.risco_esquecimento === "alto" ? 5 : rev.risco_esquecimento === "medio" ? 2 : 0;
    const phaseBonus = weights.phase === "critico" ? 5 : 0;
    // Aggressive: overdue > 3 days gets extra boost
    const daysOverdue = isOverdue ? Math.max(0, Math.floor((Date.now() - new Date(rev.data_revisao).getTime()) / 86400000)) : 0;
    const overdueBoost = daysOverdue > 3 ? 10 : 0;

    addRec({
      id: id("rev", i),
      type: "review",
      topic: tema,
      specialty: spec,
      priority: cap(basePriority + riskBonus + phaseBonus + overdueBoost - i),
      reason: isOverdue
        ? daysOverdue > 3
          ? `⚠️ Revisão de "${tema}" atrasada ${daysOverdue} dias — prioridade máxima!`
          : `Revisão atrasada de "${tema}" — risco de esquecer!`
        : `Revisão programada de "${tema}" para hoje.`,
      targetModule: "tutor",
      targetPath: "/dashboard/chatgpt",
      estimatedMinutes: 15,
      objective: "review",
      _groupKey: `review:${tema}`,
    });
  }

  // ── 2. Error bank ────────────────────────────────────────────
  const errors = (errorBankData || []) as any[];
  const errorLimit = weights.phase === "critico" ? 5 : 3;

  // Aggressive priority: check if any topic has vezes_errado >= 5 with no mastery
  const criticalErrors = errors.filter((e: any) => e.vezes_errado >= 5);
  const hasCriticalBlock = criticalErrors.length > 0 && approvalScore < 50;

  for (let i = 0; i < Math.min(errors.length, errorLimit); i++) {
    const err = errors[i];
    // Smoothed aggressive boost: cap individual boosts to avoid wild oscillation
    const errorBoost = Math.min(err.vezes_errado >= 3 ? 20 : 0, 20);
    const scoreBoost = approvalScore < 40 ? 10 : 0;
    const priority = cap(70 + Math.min(err.vezes_errado * 3, 15) - i * 2 + (weights.phase === "critico" ? 8 : 0) + errorBoost + scoreBoost);
    addRec({
      id: id("err", i),
      type: "error_review",
      topic: err.tema,
      specialty: err.subtema || "Geral",
      subtopic: err.subtema || undefined,
      priority,
      reason: err.vezes_errado >= 5
        ? `⚠️ "${err.tema}" errado ${err.vezes_errado}x — bloqueio ativo até domínio.`
        : `Você errou "${err.tema}" ${err.vezes_errado}x. Revise para fixar.`,
      targetModule: "tutor",
      targetPath: "/dashboard/chatgpt",
      estimatedMinutes: 10,
      objective: "correction",
      _groupKey: `error:${err.tema}`,
    });
  }

  // ── 3. Low-accuracy topics ───────────────────────────────────
  const weakTopics = (desempenhoData || []).filter((d: any) => d.taxa_acerto < 60 && d.questoes_feitas >= 3) as any[];
  for (let i = 0; i < Math.min(weakTopics.length, 3); i++) {
    const w = weakTopics[i];
    const tema = w.temas_estudados?.tema || "Tema";
    const spec = w.temas_estudados?.especialidade || "Geral";
    addRec({
      id: id("weak", i),
      type: "practice",
      topic: tema,
      specialty: spec,
      priority: cap(65 - i * 3),
      reason: `Acerto de ${Math.round(w.taxa_acerto)}% em "${tema}". Pratique mais questões.`,
      targetModule: "questoes",
      targetPath: "/dashboard/banco-questoes",
      estimatedMinutes: 20,
      objective: "reinforcement",
      _groupKey: `practice:${tema}`,
    });
  }

  // ── 4. Clinical practice ─────────────────────────────────────
  const totalPractice = practiceAttempts.length;
  const totalCorrect = practiceAttempts.filter((a: any) => a.correct).length;
  const overallAccuracy = totalPractice > 0 ? (totalCorrect / totalPractice) * 100 : 0;
  const clinicalCount = clinicalSims.length;
  const anamnesisCount = anamnesisResults.length;

  // Adaptive clinical priority based on phase
  const clinicalPriority = weights.phase === "pronto" ? 85 : weights.phase === "competitivo" ? 70 : weights.phase === "atencao" ? 55 : 40;

  // Detect theory-strong but practice-weak users
  const avgPracticalScore = [...clinicalSims, ...anamnesisResults]
    .map((r: any) => r.final_score || 0)
    .reduce((sum, s, _, arr) => sum + s / (arr.length || 1), 0);
  const practiceGap = overallAccuracy > 60 && avgPracticalScore < 60;

  if (practiceGap || weights.phase === "competitivo" || weights.phase === "pronto") {
    addRec({
      id: "clinical-gap",
      type: "clinical",
      topic: "Simulação Clínica",
      specialty: "Prática Clínica",
      priority: practiceGap ? clinicalPriority + 10 : clinicalPriority,
      reason: practiceGap
        ? "Bom desempenho teórico mas prática clínica fraca. Treine cenários!"
        : weights.phase === "pronto"
        ? "Fase final: pratique casos clínicos para consolidar."
        : `Boa acurácia (${Math.round(overallAccuracy)}%). Hora de praticar no plantão!`,
      targetModule: "plantao",
      targetPath: "/dashboard/simulacao-clinica",
      estimatedMinutes: 30,
      objective: "practice",
      difficulty: weights.phase === "pronto" ? "difícil" : "intermediário",
    });
  }

  if ((overallAccuracy >= 50 || weights.phase !== "critico") && anamnesisCount < 5) {
    addRec({
      id: "anamnesis-gap",
      type: "clinical",
      topic: "Treino de Anamnese",
      specialty: "Semiologia",
      priority: practiceGap ? clinicalPriority + 5 : clinicalPriority - 5,
      reason: "Treine a coleta de história clínica com paciente virtual.",
      targetModule: "anamnese",
      targetPath: "/dashboard/anamnese",
      estimatedMinutes: 25,
      objective: "practice",
    });
  }

  // ── 5. Simulado readiness ────────────────────────────────────
  const simuladoPriority = weights.phase === "pronto" ? 90 : weights.phase === "competitivo" ? 65 : 45;
  if (overallAccuracy >= 55 && totalPractice >= 20) {
    addRec({
      id: "simulado-ready",
      type: "simulado",
      topic: "Simulado Completo",
      specialty: "Geral",
      priority: simuladoPriority,
      reason: weights.phase === "pronto"
        ? "Fase de prova: faça simulados completos regularmente."
        : `Com ${Math.round(overallAccuracy)}% de acurácia, teste em condições reais.`,
      targetModule: "simulado",
      targetPath: "/dashboard/simulados",
      estimatedMinutes: 60,
      objective: "practice",
      difficulty: weights.phase === "pronto" || weights.phase === "competitivo" ? "difícil" : "médio",
    });
  }

  // ── 6. New topics (blocked if critical errors exist) ──────────
  // Aggressive: if any topic has vezes_errado >= 5 and accuracy < 50%, block new topics
  if (!hasCriticalBlock) {
    const temas = (temasData || []) as any[];
    const studiedSpecialties = new Set(temas.map((t: any) => t.especialidade));
    const CORE_SPECIALTIES = [
      "Clínica Médica", "Cirurgia", "Pediatria", "Ginecologia e Obstetrícia",
      "Saúde Coletiva", "Medicina de Emergência",
    ];
    const unexplored = CORE_SPECIALTIES.filter((s) => !studiedSpecialties.has(s));

    const isNewUser = temas.length === 0 && (practiceAttempts as any[]).length === 0;
    const maxNew = isNewUser ? Math.max(weights.maxNewTopics, 3) : weights.maxNewTopics;
    for (let i = 0; i < Math.min(unexplored.length, maxNew); i++) {
      addRec({
        id: id("new", i),
        type: "new",
        topic: unexplored[i],
        specialty: unexplored[i],
        priority: cap(isNewUser ? 80 - i * 5 : 35 - i * 5),
        reason: `Você ainda não estudou "${unexplored[i]}". Comece pelo tutor!`,
        targetModule: "tutor",
        targetPath: "/dashboard/chatgpt",
        estimatedMinutes: 30,
        objective: "new_content",
      });
    }
  }

  // ── 7. FSRS due flashcard reviews ────────────────────────────
  const flashcardDue = fsrsDue.filter((c: any) => c.card_type === "flashcard");
  if (flashcardDue.length > 0) {
    flashcardDue.sort((a: any, b: any) => a.stability - b.stability);
    const urgency = flashcardDue.length > 10 ? "alta" : flashcardDue.length > 3 ? "moderada" : "normal";
    addRec({
      id: "fsrs-flashcards",
      type: "review",
      topic: `${flashcardDue.length} Flashcards`,
      specialty: "Revisão Espaçada",
      priority: cap(85 + Math.min(flashcardDue.length, 10)),
      reason: flashcardDue.length > 5
        ? `${flashcardDue.length} flashcards pendentes — prioridade ${urgency}!`
        : `${flashcardDue.length} flashcard(s) pronto(s) para revisão.`,
      targetModule: "flashcards",
      targetPath: "/dashboard/flashcards",
      estimatedMinutes: Math.max(5, flashcardDue.length * 2),
      objective: "review",
    });
  }

  // ── Mentor topic priority boost ───────────────────────────────
  if (mentorTopics.length > 0) {
    for (const rec of recs) {
      const isMentorTopic = mentorTopics.some(mt =>
        rec.topic.toLowerCase().includes(mt.toLowerCase()) ||
        rec.specialty.toLowerCase().includes(mt.toLowerCase())
      );
      if (isMentorTopic) {
        rec.priority = cap(rec.priority + 10);
        if (!rec.reason.includes("📋")) {
          rec.reason = `📋 ${rec.reason}`;
        }
      }
    }
  }

  // ── Sort by priority then apply weight-based slot limits ─────
  recs.sort((a, b) => b.priority - a.priority);
  const result = applyWeights(recs, weights, 8);

  // ── FALLBACK: guarantee at least 1 task for any user ─────────
  if (result.length === 0) {
    return {
      recommendations: [{
        id: "fallback-start",
        type: "new",
        topic: "Clínica Médica",
        specialty: "Clínica Médica",
        priority: 90,
        reason: "Vamos começar! Estude com o Tutor IA.",
        targetModule: "tutor",
        targetPath: "/dashboard/chatgpt",
        estimatedMinutes: 20,
      }],
      adaptive,
    };
  }

  return { recommendations: result, adaptive };
 } catch (err) {
  console.error("[StudyEngine] Error generating recommendations:", err);
  return {
    recommendations: [{
      id: "fallback-error",
      type: "new",
      topic: "Clínica Médica",
      specialty: "Clínica Médica",
      priority: 90,
      reason: "Vamos começar! Estude com o Tutor IA.",
      targetModule: "tutor",
      targetPath: "/dashboard/chatgpt",
      estimatedMinutes: 20,
    }],
    adaptive: {
      approvalScore: 0,
      weights: adjustPlanByApprovalScore(0),
      mode: getAdaptiveMode("critico"),
      lockStatus: "allowed",
      lockReasons: [],
      focusReason: "Vamos começar seus estudos!",
      memoryPressure: 0,
      overdueCount: 0,
    },
  };
 }
}
