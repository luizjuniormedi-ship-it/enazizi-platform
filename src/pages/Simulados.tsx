import { useState } from "react";
import { FileText, Clock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

const questions = [
  {
    statement: "De acordo com a Constituição Federal, a Polícia Federal destina-se a:",
    options: [
      "Exercer funções de polícia judiciária dos Estados",
      "Apurar infrações penais contra a ordem política e social",
      "Exercer a segurança pública municipal",
      "Fiscalizar o trânsito em rodovias estaduais",
    ],
    correct: 1,
  },
  {
    statement: "A prisão em flagrante pode ser realizada por:",
    options: [
      "Apenas por autoridade policial",
      "Apenas por agentes de segurança pública",
      "Qualquer do povo",
      "Apenas mediante mandado judicial",
    ],
    correct: 2,
  },
];

const Simulados = () => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const q = questions[current];

  const handleAnswer = () => setAnswered(true);

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
            <Button onClick={() => { setCurrent(Math.min(questions.length - 1, current + 1)); setSelected(null); setAnswered(false); }}>
              Próxima
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulados;
