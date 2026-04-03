import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Timer, CheckCircle, XCircle, AlertTriangle, Trophy, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useGamification, XP_REWARDS } from "@/hooks/useGamification";

interface OSCEOption {
  text: string;
  is_correct: boolean;
}

interface OSCEStage {
  stage_type: "diagnostico" | "exame" | "conduta" | "priorizacao";
  title: string;
  clinical_context: string;
  options: OSCEOption[];
  explanation: string;
  time_limit_seconds: number;
  critical_action: boolean;
}

interface OSCEData {
  structured_data: {
    specialty: string;
    topic: string;
    difficulty: string;
    diagnosis: string;
    keyFindings: string[];
    criticalPoints: string[];
    commonErrors: string[];
  };
  osce_stages: OSCEStage[];
}

interface Props {
  osceData: OSCEData;
  chronicleId: string | null;
  onBack: () => void;
}

const STAGE_LABELS: Record<string, { label: string; icon: string }> = {
  diagnostico: { label: "Diagnóstico", icon: "🩺" },
  exame: { label: "Exame Complementar", icon: "🔬" },
  conduta: { label: "Conduta", icon: "💊" },
  priorizacao: { label: "Priorização", icon: "⚡" },
};

const ChronicleOSCE = ({ osceData, chronicleId, onBack }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addXp } = useGamification();

  const [currentStage, setCurrentStage] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [decisions, setDecisions] = useState<Array<{ stage: number; selected: number; correct: boolean; timeUsed: number }>>([]);
  const [finished, setFinished] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(Date.now());

  const stages = osceData.osce_stages;
  const stage = stages[currentStage];

  // Timer
  useEffect(() => {
    if (finished || showExplanation || !stage) return;
    setTimeLeft(stage.time_limit_seconds);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto-select wrong if time runs out
          handleSelect(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentStage, finished, showExplanation]);

  const handleSelect = useCallback((optionIdx: number) => {
    if (selectedOption !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const timeUsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    const correct = optionIdx >= 0 && stage.options[optionIdx]?.is_correct === true;

    setSelectedOption(optionIdx);
    setShowExplanation(true);
    setDecisions(prev => [...prev, { stage: currentStage, selected: optionIdx, correct, timeUsed }]);
  }, [selectedOption, currentStage, stage]);

  const nextStage = () => {
    if (currentStage + 1 >= stages.length) {
      finishExam();
    } else {
      setCurrentStage(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    }
  };

  const finishExam = async () => {
    const allDecisions = decisions;
    const correctCount = allDecisions.filter(d => d.correct).length;
    const totalTimeUsed = allDecisions.reduce((s, d) => s + d.timeUsed, 0);
    setTotalTime(totalTimeUsed);

    // Calculate score (0-10)
    const accuracyScore = (correctCount / stages.length) * 6;
    const criticalStages = stages.filter(s => s.critical_action);
    const criticalCorrect = allDecisions.filter((d, i) => stages[i]?.critical_action && d.correct).length;
    const criticalScore = criticalStages.length > 0 ? (criticalCorrect / criticalStages.length) * 2 : 2;
    const avgTimeRatio = allDecisions.reduce((s, d, i) => s + (d.timeUsed / stages[i].time_limit_seconds), 0) / stages.length;
    const timeScore = avgTimeRatio <= 0.7 ? 2 : avgTimeRatio <= 0.9 ? 1.5 : 1;

    const finalScore = Math.min(10, Math.round((accuracyScore + criticalScore + timeScore) * 10) / 10);

    const evaluation = {
      score: finalScore,
      grade: finalScore >= 8 ? "excelente" : finalScore >= 6 ? "bom" : finalScore >= 4 ? "regular" : "ruim",
      correct_count: correctCount,
      total_stages: stages.length,
      critical_correct: criticalCorrect,
      critical_total: criticalStages.length,
      time_total: totalTimeUsed,
      diagnosis: osceData.structured_data.diagnosis,
      specialty: osceData.structured_data.specialty,
    };

    setFinished(true);

    // Save to DB
    if (user && chronicleId) {
      try {
        await supabase.from("chronicle_osce_sessions").insert({
          user_id: user.id,
          chronicle_id: chronicleId,
          score: finalScore,
          evaluation,
          decisions: allDecisions,
          time_seconds: totalTimeUsed,
        });
        await addXp(XP_REWARDS.question_answered * 5);
      } catch (e) {
        console.error("Failed to save OSCE session:", e);
      }
    }
  };

  if (finished) {
    const correctCount = decisions.filter(d => d.correct).length;
    const finalScore = decisions.length > 0
      ? Math.min(10, Math.round(((correctCount / stages.length) * 6 + 2 + 1.5) * 10) / 10)
      : 0;
    const grade = finalScore >= 8 ? "Excelente" : finalScore >= 6 ? "Bom" : finalScore >= 4 ? "Regular" : "Insuficiente";
    const gradeColor = finalScore >= 8 ? "text-green-400" : finalScore >= 6 ? "text-blue-400" : finalScore >= 4 ? "text-yellow-400" : "text-red-400";

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar à crônica
          </Button>
        </div>

        <Card className="border-primary/20">
          <CardContent className="p-6 text-center space-y-4">
            <Trophy className="h-12 w-12 mx-auto text-primary" />
            <h2 className="text-xl font-bold">Simulação Concluída</h2>
            <p className="text-sm text-muted-foreground">{osceData.structured_data.diagnosis}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
              <div className="glass-card p-3">
                <div className={`text-2xl font-bold ${gradeColor}`}>{finalScore.toFixed(1)}</div>
                <div className="text-[10px] text-muted-foreground">Nota</div>
              </div>
              <div className="glass-card p-3">
                <div className={`text-2xl font-bold ${gradeColor}`}>{grade}</div>
                <div className="text-[10px] text-muted-foreground">Conceito</div>
              </div>
              <div className="glass-card p-3">
                <div className="text-2xl font-bold">{correctCount}/{stages.length}</div>
                <div className="text-[10px] text-muted-foreground">Acertos</div>
              </div>
              <div className="glass-card p-3">
                <div className="text-2xl font-bold">{totalTime}s</div>
                <div className="text-[10px] text-muted-foreground">Tempo total</div>
              </div>
            </div>

            {/* Stage-by-stage review */}
            <div className="space-y-2 text-left">
              <h3 className="text-sm font-semibold">Revisão por etapa</h3>
              {decisions.map((d, i) => {
                const s = stages[i];
                const sl = STAGE_LABELS[s.stage_type] || { label: s.stage_type, icon: "📋" };
                return (
                  <div key={i} className={`p-3 rounded-lg border text-sm ${d.correct ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{sl.icon} {sl.label}</span>
                      <div className="flex items-center gap-2">
                        {s.critical_action && <Badge variant="destructive" className="text-[9px]">Crítica</Badge>}
                        {d.correct ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.title}</p>
                    {!d.correct && (
                      <p className="text-xs mt-1 text-red-300">
                        ✅ Correto: {s.options.find(o => o.is_correct)?.text}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 justify-center pt-4">
              <Button variant="outline" onClick={onBack}>Voltar à crônica</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stage) return null;

  const sl = STAGE_LABELS[stage.stage_type] || { label: stage.stage_type, icon: "📋" };
  const timePercent = stage.time_limit_seconds > 0 ? (timeLeft / stage.time_limit_seconds) * 100 : 0;
  const timeColor = timeLeft <= 10 ? "text-red-400" : timeLeft <= 20 ? "text-yellow-400" : "text-foreground";

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{osceData.structured_data.specialty}</Badge>
          <Badge variant="secondary" className="text-xs">Etapa {currentStage + 1}/{stages.length}</Badge>
        </div>
      </div>

      {/* Progress */}
      <Progress value={((currentStage) / stages.length) * 100} className="h-2" />

      {/* Timer */}
      {!showExplanation && (
        <div className="flex items-center justify-center gap-2">
          <Timer className={`h-5 w-5 ${timeColor}`} />
          <span className={`text-2xl font-mono font-bold ${timeColor}`}>{timeLeft}s</span>
          {stage.critical_action && (
            <Badge variant="destructive" className="text-[10px] gap-1">
              <AlertTriangle className="h-3 w-3" /> Decisão crítica
            </Badge>
          )}
        </div>
      )}

      {/* Stage card */}
      <Card className={stage.critical_action ? "border-red-500/30" : ""}>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{sl.icon}</span>
            <h3 className="font-semibold text-sm">{sl.label}</h3>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{stage.clinical_context}</p>

          <h4 className="font-semibold text-base">{stage.title}</h4>

          {/* Options */}
          <div className="space-y-2">
            {stage.options.map((opt, i) => {
              let optClass = "border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer";
              if (selectedOption !== null) {
                if (opt.is_correct) {
                  optClass = "border-green-500 bg-green-500/10";
                } else if (i === selectedOption && !opt.is_correct) {
                  optClass = "border-red-500 bg-red-500/10";
                } else {
                  optClass = "border-border opacity-50";
                }
              }

              return (
                <button
                  key={i}
                  disabled={selectedOption !== null}
                  onClick={() => handleSelect(i)}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${optClass}`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + i)})</span>
                  {opt.text}
                  {selectedOption !== null && opt.is_correct && <CheckCircle className="h-4 w-4 inline ml-2 text-green-400" />}
                  {selectedOption === i && !opt.is_correct && <XCircle className="h-4 w-4 inline ml-2 text-red-400" />}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border space-y-2 animate-fade-in">
              <h4 className="font-semibold text-sm flex items-center gap-1">
                {decisions[decisions.length - 1]?.correct
                  ? <><CheckCircle className="h-4 w-4 text-green-400" /> Correto!</>
                  : <><XCircle className="h-4 w-4 text-red-400" /> Incorreto</>
                }
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{stage.explanation}</p>
              <div className="pt-2">
                <Button size="sm" onClick={nextStage} className="gap-1">
                  {currentStage + 1 >= stages.length ? "Ver Resultado" : "Próxima Etapa"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChronicleOSCE;
