import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Rocket, Target, Brain, BarChart3 } from "lucide-react";

interface Props {
  onStart: () => void;
}

const features = [
  {
    icon: <Target className="h-5 w-5 text-primary" />,
    title: "Plano automático de estudo",
    desc: "O sistema gera seu plano diário baseado no que você mais precisa.",
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-primary" />,
    title: "Percentual de aprovação",
    desc: "Acompanhe em tempo real sua chance de ser aprovado.",
  },
  {
    icon: <Brain className="h-5 w-5 text-primary" />,
    title: "Estudo guiado inteligente",
    desc: "O sistema decide a melhor sequência: teoria, questões, revisão ou prática.",
  },
];

export default function WelcomeBackScreen({ onStart }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6 animate-fade-in text-center">
        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Rocket className="h-10 w-10 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Seu sistema de estudo evoluiu 🚀</h1>
          <p className="text-muted-foreground text-sm">
            O ENAZIZI agora tem inteligência para guiar cada minuto do seu estudo.
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

        <Button onClick={onStart} size="lg" className="w-full gap-2">
          <Sparkles className="h-4 w-4" /> Iniciar nova jornada
        </Button>
      </div>
    </div>
  );
}
