import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, RotateCcw } from "lucide-react";
import ProgressDelta from "./ProgressDelta";

interface DeltaItem {
  label: string;
  before: number;
  after: number;
  direction?: "less" | "more";
  suffix?: string;
}

interface TaskCompletionCardProps {
  title?: string;
  subtitle?: string;
  /** Extra stats to show above the CTA */
  children?: React.ReactNode;
  /** Delta items to show progress change */
  deltas?: DeltaItem[];
  /** Label for the secondary action (e.g. "Novo Simulado") */
  secondaryLabel?: string;
  /** Callback for the secondary action */
  onSecondary?: () => void;
  /** Optional third action */
  tertiaryLabel?: string;
  onTertiary?: () => void;
}

export default function TaskCompletionCard({
  title = "Tarefa concluída!",
  subtitle = "Seu progresso já foi atualizado. Vamos para a próxima etapa da missão.",
  children,
  deltas,
  secondaryLabel,
  onSecondary,
  tertiaryLabel,
  onTertiary,
}: TaskCompletionCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="border-primary/30 bg-primary/5 shadow-lg animate-fade-in">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <CheckCircle className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {deltas && deltas.length > 0 && <ProgressDelta items={deltas} />}

        {children}

        <p className="text-xs text-center text-muted-foreground italic">
          Sua missão foi atualizada com base no seu desempenho
        </p>

        <Button
          onClick={() => navigate("/mission")}
          size="lg"
          className="w-full gap-2 text-base font-semibold glow"
        >
          CONTINUAR MISSÃO
          <ArrowRight className="h-5 w-5" />
        </Button>

        {(onSecondary || onTertiary) && (
          <div className="flex gap-2 justify-center">
            {onSecondary && (
              <Button variant="ghost" size="sm" onClick={onSecondary} className="gap-1.5 text-muted-foreground">
                <RotateCcw className="h-4 w-4" />
                {secondaryLabel || "Nova sessão"}
              </Button>
            )}
            {onTertiary && (
              <Button variant="ghost" size="sm" onClick={onTertiary} className="gap-1.5 text-muted-foreground">
                {tertiaryLabel || "Outra ação"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
