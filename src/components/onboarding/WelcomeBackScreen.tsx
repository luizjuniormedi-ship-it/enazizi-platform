import { Button } from "@/components/ui/button";
import { Sparkles, Rocket, Target, Brain, BarChart3, ArrowRight } from "lucide-react";

interface Props {
  onStart: () => void;
  onSkip: () => void;
}

const features = [
  {
    icon: <Target className="h-5 w-5 text-primary" />,
    title: "Plano feito para você",
    desc: "Alunos com plano personalizado evoluem até 3x mais rápido.",
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-primary" />,
    title: "Sua chance real de aprovação",
    desc: "Acompanhe em tempo real o que falta para você passar.",
  },
  {
    icon: <Brain className="h-5 w-5 text-primary" />,
    title: "Cada minuto conta",
    desc: "O sistema escolhe a sequência ideal: teoria, questões, revisão ou prática.",
  },
];

export default function WelcomeBackScreen({ onStart, onSkip }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6 animate-fade-in text-center">
        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Rocket className="h-10 w-10 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Comece do jeito certo 🎯</h1>
          <p className="text-muted-foreground text-sm">
            Alunos que personalizam o plano evoluem até <span className="font-semibold text-primary">3x mais rápido</span>.
          </p>
        </div>

        <div className="space-y-3 text-left">
          {features.map((f, i) => (
            <div key={i} className="flex gap-3 items-start rounded-lg border bg-card p-3">
              <div className="mt-0.5 h-9 w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                {f.icon}
              </div>
              <div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Button onClick={onStart} size="lg" className="w-full gap-2">
            <Sparkles className="h-4 w-4" /> Quero um plano personalizado
          </Button>
          <Button variant="outline" onClick={onSkip} size="lg" className="w-full gap-2 text-muted-foreground">
            Continuar sem personalizar <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-[11px] text-muted-foreground/70 pt-1">
            Sem personalização, seu plano ficará menos preciso
          </p>
        </div>
      </div>
    </div>
  );
}
