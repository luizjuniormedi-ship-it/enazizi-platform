import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, CalendarDays, AlertTriangle } from "lucide-react";
import type { TemaEstudado, Revisao } from "@/pages/CronogramaInteligente";

interface Props {
  revisoesHoje: Revisao[];
  temas: TemaEstudado[];
  onStartRevisao: (revisao: Revisao) => void;
}

const CronogramaAlertasHoje = ({ revisoesHoje, temas, onStartRevisao }: Props) => {
  if (revisoesHoje.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <CalendarDays className="h-8 w-8 text-primary mx-auto mb-2" />
        <h3 className="font-semibold">Nenhuma revisão pendente para hoje! 🎉</h3>
        <p className="text-sm text-muted-foreground mt-1">Registre novos temas ou aguarde as próximas revisões.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 border-destructive/30">
      <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        Hoje você precisa revisar:
      </h3>
      <div className="space-y-2">
        {revisoesHoje.map((r) => {
          const tema = temas.find(t => t.id === r.tema_id);
          if (!tema) return null;
          return (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant="outline" className="text-[10px] flex-shrink-0">{r.tipo_revisao}</Badge>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{tema.tema}</div>
                  <div className="text-[11px] text-muted-foreground">{tema.especialidade}</div>
                </div>
              </div>
              <Button size="sm" className="flex-shrink-0 ml-2" onClick={() => onStartRevisao(r)}>
                <Play className="h-3.5 w-3.5 mr-1" /> Revisar
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CronogramaAlertasHoje;
