import { Link } from "react-router-dom";
import { MessageSquare, HelpCircle, BookOpen, Heart, ArrowRight, Zap, TrendingUp, GraduationCap, Brain, Stethoscope, Sparkles } from "lucide-react";

const agents = [
  {
    to: "/dashboard/chatgpt",
    icon: Sparkles,
    title: "🤖 Tutor IA — Agente Principal",
    description: "Seu professor particular com GPT-5.4. Aulas completas pelo Protocolo ENAZIZI: explicação → fisiopatologia → clínica → questões → caso discursivo. Use para ESTUDAR qualquer tema.",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    highlight: true,
  },
  {
    to: "/dashboard/questoes",
    icon: HelpCircle,
    title: "❓ Gerador de Questões",
    description: "Gera questões objetivas estilo ENARE/USP com casos clínicos, gabarito comentado e referências. Use quando quiser TREINAR questões específicas.",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  {
    to: "/dashboard/resumos",
    icon: BookOpen,
    title: "📖 Resumidor de Conteúdo",
    description: "Cria resumos estruturados com tabelas comparativas, mnemônicos e pegadinhas de prova. Use para REVISAR rapidamente um tema.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    to: "/dashboard/coach",
    icon: Heart,
    title: "💪 Coach Motivacional",
    description: "Apoio emocional e estratégico para ansiedade, burnout e organização da rotina. Use quando precisar de SUPORTE EMOCIONAL.",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
  },
  {
    to: "/dashboard/plano-dia",
    icon: Zap,
    title: "⚡ Otimizador de Estudo",
    description: "IA decide o que estudar hoje baseado em erros, SRS e proximidade da prova. Use para saber O QUE estudar.",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    to: "/dashboard/predictor",
    icon: TrendingUp,
    title: "📈 Previsão de Desempenho",
    description: "Calcula probabilidade de aprovação, nota estimada e tendência de evolução. Use para saber ONDE você está.",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
  },
  {
    to: "/dashboard/diagnostico",
    icon: Stethoscope,
    title: "🩺 Diagnóstico Inicial",
    description: "Simulado diagnóstico para calcular seu nível atual e gerar plano adaptativo. Use NO INÍCIO para descobrir seus pontos fracos.",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
];

const AgentsHub = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold">Agentes IA</h1>
      <p className="text-muted-foreground">Agentes especializados para sua aprovação em Residência Médica e Revalida.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((a) => (
        <Link
          key={a.to}
          to={a.to}
          className={`glass-card p-6 hover:border-primary/30 transition-all group flex flex-col justify-between ${
            (a as any).highlight ? "ring-1 ring-primary/30 border-primary/20" : ""
          }`}
        >
          <div>
            <div className={`h-12 w-12 rounded-xl ${a.bgColor} flex items-center justify-center mb-4`}>
              <a.icon className={`h-6 w-6 ${a.color}`} />
            </div>
            <h2 className="text-lg font-semibold mb-2">{a.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{a.description}</p>
          </div>
          <div className="flex items-center gap-1 text-sm text-primary font-medium mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            Acessar <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default AgentsHub;
