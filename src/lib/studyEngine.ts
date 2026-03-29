import { supabase } from "@/integrations/supabase/client";

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

// ── helpers ────────────────────────────────────────────────────────
function id(prefix: string, idx: number) {
  return `${prefix}-${idx}`;
}

function cap(n: number, max = 100) {
  return Math.min(Math.max(Math.round(n), 0), max);
}

// ── main engine ────────────────────────────────────────────────────
export async function generateRecommendations({ userId }: EngineInput): Promise<StudyRecommendation[]> {
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
  ]);

  // ── 1. Overdue / pending reviews (highest priority) ──────────
  const today = new Date().toISOString().split("T")[0];
  const pendingReviews = (revisoesRes.data || []) as any[];
  
  for (let i = 0; i < Math.min(pendingReviews.length, 5); i++) {
    const rev = pendingReviews[i];
    const isOverdue = rev.data_revisao <= today;
    const tema = rev.temas_estudados?.tema || "Tema";
    const spec = rev.temas_estudados?.especialidade || "Geral";
    const basePriority = isOverdue ? 95 : 80;
    const riskBonus = rev.risco_esquecimento === "alto" ? 5 : rev.risco_esquecimento === "medio" ? 2 : 0;

    recs.push({
      id: id("rev", i),
      type: "review",
      topic: tema,
      specialty: spec,
      priority: cap(basePriority + riskBonus - i),
      reason: isOverdue
        ? `Revisão atrasada de "${tema}" — risco de esquecer!`
        : `Revisão programada de "${tema}" para hoje.`,
      targetModule: "cronograma",
      targetPath: "/dashboard/cronograma",
      estimatedMinutes: 15,
    });
  }

  // ── 2. Error bank — recurring mistakes ───────────────────────
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

  // ── 3. Low-accuracy topics — need more practice ──────────────
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

  // ── 4. Clinical practice gap ─────────────────────────────────
  const practiceAttempts = practiceRes.data || [];
  const totalPractice = practiceAttempts.length;
  const totalCorrect = practiceAttempts.filter((a: any) => a.correct).length;
  const overallAccuracy = totalPractice > 0 ? (totalCorrect / totalPractice) * 100 : 0;
  const clinicalCount = (clinicalSimRes.data || []).length;
  const anamnesisCount = (anamnesisRes.data || []).length;

  if (overallAccuracy >= 70 && totalPractice >= 20 && clinicalCount < 3) {
    recs.push({
      id: "clinical-gap",
      type: "clinical",
      topic: "Simulação Clínica",
      specialty: "Prática Clínica",
      priority: 55,
      reason: `Boa acurácia teórica (${Math.round(overallAccuracy)}%), mas poucas simulações clínicas. Hora de praticar!`,
      targetModule: "plantao",
      targetPath: "/dashboard/simulacao-clinica",
      estimatedMinutes: 30,
    });
  }

  if (overallAccuracy >= 60 && totalPractice >= 10 && anamnesisCount < 2) {
    recs.push({
      id: "anamnesis-gap",
      type: "clinical",
      topic: "Treino de Anamnese",
      specialty: "Semiologia",
      priority: 50,
      reason: "Você ainda não praticou anamnese suficientemente. Treine a coleta de história clínica.",
      targetModule: "anamnese",
      targetPath: "/dashboard/anamnese",
      estimatedMinutes: 25,
    });
  }

  // ── 5. Simulado readiness ────────────────────────────────────
  const exams = examRes.data || [];
  if (overallAccuracy >= 65 && totalPractice >= 30 && exams.length < 3) {
    recs.push({
      id: "simulado-ready",
      type: "simulado",
      topic: "Simulado Completo",
      specialty: "Geral",
      priority: 45,
      reason: `Com ${Math.round(overallAccuracy)}% de acurácia, você está pronto para um simulado completo.`,
      targetModule: "simulado",
      targetPath: "/dashboard/simulados",
      estimatedMinutes: 60,
    });
  }

  // ── 6. New topics to explore ─────────────────────────────────
  const temas = (temasRes.data || []) as any[];
  const studiedSpecialties = new Set(temas.map((t: any) => t.especialidade));
  const CORE_SPECIALTIES = [
    "Clínica Médica", "Cirurgia", "Pediatria", "Ginecologia e Obstetrícia",
    "Saúde Coletiva", "Medicina de Emergência",
  ];
  const unexplored = CORE_SPECIALTIES.filter((s) => !studiedSpecialties.has(s));

  for (let i = 0; i < Math.min(unexplored.length, 2); i++) {
    recs.push({
      id: id("new", i),
      type: "new",
      topic: unexplored[i],
      specialty: unexplored[i],
      priority: cap(35 - i * 5),
      reason: `Você ainda não estudou "${unexplored[i]}". Comece pelo tutor!`,
      targetModule: "tutor",
      targetPath: "/dashboard/chatgpt",
      estimatedMinutes: 30,
    });
  }

  // ── Sort by priority and return top recommendations ──────────
  recs.sort((a, b) => b.priority - a.priority);
  return recs.slice(0, 8);
}
