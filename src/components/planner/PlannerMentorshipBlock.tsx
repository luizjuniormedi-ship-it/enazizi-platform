import { useState, useEffect } from "react";
import { BookMarked, Calendar, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface MentorPlan {
  id: string;
  name: string;
  exam_date: string | null;
  daysUntilExam: number | null;
  professor_name: string;
  topics: { topic: string; subtopic: string | null }[];
  progress: { total: number; started: number };
}

const PlannerMentorshipBlock = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<MentorPlan[]>([]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    const { data: targets } = await supabase
      .from("mentor_theme_plan_targets")
      .select("plan_id")
      .eq("target_id", user.id);
    if (!targets || targets.length === 0) return;

    const planIds = [...new Set(targets.map(t => t.plan_id))];
    const { data: activePlans } = await supabase
      .from("mentor_theme_plans")
      .select("id, name, exam_date, professor_id")
      .in("id", planIds)
      .eq("status", "active");
    if (!activePlans || activePlans.length === 0) return;

    const ids = activePlans.map(p => p.id);
    const profIds = [...new Set(activePlans.map(p => p.professor_id))];

    const [{ data: topics }, { data: profiles }, { data: progress }] = await Promise.all([
      supabase.from("mentor_theme_plan_topics").select("plan_id, topic, subtopic").in("plan_id", ids),
      supabase.from("profiles").select("user_id, display_name").in("user_id", profIds),
      supabase.from("mentor_theme_plan_progress").select("plan_id, status").eq("user_id", user!.id).in("plan_id", ids),
    ]);

    const profMap: Record<string, string> = {};
    (profiles || []).forEach(p => { profMap[p.user_id] = p.display_name || "Professor"; });

    setPlans(activePlans.map(p => {
      const planTopics = (topics || []).filter(t => t.plan_id === p.id);
      const planProgress = (progress || []).filter(pr => pr.plan_id === p.id);
      const days = p.exam_date ? Math.ceil((new Date(p.exam_date).getTime() - Date.now()) / 86400000) : null;
      return {
        id: p.id,
        name: p.name,
        exam_date: p.exam_date,
        daysUntilExam: days,
        professor_name: profMap[p.professor_id] || "Professor",
        topics: planTopics.map(t => ({ topic: t.topic, subtopic: t.subtopic })),
        progress: {
          total: planTopics.length,
          started: planProgress.filter(pr => pr.status !== "pending").length,
        },
      };
    }));
  };

  if (plans.length === 0) return null;

  return (
    <div className="space-y-3">
      {plans.map(plan => {
        const pct = plan.progress.total > 0
          ? Math.round((plan.progress.started / plan.progress.total) * 100)
          : 0;

        const urgencyBorder = plan.daysUntilExam !== null
          ? plan.daysUntilExam <= 7 ? "border-l-red-500"
            : plan.daysUntilExam <= 14 ? "border-l-orange-500"
            : plan.daysUntilExam <= 30 ? "border-l-yellow-500"
            : "border-l-primary"
          : "border-l-primary";

        return (
          <Card key={plan.id} className={`border-l-4 ${urgencyBorder} bg-card`}>
            <CardContent className="p-3 space-y-2.5">
              {/* Header */}
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold truncate">📋 Mentoria: {plan.name}</h4>
                  <p className="text-[10px] text-muted-foreground">{plan.professor_name}</p>
                </div>
                {plan.daysUntilExam !== null && (
                  <Badge
                    variant={plan.daysUntilExam <= 7 ? "destructive" : "secondary"}
                    className="text-[10px] shrink-0"
                  >
                    <Calendar className="h-3 w-3 mr-0.5" />
                    {plan.daysUntilExam <= 0 ? "HOJE!" : `${plan.daysUntilExam}d`}
                  </Badge>
                )}
              </div>

              {/* Prioritized topics */}
              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-1">
                  Temas priorizados pela mentoria ({plan.topics.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {plan.topics.slice(0, 6).map((t, i) => (
                    <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 bg-primary/5">
                      {t.topic}{t.subtopic ? ` → ${t.subtopic}` : ""}
                    </Badge>
                  ))}
                  {plan.topics.length > 6 && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">+{plan.topics.length - 6}</Badge>
                  )}
                </div>
              </div>

              {/* Progress */}
              {plan.progress.total > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{plan.progress.started}/{plan.progress.total} temas iniciados</span>
                    <span>{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-1" />
                </div>
              )}

              {/* Explanation */}
              <p className="text-[10px] text-muted-foreground italic">
                Esses temas foram priorizados pela mentoria do professor e integrados ao seu plano automaticamente.
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PlannerMentorshipBlock;
