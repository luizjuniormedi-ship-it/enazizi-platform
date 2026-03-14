import { BookOpen } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

const quickActions = [
  { label: "📋 Resumo completo", prompt: "Faça um resumo completo e estruturado de todo o meu material, com pontos de prova, mnemônicos e tabelas comparativas.", icon: "📋" },
  { label: "🧠 Mnemônicos", prompt: "Crie mnemônicos e técnicas de memorização para os temas mais importantes do meu material.", icon: "🧠" },
  { label: "⚠️ Pegadinhas de prova", prompt: "Liste as principais pegadinhas de prova e pontos de atenção baseados no meu material.", icon: "⚠️" },
  { label: "📊 Tabela comparativa", prompt: "Crie tabelas comparativas dos diagnósticos diferenciais presentes no meu material.", icon: "📊" },
];

const ContentSummarizer = () => (
  <AgentChat
    title="Resumidor de Conteúdo"
    subtitle="Resumos estruturados com mnemônicos e pontos de prova."
    icon={<BookOpen className="h-6 w-6 text-primary" />}
    welcomeMessage="Olá! Sou o Resumidor especializado em Residência Médica. Crio resumos com tabelas comparativas, mnemônicos 🧠, pegadinhas de prova ⚠️, condutas 💊 e pontos de alta incidência 📌. Cole um texto ou me diga o tema! 📚"
    welcomeMessageWithUploads="📚 Encontrei {count} material(is): {materiais}. Posso resumir tudo! Escolha o tipo de resumo que deseja abaixo. 👇"
    placeholder="Ex: Resuma Insuficiência Cardíaca com diagnóstico diferencial..."
    functionName="content-summarizer"
    quickActions={quickActions}
  />
);

export default ContentSummarizer;
