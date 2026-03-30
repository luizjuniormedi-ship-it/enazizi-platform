import { useStudyContext, getSourceLabel, getObjectiveLabel } from "@/lib/studyContext";
import { Badge } from "@/components/ui/badge";
import { Target, ArrowLeft, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const REASON_LABELS: Record<string, string> = {
  review: "Revisão programada pelo sistema de repetição espaçada",
  correction: "Reforço baseado no seu último erro",
  reinforcement: "Tema com baixa acurácia — reforço direcionado",
  new_content: "Novo conteúdo recomendado pelo Study Engine",
  practice: "Prática para consolidar conhecimento",
};

/**
 * Shows active study context when arriving from a guided flow.
 * Renders nothing in free mode.
 */
export default function StudyContextBanner() {
  const ctx = useStudyContext();
  const navigate = useNavigate();

  if (!ctx) return null;

  const reasonText = ctx.reason || (ctx.objective && REASON_LABELS[ctx.objective]) || null;

  return (
    <div className="space-y-1 mb-3">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-xs">
        <Target className="h-3.5 w-3.5 text-primary shrink-0" />
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
          {ctx.topic && (
            <span className="font-medium truncate">{ctx.topic}</span>
          )}
          {ctx.objective && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 border-0 bg-primary/10 text-primary">
              {getObjectiveLabel(ctx.objective)}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px] text-muted-foreground shrink-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-3 w-3 mr-1" />
          Voltar
        </Button>
      </div>
      {reasonText && (
        <div className="flex items-center gap-1.5 px-3 text-[10px] text-muted-foreground">
          <Info className="h-3 w-3 shrink-0" />
          <span>{reasonText}</span>
        </div>
      )}
    </div>
  );
}
