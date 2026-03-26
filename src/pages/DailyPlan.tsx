import { useState, useEffect } from "react";
import { Brain, Clock, BookOpen, RefreshCw, CheckCircle2, Loader2, Zap, Target, FlipVertical, GraduationCap, Calendar, AlertTriangle, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ModuleHelpButton from "@/components/layout/ModuleHelpButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface StudyBlock {
  order: number;
  type: string;
  topic: string;
  duration_minutes: number;
  description: string;
  priority: string;
  reason: string;
}

interface DailyPlanData {
  greeting: string;
  focus_areas: string[];
  blocks: StudyBlock[];
  total_minutes: number;
  tips: string[];
  review_reminder: string;
}

interface ScheduledReview {
  id: string;
  tema_id: string;
  tipo_revisao: string;
  data_revisao: string;
  status: string;
  prioridade: number | null;
  risco_esquecimento: string | null;
  tema: string;
  especialidade: string;
  subtopico: string | null;
  overdue: boolean;
}

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

const DailyPlan = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<DailyPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());
  const [scheduledReviews, setScheduledReviews] = useState<ScheduledReview[]>([]);
  const [completedReviews, setCompletedReviews] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const loadToday = async () => {
      const today = new Date().toISOString().split("T")[0];

      const [planRes, reviewsRes] = await Promise.all([
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
      ]);

      if (planRes.data) {
        setPlan(planRes.data.plan_json as unknown as DailyPlanData);
        const completed = (planRes.data.completed_blocks as number[]) || [];
        setCompletedBlocks(new Set(completed));
      }

      // Enrich reviews with tema info
      if (reviewsRes.data && reviewsRes.data.length > 0) {
        const temaIds = [...new Set(reviewsRes.data.map(r => r.tema_id))];
        const { data: temas } = await supabase
          .from("temas_estudados")
          .select("id, tema, especialidade, subtopico")
          .in("id", temaIds);

        const temaMap = new Map((temas || []).map(t => [t.id, t]));

        const enriched: ScheduledReview[] = reviewsRes.data.map(r => {
          const tema = temaMap.get(r.tema_id);
          return {
            ...r,
            tema: tema?.tema || "Tema desconhecido",
            especialidade: tema?.especialidade || "Geral",
            subtopico: tema?.subtopico || null,
            overdue: r.data_revisao < today,
          };
        });
        setScheduledReviews(enriched);
      }

      setLoading(false);
    };
    loadToday();
  }, [user]);

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

      // Build scheduledTopics from cronograma reviews
      const scheduledTopics = scheduledReviews.map(r => ({
        topic: r.tema,
        specialty: r.especialidade,
        subtopics: r.subtopico || "",
        reviewType: r.tipo_revisao,
        overdue: r.overdue,
        risk: r.risco_esquecimento || "baixo",
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
        },
      });

      if (response.error) throw response.error;
      const newPlan = response.data as DailyPlanData;
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
    const next = new Set(completedBlocks);
    if (next.has(order)) next.delete(order); else next.add(order);
    setCompletedBlocks(next);
    if (plan) await savePlanToDB(plan, next);
  };

  const toggleReviewDone = async (reviewId: string) => {
    const next = new Set(completedReviews);
    if (next.has(reviewId)) {
      next.delete(reviewId);
      await supabase.from("revisoes").update({ status: "pendente", concluida_em: null }).eq("id", reviewId);
    } else {
      next.add(reviewId);
      await supabase.from("revisoes").update({ status: "concluida", concluida_em: new Date().toISOString() }).eq("id", reviewId);
    }
    setCompletedReviews(next);
  };

  const completionPct = plan ? Math.round((completedBlocks.size / plan.blocks.length) * 100) : 0;
  const totalItems = (plan?.blocks.length || 0) + scheduledReviews.length;
  const totalDone = completedBlocks.size + completedReviews.size;
  const overallPct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

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
            "Marque cada bloco como concluído clicando no ícone à esquerda",
            "Use 'Estudar com Tutor IA' para abrir sessão direta no tema sugerido",
            "Acompanhe o progresso pela barra — tente completar 100% do dia",
            "Clique 'Regenerar' a qualquer momento para atualizar o plano",
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

      {/* Overall progress bar */}
      {(plan || scheduledReviews.length > 0) && !generating && (
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span>Progresso do Dia</span>
              <span className="font-bold text-primary">{overallPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${overallPct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalDone}/{totalItems} atividades concluídas
            </p>
          </div>
          {plan && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {Math.round(plan.total_minutes / 60)}h {plan.total_minutes % 60}min
            </div>
          )}
        </div>
      )}

      {/* Scheduled Reviews from Cronograma */}
      {scheduledReviews.length > 0 && !generating && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Revisões do Cronograma
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{scheduledReviews.length}</span>
          </h2>
          {scheduledReviews.map((review) => {
            const done = completedReviews.has(review.id);
            return (
              <div
                key={review.id}
                className={`glass-card p-4 flex items-start gap-4 transition-all ${done ? "opacity-50" : ""} ${review.overdue ? "border-destructive/50 bg-destructive/5" : "border-warning/50 bg-warning/5"}`}
              >
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer ${done ? "bg-primary/20" : "bg-primary/10"}`}
                  onClick={() => toggleReviewDone(review.id)}
                >
                  {done ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <RefreshCw className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className={`font-semibold text-sm ${done ? "line-through" : ""}`}>{review.tema}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{review.tipo_revisao}</span>
                    <span className="text-xs text-muted-foreground">{review.especialidade}</span>
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
            </h2>
            {plan.blocks.map((block) => {
              const Icon = typeIcons[block.type] || BookOpen;
              const done = completedBlocks.has(block.order);
              return (
                <div
                  key={block.order}
                  className={`glass-card p-4 flex items-start gap-4 transition-all ${done ? "opacity-50" : ""} ${priorityColors[block.priority] || ""}`}
                >
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer ${done ? "bg-primary/20" : "bg-primary/10"}`}
                    onClick={() => toggleBlock(block.order)}
                  >
                    {done ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Icon className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold text-sm ${done ? "line-through" : ""}`}>{block.topic}</h3>
                      <span className="text-xs text-muted-foreground">{block.duration_minutes}min</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{block.description}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1 italic">{block.reason}</p>
                    {!done && (block.type === "study" || block.type === "review") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 gap-1.5 text-xs h-7 px-2 text-primary hover:text-primary"
                        onClick={() => navigate("/dashboard/chatgpt", {
                          state: {
                            initialMessage: `Quero estudar o tópico "${block.topic}". Me dê uma aula completa seguindo o protocolo ENAZIZI.`,
                            fromDailyPlan: true,
                            topic: block.topic,
                          },
                        })}
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                        Estudar com Tutor IA
                      </Button>
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

      {!plan && scheduledReviews.length === 0 && !generating && (
        <div className="text-center py-16">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Clique em "Gerar Plano" para criar seu plano do dia.</p>
          <p className="text-xs text-muted-foreground mt-2">Ou cadastre temas no Cronograma Inteligente para ver revisões aqui.</p>
        </div>
      )}
    </div>
  );
};

export default DailyPlan;
