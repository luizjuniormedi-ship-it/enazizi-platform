import { Card, CardContent } from "@/components/ui/card";
import { Zap, TrendingUp, BookOpen, Brain } from "lucide-react";
import type { StudyRecommendation } from "@/hooks/useStudyEngine";
import type { AdaptiveState } from "@/hooks/useStudyEngine";

interface Props {
  tasks: StudyRecommendation[];
  completedIds: string[];
  adaptive?: AdaptiveState;
}

export default function MissionImpactProjection({ tasks, completedIds, adaptive }: Props) {
  const remaining = tasks.filter(t => !completedIds.includes(t.id));
  const reviewCount = remaining.filter(t => t.type === "review" || t.type === "error_review").length;
  const practiceCount = remaining.filter(t => t.type === "practice" || t.type === "simulado").length;
  const newCount = remaining.filter(t => t.type === "new").length;

  const projections: { icon: React.ReactNode; text: string }[] = [];

  if (reviewCount > 0) {
    projections.push({
      icon: <Brain className="h-4 w-4 text-primary" />,
      text: `-${reviewCount} revisões pendentes`,
    });
  }

  if (practiceCount > 0) {
    const est = Math.min(practiceCount * 2, 8);
    projections.push({
      icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
      text: `+${est}% acurácia estimada`,
    });
  }

  if (newCount > 0) {
    projections.push({
      icon: <BookOpen className="h-4 w-4 text-primary" />,
      text: `+${newCount} tema${newCount > 1 ? "s" : ""} no cronograma`,
    });
  }

  if (projections.length === 0) return null;

  return (
    <Card className="rounded-xl border-emerald-500/20 bg-emerald-500/5">
      <CardContent className="p-4 space-y-2.5">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-emerald-500" />
          Impacto ao Concluir
        </h3>
        <div className="space-y-1.5">
          {projections.map((p, i) => (
            <div key={i} className="flex items-center gap-2.5 text-xs font-medium">
              {p.icon}
              {p.text}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
