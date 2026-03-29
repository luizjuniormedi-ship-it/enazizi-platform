import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, AlertTriangle, ChevronRight } from "lucide-react";
import { useStudyEngine } from "@/hooks/useStudyEngine";
import { buildStudyPath } from "@/lib/studyRouter";

export default function PendingReviewsCard() {
  const navigate = useNavigate();
  const { data: recommendations } = useStudyEngine();

  const reviews = (recommendations || []).filter(
    (r) => r.type === "review" || r.type === "error_review"
  );

  if (reviews.length === 0) return null;

  const RISK_STYLES: Record<string, string> = {
    alto: "text-red-600 dark:text-red-400",
    medio: "text-amber-600 dark:text-amber-400",
    baixo: "text-emerald-600 dark:text-emerald-400",
  };

  return (
    <Card className="border-amber-500/20">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Brain className="h-4 w-4 text-amber-500" />
          Revisões Pendentes
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-auto">
            {reviews.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {reviews.slice(0, 4).map((rev) => (
          <div
            key={rev.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors group"
            onClick={() => navigate(rev.targetPath)}
          >
            {rev.priority >= 85 && (
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{rev.topic}</p>
              <p className="text-[10px] text-muted-foreground">{rev.reason}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
