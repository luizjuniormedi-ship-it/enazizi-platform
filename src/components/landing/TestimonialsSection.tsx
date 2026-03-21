import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dra. Carolina M.",
    role: "Aprovada em Clínica Médica — ENARE 2025",
    text: "O Tutor IA mudou minha forma de estudar. Parei de apenas ler e comecei a ser questionada o tempo todo. Fui aprovada na primeira tentativa.",
    stars: 5,
  },
  {
    name: "Dr. Lucas R.",
    role: "Aprovado em Cirurgia — USP 2025",
    text: "O banco de erros e o preditor de aprovação me ajudaram a focar nos temas certos. Nos últimos 2 meses, minha taxa de acerto subiu de 58% para 82%.",
    stars: 5,
  },
  {
    name: "Mariana S.",
    role: "6º ano — Preparação Revalida",
    text: "A simulação clínica e a anamnese interativa são incríveis. Sinto que estou no plantão de verdade. Melhor investimento que fiz na minha preparação.",
    stars: 5,
  },
];

const TestimonialsSection = () => (
  <section className="py-24 relative overflow-hidden bg-card/20">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-primary/3 blur-3xl" />
    </div>

    <div className="container relative z-10">
      <div className="text-center mb-16">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          Depoimentos
        </span>
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Quem usa, <span className="gradient-text">aprova</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Histórias reais de alunos que transformaram sua preparação com IA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <div
            key={t.name}
            className="relative rounded-2xl border border-border/40 bg-card/80 p-7 transition-all duration-300 hover:border-primary/30 animate-fade-in"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <Quote className="h-8 w-8 text-primary/20 mb-4" />
            <p className="text-sm text-foreground/90 leading-relaxed mb-6 italic">
              "{t.text}"
            </p>
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: t.stars }).map((_, s) => (
                <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="font-semibold text-sm">{t.name}</p>
            <p className="text-xs text-muted-foreground">{t.role}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
