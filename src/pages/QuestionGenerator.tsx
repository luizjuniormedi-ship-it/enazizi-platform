import { HelpCircle } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

const QuestionGenerator = () => (
  <AgentChat
    title="Gerador de Questões"
    subtitle="Gere questões no estilo CESPE e múltipla escolha para treinar."
    icon={<HelpCircle className="h-6 w-6 text-primary" />}
    welcomeMessage="Olá! Sou o Gerador de Questões do MentorPF. Posso criar questões no estilo CESPE (Certo/Errado) ou múltipla escolha sobre qualquer matéria do concurso de Delegado PF. Qual matéria você quer treinar? 📝"
    placeholder="Ex: Gere 5 questões de Direito Penal sobre crimes contra a administração pública..."
    functionName="question-generator"
  />
);

export default QuestionGenerator;
