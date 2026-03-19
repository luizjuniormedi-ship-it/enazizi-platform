import { CheckCircle2, XCircle, Clock, ArrowRight, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { DiagQuestion, AnswerRecord } from "./DiagnosticExam";

interface DiagnosticReviewProps {
  questions: DiagQuestion[];
  answers: AnswerRecord[];
  totalQuestions: number;
  onFinish: () => void;
  onBack: () => void;
}

const DiagnosticReview = ({ questions, answers, totalQuestions, onFinish, onBack }: DiagnosticReviewProps) => {
  const correctCount = answers.filter(a => a.correct).length;
  const unansweredCount = totalQuestions - answers.length;
  const skippedCount = answers.filter(a => a.selected === -1).length;
  const avgTime = answers.length > 0 ? Math.round(answers.reduce((s, a) => s + a.timeSpent, 0) / answers.length) : 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Revisão das Respostas</h2>
        <p className="text-muted-foreground text-sm">Confira suas respostas antes de finalizar.</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="glass-card p-3 text-center">
          <div className="text-xl font-bold text-green-500">{correctCount}</div>
          <p className="text-xs text-muted-foreground">Corretas</p>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-xl font-bold text-destructive">{answers.length - correctCount - skippedCount}</div>
          <p className="text-xs text-muted-foreground">Erradas</p>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-xl font-bold text-warning">{skippedCount + unansweredCount}</div>
          <p className="text-xs text-muted-foreground">Sem resposta</p>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-xl font-bold text-muted-foreground">{avgTime}s</div>
          <p className="text-xs text-muted-foreground">Tempo médio</p>
        </div>
      </div>

      {/* Questions list */}
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-2">
          {questions.map((q, i) => {
            const answer = answers.find(a => a.questionIdx === i);
            const status = !answer ? "unanswered" : answer.selected === -1 ? "timeout" : answer.correct ? "correct" : "wrong";

            return (
              <div key={i} className={cn(
                "p-3 rounded-lg border flex items-start gap-3 text-sm",
                status === "correct" ? "border-green-500/30 bg-green-500/5" :
                status === "wrong" ? "border-destructive/30 bg-destructive/5" :
                "border-warning/30 bg-warning/5"
              )}>
                <div className="flex-shrink-0 mt-0.5">
                  {status === "correct" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                   status === "wrong" ? <XCircle className="h-4 w-4 text-destructive" /> :
                   <MinusCircle className="h-4 w-4 text-warning" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="line-clamp-2 text-foreground">{i + 1}. {q.statement.slice(0, 120)}...</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] h-4">{q.topic}</Badge>
                    {answer && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> {answer.timeSpent}s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">Voltar às questões</Button>
        <Button onClick={onFinish} className="flex-1 gap-1.5">
          Finalizar diagnóstico <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DiagnosticReview;
