import { BookOpen, Brain, Target, TrendingUp } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: BookOpen,
    title: "Planner monta seu dia",
    desc: "O sistema analisa seus erros, revisões pendentes e temas fracos para criar um plano de estudo personalizado toda manhã.",
  },
  {
    num: "02",
    icon: Brain,
    title: "IA ensina e avalia",
    desc: "Explicações profundas com active recall automático: você aprende e é testado em tempo real.",
  },
  {
    num: "03",
    icon: Target,
    title: "Prática clínica guiada",
    desc: "Plantão simulado e anamnese interativa são acionados quando o sistema identifica que você precisa praticar.",
  },
  {
    num: "04",
    icon: TrendingUp,
    title: "Motor de evolução",
    desc: "Cada resposta alimenta o Study Engine: ele recalcula prioridades, agenda revisões e prediz sua aprovação.",
  },
];

const HowItWorksSection = () => (
  <section className="py-16 sm:py-24 relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
    </div>

    <div className="container relative z-10 px-4">
      <div className="text-center mb-12 sm:mb-16">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          Como funciona
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3">
          Veja como o sistema <span className="gradient-text">te conduz à aprovação</span>
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
          Um ciclo contínuo que aprende com você e se adapta todo dia.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid gap-0">
        {steps.map((s, i) => (
          <div
            key={s.num}
            className="group relative flex gap-5 sm:gap-8 animate-fade-in"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {/* timeline */}
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                <s.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              {i < steps.length - 1 && (
                <div className="w-px flex-1 bg-border/50 my-2" />
              )}
            </div>

            {/* content */}
            <div className="pb-10 sm:pb-12">
              <span className="text-xs font-mono text-muted-foreground mb-1 block">
                PASSO {s.num}
              </span>
              <h3 className="text-lg sm:text-xl font-bold mb-1.5">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
