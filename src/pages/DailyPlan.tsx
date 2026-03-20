import { useState, useEffect } from "react";
import { Brain, Clock, BookOpen, RefreshCw, CheckCircle2, Loader2, Zap, Target, FlipVertical, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

  // Load today's plan from DB on mount
  useEffect(() => {
    if (!user) return;
    const loadToday = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("daily_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("plan_date", today)
        .maybeSingle();

      if (data) {
        setPlan(data.plan_json as unknown as DailyPlanData);
        const completed = (data.completed_blocks as number[]) || [];
        setCompletedBlocks(new Set(completed));
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

      const response = await supabase.functions.invoke("learning-optimizer", {
        body: {
          performanceData: areaPerformance,
          examDate: profileRes.data?.exam_date,
          dailyHours: profileRes.data?.daily_study_hours || 4,
          completedTopics: Object.keys(areaPerformance),
          weakAreas,
          flashcardsDue: flashcardsRes.data?.length || 0,
          recentErrors: errorTopics.slice(0, 10),
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

  const completionPct = plan ? Math.round((completedBlocks.size / plan.blocks.length) * 100) : 0;

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
        <Button onClick={generatePlan} disabled={generating} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
          {plan ? "Regenerar" : "Gerar Plano"}
        </Button>
      </div>

      {generating && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-3 text-muted-foreground">Analisando seu desempenho...</span>
        </div>
      )}

      {plan && !generating && (
        <>
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

          <div className="glass-card p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>Progresso</span>
                <span className="font-bold text-primary">{completionPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completionPct}%` }} />
              </div>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {Math.round(plan.total_minutes / 60)}h {plan.total_minutes % 60}min
            </div>
          </div>

          <div className="space-y-3">
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
                            initialMessage: `Quero estudar o tópico "${block.topic}". Me dê uma aula completa seguindo o protocolo MedStudy.`,
                            fromErrorBank: true,
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

      {!plan && !generating && (
        <div className="text-center py-16">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Clique em "Gerar Plano" para criar seu plano do dia.</p>
        </div>
      )}
    </div>
  );
};

export default DailyPlan;
