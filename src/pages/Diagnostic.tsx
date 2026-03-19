import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { logErrorToBank } from "@/lib/errorBankLogger";
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

const Diagnostic = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<DiagQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [resumeIdx, setResumeIdx] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("diagnostic_results").select("id").eq("user_id", user.id).limit(1).then(({ data }) => {
      if (data && data.length > 0) setAlreadyDone(true);
    });
  }, [user]);

  const getDifficultyForArea = (area: string, prevAnswers: AnswerRecord[]): string => {
    const areaAnswers = prevAnswers.filter(a => a.topic === area);
    if (areaAnswers.length === 0) return "intermediário";
    const rate = areaAnswers.filter(a => a.correct).length / areaAnswers.length;
    if (rate >= 0.8) return "avançado";
    if (rate >= 0.5) return "intermediário";
    return "básico";
  };

  const startExam = async () => {
    setPhase("loading");
    try {
      const allQuestions: DiagQuestion[] = [];

      for (const area of AREAS) {
        const hint = SCENARIO_HINTS[area] || "";
        const difficulty = getDifficultyForArea(area, allQuestions.flatMap(() => []));

        const res = await supabase.functions.invoke("question-generator", {
          body: {
            stream: false,
            messages: [{ role: "user", content: `Gere EXATAMENTE 5 questões de múltipla escolha de ${area} para simulado diagnóstico de residência médica. Nível: ${difficulty}.

REGRAS DE DIVERSIDADE:
- ${hint}
- Cada questão DEVE ter caso clínico ÚNICO
- PROIBIDO repetir cenário ou perfil de paciente
- Varie pergunta: diagnóstico, conduta, exame complementar, fisiopatologia

REGRA DE GABARITO:
- NUNCA repita mesma letra consecutiva
- Use pelo menos 3 letras diferentes (A=0,B=1,C=2,D=3,E=4)

FORMATO: Retorne APENAS JSON array:
[{"statement":"...","options":["A) ...","B) ...","C) ...","D) ...","E) ..."],"correct_index":0,"topic":"${area}","explanation":"...","difficulty":"${difficulty}"}]
NÃO inclua texto extra, APENAS o JSON.` }],
          },
        });

        if (res.error) throw res.error;

        const raw = res.data;
        let content = "";
        if (typeof raw === "string") content = raw;
        else if (raw?.choices?.[0]?.message?.content) content = raw.choices[0].message.content;
        else content = JSON.stringify(raw);

        const parsed = parseQuestions(content, area, difficulty);
        allQuestions.push(...parsed.slice(0, 5));
      }

      if (allQuestions.length < 10) {
        allQuestions.push(...generateFallbackQuestions());
      }

      setQuestions(allQuestions);
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

  const generateFallbackQuestions = (): DiagQuestion[] => {
    return AREAS.map(area => ({
      statement: `Questão diagnóstica de ${area}: Paciente de 45 anos apresenta-se no pronto-socorro com queixa de dor torácica há 2 horas. Qual a conduta inicial mais adequada?`,
      options: ["A) ECG em até 10 minutos", "B) Solicitar troponina e aguardar", "C) Prescrever analgésico", "D) Encaminhar para enfermaria", "E) Solicitar raio-X de tórax primeiro"],
      correct_index: 0,
      topic: area,
      explanation: "O ECG deve ser realizado em até 10 minutos da chegada do paciente com dor torácica.",
      difficulty: "intermediário",
    }));
  };

  const handleExamFinish = async (finalAnswers: AnswerRecord[]) => {
    setAnswers(finalAnswers);

    // Log wrong answers
    if (user) {
      for (const a of finalAnswers) {
        if (!a.correct && a.selected >= 0) {
          const q = questions[a.questionIdx];
          logErrorToBank({
            userId: user.id,
            tema: q.topic || "Geral",
            tipoQuestao: "diagnostico",
            conteudo: q.statement,
            motivoErro: `Marcou "${q.options[a.selected]}" — Correta: "${q.options[q.correct_index]}"`,
            categoriaErro: "conceito",
          });
        }
      }
    }

    const correctCount = finalAnswers.filter(a => a.correct).length;
    const score = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
    const areaResults: Record<string, { correct: number; total: number }> = {};
    for (const a of finalAnswers) {
      if (!areaResults[a.topic]) areaResults[a.topic] = { correct: 0, total: 0 };
      areaResults[a.topic].total++;
      if (a.correct) areaResults[a.topic].correct++;
    }

    if (user) {
      await supabase.from("diagnostic_results").insert([{
        user_id: user.id,
        score,
        total_questions: questions.length,
        results_json: { answers: finalAnswers, areaResults } as any,
      }]);
      await supabase.from("profiles").update({ has_completed_diagnostic: true }).eq("user_id", user.id);
    }

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

  return <DiagnosticResult questions={questions} answers={answers} />;
};

export default Diagnostic;
