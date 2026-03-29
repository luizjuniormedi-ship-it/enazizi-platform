import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, ChevronRight } from "lucide-react";
import { useStudyEngine } from "@/hooks/useStudyEngine";

export default function WeakTopicsCard() {
  const navigate = useNavigate();
  const { data: recommendations } = useStudyEngine();

  const weakTopics = (recommendations || []).filter(
    (r) => r.type === "practice" || r.type === "error_review"
  );

  if (weakTopics.length === 0) return null;

  return (
    <Card className="border-rose-500/20">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <TrendingDown className="h-4 w-4 text-rose-500" />
          Pontos Fracos
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 ml-auto">
            {weakTopics.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {weakTopics.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors group"
            onClick={() => navigate(item.targetPath)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{item.topic}</p>
              <p className="text-[10px] text-muted-foreground">{item.reason}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
