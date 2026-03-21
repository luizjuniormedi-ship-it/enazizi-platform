import { CheckCircle2, Clock, Zap, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Estude menos, aprenda mais",
    desc: "A IA identifica seus pontos fracos e prioriza o que realmente cai na prova, eliminando tempo desperdiçado com conteúdo que você já domina.",
  },
  {
    icon: Zap,
    title: "Feedback instantâneo",
    desc: "Cada questão respondida gera uma micro-aula personalizada com explicação, diagnóstico diferencial e referências bibliográficas.",
  },
  {
    icon: ShieldCheck,
    title: "Método comprovado",
    desc: "Protocolo MedStudy: Ensinar → Avaliar → Discutir → Analisar. Active Recall + Repetição Espaçada validados pela neurociência.",
  },
  {
    icon: Sparkles,
    title: "8 agentes IA especializados",
    desc: "Tutor, gerador de questões, anamnese, plantão, coach motivacional, flashcards, resumidor e crônicas — cada um expert na sua função.",
  },
  {
    icon: TrendingUp,
    title: "Acompanhe sua evolução",
    desc: "Dashboard com mapa de domínio, preditor de aprovação, banco de erros e analytics por especialidade em tempo real.",
  },
  {
    icon: CheckCircle2,
    title: "Pronto para qualquer prova",
    desc: "Simulados no padrão ENARE, USP, UNIFESP e Revalida. Questões objetivas, discursivas e casos clínicos interativos.",
  },
];

const BenefitsSection = () => (
  <section className="py-16 sm:py-24 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl pointer-events-none" />

    <div className="container relative z-10 px-4">
      <div className="text-center mb-10 sm:mb-16">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          Por que escolher o MedStudy AI?
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-4">
          Sua vantagem <span className="gradient-text">competitiva</span>
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
          Enquanto outros estudam no escuro, você tem a IA como copiloto.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
        {benefits.map((b, i) => (
          <div
            key={b.title}
            className="group relative rounded-2xl border border-border/40 bg-card/60 p-5 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-card/90 animate-fade-in"
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
              <b.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2">{b.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default BenefitsSection;
