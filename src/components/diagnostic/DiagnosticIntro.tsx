import { Stethoscope, ArrowRight, Clock, Brain, Target, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiagnosticIntroProps {
  alreadyDone: boolean;
  onStart: () => void;
}

const FEATURES = [
  { icon: Brain, label: "Dificuldade adaptativa", desc: "Questões se ajustam ao seu nível" },
  { icon: Clock, label: "Cronômetro por questão", desc: "1 minuto por questão" },
  { icon: Target, label: "8 áreas médicas", desc: "Cobertura completa" },
  { icon: BarChart3, label: "Análise detalhada", desc: "Desempenho por especialidade" },
];

const DiagnosticIntro = ({ alreadyDone, onStart }: DiagnosticIntroProps) => {
  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div className="text-center py-8">
        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10">
          <Stethoscope className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Diagnóstico Inicial</h1>
        <p className="text-muted-foreground text-lg mb-2">
          {alreadyDone
            ? "Você já realizou o diagnóstico. Deseja refazer para atualizar seu perfil?"
            : "Antes de começar, precisamos avaliar seu nível atual em cada especialidade."}
        </p>
        <p className="text-sm text-muted-foreground">
          40 questões • 8 áreas • Dificuldade adaptativa • ~40 minutos
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {FEATURES.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="glass-card p-4 flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button size="lg" onClick={onStart} className="gap-2 px-8">
          {alreadyDone ? "Refazer diagnóstico" : "Iniciar diagnóstico"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DiagnosticIntro;
