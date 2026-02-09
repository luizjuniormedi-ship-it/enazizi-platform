import { Brain, CalendarDays, FileText, FlipVertical, MessageSquare, BarChart3, Upload, Shield } from "lucide-react";

const features = [
  { icon: Brain, title: "Mentor IA", desc: "Chat inteligente que conhece o edital, tira dúvidas e sugere estratégias personalizadas." },
  { icon: CalendarDays, title: "Cronograma Inteligente", desc: "Plano de estudos gerado por IA, adaptado ao seu tempo e desempenho." },
  { icon: FlipVertical, title: "Flashcards Automáticos", desc: "Envie PDFs e receba flashcards prontos com revisão espaçada." },
  { icon: FileText, title: "Simulados Personalizados", desc: "Questões geradas por IA baseadas no edital e provas anteriores." },
  { icon: Upload, title: "Upload de Materiais", desc: "Envie editais, provas e cursos em PDF para análise automática." },
  { icon: BarChart3, title: "Analytics Completos", desc: "Acompanhe seu desempenho com dashboards detalhados." },
  { icon: MessageSquare, title: "Resumos Inteligentes", desc: "Resumos estruturados gerados automaticamente dos seus materiais." },
  { icon: Shield, title: "Multiusuário & SaaS", desc: "Gerencie equipes e organizações com planos escaláveis." },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Tudo que você precisa para <span className="gradient-text">ser aprovado</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Uma plataforma completa com inteligência artificial para maximizar seus estudos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass-card p-6 hover:border-primary/30 transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
