import { Stethoscope, ArrowRight, Clock, Brain, Target, BarChart3 } from "lucide-react";
import ModuleHelpButton from "@/components/layout/ModuleHelpButton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface DiagnosticIntroProps {
  alreadyDone: boolean;
  defaultCycle?: string;
  onStart: (cycle: string) => void;
}

const CYCLES = [
  { value: "basico", label: "Ciclo Básico (1º–2º ano)", desc: "Anatomia, Fisiologia, Bioquímica, Farmacologia..." },
  { value: "clinico", label: "Ciclo Clínico (3º–4º ano)", desc: "Clínica Médica, Cirurgia, Pediatria, GO..." },
  { value: "internato", label: "Internato (5º–6º ano)", desc: "Todas as grandes áreas com foco prático" },
];

const FEATURES = [
  { icon: Brain, label: "Dificuldade adaptativa", desc: "Questões se ajustam ao seu nível" },
  { icon: Clock, label: "Cronômetro por questão", desc: "1 minuto por questão" },
  { icon: Target, label: "8 áreas médicas", desc: "Cobertura do seu ciclo" },
  { icon: BarChart3, label: "Análise detalhada", desc: "Desempenho por especialidade" },
];

const DiagnosticIntro = ({ alreadyDone, defaultCycle, onStart }: DiagnosticIntroProps) => {
  const [selectedCycle, setSelectedCycle] = useState<string>(defaultCycle || "");

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div className="text-center py-8">
        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10">
          <Stethoscope className="h-12 w-12 text-primary" />
        </div>
        <div className="flex justify-center mb-3">
          <ModuleHelpButton moduleKey="diagnostic" moduleName="Nivelamento Inicial" steps={[
            "Selecione seu ciclo acadêmico para questões adequadas à sua fase",
            "Clique em 'Iniciar Nivelamento' para começar a avaliação",
            "São 40 questões em 8 especialidades — cada uma com 1 minuto de tempo",
            "A dificuldade se adapta: acertou? Próxima será mais difícil",
            "Ao finalizar, veja seu desempenho por área e um mapa de domínio",
            "Os resultados alimentam seu Mapa de Domínio e Cronograma automaticamente",
          ]} />
        </div>
        <h1 className="text-3xl font-bold mb-3">Nivelamento Inicial</h1>
        <p className="text-muted-foreground text-lg mb-2">
          {alreadyDone
            ? "Você já realizou o nivelamento. Deseja refazer para atualizar seu perfil?"
            : "Antes de começar, precisamos avaliar seu nível atual em cada especialidade."}
        </p>
        <p className="text-sm text-muted-foreground">
          40 questões • 8 áreas • Dificuldade adaptativa • ~40 minutos
        </p>
      </div>

      <div className="space-y-2 max-w-sm mx-auto">
        <Label htmlFor="cycle-select" className="text-sm font-semibold">
          Em qual ciclo você está? *
        </Label>
        <Select value={selectedCycle} onValueChange={setSelectedCycle}>
          <SelectTrigger id="cycle-select">
            <SelectValue placeholder="Selecione seu ciclo acadêmico" />
          </SelectTrigger>
          <SelectContent>
            {CYCLES.map(c => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCycle && (
          <p className="text-xs text-muted-foreground">
            {CYCLES.find(c => c.value === selectedCycle)?.desc}
          </p>
        )}
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
        <Button
          size="lg"
          onClick={() => onStart(selectedCycle)}
          className="gap-2 px-8"
          disabled={!selectedCycle}
        >
          {alreadyDone ? "Refazer nivelamento" : "Iniciar nivelamento"}
          <ArrowRight className="h-4 w-4" />
        </Button>
        {!selectedCycle && (
          <p className="text-xs text-destructive mt-2">Selecione seu ciclo para continuar</p>
        )}
      </div>
    </div>
  );
};

export default DiagnosticIntro;
