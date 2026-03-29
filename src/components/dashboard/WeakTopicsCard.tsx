import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, ChevronRight } from "lucide-react";
import { useStudyEngine } from "@/hooks/useStudyEngine";
import { buildStudyPath } from "@/lib/studyRouter";

export default function WeakTopicsCard() {
  const navigate = useNavigate();
  const { data: recommendations } = useStudyEngine();

  const weakTopics = (recommendations || []).filter(
    (r) => r.type === "practice" || r.type === "error_review"
  );

  if (weakTopics.length === 0) {
    return (
      <Card className="border-border/40">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <TrendingDown className="h-4 w-4 text-rose-500" />
            Temas para Reforçar
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-muted-foreground">✅ Nenhum tema crítico no momento</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-rose-500/20">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <TrendingDown className="h-4 w-4 text-rose-500" />
          Temas para Reforçar
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-rose-500/10 text-rose-500 ml-auto border-0">
            {weakTopics.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-1.5">
        {weakTopics.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors group"
            onClick={() => navigate(buildStudyPath(item, "weak-topics"))}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{item.topic}</p>
              <p className="text-[10px] text-muted-foreground">{item.reason}</p>
            </div>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0">
              Reforçar
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
