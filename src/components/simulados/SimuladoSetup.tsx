import { useState } from "react";
import { useStudyContext } from "@/lib/studyContext";
import StudyContextBanner from "@/components/study/StudyContextBanner";
import { FileText, Play, History, BookOpen, Timer, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import ModuleHelpButton from "@/components/layout/ModuleHelpButton";
import ResumeSessionBanner from "@/components/layout/ResumeSessionBanner";
import SimuladoHistory from "./SimuladoHistory";

import { ALL_SPECIALTIES as ALL_TOPICS, SPECIALTY_CYCLES } from "@/constants/specialties";
import CycleFilter, { getFilteredSpecialties } from "@/components/CycleFilter";

const DIFFICULTY_OPTIONS = [
  { value: "facil", label: "Fácil" },
  { value: "intermediario", label: "Intermediário" },
  { value: "dificil", label: "Difícil" },
  { value: "misto", label: "Misto" },
];

export type SimuladoMode = "prova" | "estudo" | "extremo";

interface SimuladoSetupProps {
  onStart: (config: { topics: string[]; count: number; difficulty: string; timePerQuestion: number; mode: SimuladoMode }) => void;
  onResumeSession: () => void;
  onDiscardSession: () => void;
  onRetryErrors: (sessionId: string) => void;
  pendingSession: any;
  checkedSession: boolean;
  userId?: string;
}

const SimuladoSetup = ({ onStart, onResumeSession, onDiscardSession, onRetryErrors, pendingSession, checkedSession, userId }: SimuladoSetupProps) => {
  const studyCtx = useStudyContext();
  const [tab, setTab] = useState<"novo" | "historico">("novo");
  const [selectedTopics, setSelectedTopics] = useState<string[]>(() => {
    if (studyCtx?.specialty) return [studyCtx.specialty];
    if (studyCtx?.topic) return [studyCtx.topic];
    return [];
  });
  const [cycleFilter, setCycleFilter] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [customCount, setCustomCount] = useState("");
  const [difficulty, setDifficulty] = useState("intermediario");
  const [timePerQuestion, setTimePerQuestion] = useState(3);
  const [mode, setMode] = useState<SimuladoMode>("estudo");

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleStart = () => {
    const count = customCount ? parseInt(customCount) : questionCount;
    onStart({ topics: selectedTopics, count, difficulty, timePerQuestion, mode });
  };

  const totalTime = (customCount ? parseInt(customCount) || questionCount : questionCount) * timePerQuestion;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <StudyContextBanner />
      {checkedSession && pendingSession && (
        <ResumeSessionBanner
          updatedAt={pendingSession.updated_at}
          onResume={onResumeSession}
          onDiscard={onDiscardSession}
        />
      )}

      <div className="text-center py-4 relative">
        <div className="absolute top-4 right-0">
          <ModuleHelpButton moduleKey="simulados" moduleName="Simulados" steps={[
            "Escolha entre Modo Estudo (feedback imediato) ou Modo Prova (cronômetro)",
            "Selecione uma ou mais especialidades clicando nos chips de tema",
            "Defina a quantidade de questões (5 a 100) e o nível de dificuldade",
            "No Modo Estudo: veja explicação após cada resposta e aprenda em tempo real",
            "No Modo Prova: cronômetro, sem feedback, resultado completo no final",
            "Marque questões com a flag para revisão posterior em ambos os modos",
          ]} />
        </div>
        <FileText className="h-12 w-12 text-primary mx-auto mb-3" />
        <h1 className="text-2xl font-bold">Simulados</h1>
        <p className="text-muted-foreground text-sm">Configure seu simulado com dificuldade, cronômetro e relatório detalhado.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        <button
          onClick={() => setTab("novo")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "novo" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Play className="h-4 w-4 inline mr-1.5" />Novo Simulado
        </button>
        <button
          onClick={() => setTab("historico")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "historico" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-4 w-4 inline mr-1.5" />Histórico
        </button>
      </div>

      {tab === "historico" ? (
        <SimuladoHistory userId={userId} onRetryErrors={onRetryErrors} />
      ) : (
        <div className="glass-card p-6 space-y-6">
          {/* Mode toggle */}
          <div>
            <label className="text-sm font-semibold mb-3 block">Modo do Simulado</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setMode("estudo")}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  mode === "estudo"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/30 hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">Modo Estudo</span>
                </div>
                <p className="text-xs text-muted-foreground">Feedback imediato. Sem cronômetro. Ideal para aprender.</p>
              </button>
              <button
                onClick={() => setMode("prova")}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  mode === "prova"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/30 hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Timer className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">Modo Prova</span>
                </div>
                <p className="text-xs text-muted-foreground">Cronômetro ativo. Resultado só no final.</p>
              </button>
              <button
                onClick={() => {
                  setMode("extremo");
                  setDifficulty("dificil");
                  if (!customCount && questionCount < 50) setQuestionCount(50);
                  setTimePerQuestion(2);
                }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  mode === "extremo"
                    ? "border-destructive bg-destructive/10"
                    : "border-border bg-secondary/30 hover:border-destructive/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Skull className="h-5 w-5 text-destructive" />
                  <span className="font-semibold text-sm">Modo Extremo</span>
                </div>
                <p className="text-xs text-muted-foreground">Prova real. 50+ questões. Dificuldade alta. Pressão máxima.</p>
              </button>
            </div>
          </div>

          {/* Topic selection grouped by cycle */}
          <div>
            <label className="text-sm font-semibold mb-3 block">Selecione os assuntos</label>
            <CycleFilter activeCycle={cycleFilter} onCycleChange={setCycleFilter} className="mb-3" />
            {(cycleFilter
              ? [{ label: cycleFilter, specialties: getFilteredSpecialties(cycleFilter) }]
              : SPECIALTY_CYCLES
            ).map(cycle => (
              <div key={cycle.label} className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{cycle.label}</p>
                <div className="flex flex-wrap gap-2">
                  {cycle.specialties.map(topic => (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        selectedTopics.includes(topic)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30"
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedTopics([...ALL_TOPICS])}>
                Selecionar todos
              </Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedTopics([])}>
                Limpar
              </Button>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-sm font-semibold mb-3 block">Nível de dificuldade</label>
            <div className="flex gap-2 flex-wrap">
              {DIFFICULTY_OPTIONS.map(d => (
                <Button key={d.value} variant={difficulty === d.value ? "default" : "outline"} size="sm" onClick={() => setDifficulty(d.value)}>
                  {d.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Question count */}
          <div>
            <label className="text-sm font-semibold mb-3 block">Quantas questões?</label>
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 15, 20, 30].map(n => (
                <Button key={n} variant={questionCount === n && !customCount ? "default" : "outline"} size="sm" onClick={() => { setQuestionCount(n); setCustomCount(""); }}>
                  {n}
                </Button>
              ))}
              <Input type="number" placeholder="Outro..." className="w-24 h-9" min={1} max={100} value={customCount} onChange={e => setCustomCount(e.target.value)} />
            </div>
          </div>

          {/* Timer - only in prova mode */}
          {mode === "prova" && (
            <div>
              <label className="text-sm font-semibold mb-2 block">Tempo por questão</label>
              <div className="flex gap-2 flex-wrap">
                {[2, 3, 4, 5].map(m => (
                  <Button key={m} variant={timePerQuestion === m ? "default" : "outline"} size="sm" onClick={() => setTimePerQuestion(m)}>
                    {m} min
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total: {totalTime} minutos</p>
            </div>
          )}

          <Button size="lg" className="w-full" onClick={handleStart} disabled={selectedTopics.length === 0}>
            <Play className="h-4 w-4 mr-2" />
            {mode === "estudo" ? "Iniciar Modo Estudo" : "Iniciar Simulado"} ({customCount || questionCount} questões)
          </Button>
        </div>
      )}
    </div>
  );
};

export { ALL_TOPICS };
export default SimuladoSetup;
