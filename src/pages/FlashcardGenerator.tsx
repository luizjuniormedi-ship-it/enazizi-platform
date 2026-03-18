import { FlipVertical } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";

const quickActions = [
  { label: "🎯 Escolher tema", prompt: "Quero gerar flashcards clínicos. Me pergunte sobre qual tema/especialidade eu quero antes de começar.", icon: "🎯" },
  { label: "🫀 Cardiologia (10)", prompt: "Gere 10 flashcards clínicos de Cardiologia com casos clínicos variados, cobrindo IAM, IC, arritmias e valvopatias.", icon: "🫀" },
  { label: "🧒 Pediatria (10)", prompt: "Gere 10 flashcards clínicos de Pediatria com casos clínicos variados, cobrindo reanimação neonatal, bronquiolite, meningite e desidratação.", icon: "🧒" },
  { label: "🔪 Cirurgia (10)", prompt: "Gere 10 flashcards clínicos de Cirurgia com casos clínicos variados, cobrindo abdome agudo, trauma e hérnias.", icon: "🔪" },
  { label: "🤰 GO (10)", prompt: "Gere 10 flashcards clínicos de Ginecologia e Obstetrícia com casos clínicos variados, cobrindo pré-eclâmpsia, DMG, SOP e endometriose.", icon: "🩷" },
  { label: "🧠 Neurologia (10)", prompt: "Gere 10 flashcards clínicos de Neurologia com casos clínicos variados, cobrindo AVC, epilepsia, meningite e Guillain-Barré.", icon: "🧠" },
  { label: "🦠 Infectologia (10)", prompt: "Gere 10 flashcards clínicos de Infectologia com casos clínicos variados, cobrindo HIV, sepse, tuberculose e hepatites virais.", icon: "🦠" },
  { label: "💊 Endocrinologia (10)", prompt: "Gere 10 flashcards clínicos de Endocrinologia com casos clínicos variados, cobrindo DM, hipotireoidismo, Cushing e CAD.", icon: "💊" },
  { label: "🛡️ Preventiva (10)", prompt: "Gere 10 flashcards clínicos de Medicina Preventiva com casos variados, cobrindo rastreamento, vacinação, epidemiologia e SUS.", icon: "🛡️" },
  { label: "🎗️ Oncologia (10)", prompt: "Gere 10 flashcards clínicos de Oncologia com casos clínicos variados, cobrindo câncer de mama, pulmão, colorretal, estadiamento TNM, síndromes paraneoplásicas e emergências oncológicas.", icon: "🎗️" },
  { label: "⚡ 20 Mistas", prompt: "Gere 20 flashcards clínicos mistos cobrindo Clínica Médica, Cirurgia, Pediatria, GO, Preventiva e Oncologia. Varie os subtemas.", icon: "⚡" },
];

function parseFlashcardsFromText(content: string): Array<{ question: string; answer: string; topic: string }> {
  const flashcards: Array<{ question: string; answer: string; topic: string }> = [];

  const blocks = content.split(/\*\*FLASHCARD\s+\d+/i).filter(b => b.trim());

  for (const block of blocks) {
    const caseMatch = block.match(/(?:CASO\s+CL[ÍI]NICO[:\s]*\*?\*?)\s*([\s\S]*?)(?=\*?\*?❓|\*?\*?\s*PERGUNTA)/i);
    const questionMatch = block.match(/(?:PERGUNTA[:\s]*\*?\*?)\s*([\s\S]*?)(?=\*?\*?✅|\*?\*?\s*RESPOSTA)/i);
    const answerMatch = block.match(/(?:RESPOSTA[:\s]*\*?\*?)\s*([\s\S]*?)(?=\*?\*?🧠|\*?\*?\s*EXPLICA[ÇC][ÃA]O)/i);
    const explanationMatch = block.match(/(?:EXPLICA[ÇC][ÃA]O\s+CL[ÍI]NICA[:\s]*\*?\*?)\s*([\s\S]*?)(?=\*?\*?📌|\*?\*?\s*PONTO|---|$)/i);
    const provaMatch = block.match(/(?:PONTO\s+DE\s+PROVA[:\s]*\*?\*?)\s*([\s\S]*?)(?=---|$)/i);

    const caseText = caseMatch?.[1]?.trim() || "";
    const questionText = questionMatch?.[1]?.trim() || "";
    const answerText = answerMatch?.[1]?.trim() || "";
    const explanation = explanationMatch?.[1]?.trim() || "";
    const prova = provaMatch?.[1]?.trim() || "";

    if (!questionText || !answerText) continue;

    const fullQuestion = caseText ? `${caseText}\n\n${questionText}` : questionText;
    let fullAnswer = answerText;
    if (explanation) fullAnswer += `\n\n🧠 ${explanation}`;
    if (prova) fullAnswer += `\n\n📌 ${prova}`;

    const topicMatch = block.match(/(?:—|[-–])\s*(\w[\w\s/]*)/);
    const topic = topicMatch?.[1]?.trim() || "Medicina";

    flashcards.push({ question: fullQuestion, answer: fullAnswer, topic });
  }

  return flashcards;
}

const FlashcardGenerator = () => {
  const { user } = useAuth();
  const { addXp } = useGamification();

  const handleSaveFlashcards = useCallback(async (content: string): Promise<number> => {
    if (!user) throw new Error("Usuário não autenticado");

    const parsed = parseFlashcardsFromText(content);
    if (parsed.length === 0) throw new Error("Nenhum flashcard encontrado para salvar. Verifique se o formato é válido.");

    const rows = parsed.map((f) => ({
      user_id: user.id,
      question: f.question,
      answer: f.answer,
      topic: f.topic,
    }));

    const { error } = await supabase.from("flashcards").insert(rows);
    if (error) throw new Error("Erro ao salvar: " + error.message);

    await addXp(XP_REWARDS.flashcard_created * parsed.length);

    return parsed.length;
  }, [user, addXp]);

  return (
    <AgentChat
      title="Gerador de Flashcards Clínicos"
      subtitle="Flashcards com casos clínicos para residência médica e Revalida."
      icon={<FlipVertical className="h-6 w-6 text-primary" />}
      welcomeMessage="Olá! Sou o Gerador de Flashcards Clínicos ENAZIZI. 🏥 Crio flashcards baseados em **casos clínicos** para treinar seu raciocínio diagnóstico. Me diga: qual **especialidade** você quer treinar? Exemplo: 'Cardiologia', 'Pediatria', 'Cirurgia'. Ou clique em uma opção abaixo! 👇"
      welcomeMessageWithUploads="📚 Detectei {count} material(is) do seu acervo: {materiais}. Vou usar como base para gerar flashcards clínicos! Escolha o tema abaixo ou me diga o que prefere. 👇"
      placeholder="Ex: Gere 10 flashcards de Cardiologia sobre IAM..."
      functionName="generate-flashcards"
      onSaveMessage={handleSaveFlashcards}
      quickActions={quickActions}
    />
  );
};

export default FlashcardGenerator;
