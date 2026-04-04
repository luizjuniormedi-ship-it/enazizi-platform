import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import type { StudyRecommendation } from "@/hooks/useStudyEngine";

interface Props {
  task: StudyRecommendation | null;
}

export default function MissionTutorHint({ task }: Props) {
  const navigate = useNavigate();

  if (!task) return null;
  if (task.type !== "error_review" && task.type !== "review") return null;
  if (task.priority < 80) return null;

  return (
    <Card className="rounded-xl border-primary/20 bg-primary/5">
      <CardContent className="p-4 flex items-center gap-3">
        <Lightbulb className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium">Quer uma explicação rápida sobre {task.topic}?</p>
          <p className="text-[10px] text-muted-foreground">O Tutor IA pode ajudar</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => navigate(`/dashboard/chatgpt?topic=${encodeURIComponent(task.topic || "")}&specialty=${encodeURIComponent(task.specialty || "")}`)}
        >
          Explicar
        </Button>
      </CardContent>
    </Card>
  );
}
