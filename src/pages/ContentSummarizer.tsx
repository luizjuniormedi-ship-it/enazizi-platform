import { BookOpen } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

const ContentSummarizer = () => (
  <AgentChat
    title="Resumidor de Conteúdo"
    subtitle="Crie resumos inteligentes e mapas mentais de qualquer matéria."
    icon={<BookOpen className="h-6 w-6 text-primary" />}
    welcomeMessage="Olá! Sou o Resumidor do MentorPF. Posso criar resumos organizados, quadros comparativos, mnemônicos e mapas mentais em texto de qualquer matéria do concurso. Cole um texto ou me diga o tema que deseja resumir! 📚"
    placeholder="Ex: Resuma os tipos de controle da administração pública..."
    functionName="content-summarizer"
  />
);

export default ContentSummarizer;
