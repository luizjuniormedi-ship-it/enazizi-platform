import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Play, CheckCircle2, Clock } from "lucide-react";
import type { TemaEstudado, Revisao, Desempenho } from "@/pages/CronogramaInteligente";

interface Props {
  temas: TemaEstudado[];
  revisoes: Revisao[];
  desempenhos: Desempenho[];
  onDelete: (temaId: string) => void;
  onStartRevisao: (revisao: Revisao) => void;
}

const REVIEW_ORDER = ["D1", "D2", "D3", "D5", "D7", "D15", "D30"];

const CronogramaTemas = ({ temas, revisoes, desempenhos, onDelete, onStartRevisao }: Props) => {
  if (temas.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <p className="text-muted-foreground">Nenhum tema registrado ainda. Adicione seu primeiro tema!</p>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      {temas.map((tema) => {
        const temaRevisoes = revisoes
          .filter(r => r.tema_id === tema.id)
          .sort((a, b) => REVIEW_ORDER.indexOf(a.tipo_revisao) - REVIEW_ORDER.indexOf(b.tipo_revisao));
        const temaDesempenhos = desempenhos.filter(d => d.tema_id === tema.id);
        const ultimaTaxa = temaDesempenhos.length > 0 ? temaDesempenhos[0].taxa_acerto : null;

        return (
          <div key={tema.id} className="glass-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{tema.tema}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px]">{tema.especialidade}</Badge>
                  <span className="text-[11px] text-muted-foreground">
                    D0: {new Date(tema.data_estudo + "T12:00:00").toLocaleDateString("pt-BR")}
                  </span>
                  {ultimaTaxa !== null && (
                    <Badge variant={ultimaTaxa >= 80 ? "default" : ultimaTaxa >= 60 ? "secondary" : "destructive"} className="text-[10px]">
                      {ultimaTaxa}% acerto
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(tema.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Review timeline */}
            <div className="flex gap-1.5 flex-wrap">
              {temaRevisoes.map((r) => {
                const isDone = r.status === "concluida";
                const isToday = r.data_revisao <= today && !isDone;
                const isFuture = r.data_revisao > today;
                return (
                  <button
                    key={r.id}
                    onClick={() => !isDone && !isFuture && onStartRevisao(r)}
                    disabled={isDone || isFuture}
                    className={`text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 transition-all ${
                      isDone
                        ? "bg-emerald-500/20 text-emerald-500"
                        : isToday
                        ? "bg-destructive/20 text-destructive cursor-pointer hover:bg-destructive/30 animate-pulse"
                        : "bg-secondary text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-3 w-3" /> : isToday ? <Play className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {r.tipo_revisao}
                    <span className="text-[9px] opacity-70">
                      {new Date(r.data_revisao + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CronogramaTemas;
