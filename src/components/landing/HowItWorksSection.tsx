import { BookOpen, Brain, Target, TrendingUp } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: BookOpen,
    title: "Você resolve questões",
    desc: "Faça questões no estilo da sua prova. O sistema registra cada resposta, erro e tempo gasto.",
  },
  {
    num: "02",
    icon: Brain,
    title: "O sistema analisa seus erros",
    desc: "A IA identifica padrões: quais temas você erra, por quê, e o que precisa revisar com urgência.",
  },
  {
    num: "03",
    icon: Target,
    title: "A missão do dia é criada",
    desc: "Toda manhã, o ENAZIZI monta um plano personalizado com revisões, questões e prática clínica.",
  },
  {
    num: "04",
    icon: TrendingUp,
    title: "Você melhora de forma direcionada",
    desc: "Cada dia de estudo focado aumenta sua chance real de aprovação. O sistema acompanha e ajusta.",
  },
];

const HowItWorksSection = () => (
  <section id="como-funciona" className="py-16 sm:py-24 relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
    </div>

    <div className="container relative z-10 px-4">
      <div className="text-center mb-12 sm:mb-16">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          Passo a passo
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3">
          Como o ENAZIZI <span className="gradient-text">funciona na prática</span>
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
          Um ciclo simples que transforma seu estudo em evolução real.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid gap-0">
        {steps.map((s, i) => (
          <div
            key={s.num}
            className="group relative flex gap-5 sm:gap-8 animate-fade-in"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                <s.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              {i < steps.length - 1 && (
                <div className="w-px flex-1 bg-border/50 my-2" />
              )}
            </div>

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
