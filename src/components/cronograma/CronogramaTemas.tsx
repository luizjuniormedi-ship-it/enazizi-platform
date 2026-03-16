import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Play, CheckCircle2, Clock, ShieldAlert, Shield, ShieldCheck, ShieldBan } from "lucide-react";
import type { Revisao, Desempenho, TemaComputado } from "@/pages/CronogramaInteligente";

interface Props {
  temasComRisco: TemaComputado[];
  revisoes: Revisao[];
  desempenhos: Desempenho[];
  onDelete: (temaId: string) => void;
  onStartRevisao: (revisao: Revisao) => void;
}

const REVIEW_ORDER = ["D1", "D2", "D3", "D4", "D5", "D7", "D15", "D30"];

const RISCO_ICON: Record<string, React.ReactNode> = {
  critico: <ShieldBan className="h-4 w-4 text-destructive" />,
  alto: <ShieldAlert className="h-4 w-4 text-orange-500" />,
  moderado: <Shield className="h-4 w-4 text-amber-500" />,
  baixo: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
};

const PRIORIDADE_BADGE: Record<string, { variant: "destructive" | "secondary" | "default" | "outline"; label: string }> = {
  urgente: { variant: "destructive", label: "Urgente" },
  alta: { variant: "secondary", label: "Alta" },
  media: { variant: "outline", label: "Média" },
  baixa: { variant: "default", label: "Baixa" },
};

const CronogramaTemas = ({ temasComRisco, revisoes, desempenhos, onDelete, onStartRevisao }: Props) => {
  if (temasComRisco.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <p className="text-muted-foreground">Nenhum tema registrado. Adicione seu primeiro tema!</p>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const sorted = [...temasComRisco].sort((a, b) => b.prioridadeScore - a.prioridadeScore);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{sorted.length} temas • ordenados por prioridade</p>
      {sorted.map((tema) => {
        const temaRevisoes = revisoes
          .filter(r => r.tema_id === tema.id)
          .sort((a, b) => REVIEW_ORDER.indexOf(a.tipo_revisao) - REVIEW_ORDER.indexOf(b.tipo_revisao));

        return (
          <div key={tema.id} className="glass-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {RISCO_ICON[tema.risco]}
                  <h3 className="font-semibold text-sm truncate">{tema.tema}</h3>
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-[9px]">{tema.especialidade}</Badge>
                  {tema.subtopico && <Badge variant="outline" className="text-[9px]">{tema.subtopico}</Badge>}
                  <span className="text-[10px] text-muted-foreground">D0: {new Date(tema.data_estudo + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                  {tema.totalQuestoes > 0 && (
                    <Badge variant={tema.taxaErro > 40 ? "destructive" : "outline"} className="text-[9px]">
                      Erro: {tema.taxaErro}%
                    </Badge>
                  )}
                  <Badge variant={PRIORIDADE_BADGE[tema.prioridade].variant} className="text-[9px]">
                    {PRIORIDADE_BADGE[tema.prioridade].label}
                  </Badge>
                  <span className={`text-[9px] font-medium ${
                    tema.risco === "critico" ? "text-destructive" : tema.risco === "alto" ? "text-orange-500" : tema.risco === "moderado" ? "text-amber-500" : "text-emerald-500"
                  }`}>
                    Risco: {tema.risco}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => onDelete(tema.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex gap-1 flex-wrap">
              {temaRevisoes.map((r) => {
                const isDone = r.status === "concluida";
                const isToday = r.data_revisao <= today && !isDone;
                const isFuture = r.data_revisao > today;
                return (
                  <button
                    key={r.id}
                    onClick={() => !isDone && !isFuture && onStartRevisao(r)}
                    disabled={isDone || isFuture}
                    className={`text-[9px] px-2 py-0.5 rounded-full flex items-center gap-0.5 transition-all ${
                      isDone ? "bg-emerald-500/20 text-emerald-500" :
                      isToday ? "bg-destructive/20 text-destructive cursor-pointer hover:bg-destructive/30 animate-pulse" :
                      "bg-secondary text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-2.5 w-2.5" /> : isToday ? <Play className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                    {r.tipo_revisao}
                    <span className="text-[8px] opacity-70">
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
