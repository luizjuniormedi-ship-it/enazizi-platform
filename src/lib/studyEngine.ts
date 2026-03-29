import { supabase } from "@/integrations/supabase/client";
import { adjustPlanByApprovalScore, type PlanWeights } from "./approvalScoreWeights";
import { adjustNewTopicsByLock, type ContentLockStatus } from "@/hooks/useContentLock";
import { retrievability as fsrsRetrievability, State as FsrsState } from "./fsrs";

export type RecommendationType = "review" | "practice" | "clinical" | "new" | "error_review" | "simulado";
export type TargetModule = "tutor" | "questoes" | "flashcards" | "plantao" | "anamnese" | "simulado" | "cronograma" | "banco-erros";

export interface StudyRecommendation {
  id: string;
  type: RecommendationType;
  topic: string;
  specialty: string;
  priority: number; // 0-100
  reason: string;
  targetModule: TargetModule;
  targetPath: string;
  estimatedMinutes: number;
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
    false, // discursivas — not loaded here, minor impact
    false, // summaries
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

// ── main engine ────────────────────────────────────────────────
export async function generateRecommendations({ userId }: EngineInput): Promise<StudyRecommendation[]> {
 try {
  const recs: StudyRecommendation[] = [];

  const [
    revisoesRes,
    errorBankRes,
    desempenhoRes,
    temasRes,
    practiceRes,
    examRes,
    anamnesisRes,
    clinicalSimRes,
    fsrsDueRes,
  ] = await Promise.all([
    supabase
      .from("revisoes")
      .select("id, tema_id, data_revisao, status, prioridade, risco_esquecimento, temas_estudados(tema, especialidade)")
      .eq("user_id", userId)
      .eq("status", "pendente")
      .order("prioridade", { ascending: false })
      .limit(20),
    supabase
      .from("error_bank")
      .select("id, tema, subtema, vezes_errado, dominado, categoria_erro")
      .eq("user_id", userId)
      .eq("dominado", false)
      .order("vezes_errado", { ascending: false })
      .limit(20),
    supabase
      .from("desempenho_questoes")
      .select("tema_id, taxa_acerto, questoes_feitas, temas_estudados(tema, especialidade)")
      .eq("user_id", userId)
      .order("taxa_acerto", { ascending: true })
      .limit(20),
    supabase
      .from("temas_estudados")
      .select("id, tema, especialidade, data_estudo, status, dificuldade")
      .eq("user_id", userId)
      .order("data_estudo", { ascending: false })
      .limit(50),
    supabase
      .from("practice_attempts")
      .select("correct, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("exam_sessions")
      .select("id, score, total_questions, finished_at")
      .eq("user_id", userId)
      .eq("status", "finished")
      .order("finished_at", { ascending: false })
      .limit(10),
    supabase
      .from("anamnesis_results")
      .select("id, specialty, final_score, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("simulation_history")
      .select("id, specialty, final_score, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    // FSRS due cards — all types
    supabase
      .from("fsrs_cards")
      .select("id, card_type, card_ref_id, stability, difficulty, state, due, lapses")
      .eq("user_id", userId)
      .lte("due", new Date().toISOString())
      .order("due", { ascending: true })
      .limit(30),
  ]);

  // ── Compute approval score & weights ─────────────────────────
  const practiceAttempts = practiceRes.data || [];
  const exams = examRes.data || [];
  const anamnesisResults = anamnesisRes.data || [];
  const clinicalSims = clinicalSimRes.data || [];

  const approvalScore = await computeApprovalScore(userId, practiceAttempts, exams, anamnesisResults, clinicalSims);
  const weights = adjustPlanByApprovalScore(approvalScore);

  // ── Content Lock — compute inline for engine use ─────────────
  const today = new Date().toISOString().split("T")[0];
  const pendingReviews = (revisoesRes.data || []) as any[];
  const overdueCount = pendingReviews.filter((r: any) => r.data_revisao <= today).length;
  const recentTotal = practiceAttempts.length;
  const recentErrors = practiceAttempts.filter((a: any) => !a.correct).length;
  const recentErrorRate = recentTotal > 0 ? (recentErrors / recentTotal) * 100 : 0;

  let lockStatus: ContentLockStatus = "allowed";
  const blockHits = [overdueCount > 20, recentErrorRate > 70 && recentTotal >= 10].filter(Boolean).length;
  if (blockHits >= 2) {
    lockStatus = "blocked";
  } else {
    const limitHits = [overdueCount >= 10, approvalScore < 50, recentErrorRate > 50 && recentTotal >= 5].filter(Boolean).length;
    if (limitHits >= 2) lockStatus = "limited";
  }
  // Adjust max new topics based on content lock
  weights.maxNewTopics = adjustNewTopicsByLock(weights.maxNewTopics, lockStatus);

  // ── 1. Overdue / pending reviews ─────────────────────────────

  for (let i = 0; i < Math.min(pendingReviews.length, 5); i++) {
    const rev = pendingReviews[i];
    const isOverdue = rev.data_revisao <= today;
    const tema = rev.temas_estudados?.tema || "Tema";
    const spec = rev.temas_estudados?.especialidade || "Geral";
    const basePriority = isOverdue ? 95 : 80;
    const riskBonus = rev.risco_esquecimento === "alto" ? 5 : rev.risco_esquecimento === "medio" ? 2 : 0;
    // Boost review priority in critical phase
    const phaseBonus = weights.phase === "critico" ? 5 : 0;

    recs.push({
      id: id("rev", i),
      type: "review",
      topic: tema,
      specialty: spec,
      priority: cap(basePriority + riskBonus + phaseBonus - i),
      reason: isOverdue
        ? `Revisão atrasada de "${tema}" — risco de esquecer!`
        : `Revisão programada de "${tema}" para hoje.`,
      targetModule: "cronograma",
      targetPath: "/dashboard/planner",
      estimatedMinutes: 15,
    });
  }

  // ── 2. Error bank ────────────────────────────────────────────
  const errors = (errorBankRes.data || []) as any[];
  for (let i = 0; i < Math.min(errors.length, 3); i++) {
    const err = errors[i];
    const priority = cap(70 + err.vezes_errado * 5 - i * 2);
    recs.push({
      id: id("err", i),
      type: "error_review",
      topic: err.tema,
      specialty: err.subtema || "Geral",
      priority,
      reason: `Você errou "${err.tema}" ${err.vezes_errado}x. Revise para fixar.`,
      targetModule: "banco-erros",
      targetPath: "/dashboard/banco-erros",
      estimatedMinutes: 10,
    });
  }

  // ── 3. Low-accuracy topics ───────────────────────────────────
  const weakTopics = (desempenhoRes.data || []).filter((d: any) => d.taxa_acerto < 60 && d.questoes_feitas >= 3) as any[];
  for (let i = 0; i < Math.min(weakTopics.length, 3); i++) {
    const w = weakTopics[i];
    const tema = w.temas_estudados?.tema || "Tema";
    const spec = w.temas_estudados?.especialidade || "Geral";
    recs.push({
      id: id("weak", i),
      type: "practice",
      topic: tema,
      specialty: spec,
      priority: cap(65 - i * 3),
      reason: `Acerto de ${Math.round(w.taxa_acerto)}% em "${tema}". Pratique mais questões.`,
      targetModule: "questoes",
      targetPath: "/dashboard/banco-questoes",
      estimatedMinutes: 20,
    });
  }

  // ── 4. Clinical practice ─────────────────────────────────────
  const totalPractice = practiceAttempts.length;
  const totalCorrect = practiceAttempts.filter((a: any) => a.correct).length;
  const overallAccuracy = totalPractice > 0 ? (totalCorrect / totalPractice) * 100 : 0;
  const clinicalCount = clinicalSims.length;
  const anamnesisCount = anamnesisResults.length;

  // In competitive/ready phases, always suggest clinical if not enough done
  const clinicalThreshold = weights.phase === "competitivo" || weights.phase === "pronto" ? 1 : 3;
  const clinicalPriority = weights.phase === "pronto" ? 80 : weights.phase === "competitivo" ? 65 : 55;

  if ((overallAccuracy >= 60 || weights.phase === "competitivo" || weights.phase === "pronto") && clinicalCount < clinicalThreshold + 5) {
    recs.push({
      id: "clinical-gap",
      type: "clinical",
      topic: "Simulação Clínica",
      specialty: "Prática Clínica",
      priority: clinicalPriority,
      reason: weights.phase === "pronto"
        ? "Fase final: pratique casos clínicos para consolidar."
        : `Boa acurácia (${Math.round(overallAccuracy)}%). Hora de praticar no plantão!`,
      targetModule: "plantao",
      targetPath: "/dashboard/simulacao-clinica",
      estimatedMinutes: 30,
    });
  }

  if ((overallAccuracy >= 50 || weights.phase !== "critico") && anamnesisCount < 5) {
    recs.push({
      id: "anamnesis-gap",
      type: "clinical",
      topic: "Treino de Anamnese",
      specialty: "Semiologia",
      priority: clinicalPriority - 5,
      reason: "Treine a coleta de história clínica com paciente virtual.",
      targetModule: "anamnese",
      targetPath: "/dashboard/anamnese",
      estimatedMinutes: 25,
    });
  }

  // ── 5. Simulado readiness ────────────────────────────────────
  const simuladoPriority = weights.phase === "pronto" ? 85 : weights.phase === "competitivo" ? 60 : 45;
  if (overallAccuracy >= 55 && totalPractice >= 20) {
    recs.push({
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
    });
  }

  // ── 6. New topics ────────────────────────────────────────────
  const temas = (temasRes.data || []) as any[];
  const studiedSpecialties = new Set(temas.map((t: any) => t.especialidade));
  const CORE_SPECIALTIES = [
    "Clínica Médica", "Cirurgia", "Pediatria", "Ginecologia e Obstetrícia",
    "Saúde Coletiva", "Medicina de Emergência",
  ];
  const unexplored = CORE_SPECIALTIES.filter((s) => !studiedSpecialties.has(s));

  // For new users (no data at all), boost maxNewTopics so they get a meaningful session
  const isNewUser = temas.length === 0 && practiceAttempts.length === 0;
  const maxNew = isNewUser ? Math.max(weights.maxNewTopics, 3) : weights.maxNewTopics;
  for (let i = 0; i < Math.min(unexplored.length, maxNew); i++) {
    recs.push({
      id: id("new", i),
      type: "new",
      topic: unexplored[i],
      specialty: unexplored[i],
      priority: cap(isNewUser ? 80 - i * 5 : 35 - i * 5),
      reason: `Você ainda não estudou "${unexplored[i]}". Comece pelo tutor!`,
      targetModule: "tutor",
      targetPath: "/dashboard/chatgpt",
      estimatedMinutes: 30,
    });
  }

  // ── 7. FSRS due flashcard reviews ────────────────────────────
  const fsrsDue = (fsrsDueRes.data || []) as any[];
  const flashcardDue = fsrsDue.filter((c: any) => c.card_type === "flashcard");
  if (flashcardDue.length > 0) {
    const now = new Date();
    // Sort by lowest stability first (most at risk of forgetting)
    flashcardDue.sort((a: any, b: any) => a.stability - b.stability);
    const count = Math.min(flashcardDue.length, 5);
    const urgency = count > 10 ? "alta" : count > 3 ? "moderada" : "normal";
    recs.push({
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
    });
  }

  // ── Sort by priority then apply weight-based slot limits ─────
  recs.sort((a, b) => b.priority - a.priority);
  const result = applyWeights(recs, weights, 8);

  // ── FALLBACK: guarantee at least 1 task for any user ─────────
  if (result.length === 0) {
    return [{
      id: "fallback-start",
      type: "new",
      topic: "Clínica Médica",
      specialty: "Clínica Médica",
      priority: 90,
      reason: "Vamos começar! Estude com o Tutor IA.",
      targetModule: "tutor",
      targetPath: "/dashboard/chatgpt",
      estimatedMinutes: 20,
    }];
  }

  return result;
 } catch (err) {
  console.error("[StudyEngine] Error generating recommendations:", err);
  // Return fallback task so the user is never stuck
  return [{
    id: "fallback-error",
    type: "new",
    topic: "Clínica Médica",
    specialty: "Clínica Médica",
    priority: 90,
    reason: "Vamos começar! Estude com o Tutor IA.",
    targetModule: "tutor",
    targetPath: "/dashboard/chatgpt",
    estimatedMinutes: 20,
  }];
 }
}
