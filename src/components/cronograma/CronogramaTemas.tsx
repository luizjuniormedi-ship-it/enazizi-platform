import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Play, CheckCircle2, Clock, ShieldAlert, Shield, ShieldCheck } from "lucide-react";
import type { Revisao, Desempenho, TemaComRisco } from "@/pages/CronogramaInteligente";

interface Props {
  temasComRisco: TemaComRisco[];
  revisoes: Revisao[];
  desempenhos: Desempenho[];
  onDelete: (temaId: string) => void;
  onStartRevisao: (revisao: Revisao) => void;
}

const REVIEW_ORDER = ["D1", "D2", "D3", "D4", "D5", "D7", "D15", "D30"];

const RISCO_ICON = {
  alto: <ShieldAlert className="h-4 w-4 text-destructive" />,
  moderado: <Shield className="h-4 w-4 text-amber-500" />,
  baixo: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
};

const RISCO_BADGE = {
  alto: { variant: "destructive" as const, label: "Risco Alto" },
  moderado: { variant: "secondary" as const, label: "Risco Moderado" },
  baixo: { variant: "default" as const, label: "Risco Baixo" },
};

const CronogramaTemas = ({ temasComRisco, revisoes, desempenhos, onDelete, onStartRevisao }: Props) => {
  if (temasComRisco.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <p className="text-muted-foreground">Nenhum tema registrado ainda. Adicione seu primeiro tema!</p>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  // Sort: high risk first
  const sorted = [...temasComRisco].sort((a, b) => {
    const order = { alto: 0, moderado: 1, baixo: 2 };
    return order[a.risco] - order[b.risco];
  });

  return (
    <div className="space-y-4">
      {sorted.map((tema) => {
        const temaRevisoes = revisoes
          .filter(r => r.tema_id === tema.id)
          .sort((a, b) => REVIEW_ORDER.indexOf(a.tipo_revisao) - REVIEW_ORDER.indexOf(b.tipo_revisao));
        const temaDesempenhos = desempenhos.filter(d => d.tema_id === tema.id);
        const totalFeitas = temaDesempenhos.reduce((s, d) => s + d.questoes_feitas, 0);
        const totalErradas = temaDesempenhos.reduce((s, d) => s + d.questoes_erradas, 0);
        const taxaErroTema = totalFeitas > 0 ? Math.round((totalErradas / totalFeitas) * 100) : 0;
        const taxaAcertoTema = totalFeitas > 0 ? Math.round(((totalFeitas - totalErradas) / totalFeitas) * 100) : 0;

        return (
          <div key={tema.id} className="glass-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  {RISCO_ICON[tema.risco]}
                  <h3 className="font-semibold">{tema.tema}</h3>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">{tema.especialidade}</Badge>
                  <span className="text-[11px] text-muted-foreground">
                    D0: {new Date(tema.data_estudo + "T12:00:00").toLocaleDateString("pt-BR")}
                  </span>
                  {totalFeitas > 0 && (
                    <>
                      <Badge variant={taxaErroTema > 40 ? "destructive" : taxaErroTema > 20 ? "secondary" : "default"} className="text-[10px]">
                        Erro: {taxaErroTema}%
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        Acerto: {taxaAcertoTema}%
                      </Badge>
                    </>
                  )}
                  <Badge variant={RISCO_BADGE[tema.risco].variant} className="text-[10px]">
                    {RISCO_BADGE[tema.risco].label}
                  </Badge>
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
