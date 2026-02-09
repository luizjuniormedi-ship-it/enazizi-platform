import { Heart } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

const MotivationalCoach = () => (
  <AgentChat
    title="Coach Motivacional"
    subtitle="Receba apoio emocional e motivação para sua jornada."
    icon={<Heart className="h-6 w-6 text-primary" />}
    welcomeMessage="Olá! Sou seu Coach Motivacional do MentorPF. Estou aqui para te ajudar a manter o foco, superar a ansiedade e encontrar motivação durante sua preparação para o concurso de Delegado PF. Como você está se sentindo hoje? 💪"
    placeholder="Ex: Estou desmotivado e com dificuldade de manter a rotina..."
    functionName="motivational-coach"
  />
);

export default MotivationalCoach;
