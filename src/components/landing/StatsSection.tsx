import { Users, BookOpen, Trophy, Brain } from "lucide-react";

const stats = [
  { icon: Users, value: "2.500+", label: "Alunos ativos", color: "text-blue-400" },
  { icon: BookOpen, value: "150.000+", label: "Questões geradas", color: "text-emerald-400" },
  { icon: Trophy, value: "92%", label: "Taxa de aprovação", color: "text-amber-400" },
  { icon: Brain, value: "8", label: "Agentes IA especializados", color: "text-violet-400" },
];

const StatsSection = () => (
  <section className="py-16 border-y border-border/30 bg-card/30 backdrop-blur-sm">
    <div className="container">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
        {stats.map((s) => (
          <div key={s.label} className="text-center group">
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
            </div>
            <p className="text-3xl md:text-4xl font-black mb-1">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsSection;
