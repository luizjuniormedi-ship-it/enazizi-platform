import { BookOpen, Brain, HelpCircle, MessageSquare, BarChart3, Upload, GraduationCap, Repeat } from "lucide-react";

const features = [
  { icon: GraduationCap, title: "Aulas Completas com IA", desc: "Explicação leiga, fisiopatologia, aplicação clínica, diagnóstico diferencial e pontos de prova — tudo estruturado." },
  { icon: Brain, title: "Active Recall", desc: "Após cada aula, perguntas curtas de memória ativa para fixação de longo prazo." },
  { icon: HelpCircle, title: "Questões Estilo Prova", desc: "Casos clínicos com 5 alternativas no padrão ENARE, USP, UNIFESP e Revalida." },
  { icon: MessageSquare, title: "Discussão Clínica Detalhada", desc: "Cada questão vira uma micro aula: raciocínio clínico, diagnóstico diferencial e análise de todas as alternativas." },
  { icon: BarChart3, title: "Mapa de Domínio", desc: "Desempenho por especialidade: cardiologia, pneumologia, neurologia e mais. Identifica seus pontos fracos." },
  { icon: Repeat, title: "Repetição Inteligente", desc: "Conteúdos errados reaparecem em novos casos clínicos com SRS (Spaced Repetition System)." },
  { icon: Upload, title: "Upload de Provas e Materiais", desc: "Envie simulados, provas anteriores e PDFs para análise e treino personalizado." },
  { icon: BookOpen, title: "Protocolo Pedagógico", desc: "Nunca começa com questões. Sequência obrigatória: Ensinar → Avaliar → Discutir → Analisar." },
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
            Protocolo ENAZIZI: ensino profundo + active recall + questões clínicas + análise estatística.
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
