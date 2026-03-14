import { MessageSquare } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

const quickActions = [
  { label: "🩺 Tirar dúvida", prompt: "Explique detalhadamente o tema principal do meu material, como se eu fosse estudar para a prova.", icon: "🩺" },
  { label: "📌 Pontos de prova", prompt: "Quais são os pontos mais cobrados em provas de residência sobre o conteúdo do meu material?", icon: "📌" },
  { label: "💊 Condutas", prompt: "Quais as condutas terapêuticas mais importantes e mais cobradas nos temas do meu material?", icon: "💊" },
  { label: "🔄 Diagnóstico diferencial", prompt: "Faça uma análise de diagnóstico diferencial dos temas abordados no meu material.", icon: "🔄" },
];

const AIMentor = () => (
  <AgentChat
    title="MentorMed"
    subtitle="Mentor especializado em Residência Médica e Revalida."
    icon={<MessageSquare className="h-6 w-6 text-primary" />}
    welcomeMessage="Olá! Sou o MentorMed, seu mentor IA especializado em Residência Médica (ENARE, USP, UNIFESP, Santa Casa). Posso tirar dúvidas de Clínica Médica, Cirurgia, Pediatria, GO e Preventiva com base em guidelines e protocolos. Como posso ajudá-lo? 🩺"
    welcomeMessageWithUploads="📚 Detectei {count} material(is) no seu acervo: {materiais}. Posso usar como base para responder suas dúvidas! Escolha uma ação rápida ou faça sua pergunta. 👇"
    placeholder="Faça uma pergunta sobre residência médica..."
    functionName="mentor-chat"
    quickActions={quickActions}
  />
);

export default AIMentor;
