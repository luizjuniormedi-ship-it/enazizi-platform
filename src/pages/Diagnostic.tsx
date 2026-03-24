import { useState, useEffect } from "react";
import { isMedicalQuestion } from "@/lib/medicalValidation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";
import { logErrorToBank } from "@/lib/errorBankLogger";
import { updateDomainMap } from "@/lib/updateDomainMap";
import { mapTopicToSpecialty } from "@/lib/mapTopicToSpecialty";
import { getFallbackQuestionsForArea, getAllFallbackQuestions } from "@/lib/diagnosticFallbackQuestions";
import DiagnosticIntro from "@/components/diagnostic/DiagnosticIntro";
import DiagnosticExam from "@/components/diagnostic/DiagnosticExam";
import DiagnosticReview from "@/components/diagnostic/DiagnosticReview";
import DiagnosticResult from "@/components/diagnostic/DiagnosticResult";
import type { DiagQuestion, AnswerRecord } from "@/components/diagnostic/DiagnosticExam";

const AREAS = [
  "Clínica Médica", "Cirurgia", "Pediatria", "Ginecologia e Obstetrícia",
  "Medicina Preventiva", "Oncologia", "Neurologia", "Cardiologia",
];

const SCENARIO_HINTS: Record<string, string> = {
  "Clínica Médica": "Varie: UBS, enfermaria, UTI, ambulatório. Pacientes 20-90 anos, diferentes comorbidades. Emergência hipertensiva, ICC descompensada, pneumonia, cetoacidose, TEP.",
  "Cirurgia": "Varie: PS, centro cirúrgico, enfermaria. Abdome agudo, trauma, hérnias, pré/pós-operatório, complicações cirúrgicas.",
  "Pediatria": "Neonatos, lactentes, pré-escolares, adolescentes. Bronquiolite, pneumonia infantil, desidratação, convulsão febril, meningite, vacinação.",
  "Ginecologia e Obstetrícia": "Gestantes em diferentes trimestres, puérperas. Pré-eclâmpsia, DM gestacional, sangramento 1º tri, trabalho de parto, rastreio câncer cervical.",
  "Medicina Preventiva": "Atenção primária, vigilância epidemiológica. Rastreamentos, vacinação adulto, indicadores de saúde, estudos epidemiológicos, SUS.",
  "Oncologia": "Neoplasias mais prevalentes: pulmão, mama, colorretal, próstata. Estadiamento, rastreio, emergências oncológicas, paraneoplásicas.",
  "Neurologia": "AVC isquêmico/hemorrágico, epilepsia, cefaleia, meningite, neuropatia periférica. Glasgow, NIHSS.",
  "Cardiologia": "SCA, IC, arritmias, valvopatias, endocardite. ECG, ecocardiograma, biomarcadores cardíacos.",
};

type Phase = "intro" | "loading" | "exam" | "review" | "result";

const QUESTIONS_PER_AREA = 5;
const REQUEST_TIMEOUT_MS = 35000;

