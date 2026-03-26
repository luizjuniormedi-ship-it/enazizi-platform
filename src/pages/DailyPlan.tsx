import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Brain, Clock, BookOpen, RefreshCw, CheckCircle2, Loader2, Zap, Target, FlipVertical, GraduationCap, Calendar, AlertTriangle, Layers, Timer, GripVertical, Info, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ModuleHelpButton from "@/components/layout/ModuleHelpButton";
import { supabase } from "@/integrations/supabase/client";
import { updateStudyPerformanceContext } from "@/lib/cronogramaSync";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import DailyPlanProgress from "@/components/daily-plan/DailyPlanProgress";
import MasteryBadge, { getMasteryLevel } from "@/components/daily-plan/MasteryBadge";
import PomodoroTimer from "@/components/daily-plan/PomodoroTimer";
import MicroQuizDialog from "@/components/daily-plan/MicroQuizDialog";
import ClassBenchmark from "@/components/daily-plan/ClassBenchmark";
import SelfAssessmentDialog from "@/components/daily-plan/SelfAssessmentDialog";
import type { StudyBlock, DailyPlanData, ScheduledReview } from "@/components/daily-plan/DailyPlanTypes";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";

const typeIcons: Record<string, typeof Brain> = {
  study: BookOpen,
  review: RefreshCw,
  practice: Target,
  flashcards: FlipVertical,
};

const priorityColors: Record<string, string> = {
  high: "border-destructive/50 bg-destructive/5",
  medium: "border-warning/50 bg-warning/5",
  low: "border-muted bg-muted/30",
};

const reviewTimeEstimates: Record<string, number> = {
  D1: 20,
  D3: 15,
  D7: 12,
  D15: 10,
  D30: 8,
};

