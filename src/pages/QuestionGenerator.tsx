import { HelpCircle } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";
import InteractiveQuestionRenderer from "@/components/agents/InteractiveQuestionRenderer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { parseQuestionsFromText } from "@/lib/parseQuestions";
import { useCallback } from "react";

const quickActions = [
  { label: "📝 Escolher tema e quantidade", prompt: "Quero gerar questões. Me pergunte sobre qual tema/especialidade e quantas questões eu quero antes de começar.", icon: "🎯" },
  { label: "🫀 Cardiologia (10)", prompt: "Gere 10 questões de Cardiologia nível intermediário. Formato ENARE com casos clínicos.", icon: "🟢" },
  { label: "🧒 Pediatria (10)", prompt: "Gere 10 questões de Pediatria nível intermediário. Formato ENARE com casos clínicos.", icon: "🟡" },
  { label: "🔪 Cirurgia (10)", prompt: "Gere 10 questões de Cirurgia nível intermediário. Formato ENARE com casos clínicos.", icon: "🔴" },
];

const QuestionGenerator = () => {
  const { user } = useAuth();

  const handleSaveQuestions = useCallback(async (content: string): Promise<number> => {
    if (!user) throw new Error("Usuário não autenticado");

    const parsed = parseQuestionsFromText(content);
    if (parsed.length === 0) throw new Error("Nenhuma questão encontrada para salvar. Verifique se o formato é válido.");

    const rows = parsed.map((q) => ({
      user_id: user.id,
      statement: q.statement,
      options: q.options,
      correct_index: q.correctIndex,
      explanation: q.explanation,
      topic: q.topic || null,
      source: "gerador-ia",
    }));

    const { error } = await supabase.from("questions_bank").insert(rows);
    if (error) throw new Error("Erro ao salvar: " + error.message);

    return parsed.length;
  }, [user]);

  return (
    <AgentChat
      title="Gerador de Questões"
      subtitle="Questões estilo ENARE, USP e UNIFESP com casos clínicos."
      icon={<HelpCircle className="h-6 w-6 text-primary" />}
      welcomeMessage="Olá! Sou o Gerador de Questões para Residência Médica. 📝 Me diga: qual **assunto/especialidade** você quer treinar e **quantas questões** deseja? Exemplo: '10 questões de Cardiologia' ou '5 questões difíceis de Pediatria'."
      welcomeMessageWithUploads="📚 Detectei {count} material(is) do seu acervo: {materiais}. Vou usar como base para gerar questões! Escolha abaixo quantas questões e o nível de dificuldade, ou me diga o que prefere. 👇"
      placeholder="Ex: Gere 5 questões de Cardiologia sobre Insuficiência Cardíaca..."
      functionName="question-generator"
      onSaveMessage={handleSaveQuestions}
      quickActions={quickActions}
    />
  );
};

export default QuestionGenerator;
