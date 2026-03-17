import {
  BookOpen,
  Brain,
  HelpCircle,
  MessageSquare,
  BarChart3,
  Upload,
  GraduationCap,
  Repeat,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

const pillars = [
  {
    icon: GraduationCap,
    title: "Ensino Profundo com IA",
    desc: "Explicação completa: fisiopatologia, raciocínio clínico, diagnóstico diferencial e pontos de prova — estruturado por especialidade.",
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: Brain,
    title: "Active Recall Automático",
    desc: "Perguntas curtas de memória ativa logo após cada conteúdo, ativando a fixação de longo prazo.",
    color: "from-violet-500/20 to-purple-500/20",
    iconColor: "text-violet-400",
  },
  {
    icon: HelpCircle,
    title: "Questões Estilo Prova",
    desc: "Casos clínicos com 5 alternativas no padrão ENARE, USP, UNIFESP e Revalida, gerados por IA.",
    color: "from-emerald-500/20 to-green-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: MessageSquare,
    title: "Discussão Clínica",
    desc: "Cada questão vira uma micro aula: raciocínio clínico, análise de todas as alternativas e referências.",
    color: "from-amber-500/20 to-yellow-500/20",
    iconColor: "text-amber-400",
  },
];

const extras = [
  {
    icon: BarChart3,
    title: "Mapa de Evolução",
    desc: "Acompanhe seu desempenho por especialidade e identifique pontos fracos em tempo real.",
  },
  {
    icon: Repeat,
    title: "Repetição Espaçada (SRS)",
    desc: "Conteúdos errados reaparecem em novos casos clínicos no momento certo para retenção máxima.",
  },
  {
    icon: Upload,
    title: "Upload de Materiais",
    desc: "Envie simulados, provas anteriores e PDFs para análise e treino personalizado com IA.",
  },
  {
    icon: Target,
    title: "Simulação Clínica",
    desc: "Pratique anamnese, exame físico e conduta em casos interativos com feedback detalhado.",
  },
  {
    icon: TrendingUp,
    title: "Preditor de Aprovação",
    desc: "Algoritmo que analisa seu progresso e estima sua chance de aprovação na prova-alvo.",
  },
  {
    icon: Sparkles,
    title: "Gerador de Conteúdo",
    desc: "Flashcards, resumos e questões discursivas criados automaticamente a partir do seu material.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/3 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/3 blur-3xl pointer-events-none" />

      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Protocolo ENAZIZI
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Tudo que você precisa para <span className="gradient-text">ser aprovado</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Uma sequência pedagógica obrigatória: <strong className="text-foreground">Ensinar → Avaliar → Discutir → Analisar.</strong>
          </p>
        </div>

        {/* Pilares principais — cards grandes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12 max-w-5xl mx-auto">
          {pillars.map((p, i) => (
            <div
              key={p.title}
              className="group relative rounded-2xl border border-border/60 bg-card/80 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 animate-fade-in"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${p.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <p.icon className={`h-6 w-6 ${p.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold mb-2">{p.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 max-w-5xl mx-auto mb-12">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-sm text-muted-foreground font-medium">E muito mais</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Features extras — grid compacto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {extras.map((f, i) => (
            <div
              key={f.title}
              className="group flex gap-4 items-start rounded-xl border border-border/40 bg-card/50 p-5 transition-all duration-300 hover:border-primary/30 hover:bg-card/80 animate-fade-in"
              style={{ animationDelay: `${(i + 4) * 0.06}s` }}
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">{f.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