const Diagnostic = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addXp } = useGamification();
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<DiagQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [resumeIdx, setResumeIdx] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("diagnostic_results").select("id").eq("user_id", user.id).limit(1).then(({ data }) => {
      if (data && data.length > 0) setAlreadyDone(true);
    });
  }, [user]);

  const getDifficultyForArea = (area: string, prevAnswers: AnswerRecord[]): string => {
    const areaAnswers = prevAnswers.filter(a => a.topic === area);
    if (areaAnswers.length === 0) return "intermediário (padrão REVALIDA)";
    const rate = areaAnswers.filter(a => a.correct).length / areaAnswers.length;
    if (rate >= 0.8) return "avançado (padrão ENAMED/ENARE com pegadinhas)";
    return "intermediário (padrão REVALIDA)";
  };

  const invokeQuestionGeneratorWithTimeout = async (body: Record<string, unknown>, timeoutMs: number) => {
    let timer: number | undefined;
    try {
      const request = supabase.functions.invoke("question-generator", { body });
      const timeout = new Promise<never>((_, reject) => {
        timer = window.setTimeout(() => reject(new Error("Tempo limite ao gerar questões.")), timeoutMs);
      });
      return await Promise.race([request, timeout]) as Awaited<typeof request>;
    } finally {
      if (timer) window.clearTimeout(timer);
    }
  };

  const startExam = async () => {
    setPhase("loading");
    try {
      const results = await Promise.allSettled(
        AREAS.map(async (area) => {
          const hint = SCENARIO_HINTS[area] || "";
          const difficulty = getDifficultyForArea(area, answers);
          const seed = Math.floor(Math.random() * 99999);
          const usedTopics = questions
            .filter(q => q.topic === area)
            .map(q => q.statement.slice(0, 40))
            .slice(-3)
            .join("; ");

          const res = await invokeQuestionGeneratorWithTimeout({
            stream: false,
            maxRetries: 0,
            timeoutMs: 18000,
            messages: [{ role: "user", content: `Gere EXATAMENTE ${QUESTIONS_PER_AREA} questões de múltipla escolha de ${area} para simulado diagnóstico de residência médica. Nível: ${difficulty}. Seed: ${seed}.

CALIBRAÇÃO OBRIGATÓRIA REVALIDA/ENAMED:
- PROIBIDO: questões de definição pura ("O que é X?")
- PROIBIDO: enunciados < 150 caracteres sem caso clínico
- OBRIGATÓRIO: caso clínico com ≥3 dados clínicos (sinais vitais, exames, achados semiológicos)
- OBRIGATÓRIO: ≥2 etapas de raciocínio clínico
- OBRIGATÓRIO: pelo menos 2 distratores plausíveis (diagnóstico diferencial real)

REGRAS DE DIVERSIDADE OBRIGATÓRIAS:
- ${hint}
- Cada questão DEVE abordar um SUBTÓPICO DIFERENTE dentro de ${area}
- PROIBIDO repetir cenário, perfil de paciente, faixa etária ou queixa principal
- Varie o TIPO de pergunta: 1 diagnóstico, 1 conduta, 1 exame complementar, 1 fisiopatologia, 1 tratamento
- Cada paciente deve ter idade, sexo e contexto clínico DISTINTOS
- ${usedTopics ? `NÃO repita temas similares a: ${usedTopics}` : ""}

REGRA DE GABARITO:
- NUNCA repita mesma letra consecutiva
- Distribua gabaritos entre A(0), B(1), C(2), D(3), E(4) — use pelo menos 4 letras diferentes

FORMATO: Retorne APENAS JSON array:
[{"statement":"Caso clínico completo com ≥150 chars...","options":["A) ...","B) ...","C) ...","D) ...","E) ..."],"correct_index":0,"topic":"${area}","explanation":"Raciocínio clínico passo a passo...","difficulty":"${difficulty}"}]
NÃO inclua texto extra, APENAS o JSON.` }],
          }, REQUEST_TIMEOUT_MS);

          if (res.error) throw res.error;

          const raw = res.data;
          let content = "";
          if (typeof raw === "string") content = raw;
          else if (raw?.choices?.[0]?.message?.content) content = raw.choices[0].message.content;
          else content = JSON.stringify(raw);

          const parsed = parseQuestions(content, area, difficulty).filter(q => isMedicalQuestion(q));
          return parsed.slice(0, QUESTIONS_PER_AREA);
        })
      );

      const failedAreas: string[] = [];
      const allQuestions = results.flatMap((result, idx) => {
        const area = AREAS[idx];
        if (result.status === "fulfilled" && result.value.length > 0) {
          return result.value;
        }
        failedAreas.push(area);
        return generateFallbackQuestionsForArea(area, QUESTIONS_PER_AREA);
      });

      if (failedAreas.length > 0) {
        toast({
          title: "Geração parcial concluída",
          description: `Algumas áreas demoraram demais (${failedAreas.join(", ")}). Inserimos questões de contingência para você continuar.`,
        });
      }

      setQuestions(allQuestions.length > 0 ? allQuestions : generateFallbackQuestions());
      setPhase("exam");
    } catch (err: any) {
      toast({ title: "Erro ao gerar diagnóstico", description: err.message, variant: "destructive" });
      setQuestions(generateFallbackQuestions());
      setPhase("exam");
    }
  };

  const parseQuestions = (text: string, defaultTopic: string, difficulty: string): DiagQuestion[] => {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as DiagQuestion[];
        return parsed.map(q => ({ ...q, topic: q.topic || defaultTopic, difficulty: q.difficulty || difficulty }));
      }
    } catch {}
    return [];
  };

  const generateFallbackQuestionsForArea = (area: string, count = 1): DiagQuestion[] => {
    const focuses = ["diagnóstico inicial", "conduta imediata", "exame complementar", "fisiopatologia", "tratamento"];
    return Array.from({ length: count }, (_, idx) => ({
      statement: `Questão de ${area} (${idx + 1}/${count}): Paciente de 45 anos apresenta dor torácica há 2 horas no pronto-socorro. Qual a melhor ${focuses[idx % focuses.length]}?`,
      options: ["A) ECG em até 10 minutos", "B) Solicitar troponina e aguardar", "C) Prescrever analgésico", "D) Encaminhar para enfermaria", "E) Solicitar raio-X de tórax primeiro"],
      correct_index: 0,
      topic: area,
      explanation: "O ECG deve ser realizado em até 10 minutos da chegada em casos com suspeita de síndrome coronariana aguda.",
      difficulty: "intermediário",
    }));
  };

  const generateFallbackQuestions = (): DiagQuestion[] => {
    return AREAS.flatMap(area => generateFallbackQuestionsForArea(area, QUESTIONS_PER_AREA));
  };

  const updateMedicalDomainMap = async (finalAnswers: AnswerRecord[]) => {
    if (!user) return;
    const entries = finalAnswers.map(a => ({ topic: a.topic, correct: a.correct }));
    await updateDomainMap(user.id, entries);
  };

  const handleExamFinish = async (finalAnswers: AnswerRecord[]) => {
    setAnswers(finalAnswers);

    if (!user) {
      setPhase("result");
      return;
    }

    // Log wrong answers to error bank
    for (const a of finalAnswers) {
      if (!a.correct && a.selected >= 0) {
        const q = questions[a.questionIdx];
        logErrorToBank({
          userId: user.id,
          tema: mapTopicToSpecialty(q.topic || "Geral") || q.topic || "Geral",
          tipoQuestao: "diagnostico",
          conteudo: q.statement,
          motivoErro: `Marcou "${q.options[a.selected]}" — Correta: "${q.options[q.correct_index]}"`,
          categoriaErro: "conceito",
        });
      }
    }

    // Calculate & save score
    const correctCount = finalAnswers.filter(a => a.correct).length;
    const score = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
    const areaResults: Record<string, { correct: number; total: number }> = {};
    for (const a of finalAnswers) {
      if (!areaResults[a.topic]) areaResults[a.topic] = { correct: 0, total: 0 };
      areaResults[a.topic].total++;
      if (a.correct) areaResults[a.topic].correct++;
    }

    await supabase.from("diagnostic_results").insert([{
      user_id: user.id,
      score,
      total_questions: questions.length,
      results_json: { answers: finalAnswers, areaResults } as any,
    }]);
    await supabase.from("profiles").update({ has_completed_diagnostic: true }).eq("user_id", user.id);

    // Gamification: award XP
    const xpPerCorrect = XP_REWARDS.question_correct;
    const xpPerAttempt = XP_REWARDS.question_answered;
    const totalXp = (correctCount * xpPerCorrect) + (finalAnswers.length * xpPerAttempt);
    const earned = await addXp(totalXp, "diagnostic_completed");
    setXpEarned(earned || totalXp);

    // Update medical domain map with normalized specialties
    await updateMedicalDomainMap(finalAnswers);

    setPhase("result");
  };

  const handleGoToReview = (currentAnswers: AnswerRecord[], currentIdx: number) => {
    setAnswers(currentAnswers);
    setResumeIdx(currentIdx);
    setPhase("review");
  };

  if (phase === "intro") {
    return <DiagnosticIntro alreadyDone={alreadyDone} onStart={startExam} />;
  }

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Gerando questões diagnósticas personalizadas...</p>
        <p className="text-xs text-muted-foreground mt-2">Isso pode levar até 1 minuto</p>
      </div>
    );
  }

  if (phase === "exam") {
    return (
      <DiagnosticExam
        questions={questions}
        onFinish={handleExamFinish}
        onGoToReview={handleGoToReview}
      />
    );
  }

  if (phase === "review") {
    return (
      <DiagnosticReview
        questions={questions}
        answers={answers}
        totalQuestions={questions.length}
        onFinish={() => handleExamFinish(answers)}
        onBack={() => setPhase("exam")}
      />
    );
  }

  return <DiagnosticResult questions={questions} answers={answers} xpEarned={xpEarned} />;
};

export default Diagnostic;
