import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, CalendarDays, AlertTriangle, Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import StudyBlockActions from "./StudyBlockActions";
import type { TemaEstudado, Revisao, TemaComputado } from "@/pages/CronogramaInteligente";
import type { TemaEstudado, Revisao, TemaComputado } from "@/pages/CronogramaInteligente";

interface Props {
  revisoes: Revisao[];
  temas: TemaEstudado[];
  temasComputados: TemaComputado[];
  onStartRevisao: (revisao: Revisao) => void;
}

const PRIORIDADE_COLOR: Record<string, string> = {
  urgente: "text-destructive",
  alta: "text-orange-500",
  media: "text-amber-500",
  baixa: "text-emerald-500",
};

const CronogramaAgendaHoje = ({ revisoes, temas, temasComputados, onStartRevisao }: Props) => {
  const today = new Date().toISOString().split("T")[0];
  const atrasadas = revisoes.filter(r => r.data_revisao < today && r.status === "pendente");
  const hojePendentes = revisoes.filter(r => r.data_revisao === today && r.status === "pendente");
  const hojeUrgentes = atrasadas.filter(r => {
    const tc = temasComputados.find(t => t.id === r.tema_id);
    return tc && (tc.prioridade === "urgente" || tc.risco === "critico");
  });
  const hojeNormais = atrasadas.filter(r => !hojeUrgentes.includes(r));

  const renderItem = (r: Revisao, isUrgent: boolean = false) => {
    const tema = temas.find(t => t.id === r.tema_id);
    const tc = temasComputados.find(t => t.id === r.tema_id);
    if (!tema) return null;
    const diasAtraso = Math.max(0, Math.floor((Date.now() - new Date(r.data_revisao + "T12:00:00").getTime()) / (1000 * 60 * 60 * 24)));

    return (
      <div key={r.id} className={`flex items-center justify-between p-3 rounded-lg ${isUrgent ? "bg-destructive/5 border border-destructive/20" : "bg-secondary/50"}`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex flex-col items-center gap-0.5">
            <Badge variant={isUrgent ? "destructive" : "outline"} className="text-[10px]">{r.tipo_revisao}</Badge>
            {tc && <span className={`text-[9px] font-medium ${PRIORIDADE_COLOR[tc.prioridade]}`}>{tc.prioridade}</span>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm truncate">{tema.tema}</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>{tema.especialidade}</span>
              {tc && tc.taxaErro > 0 && <span className={tc.taxaErro > 40 ? "text-destructive" : ""}>Erro: {tc.taxaErro}%</span>}
              {diasAtraso > 0 && <span className="text-destructive">{diasAtraso}d atraso</span>}
              {tc?.ultimaRevisao && (
                <span>Última: {new Date(tc.ultimaRevisao).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <StudyBlockActions subject={tema.tema} specialty={tema.especialidade} />
          <Button size="sm" variant={isUrgent ? "destructive" : "default"} onClick={() => onStartRevisao(r)}>
            <Play className="h-3.5 w-3.5 mr-1" /> Revisar
          </Button>
        </div>
    );
  };

  const hasContent = hojeUrgentes.length > 0 || hojeNormais.length > 0 || hojePendentes.length > 0;

  if (!hasContent) {
    return (
      <div className="glass-card p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
        <h3 className="font-semibold text-lg">Tudo em dia! 🎉</h3>
        <p className="text-sm text-muted-foreground mt-1">Nenhuma revisão pendente para hoje. Registre novos temas ou aguarde.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-primary" />
        O que fazer hoje
      </h2>

      {/* Urgent reviews */}
      {hojeUrgentes.length > 0 && (
        <div className="glass-card p-4 border-destructive/30">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3 text-destructive">
            <ShieldAlert className="h-4 w-4" />
            🚨 Revisar com urgência ({hojeUrgentes.length})
          </h3>
          <div className="space-y-2">
            {hojeUrgentes.sort((a, b) => {
              const ta = temasComputados.find(t => t.id === a.tema_id);
              const tb = temasComputados.find(t => t.id === b.tema_id);
              return (tb?.prioridadeScore || 0) - (ta?.prioridadeScore || 0);
            }).map(r => renderItem(r, true))}
          </div>
        </div>
      )}

      {/* Overdue (non-urgent) */}
      {hojeNormais.length > 0 && (
        <div className="glass-card p-4 border-amber-500/20">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-amber-500" />
            Revisões atrasadas ({hojeNormais.length})
          </h3>
          <div className="space-y-2">
            {hojeNormais.sort((a, b) => {
              const ta = temasComputados.find(t => t.id === a.tema_id);
              const tb = temasComputados.find(t => t.id === b.tema_id);
              return (tb?.prioridadeScore || 0) - (ta?.prioridadeScore || 0);
            }).map(r => renderItem(r))}
          </div>
        </div>
      )}

      {/* Today's reviews */}
      {hojePendentes.length > 0 && (
        <div className="glass-card p-4 border-primary/20">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-primary" />
            Revisar hoje ({hojePendentes.length})
          </h3>
          <div className="space-y-2">
            {hojePendentes.sort((a, b) => {
              const ta = temasComputados.find(t => t.id === a.tema_id);
              const tb = temasComputados.find(t => t.id === b.tema_id);
              return (tb?.prioridadeScore || 0) - (ta?.prioridadeScore || 0);
            }).map(r => renderItem(r))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CronogramaAgendaHoje;
