import { AlertTriangle, Clock, Shuffle, EyeOff } from "lucide-react";

const problems = [
  {
    icon: Shuffle,
    title: "Estuda sem saber o que priorizar",
    desc: "Gasta horas em temas que quase não caem na sua prova.",
  },
  {
    icon: EyeOff,
    title: "Não corrige os próprios erros",
    desc: "Erra os mesmos temas várias vezes sem perceber o padrão.",
  },
  {
    icon: Clock,
    title: "Perde tempo com conteúdo irrelevante",
    desc: "Assiste aulas longas sem aplicar o conhecimento na prática.",
  },
  {
    icon: AlertTriangle,
    title: "Não acompanha evolução real",
    desc: "Não sabe se está melhorando ou só estudando por inércia.",
  },
];

const ProblemSection = () => (
  <section className="py-16 sm:py-24 relative overflow-hidden">
    <div className="container relative z-10 px-4">
      <div className="text-center mb-10 sm:mb-14">
        <span className="inline-block px-4 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-4">
          O problema
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3">
          Por que a maioria <span className="text-destructive">não passa?</span>
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
          Não é falta de esforço. É falta de direção.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {problems.map((p, i) => (
          <div
            key={p.title}
            className="group flex gap-4 items-start rounded-2xl border border-destructive/15 bg-destructive/5 p-5 sm:p-6 transition-all hover:border-destructive/30 animate-fade-in"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <p.icon className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base mb-1">{p.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;
