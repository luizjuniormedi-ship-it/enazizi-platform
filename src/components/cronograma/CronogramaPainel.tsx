import { Loader2, BookOpen, RotateCcw, CalendarDays, HelpCircle, AlertTriangle, Target, XCircle, ShieldAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { TemaEstudado, Revisao } from "@/pages/CronogramaInteligente";

interface Props {
  temas: TemaEstudado[];
  temasEmRevisao: TemaEstudado[];
  revisoesHoje: Revisao[];
  totalQuestoes: number;
  totalErros: number;
  taxaGeralAcerto: number;
  taxaGeralErro: number;
  preparation: number;
  prepLevel: { label: string; color: string };
  temasAltoRisco: number;
  loading: boolean;
}

const CronogramaPainel = ({ temas, temasEmRevisao, revisoesHoje, totalQuestoes, totalErros, taxaGeralAcerto, taxaGeralErro, preparation, prepLevel, temasAltoRisco, loading }: Props) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { label: "Temas estudados", value: temas.length, icon: BookOpen, color: "text-primary" },
    { label: "Em revisão", value: temasEmRevisao.length, icon: RotateCcw, color: "text-amber-500" },
    { label: "Revisões hoje", value: revisoesHoje.length, icon: CalendarDays, color: "text-destructive" },
    { label: "Questões feitas", value: totalQuestoes, icon: HelpCircle, color: "text-emerald-500" },
    { label: "Total de erros", value: totalErros, icon: XCircle, color: "text-orange-500" },
    { label: "Taxa de erro", value: `${taxaGeralErro}%`, icon: AlertTriangle, color: taxaGeralErro > 40 ? "text-destructive" : taxaGeralErro > 20 ? "text-amber-500" : "text-emerald-500" },
    { label: "Taxa de acerto", value: `${taxaGeralAcerto}%`, icon: Target, color: "text-primary" },
    { label: "Alto risco", value: temasAltoRisco, icon: ShieldAlert, color: "text-destructive" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <s.icon className={`h-5 w-5 mx-auto mb-2 ${s.color}`} />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Error rate indicator */}
      {totalQuestoes > 0 && (
        <div className="glass-card p-5 border-orange-500/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm">📉 Taxa de Erro Geral</h3>
              <p className="text-xs text-muted-foreground">
                {taxaGeralErro <= 20 ? "Excelente! Cronograma padrão" :
                 taxaGeralErro <= 40 ? "Atenção moderada — revisões extras D5 ativas" :
                 taxaGeralErro <= 60 ? "Erro alto — revisões extras D2 e D5 ativas" :
                 "Erro crítico — cronograma agressivo ativado"}
              </p>
            </div>
            <div className={`text-3xl font-bold ${taxaGeralErro > 40 ? "text-destructive" : taxaGeralErro > 20 ? "text-amber-500" : "text-emerald-500"}`}>
              {taxaGeralErro}%
            </div>
          </div>
          <Progress value={taxaGeralErro} className="h-3" />
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            <span>≤20% Normal</span>
            <span>21-40% Extra D5</span>
            <span>41-60% +D2 +D5</span>
            <span>&gt;60% Agressivo</span>
          </div>
        </div>
      )}

      {/* Preparation Index */}
      <div className="glass-card p-5 border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">🎯 Índice de Preparação para Prova</h3>
            <p className={`text-xs font-medium ${prepLevel.color}`}>{prepLevel.label}</p>
          </div>
          <div className={`text-3xl font-bold ${prepLevel.color}`}>{preparation}%</div>
        </div>
        <Progress value={preparation} className="h-3" />
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>Básico</span>
          <span>Intermediário</span>
          <span>Avançado</span>
          <span>Pronto</span>
        </div>
      </div>
    </div>
  );
};

export default CronogramaPainel;
