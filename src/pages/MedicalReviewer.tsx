import { PenTool } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";

const quickActions = [
  { label: "📝 Treinar discursiva", prompt: "Quero treinar uma questão discursiva. Gere uma questão de caso clínico para eu responder e depois corrija minha resposta.", icon: "📝" },
  { label: "✏️ Revisar minha resposta", prompt: "Vou colar uma resposta discursiva que escrevi. Por favor, corrija como uma banca de residência médica.", icon: "✏️" },
  { label: "📋 Estrutura ideal", prompt: "Me ensine a estrutura ideal para respostas discursivas em provas de residência médica. Como organizar, o que incluir e o que evitar.", icon: "📋" },
  { label: "⚠️ Erros comuns", prompt: "Quais são os erros mais comuns que candidatos cometem em provas discursivas de residência? Como evitá-los?", icon: "⚠️" },
];

const MedicalReviewer = () => (
  <AgentChat
    title="Revisor de Redação Médica"
    subtitle="Correção e orientação para provas discursivas de residência."
    icon={<PenTool className="h-6 w-6 text-primary" />}
    welcomeMessage="Olá! Sou o Revisor de Redação Médica do MedStudy AI. ✍️ Posso corrigir suas respostas discursivas como uma banca real, gerar questões para treino, e ensinar técnicas de escrita para provas. Cole sua resposta ou escolha uma ação abaixo! 👇"
    welcomeMessageWithUploads="📚 Detectei {count} material(is): {materiais}. Posso gerar questões discursivas baseadas neles! Escolha uma ação abaixo. 👇"
    placeholder="Cole aqui sua resposta discursiva ou peça uma questão para treinar..."
    functionName="medical-reviewer"
    quickActions={quickActions}
  />
);

export default MedicalReviewer;
