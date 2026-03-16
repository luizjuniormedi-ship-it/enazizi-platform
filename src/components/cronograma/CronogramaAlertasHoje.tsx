import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, CalendarDays, AlertTriangle, ShieldAlert, Clock } from "lucide-react";
import type { TemaEstudado, Revisao, TemaComRisco } from "@/pages/CronogramaInteligente";

interface Props {
  revisoesHoje: Revisao[];
  revisoesAtrasadas: Revisao[];
  temas: TemaEstudado[];
  temasComRisco: TemaComRisco[];
  onStartRevisao: (revisao: Revisao) => void;
}

const RISCO_CONFIG = {
  alto: { label: "Alto", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
  moderado: { label: "Moderado", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  baixo: { label: "Baixo", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
};

const CronogramaAlertasHoje = ({ revisoesHoje, revisoesAtrasadas, temas, temasComRisco, onStartRevisao }: Props) => {
  const temasAltoRisco = temasComRisco.filter(t => t.risco === "alto");
  const today = new Date().toISOString().split("T")[0];
  const revisoesApenas = revisoesHoje.filter(r => r.data_revisao === today);
  const atrasadas = revisoesAtrasadas.filter(r => r.data_revisao < today);

  return (
    <div className="space-y-4">
      {/* Overdue reviews */}
      {atrasadas.length > 0 && (
        <div className="glass-card p-5 border-destructive/40">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3 text-destructive">
            <Clock className="h-4 w-4" />
            Revisões atrasadas ({atrasadas.length})
          </h3>
          <div className="space-y-2">
            {atrasadas.map((r) => {
              const tema = temas.find(t => t.id === r.tema_id);
              if (!tema) return null;
              const diasAtraso = Math.floor((Date.now() - new Date(r.data_revisao + "T12:00:00").getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="destructive" className="text-[10px] flex-shrink-0">{r.tipo_revisao}</Badge>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{tema.tema}</div>
                      <div className="text-[11px] text-muted-foreground">{tema.especialidade} • {diasAtraso}d atrasada</div>
                    </div>
                  </div>
                  <Button size="sm" variant="destructive" className="flex-shrink-0 ml-2" onClick={() => onStartRevisao(r)}>
                    <Play className="h-3.5 w-3.5 mr-1" /> Revisar
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's reviews */}
      {revisoesApenas.length > 0 && (
        <div className="glass-card p-5 border-primary/30">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-primary" />
            Revisões de hoje ({revisoesApenas.length})
          </h3>
          <div className="space-y-2">
            {revisoesApenas.map((r) => {
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
      )}

      {/* High risk themes */}
      {temasAltoRisco.length > 0 && (
        <div className="glass-card p-5 border-destructive/20">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            Temas com alto risco de esquecimento ({temasAltoRisco.length})
          </h3>
          <div className="space-y-2">
            {temasAltoRisco.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{t.tema}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t.especialidade} • Erro: {t.taxaErro}% • {t.revisoesFeitas} revisões
                  </div>
                </div>
                <Badge variant="destructive" className="text-[10px] flex-shrink-0">
                  Risco alto
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {revisoesHoje.length === 0 && temasAltoRisco.length === 0 && (
        <div className="glass-card p-6 text-center">
          <CalendarDays className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold">Nenhuma revisão pendente para hoje! 🎉</h3>
          <p className="text-sm text-muted-foreground mt-1">Registre novos temas ou aguarde as próximas revisões.</p>
        </div>
      )}
    </div>
  );
};

export default CronogramaAlertasHoje;
