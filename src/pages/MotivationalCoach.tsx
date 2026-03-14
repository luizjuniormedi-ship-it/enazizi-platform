import { Heart } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

const quickActions = [
  { label: "😰 Ansiedade pré-prova", prompt: "Estou com muita ansiedade em relação à prova de residência. Me ajude a lidar com isso.", icon: "😰" },
  { label: "😴 Burnout", prompt: "Estou sentindo sinais de burnout. Me ajude a reorganizar minha rotina de estudos.", icon: "😴" },
  { label: "📅 Rotina equilibrada", prompt: "Me ajude a montar uma rotina que equilibre plantões, estudos e descanso.", icon: "📅" },
  { label: "🎯 Motivação", prompt: "Preciso de motivação para continuar estudando. Me lembre por que estou fazendo isso.", icon: "🎯" },
];

const MotivationalCoach = () => (
  <AgentChat
    title="Coach Motivacional"
    subtitle="Apoio emocional para sua jornada de preparação."
    icon={<Heart className="h-6 w-6 text-primary" />}
    welcomeMessage="Olá! Sou seu Coach Motivacional para Residência Médica. Estou aqui para ajudar com ansiedade, burnout, organização entre plantões e estudos, e escolha de especialidade. Como você está se sentindo hoje? 💪🩺"
    placeholder="Ex: Estou desmotivado e com dificuldade de manter a rotina de estudos..."
    functionName="motivational-coach"
    quickActions={quickActions}
  />
);

export default MotivationalCoach;
