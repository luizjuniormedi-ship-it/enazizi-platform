import { HelpCircle } from "lucide-react";
import AgentChat from "@/components/agents/AgentChat";
import InteractiveQuestionRenderer from "@/components/agents/InteractiveQuestionRenderer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { parseQuestionsFromText } from "@/lib/parseQuestions";
import { useCallback } from "react";

const quickActions = [
  { label: "📝 Escolher tema e quantidade", prompt: "Quero gerar questões. Me pergunte sobre qual tema/especialidade e quantas questões eu quero antes de começar.", icon: "🎯" },
  { label: "🫀 Cardiologia (10)", prompt: "Gere 10 questões ORIGINAIS de Cardiologia nível intermediário. Varie os subtemas: IAM, IC, arritmias, valvopatias, HAS, endocardite, pericardite. Formato ENARE com casos clínicos variados.", icon: "🟢" },
  { label: "🧒 Pediatria (10)", prompt: "Gere 10 questões ORIGINAIS de Pediatria nível intermediário. Varie os subtemas: bronquiolite, convulsão febril, desidratação, vacinação, icterícia neonatal, pneumonia infantil. Formato ENARE com casos clínicos variados.", icon: "🟡" },
  { label: "🔪 Cirurgia (10)", prompt: "Gere 10 questões ORIGINAIS de Cirurgia nível intermediário. Varie os subtemas: abdome agudo, politrauma, hérnias, apendicite, colecistite, obstrução intestinal. Formato ENARE com casos clínicos variados.", icon: "🔴" },
  { label: "🧠 Neurologia (10)", prompt: "Gere 10 questões ORIGINAIS de Neurologia nível intermediário. Varie os subtemas: AVC, epilepsia, meningite, cefaleia, Guillain-Barré, esclerose múltipla. Formato ENARE com casos clínicos variados.", icon: "🔵" },
  { label: "🦠 Infectologia (10)", prompt: "Gere 10 questões ORIGINAIS de Infectologia nível intermediário. Varie os subtemas: HIV, sepse, dengue, tuberculose, sífilis, hepatites virais, meningite bacteriana. Formato ENARE com casos clínicos variados.", icon: "🟠" },
  { label: "🤰 GO (10)", prompt: "Gere 10 questões ORIGINAIS de Ginecologia e Obstetrícia nível intermediário. Varie os subtemas: pré-eclâmpsia, DMG, placenta prévia, SOP, endometriose, câncer de colo uterino. Formato ENARE com casos clínicos variados.", icon: "🩷" },
  { label: "🏥 Emergência (10)", prompt: "Gere 10 questões ORIGINAIS de Medicina de Emergência nível intermediário. Varie os subtemas: PCR, choque, intoxicações, politrauma ATLS, crise hipertensiva, anafilaxia. Formato ENARE com casos clínicos variados.", icon: "🚑" },
  { label: "🛡️ Preventiva (10)", prompt: "Gere 10 questões ORIGINAIS de Medicina Preventiva nível intermediário. Varie os subtemas: rastreamento, vacinação, epidemiologia, bioestatística, SUS, APS. Formato ENARE com casos clínicos variados.", icon: "🟤" },
  { label: "💊 Endocrinologia (10)", prompt: "Gere 10 questões ORIGINAIS de Endocrinologia nível intermediário. Varie os subtemas: DM1/DM2, hipotireoidismo, hipertireoidismo, Cushing, Addison, CAD. Formato ENARE com casos clínicos variados.", icon: "💜" },
  { label: "🦴 Reumatologia (10)", prompt: "Gere 10 questões ORIGINAIS de Reumatologia nível intermediário. Varie os subtemas: LES, artrite reumatoide, gota, febre reumática, vasculites, esclerose sistêmica. Formato ENARE com casos clínicos variados.", icon: "🦴" },
  { label: "🧠 Psiquiatria (10)", prompt: "Gere 10 questões ORIGINAIS de Psiquiatria nível intermediário. Varie os subtemas: depressão, esquizofrenia, transtorno bipolar, ansiedade, dependência química, emergências psiquiátricas. Formato ENARE com casos clínicos variados.", icon: "🧩" },
  { label: "🩸 Hematologia (10)", prompt: "Gere 10 questões ORIGINAIS de Hematologia nível intermediário. Varie os subtemas: anemia ferropriva, anemia falciforme, leucemias, linfomas, PTI, CIVD. Formato ENARE com casos clínicos variados.", icon: "🩸" },
  { label: "💊 Farmacologia (10)", prompt: "Gere 10 questões ORIGINAIS de Farmacologia Médica nível intermediário. Varie os subtemas: farmacocinética, farmacodinâmica, antibióticos, anti-hipertensivos, anticoagulantes, analgésicos, anti-inflamatórios, interações medicamentosas. Formato ENARE com casos clínicos variados.", icon: "💊" },
  { label: "🔍 Semiologia (10)", prompt: "Gere 10 questões ORIGINAIS de Semiologia Médica nível intermediário. Varie os subtemas: ausculta cardíaca, ausculta pulmonar, exame abdominal, exame neurológico, sinais semiológicos clássicos, propedêutica. Formato ENARE com casos clínicos variados.", icon: "🔍" },
  { label: "🦴 Anatomia (10)", prompt: "Gere 10 questões ORIGINAIS de Anatomia Médica nível intermediário. Varie os subtemas: anatomia cardíaca, anatomia do sistema nervoso, anatomia abdominal, anatomia do aparelho locomotor, anatomia cirúrgica, correlações clínico-anatômicas. Formato ENARE com casos clínicos variados.", icon: "🦴" },
  { label: "🎗️ Oncologia (10)", prompt: "Gere 10 questões ORIGINAIS de Oncologia nível intermediário. Varie os subtemas: câncer de mama, câncer de pulmão, câncer colorretal, estadiamento TNM, síndromes paraneoplásicas, emergências oncológicas, quimioterapia e imunoterapia. Formato ENARE com casos clínicos variados.", icon: "🎗️" },
  { label: "🔥 5 Questões Difíceis", prompt: "Gere 5 questões DIFÍCEIS de múltipla escolha sobre qualquer área da Medicina para residência. Nível alto com casos clínicos complexos, diagnósticos diferenciais e condutas avançadas.", icon: "🔥" },
  { label: "⚡ 20 Questões Mistas", prompt: "Gere 20 questões ORIGINAIS mistas cobrindo: Clínica Médica, Cirurgia, Pediatria, GO, Preventiva e Oncologia. Nível intermediário a difícil. Formato ENARE com casos clínicos variados.", icon: "⚡" },
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

  const renderInteractive = useCallback((content: string) => (
    <InteractiveQuestionRenderer content={content} />
  ), []);

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
      renderAssistantMessage={renderInteractive}
    />
  );
};

export default QuestionGenerator;
