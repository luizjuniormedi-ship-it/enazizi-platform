import { Heart } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

const MotivationalCoach = () => (
  <AgentChat
    title="Coach Motivacional"
    subtitle="Apoio emocional para sua jornada de preparação."
    icon={<Heart className="h-6 w-6 text-primary" />}
    welcomeMessage="Olá! Sou seu Coach Motivacional para Residência Médica. Estou aqui para ajudar com ansiedade, burnout, organização entre plantões e estudos, e escolha de especialidade. Como você está se sentindo hoje? 💪🩺"
    placeholder="Ex: Estou desmotivado e com dificuldade de manter a rotina de estudos..."
    functionName="motivational-coach"
  />
);

export default MotivationalCoach;
