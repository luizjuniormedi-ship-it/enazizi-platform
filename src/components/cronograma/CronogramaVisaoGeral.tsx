import { Loader2, BookOpen, RotateCcw, CalendarDays, HelpCircle, XCircle, Target, ShieldAlert, CheckCircle2, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { TemaEstudado, Revisao, TemaComputado } from "@/pages/CronogramaInteligente";
import PlannerMentorshipBlock from "@/components/planner/PlannerMentorshipBlock";

interface Props {
  temas: TemaEstudado[];
  temasComputados: TemaComputado[];
  revisoes: Revisao[];
  revisoesHoje: Revisao[];
  totalQuestoes: number;
  totalErros: number;
  taxaGeralAcerto: number;
  taxaGeralErro: number;
  preparation: number;
  prepLevel: { label: string; color: string };
  revisoesSemana: number;
  revisoesNaoConcluidas: number;
  melhorEspec: string | null;
  piorEspec: string | null;
  loading: boolean;
}

const CronogramaVisaoGeral = ({
  temas, temasComputados, revisoes, revisoesHoje,
  totalQuestoes, totalErros, taxaGeralAcerto, taxaGeralErro,
  preparation, prepLevel, revisoesSemana, revisoesNaoConcluidas,
  melhorEspec, piorEspec, loading
}: Props) => {
  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const temasAtivos = temas.filter(t => (t as any).status !== "concluido").length;
  const temasEmRevisao = temas.filter(t => revisoes.some(r => r.tema_id === t.id && r.status === "pendente")).length;
  const temasCriticos = temasComputados.filter(t => t.risco === "critico" || t.risco === "alto").length;
  const temasUrgentes = temasComputados.filter(t => t.prioridade === "urgente").length;

  const stats = [
    { label: "Temas ativos", value: temasAtivos, icon: BookOpen, color: "text-primary" },
    { label: "Em revisão", value: temasEmRevisao, icon: RotateCcw, color: "text-amber-500" },
    { label: "Revisões hoje", value: revisoesHoje.length, icon: CalendarDays, color: "text-destructive" },
    { label: "Questões feitas", value: totalQuestoes, icon: HelpCircle, color: "text-emerald-500" },
    { label: "Total erros", value: totalErros, icon: XCircle, color: "text-orange-500" },
    { label: "Taxa acerto", value: `${taxaGeralAcerto}%`, icon: Target, color: "text-primary" },
    { label: "Risco alto", value: temasCriticos, icon: ShieldAlert, color: "text-destructive" },
    { label: "Urgentes", value: temasUrgentes, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-4">
      {/* Mentorship block */}
      <PlannerMentorshipBlock />
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="glass-card p-3 text-center">
            <s.icon className={`h-4 w-4 mx-auto mb-1.5 ${s.color}`} />
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-[10px] text-muted-foreground leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Summary card */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-sm mb-3">📋 Resumo Semanal</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold">{temas.length}</div>
            <div className="text-[10px] text-muted-foreground">Total temas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{temasEmRevisao}</div>
            <div className="text-[10px] text-muted-foreground">Em revisão</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-500">{revisoesSemana}</div>
            <div className="text-[10px] text-muted-foreground">Concluídas semana</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-destructive">{revisoesNaoConcluidas}</div>
            <div className="text-[10px] text-muted-foreground">Não concluídas</div>
          </div>
          <div className="text-center">
            {melhorEspec ? (
              <>
                <TrendingUp className="h-4 w-4 mx-auto text-emerald-500" />
                <div className="text-[10px] text-muted-foreground mt-1 truncate" title={melhorEspec}>{melhorEspec}</div>
                <div className="text-[9px] text-emerald-500">Melhor</div>
              </>
            ) : <div className="text-[10px] text-muted-foreground">—</div>}
          </div>
          <div className="text-center">
            {piorEspec ? (
              <>
                <TrendingDown className="h-4 w-4 mx-auto text-destructive" />
                <div className="text-[10px] text-muted-foreground mt-1 truncate" title={piorEspec}>{piorEspec}</div>
                <div className="text-[9px] text-destructive">Pior</div>
              </>
            ) : <div className="text-[10px] text-muted-foreground">—</div>}
          </div>
        </div>
      </div>

      {/* Error rate */}
      {totalQuestoes > 0 && (
        <div className="glass-card p-5 border-orange-500/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm">📉 Taxa de Erro Geral</h3>
              <p className="text-xs text-muted-foreground">
                {taxaGeralErro <= 20 ? "Excelente! Cronograma padrão" :
                 taxaGeralErro <= 40 ? "Revisões extras D5 ativas" :
                 taxaGeralErro <= 60 ? "Revisões extras D2 e D5 ativas" :
                 "Cronograma agressivo ativado"}
              </p>
            </div>
            <div className={`text-3xl font-bold ${taxaGeralErro > 40 ? "text-destructive" : taxaGeralErro > 20 ? "text-amber-500" : "text-emerald-500"}`}>
              {taxaGeralErro}%
            </div>
          </div>
          <Progress value={taxaGeralErro} className="h-2.5" />
          <div className="flex justify-between mt-1.5 text-[9px] text-muted-foreground">
            <span>≤20%</span><span>21-40%</span><span>41-60%</span><span>&gt;60%</span>
          </div>
        </div>
      )}

      {/* Preparation index */}
      <div className="glass-card p-5 border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">🎯 Índice de Preparação</h3>
            <p className={`text-xs font-medium ${prepLevel.color}`}>{prepLevel.label}</p>
          </div>
          <div className={`text-3xl font-bold ${prepLevel.color}`}>{preparation}%</div>
        </div>
        <Progress value={preparation} className="h-2.5" />
        <div className="flex justify-between mt-1.5 text-[9px] text-muted-foreground">
          <span>Básico</span><span>Intermediário</span><span>Avançado</span><span>Pronto</span>
        </div>
      </div>

      {/* Top risk themes */}
      {temasCriticos > 0 && (
        <div className="glass-card p-5 border-destructive/20">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            Temas com maior risco de esquecimento
          </h3>
          <div className="space-y-2">
            {temasComputados
              .filter(t => t.risco === "critico" || t.risco === "alto")
              .sort((a, b) => b.riscoScore - a.riscoScore)
              .slice(0, 5)
              .map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{t.tema}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {t.especialidade} • Erro: {t.taxaErro}% • {t.diasSemRevisar}d sem revisar
                    </div>
                  </div>
                  <Badge variant={t.risco === "critico" ? "destructive" : "secondary"} className="text-[9px] flex-shrink-0">
                    {t.risco === "critico" ? "Crítico" : "Alto"}
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CronogramaVisaoGeral;
