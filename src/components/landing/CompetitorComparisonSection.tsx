import { Check, X, Minus } from "lucide-react";

const features = [
  { name: "Planner inteligente adaptativo", us: true, others: false },
  { name: "IA que ensina + avalia + discute", us: true, others: false },
  { name: "Motor de decisão (Study Engine)", us: true, others: false },
  { name: "Repetição espaçada automática", us: true, others: "partial" as const },
  { name: "Simulação clínica interativa", us: true, others: "partial" as const },
  { name: "Anamnese com IA", us: true, others: false },
  { name: "Preditor de aprovação", us: true, others: false },
  { name: "Banco de questões", us: true, others: true },
  { name: "Flashcards", us: true, others: true },
];

const Icon = ({ val }: { val: boolean | "partial" }) => {
  if (val === true) return <Check className="h-4 w-4 text-emerald-400" />;
  if (val === "partial") return <Minus className="h-4 w-4 text-warning" />;
  return <X className="h-4 w-4 text-destructive" />;
};

const CompetitorComparisonSection = () => (
  <section className="py-16 sm:py-24 relative overflow-hidden">
    <div className="container relative z-10 px-4">
      <div className="text-center mb-10 sm:mb-14">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          Comparativo
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3">
          Por que o ENAZIZI é <span className="gradient-text">diferente</span>
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
          Não é só banco de questões. É um sistema completo de ensino adaptativo.
        </p>
      </div>

      <div className="max-w-2xl mx-auto rounded-2xl border border-border/60 overflow-hidden">
        {/* header */}
        <div className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_100px_100px] bg-secondary/60 px-4 sm:px-6 py-3 text-sm font-semibold">
          <span>Recurso</span>
          <span className="text-center text-primary">ENAZIZI</span>
          <span className="text-center text-muted-foreground">Outros</span>
        </div>

        {features.map((f, i) => (
          <div
            key={f.name}
            className={`grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_100px_100px] px-4 sm:px-6 py-3 text-sm items-center ${
              i % 2 === 0 ? "bg-card/40" : "bg-card/20"
            }`}
          >
            <span className="text-foreground/90">{f.name}</span>
            <span className="flex justify-center"><Icon val={f.us} /></span>
            <span className="flex justify-center"><Icon val={f.others} /></span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default CompetitorComparisonSection;
