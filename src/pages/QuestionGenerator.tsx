import { HelpCircle } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { parseQuestionsFromText } from "@/lib/parseQuestions";
import { useCallback } from "react";

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
      welcomeMessage="Olá! Sou o Gerador de Questões para Residência Médica. Crio questões com casos clínicos no padrão ENARE/USP/UNIFESP, com gabarito comentado e referências (Harrison, Sabiston, Nelson, guidelines). Qual área quer treinar? 📝"
      placeholder="Ex: Gere 5 questões de Cardiologia sobre Insuficiência Cardíaca..."
      functionName="question-generator"
      onSaveMessage={handleSaveQuestions}
    />
  );
};

export default QuestionGenerator;
