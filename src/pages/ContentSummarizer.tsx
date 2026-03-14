import { BookOpen } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

const ContentSummarizer = () => (
  <AgentChat
    title="Resumidor de Conteúdo"
    subtitle="Resumos estruturados com mnemônicos e pontos de prova."
    icon={<BookOpen className="h-6 w-6 text-primary" />}
    welcomeMessage="Olá! Sou o Resumidor especializado em Residência Médica. Crio resumos com tabelas comparativas, mnemônicos 🧠, pegadinhas de prova ⚠️, condutas 💊 e pontos de alta incidência 📌. Cole um texto ou me diga o tema! 📚"
    placeholder="Ex: Resuma Insuficiência Cardíaca com diagnóstico diferencial..."
    functionName="content-summarizer"
  />
);

export default ContentSummarizer;
