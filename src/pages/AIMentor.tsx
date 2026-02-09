import { MessageSquare } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

const AIMentor = () => (
  <AgentChat
    title="Mentor IA"
    subtitle="Tire dúvidas e receba orientação personalizada."
    icon={<MessageSquare className="h-6 w-6 text-primary" />}
    welcomeMessage="Olá! Sou o MentorPF, seu mentor IA especializado no concurso de Delegado da Polícia Federal. Como posso ajudá-lo hoje? 🚀"
    placeholder="Faça uma pergunta ao mentor..."
    functionName="mentor-chat"
  />
);

export default AIMentor;
