import { useState } from "react";
import { logErrorToBank } from "@/lib/errorBankLogger";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, Award, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const questions = [
  {
    statement: "Paciente de 65 anos com dor torácica típica há 40 minutos e supradesnivelamento de ST em DII, DIII e aVF. Qual a conduta inicial prioritária?",
    options: [
      "Solicitar teste ergométrico imediato",
      "Iniciar reperfusão (angioplastia primária quando disponível) e terapia anti-isquêmica",
      "Alta com analgesia e retorno em 24 horas",
      "Aguardar troponina seriada antes de qualquer conduta",
    ],
    correct: 1,
    topic: "Cardiologia",
  },
  {
    statement: "Lactente de 8 meses, febre alta, irritabilidade e fontanela abaulada. Qual exame deve ser considerado para confirmação diagnóstica de meningite, se não houver contraindicação?",
    options: [
      "Ultrassom abdominal",
      "Punção lombar com análise do líquor",
      "Endoscopia digestiva alta",
      "ECG de repouso",
    ],
    correct: 1,
    topic: "Pediatria",
  },
];

const Simulados = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const q = questions[current];

  const handleAnswer = () => {
    if (selected === null) return;
    setAnswered(true);
    const isCorrect = selected === q.correct;
    setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));

    if (!isCorrect && user) {
      logErrorToBank({
        userId: user.id,
        tema: q.topic || "Clínica Médica",
        tipoQuestao: "simulado",
        conteudo: q.statement,
        motivoErro: `Marcou "${q.options[selected]}" — Correta: "${q.options[q.correct]}"`,
        categoriaErro: "conceito",
      });
    }
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setFinished(false);
    setScore({ correct: 0, total: 0 });
  };

  const handleStudyWithTutor = () => {
    const topic = q.topic || "Clínica Médica";
    navigate("/dashboard/chatgpt", {
      state: {
        initialMessage: `Errei uma questão sobre "${topic}". O enunciado era: "${q.statement.slice(0, 200)}". A resposta correta era "${q.options[q.correct]}". Me explique este tema em detalhes seguindo o protocolo ENAZIZI.`,
        fromErrorBank: true,
      },
    });
  };

  if (finished) {
    const pct = Math.round((score.correct / score.total) * 100);
    return (
      <div className="space-y-8 animate-fade-in max-w-3xl">
        <div className="text-center py-8">
          <Award className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Simulado Concluído!</h1>
          <div className="text-5xl font-black text-primary">{pct}%</div>
          <p className="text-muted-foreground mt-2">{score.correct} de {score.total} questões corretas</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={handleRestart}>Refazer Simulado</Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Simulados
        </h1>
        <p className="text-muted-foreground">Teste seus conhecimentos com questões geradas por IA.</p>
      </div>

      <div className="glass-card p-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-muted-foreground">Questão {current + 1}/{questions.length}</span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" /> 02:30
          </span>
        </div>

        <p className="text-lg font-medium mb-6">{q.statement}</p>

        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => !answered && setSelected(i)}
              className={`w-full text-left p-4 rounded-lg border text-sm transition-all ${
                answered && i === q.correct
                  ? "border-success bg-success/10"
                  : answered && i === selected && i !== q.correct
                  ? "border-destructive bg-destructive/10"
                  : selected === i
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/50 hover:border-primary/30"
              }`}
            >
              <span className="font-semibold mr-2">{String.fromCharCode(65 + i)})</span>
              {opt}
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          {!answered ? (
            <Button onClick={handleAnswer} disabled={selected === null}>Confirmar</Button>
          ) : (
            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleNext}>
                {current < questions.length - 1 ? "Próxima" : "Finalizar"}
              </Button>
              {selected !== q.correct && (
                <Button variant="outline" onClick={handleStudyWithTutor} className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Estudar com Tutor IA
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulados;