const DailyPlan = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<DailyPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());
  const [scheduledReviews, setScheduledReviews] = useState<ScheduledReview[]>([]);
  const [completedReviews, setCompletedReviews] = useState<Set<string>>(new Set());
  const [todayTopics, setTodayTopics] = useState<Array<{ id: string; tema: string; especialidade: string; subtopico: string | null }>>([]);
  const [completedInitialTopics, setCompletedInitialTopics] = useState<Set<string>>(new Set());
  const [masteryData, setMasteryData] = useState<Map<string, { correctRate: number; reviewsDone: number }>>(new Map());
  const [dailyMinutes, setDailyMinutes] = useState(240);
  const [overflowReviews, setOverflowReviews] = useState<ScheduledReview[]>([]);
  const [overflowTopics, setOverflowTopics] = useState<Array<{ id: string; tema: string; especialidade: string; subtopico: string | null }>>([]);
  const [showOverflowReviews, setShowOverflowReviews] = useState(false);
  const [showOverflowTopics, setShowOverflowTopics] = useState(false);

  // Pomodoro state
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  const [pomodoroTopic, setPomodoroTopic] = useState("");

  // Micro-quiz state
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizReview, setQuizReview] = useState<{ id: string; tema: string; especialidade: string } | null>(null);

  // Self-assessment state
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [assessmentTopic, setAssessmentTopic] = useState("");
  const [pendingBlockOrder, setPendingBlockOrder] = useState<number | null>(null);

  // Drag & drop state
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadToday = async () => {
      const today = new Date().toISOString().split("T")[0];

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [planRes, reviewsRes, attemptsRes, todayTemasRes, profileRes] = await Promise.all([
        supabase
          .from("daily_plans")
          .select("*")
          .eq("user_id", user.id)
          .eq("plan_date", today)
          .maybeSingle(),
        supabase
          .from("revisoes")
          .select("id, tema_id, tipo_revisao, data_revisao, status, prioridade, risco_esquecimento")
          .eq("user_id", user.id)
          .eq("status", "pendente")
          .lte("data_revisao", today)
          .order("prioridade", { ascending: false }),
        supabase
          .from("desempenho_questoes")
          .select("tema_id, questoes_feitas, taxa_acerto")
          .eq("user_id", user.id),
        supabase
          .from("temas_estudados")
          .select("id, tema, especialidade, subtopico")
          .eq("user_id", user.id)
          .eq("status", "ativo"),
        supabase
          .from("profiles")
          .select("daily_study_hours")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      const userDailyMinutes = Math.round((profileRes.data?.daily_study_hours || 4) * 60);
      setDailyMinutes(userDailyMinutes);

      if (planRes.data) {
        setPlan(planRes.data.plan_json as unknown as DailyPlanData);
        const completed = (planRes.data.completed_blocks as number[]) || [];
        setCompletedBlocks(new Set(completed));
      }

      // Build mastery map from desempenho
      const mMap = new Map<string, { correctRate: number; reviewsDone: number }>();
      if (attemptsRes.data) {
        for (const d of attemptsRes.data) {
          const existing = mMap.get(d.tema_id) || { correctRate: 0, reviewsDone: 0 };
          existing.correctRate = Number(d.taxa_acerto) / 100;
          mMap.set(d.tema_id, existing);
        }
      }

      // Enrich reviews with tema info
      let usedReviewMinutes = 0;
      if (reviewsRes.data && reviewsRes.data.length > 0) {
        const temaIds = [...new Set(reviewsRes.data.map(r => r.tema_id))];
        const { data: temas } = await supabase
          .from("temas_estudados")
          .select("id, tema, especialidade, subtopico")
          .in("id", temaIds);

        // Count reviews done per tema
        const { data: doneReviews } = await supabase
          .from("revisoes")
          .select("tema_id")
          .eq("user_id", user.id)
          .eq("status", "concluida")
          .in("tema_id", temaIds);

        const reviewCounts = new Map<string, number>();
        for (const r of (doneReviews || [])) {
          reviewCounts.set(r.tema_id, (reviewCounts.get(r.tema_id) || 0) + 1);
        }

        // Update mastery with review counts
        for (const tId of temaIds) {
          const existing = mMap.get(tId) || { correctRate: 0, reviewsDone: 0 };
          existing.reviewsDone = reviewCounts.get(tId) || 0;
          mMap.set(tId, existing);
        }

        const temaMap = new Map((temas || []).map(t => [t.id, t]));

        const enriched: ScheduledReview[] = reviewsRes.data
          .map(r => {
            const tema = temaMap.get(r.tema_id);
            return {
              ...r,
              tema: tema?.tema || "Tema desconhecido",
              especialidade: tema?.especialidade || "Geral",
              subtopico: tema?.subtopico || null,
              overdue: r.data_revisao < today,
              estimatedMinutes: reviewTimeEstimates[r.tipo_revisao] || 15,
            };
          })
          // Sort: overdue first, then by priority desc
          .sort((a, b) => {
            if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
            return (b.prioridade || 0) - (a.prioridade || 0);
          });

        // Time budget: 60% for reviews
        const reviewBudget = Math.round(userDailyMinutes * 0.6);
        const fittingReviews: ScheduledReview[] = [];
        const extraReviews: ScheduledReview[] = [];

        for (const r of enriched) {
          if (usedReviewMinutes + (r.estimatedMinutes || 15) <= reviewBudget) {
            fittingReviews.push(r);
            usedReviewMinutes += r.estimatedMinutes || 15;
          } else {
            extraReviews.push(r);
          }
        }

        setScheduledReviews(fittingReviews);
        setOverflowReviews(extraReviews);
      }

      // Set today's topics: topics without any completed review (first contact) and not in today's reviews
      const reviewedTemaIds = new Set((reviewsRes.data || []).map(r => r.tema_id));
      
      // Get all tema IDs that have at least one completed review
      const { data: completedReviewTemas } = await supabase
        .from("revisoes")
        .select("tema_id")
        .eq("user_id", user.id)
        .eq("status", "concluida");
      const completedTemaIds = new Set((completedReviewTemas || []).map(r => r.tema_id));
      
      // Show topics that have NO completed reviews (first contact) and aren't already in scheduled reviews
      const allNewTopics = (todayTemasRes.data || []).filter(t => !reviewedTemaIds.has(t.id) && !completedTemaIds.has(t.id));

      // Time budget for initial topics: remaining after reviews, capped at 40% of total daily time
      const topicBudget = Math.min(
        userDailyMinutes - usedReviewMinutes,
        Math.round(userDailyMinutes * 0.4)
      );
      const TOPIC_DURATION = 40; // 40min per new topic (realistic first-contact study)
      const MAX_NEW_TOPICS_PER_DAY = 5; // Hard cap to keep plan achievable
      let usedTopicMinutes = 0;
      const fittingTopics: typeof allNewTopics = [];
      const extraTopics: typeof allNewTopics = [];

      for (const t of allNewTopics) {
        if (fittingTopics.length < MAX_NEW_TOPICS_PER_DAY && usedTopicMinutes + TOPIC_DURATION <= topicBudget) {
          fittingTopics.push(t);
          usedTopicMinutes += TOPIC_DURATION;
        } else {
          extraTopics.push(t);
        }
      }

      setTodayTopics(fittingTopics);
      setOverflowTopics(extraTopics);

      setMasteryData(mMap);
      setLoading(false);
    };
    loadToday();
  }, [user, location.key]);

  const savePlanToDB = async (planData: DailyPlanData, completed: Set<number>) => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    await supabase
      .from("daily_plans")
      .upsert({
        user_id: user.id,
        plan_date: today,
        plan_json: planData as any,
        completed_blocks: Array.from(completed) as any,
        total_blocks: planData.blocks.length,
        completed_count: completed.size,
      }, { onConflict: "user_id,plan_date" });
  };

  const generatePlan = async () => {
    if (!user) return;
    setGenerating(true);

    try {
      const [attemptsRes, flashcardsRes, profileRes] = await Promise.all([
        supabase.from("practice_attempts").select("correct, question_id, questions_bank(topic)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
        supabase.from("reviews").select("id").eq("user_id", user.id).lte("next_review", new Date().toISOString()),
        supabase.from("profiles").select("exam_date, daily_study_hours").eq("user_id", user.id).maybeSingle(),
      ]);

      const attempts = attemptsRes.data || [];
      const errorTopics: string[] = [];
      const areaPerformance: Record<string, { correct: number; total: number }> = {};

      for (const a of attempts) {
        const topic = (a as any).questions_bank?.topic || "Geral";
        if (!areaPerformance[topic]) areaPerformance[topic] = { correct: 0, total: 0 };
        areaPerformance[topic].total++;
        if (a.correct) areaPerformance[topic].correct++;
        else errorTopics.push(topic);
      }

      const weakAreas = Object.entries(areaPerformance)
        .filter(([, v]) => v.total >= 3 && (v.correct / v.total) < 0.6)
        .map(([k]) => k);

      const scheduledTopics = scheduledReviews.map(r => ({
        topic: r.tema,
        specialty: r.especialidade,
        subtopics: r.subtopico || "",
        reviewType: r.tipo_revisao,
        overdue: r.overdue,
        risk: r.risco_esquecimento || "baixo",
      }));

      // Include today's new topics as active topics for the AI
      const activeTopics = todayTopics.map(t => ({
        topic: t.tema,
        specialty: t.especialidade,
        subtopics: t.subtopico || "",
        isNew: true,
      }));

      const response = await supabase.functions.invoke("learning-optimizer", {
        body: {
          performanceData: areaPerformance,
          examDate: profileRes.data?.exam_date,
          dailyHours: profileRes.data?.daily_study_hours || 4,
          completedTopics: Object.keys(areaPerformance),
          weakAreas,
          flashcardsDue: flashcardsRes.data?.length || 0,
          recentErrors: errorTopics.slice(0, 10),
          scheduledTopics,
          activeTopics,
        },
      });

      if (response.error) throw response.error;
      const rawPlan = response.data;
      // Map snake_case from AI to camelCase
      const newPlan: DailyPlanData = {
        ...rawPlan,
        blocks: (rawPlan.blocks || []).map((b: any) => ({
          ...b,
          learningGoal: b.learning_goal || b.learningGoal || "",
          summary: b.summary || "",
          prerequisite: b.prerequisite || null,
        })),
      };
      setPlan(newPlan);
      const newCompleted = new Set<number>();
      setCompletedBlocks(newCompleted);
      await savePlanToDB(newPlan, newCompleted);
    } catch (err: any) {
      toast({ title: "Erro ao gerar plano", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const toggleBlock = async (order: number) => {
    if (!completedBlocks.has(order) && plan) {
      // Opening self-assessment before marking as done
      const block = plan.blocks.find(b => b.order === order);
      if (block) {
        setAssessmentTopic(block.topic);
        setPendingBlockOrder(order);
        setAssessmentOpen(true);
        return;
      }
    }
    const next = new Set(completedBlocks);
    if (next.has(order)) next.delete(order); else next.add(order);
    setCompletedBlocks(next);
    if (plan) await savePlanToDB(plan, next);
  };

  const handleAssessmentSubmit = async (confidence: number) => {
    if (pendingBlockOrder !== null) {
      const next = new Set(completedBlocks);
      next.add(pendingBlockOrder);
      setCompletedBlocks(next);
      if (plan) await savePlanToDB(plan, next);
      setPendingBlockOrder(null);
      toast({ title: "Autoavaliação salva!", description: `Confiança: ${confidence}/5 em ${assessmentTopic}` });
      // Sync study context for Tutor IA
      if (user) {
        updateStudyPerformanceContext(user.id, [{ id: "", tema: assessmentTopic, especialidade: "" }]).catch(() => {});
      }
    }
  };

  const handleReviewComplete = (reviewId: string, tema: string, especialidade: string) => {
    setQuizReview({ id: reviewId, tema, especialidade });
    setQuizOpen(true);
  };

  const toggleReviewDone = async (reviewId: string) => {
    const next = new Set(completedReviews);
    if (next.has(reviewId)) {
      next.delete(reviewId);
      await supabase.from("revisoes").update({ status: "pendente", concluida_em: null }).eq("id", reviewId);
    } else {
      next.add(reviewId);
      await supabase.from("revisoes").update({ status: "concluida", concluida_em: new Date().toISOString() }).eq("id", reviewId);
      // Sync study context for Tutor IA
      if (user) {
        const completedTopics = scheduledReviews.filter(r => next.has(r.id) || r.id === reviewId).map(r => ({ tema: r.tema, especialidade: r.especialidade }));
        updateStudyPerformanceContext(user.id, completedTopics.map(t => ({ id: "", ...t }))).catch(() => {});
      }
    }
    setCompletedReviews(next);
  };

  // Drag & drop handlers for blocks
  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx || !plan) return;
    const newBlocks = [...plan.blocks];
    const [moved] = newBlocks.splice(dragIndex, 1);
    newBlocks.splice(idx, 0, moved);
    setPlan({ ...plan, blocks: newBlocks.map((b, i) => ({ ...b, order: i })) });
    setDragIndex(idx);
  };
  const handleDragEnd = () => {
    setDragIndex(null);
    if (plan) savePlanToDB(plan, completedBlocks);
  };

  const totalItems = (plan?.blocks.length || 0) + scheduledReviews.length + todayTopics.length;
  const totalDone = completedBlocks.size + completedReviews.size + completedInitialTopics.size;
  const overallPct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  // Estimated total time — use AI plan total if available (already includes everything), otherwise sum manually
  const reviewMinutes = scheduledReviews.reduce((sum, r) => sum + (r.estimatedMinutes || 15), 0);
  const initialTopicMinutes = todayTopics.length * 40;
  const totalMinutes = plan
    ? (plan.total_minutes || 0)
    : reviewMinutes + initialTopicMinutes;
  const timeUsedPct = dailyMinutes > 0 ? Math.min(100, Math.round((totalMinutes / dailyMinutes) * 100)) : 0;

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? `${m}min` : ""}` : `${m}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Plano do Dia
          </h1>
          <p className="text-muted-foreground">Roteiro otimizado por IA baseado no seu desempenho.</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <ModuleHelpButton moduleKey="daily-plan" moduleName="Plano do Dia" steps={[
            "Clique em 'Gerar Plano' — a IA analisa seus erros, flashcards pendentes e desempenho",
            "Receba blocos de estudo com tema, duração e prioridade (alta, média, baixa)",
            "Use o 🍅 Pomodoro para estudar com foco de 25min",
            "Ao concluir uma revisão, responda o micro-quiz para validar retenção",
            "Arraste blocos para reordenar suas prioridades",
            "Complete 100% para ganhar celebração de conquista! 🎉",
          ]} />
          <Button onClick={generatePlan} disabled={generating} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
            {plan ? "Regenerar" : "Gerar Plano"}
          </Button>
        </div>
      </div>

      {generating && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-3 text-muted-foreground">Analisando seu desempenho...</span>
        </div>
      )}

      {/* Progress + Benchmark */}
      {(plan || scheduledReviews.length > 0 || todayTopics.length > 0) && !generating && (
        <div className="space-y-3">
          <DailyPlanProgress
            overallPct={overallPct}
            totalDone={totalDone}
            totalItems={totalItems}
            totalMinutes={totalMinutes}
          />
          {/* Time budget indicator */}
          <div className="glass-card p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Tempo planejado
              </span>
              <span className={`font-semibold ${timeUsedPct > 100 ? "text-destructive" : "text-primary"}`}>
                {formatTime(totalMinutes)} / {formatTime(dailyMinutes)}
              </span>
            </div>
            <Progress value={timeUsedPct} className="h-2" />
            {(overflowReviews.length > 0 || overflowTopics.length > 0) && (
              <p className="text-xs text-muted-foreground">
                {overflowReviews.length + overflowTopics.length} itens adicionais disponíveis abaixo (não cabem no tempo de hoje)
              </p>
            )}
          </div>
          <ClassBenchmark />
        </div>
      )}

      {/* Scheduled Reviews from Cronograma */}
      {scheduledReviews.length > 0 && !generating && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Revisões do Cronograma
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{scheduledReviews.length}</span>
            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
              <Clock className="h-3 w-3" /> ~{reviewMinutes}min
            </span>
          </h2>
          {scheduledReviews.map((review) => {
            const done = completedReviews.has(review.id);
            const mastery = masteryData.get(review.tema_id);
            const masteryLevel = mastery ? getMasteryLevel(mastery.correctRate, mastery.reviewsDone) : null;

            return (
              <div
                key={review.id}
                className={`glass-card p-4 flex items-start gap-4 transition-all ${done ? "opacity-50" : ""} ${review.overdue ? "border-destructive/50 bg-destructive/5" : "border-warning/50 bg-warning/5"}`}
              >
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 transition-transform ${done ? "bg-primary/20" : "bg-primary/10"}`}
                  onClick={() => done ? toggleReviewDone(review.id) : handleReviewComplete(review.id, review.tema, review.especialidade)}
                >
                  {done ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <RefreshCw className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className={`font-semibold text-sm ${done ? "line-through" : ""}`}>{review.tema}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{review.tipo_revisao}</span>
                    <span className="text-xs text-muted-foreground">{review.especialidade}</span>
                    {review.estimatedMinutes && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-3 w-3" /> ~{review.estimatedMinutes}min
                      </span>
                    )}
                    {masteryLevel && <MasteryBadge level={masteryLevel.level} percentage={masteryLevel.percentage} compact />}
                    {review.overdue && (
                      <span className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Atrasada
                      </span>
                    )}
                  </div>
                  {review.subtopico && (
                    <p className="text-xs text-muted-foreground mb-1">
                      <Layers className="h-3 w-3 inline mr-1" />
                      {review.subtopico}
                    </p>
                  )}
                  {!done && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs h-7 px-2 text-primary hover:text-primary"
                        onClick={() => navigate("/dashboard/chatgpt", {
                          state: {
                            initialMessage: `Quero revisar o tópico "${review.tema}" (${review.tipo_revisao}). Me dê uma aula completa seguindo o protocolo ENAZIZI.`,
                            fromDailyPlan: true,
                            topic: review.tema,
                            specialty: review.especialidade,
                          },
                        })}
                      >
                        <GraduationCap className="h-3.5 w-3.5" /> Tutor IA
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs h-7 px-2 text-primary hover:text-primary"
                        onClick={() => { setPomodoroTopic(review.tema); setPomodoroOpen(true); }}
                      >
                        <Timer className="h-3.5 w-3.5" /> Pomodoro
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs h-7 px-2 text-primary hover:text-primary"
                        onClick={() => navigate("/dashboard/flashcards")}
                      >
                        <FlipVertical className="h-3.5 w-3.5" /> Flashcards
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs h-7 px-2 text-primary hover:text-primary"
                        onClick={() => navigate("/dashboard/questions-bank")}
                      >
                        <Target className="h-3.5 w-3.5" /> Questões
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Overflow reviews */}
      {overflowReviews.length > 0 && !generating && (
        <Collapsible open={showOverflowReviews} onOpenChange={setShowOverflowReviews}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground text-xs">
              <span>Revisões adicionais ({overflowReviews.length})</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showOverflowReviews ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {overflowReviews.map((review) => (
              <div key={review.id} className="glass-card p-3 flex items-center gap-3 opacity-60">
                <RefreshCw className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{review.tema}</p>
                  <p className="text-xs text-muted-foreground">{review.tipo_revisao} · {review.especialidade} · ~{review.estimatedMinutes}min</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => navigate("/dashboard/chatgpt", {
                    state: {
                      initialMessage: `Quero revisar o tópico "${review.tema}" (${review.tipo_revisao}). Me dê uma aula completa seguindo o protocolo ENAZIZI.`,
                      fromDailyPlan: true,
                      topic: review.tema,
                      specialty: review.especialidade,
                    },
                  })}
                >
                  <GraduationCap className="h-3.5 w-3.5 mr-1" /> Estudar
                </Button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {todayTopics.length > 0 && !generating && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Estudo Inicial — Primeiro Contato
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{todayTopics.length}</span>
          </h2>
          <p className="text-xs text-muted-foreground">Temas adicionados hoje ao cronograma. Comece seu primeiro contato com cada assunto.</p>
          {todayTopics.map((topic) => {
            const done = completedInitialTopics.has(topic.id);
            return (
              <div
                key={topic.id}
                className={`glass-card p-4 flex items-start gap-4 transition-all ${done ? "opacity-50" : ""} border-primary/30 bg-primary/5`}
              >
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 transition-transform ${done ? "bg-primary/20" : "bg-primary/10"}`}
                  onClick={() => {
                    const next = new Set(completedInitialTopics);
                    if (next.has(topic.id)) next.delete(topic.id); else next.add(topic.id);
                    setCompletedInitialTopics(next);
                  }}
                >
                  {done ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <BookOpen className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className={`font-semibold text-sm ${done ? "line-through" : ""}`}>{topic.tema}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Novo</span>
                    <span className="text-xs text-muted-foreground">{topic.especialidade}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-3 w-3" /> ~40min
                    </span>
                  </div>
                  {topic.subtopico && (
                    <p className="text-xs text-muted-foreground mb-1">
                      <Layers className="h-3 w-3 inline mr-1" />
                      {topic.subtopico}
                    </p>
                  )}
                  {!done && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs h-7 px-2 text-primary hover:text-primary"
                        onClick={() => navigate("/dashboard/chatgpt", {
                          state: {
                            initialMessage: `Quero estudar o tópico "${topic.tema}" (${topic.especialidade})${topic.subtopico ? ` — subtópico: ${topic.subtopico}` : ""}. Me dê uma aula completa seguindo o protocolo ENAZIZI.`,
                            fromDailyPlan: true,
                            topic: topic.tema,
                            specialty: topic.especialidade,
                          },
                        })}
                      >
                        <GraduationCap className="h-3.5 w-3.5" /> Tutor IA
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs h-7 px-2 text-primary hover:text-primary"
                        onClick={() => { setPomodoroTopic(topic.tema); setPomodoroOpen(true); }}
                      >
                        <Timer className="h-3.5 w-3.5" /> Pomodoro
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs h-7 px-2 text-primary hover:text-primary"
                        onClick={() => navigate("/dashboard/flashcards")}
                      >
                        <FlipVertical className="h-3.5 w-3.5" /> Flashcards
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs h-7 px-2 text-primary hover:text-primary"
                        onClick={() => navigate("/dashboard/questions-bank")}
                      >
                        <Target className="h-3.5 w-3.5" /> Questões
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Overflow topics */}
      {overflowTopics.length > 0 && !generating && (
        <Collapsible open={showOverflowTopics} onOpenChange={setShowOverflowTopics}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground text-xs">
              <span>Mais temas para depois ({overflowTopics.length})</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showOverflowTopics ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {overflowTopics.map((topic) => (
              <div key={topic.id} className="glass-card p-3 flex items-center gap-3 opacity-60">
                <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{topic.tema}</p>
                  <p className="text-xs text-muted-foreground">{topic.especialidade} · ~40min</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => navigate("/dashboard/chatgpt", {
                    state: {
                      initialMessage: `Quero estudar o tópico "${topic.tema}" (${topic.especialidade}). Me dê uma aula completa seguindo o protocolo ENAZIZI.`,
                      fromDailyPlan: true,
                      topic: topic.tema,
                      specialty: topic.especialidade,
                    },
                  })}
                >
                  <GraduationCap className="h-3.5 w-3.5 mr-1" /> Estudar
                </Button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* AI-generated plan blocks */}
      {plan && !generating && (
        <>
          {plan.greeting && (
            <div className="glass-card p-5">
              <p className="text-lg font-medium">{plan.greeting}</p>
              {plan.focus_areas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {plan.focus_areas.map(area => (
                    <span key={area} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">{area}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Blocos de Estudo IA
              <span className="text-xs text-muted-foreground ml-1">(arraste para reordenar)</span>
            </h2>
            {plan.blocks.map((block, idx) => {
              const Icon = typeIcons[block.type] || BookOpen;
              const done = completedBlocks.has(block.order);
              return (
                <div
                  key={`block-${idx}`}
                  draggable={!done}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`glass-card p-4 flex items-start gap-3 transition-all ${done ? "opacity-50" : "cursor-grab active:cursor-grabbing"} ${priorityColors[block.priority] || ""} ${dragIndex === idx ? "ring-2 ring-primary/50 scale-[1.02]" : ""}`}
                >
                  {!done && (
                    <div className="flex items-center pt-2 text-muted-foreground/40">
                      <GripVertical className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 transition-transform ${done ? "bg-primary/20" : "bg-primary/10"}`}
                    onClick={() => toggleBlock(block.order)}
                  >
                    {done ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Icon className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className={`font-semibold text-sm ${done ? "line-through" : ""}`}>{block.topic}</h3>
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-3 w-3" /> {block.duration_minutes}min
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{block.description}</p>
                    {block.summary && (
                      <p className="text-xs text-foreground/70 mt-1 bg-muted/50 rounded px-2 py-1">
                        <Info className="h-3 w-3 inline mr-1 text-primary" />
                        {block.summary}
                      </p>
                    )}
                    {block.learningGoal && (
                      <p className="text-xs text-primary/80 mt-1 font-medium">
                        🎯 {block.learningGoal}
                      </p>
                    )}
                    {block.prerequisite && (
                      <p className="text-xs text-warning mt-1 font-medium">
                        📌 Pré-requisito: {block.prerequisite}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-1 italic">{block.reason}</p>
                    {!done && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(block.type === "study" || block.type === "review") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs h-7 px-2 text-primary hover:text-primary"
                            onClick={() => navigate("/dashboard/chatgpt", {
                              state: {
                                initialMessage: `Quero estudar o tópico "${block.topic}". Me dê uma aula completa seguindo o protocolo ENAZIZI.`,
                                fromDailyPlan: true,
                                topic: block.topic,
                              },
                            })}
                          >
                            <GraduationCap className="h-3.5 w-3.5" /> Tutor IA
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-xs h-7 px-2 text-primary hover:text-primary"
                          onClick={() => { setPomodoroTopic(block.topic); setPomodoroOpen(true); }}
                        >
                          <Timer className="h-3.5 w-3.5" /> Pomodoro
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {plan.tips && plan.tips.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> Dicas do dia
              </h3>
              <ul className="space-y-2">
                {plan.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plan.review_reminder && (
            <div className="glass-card p-4 border-warning/30 bg-warning/5">
              <p className="text-sm text-warning font-medium">{plan.review_reminder}</p>
            </div>
          )}
        </>
      )}

      {!plan && scheduledReviews.length === 0 && todayTopics.length === 0 && !generating && (
        <div className="text-center py-16">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Clique em "Gerar Plano" para criar seu plano do dia.</p>
          <p className="text-xs text-muted-foreground mt-2">Ou cadastre temas no Cronograma Inteligente para ver revisões aqui.</p>
        </div>
      )}

      {/* Pomodoro Timer */}
      <PomodoroTimer
        open={pomodoroOpen}
        onOpenChange={setPomodoroOpen}
        topic={pomodoroTopic}
      />

      {/* Micro Quiz */}
      {quizReview && (
        <MicroQuizDialog
          open={quizOpen}
          onOpenChange={setQuizOpen}
          topic={quizReview.tema}
          specialty={quizReview.especialidade}
          onPass={() => toggleReviewDone(quizReview.id)}
        />
      )}

      {/* Self Assessment */}
      <SelfAssessmentDialog
        open={assessmentOpen}
        onOpenChange={(open) => {
          setAssessmentOpen(open);
          if (!open) setPendingBlockOrder(null);
        }}
        topic={assessmentTopic}
        onSubmit={handleAssessmentSubmit}
      />
    </div>
  );
};

export default DailyPlan;
