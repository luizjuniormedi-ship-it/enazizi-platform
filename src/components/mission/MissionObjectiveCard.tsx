import { Card, CardContent } from "@/components/ui/card";
import { Crosshair } from "lucide-react";
import type { AdaptiveState } from "@/hooks/useStudyEngine";

interface Props {
  adaptive?: AdaptiveState;
}

function generateObjective(adaptive?: AdaptiveState): string {
  if (!adaptive) return "Completar as tarefas prioritárias de hoje.";

  const phase = adaptive.mode?.phase;

  if (adaptive.heavyRecovery?.active) {
    const p = adaptive.heavyRecovery.phase;
    if (p === 1) return "Estabilizar sua base com revisões críticas.";
    if (p === 2) return "Reduzir o backlog e limpar revisões pendentes.";
    if (p === 3) return "Reativar conteúdo novo com carga controlada.";
    return "Reintegrar ao fluxo normal de estudos.";
  }

  if (adaptive.recoveryMode) {
    return "Corrigir seus maiores erros e reduzir o backlog de revisões.";
  }

  if (adaptive.lockStatus === "blocked") {
    return "Consolidar o conteúdo atual antes de avançar.";
  }

  if (phase === "critico") return "Fortalecer sua base com foco em temas essenciais.";
  if (phase === "atencao") return "Equilibrar revisões e conteúdo novo para subir de fase.";
  if (phase === "competitivo") return "Refinar pontos fracos e praticar com simulados.";
  if (phase === "pronto") return "Manter a consistência e revisar temas estratégicos.";

  return "Avançar no plano de estudos com foco nos temas prioritários.";
}

export default function MissionObjectiveCard({ adaptive }: Props) {
  return (
    <Card className="rounded-xl border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-1.5">
          <Crosshair className="h-4 w-4 text-primary" />
          Objetivo do Dia
        </h3>
        <p className="text-sm font-medium">{generateObjective(adaptive)}</p>
      </CardContent>
    </Card>
  );
}
