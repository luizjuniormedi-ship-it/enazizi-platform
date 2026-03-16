import { Users } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

const quickActions = [
  { label: "🗣️ Entrevista pessoal", prompt: "Quero simular uma entrevista pessoal para residência médica. Banca de dificuldade neutra.", icon: "🗣️" },
  { label: "🩺 Arguição oral", prompt: "Quero simular uma arguição oral/prova prática com caso clínico. Dificuldade intermediária.", icon: "🩺" },
  { label: "🏥 Estação OSCE", prompt: "Quero simular uma estação de OSCE com paciente padronizado.", icon: "🏥" },
  { label: "💡 Dicas de entrevista", prompt: "Quais as melhores dicas para se sair bem em entrevistas de residência médica? O que as bancas procuram?", icon: "💡" },
];

const InterviewSimulator = () => (
  <AgentChat
    title="Simulador de Entrevista"
    subtitle="Prepare-se para entrevistas, arguições e OSCE de residência."
    icon={<Users className="h-6 w-6 text-primary" />}
    welcomeMessage="Olá! Sou o Simulador de Entrevista para Residência Médica. 🎤 Posso simular entrevistas pessoais, arguições orais e estações OSCE com feedback detalhado. Qual modo deseja praticar? Escolha abaixo ou me diga sua especialidade! 👇"
    placeholder="Responda à pergunta da banca ou escolha um modo de simulação..."
    functionName="interview-simulator"
    quickActions={quickActions}
  />
);

export default InterviewSimulator;
