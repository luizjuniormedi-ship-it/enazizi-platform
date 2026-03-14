import { MessageSquare } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

const AIMentor = () => (
  <AgentChat
    title="MentorMed"
    subtitle="Mentor especializado em Residência Médica e Revalida."
    icon={<MessageSquare className="h-6 w-6 text-primary" />}
    welcomeMessage="Olá! Sou o MentorMed, seu mentor IA especializado em Residência Médica (ENARE, USP, UNIFESP, Santa Casa). Posso tirar dúvidas de Clínica Médica, Cirurgia, Pediatria, GO e Preventiva com base em guidelines e protocolos. Como posso ajudá-lo? 🩺"
    placeholder="Faça uma pergunta sobre residência médica..."
    functionName="mentor-chat"
  />
);

export default AIMentor;
