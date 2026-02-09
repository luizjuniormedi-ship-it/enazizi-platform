import { Link } from "react-router-dom";
import { MessageSquare, HelpCircle, BookOpen, Heart, ArrowRight } from "lucide-react";

const agents = [
  {
    to: "/dashboard/mentor",
    icon: MessageSquare,
    title: "Mentor IA",
    description: "Orientação estratégica de estudos para o concurso de Delegado da PF. Tire dúvidas sobre matérias, métodos e cronograma.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    to: "/dashboard/questoes",
    icon: HelpCircle,
    title: "Gerador de Questões",
    description: "Questões no estilo CESPE (certo/errado) e múltipla escolha com gabarito comentado e explicações detalhadas.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    to: "/dashboard/resumos",
    icon: BookOpen,
    title: "Resumidor de Conteúdo",
    description: "Resumos estruturados, mapas mentais em texto, mnemônicos e tabelas comparativas para revisão rápida.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    to: "/dashboard/coach",
    icon: Heart,
    title: "Coach Motivacional",
    description: "Suporte emocional, controle de ansiedade, disciplina e motivação para manter o foco na aprovação.",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
];

const AgentsHub = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold">Agentes IA</h1>
      <p className="text-muted-foreground">Escolha um agente especializado para te ajudar nos estudos.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {agents.map((a) => (
        <Link
          key={a.to}
          to={a.to}
          className="glass-card p-6 hover:border-primary/30 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className={`h-12 w-12 rounded-xl ${a.bgColor} flex items-center justify-center mb-4`}>
              <a.icon className={`h-6 w-6 ${a.color}`} />
            </div>
            <h2 className="text-lg font-semibold mb-2">{a.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{a.description}</p>
          </div>
          <div className="flex items-center gap-1 text-sm text-primary font-medium mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            Iniciar conversa <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default AgentsHub;
