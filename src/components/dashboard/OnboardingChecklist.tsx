import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, ChevronUp, Rocket, Star, X } from "lucide-react";
import type { DashboardMetrics, DashboardStats } from "@/hooks/useDashboardData";

interface ChecklistItem {
  id: string;
  day: number;
  title: string;
  description: string;
  xp: number;
  path: string;
  isComplete: boolean;
}

interface Props {
  stats: DashboardStats;
  metrics: DashboardMetrics;
  hasCompletedDiagnostic: boolean;
}

const DISMISSED_KEY = "onboarding_checklist_dismissed_v2";

export default function OnboardingChecklist({ stats, metrics, hasCompletedDiagnostic }: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === "true");

  const items: ChecklistItem[] = useMemo(() => [
    {
      id: "diagnostic",
      day: 1,
      title: "Faça o Nivelamento Inicial",
      description: "Descubra seu nível em cada especialidade médica",
      xp: 50,
      path: "/dashboard/diagnostico",
      isComplete: hasCompletedDiagnostic,
    },
    {
      id: "questions",
      day: 2,
      title: "Responda 10 Questões",
      description: "Pratique com questões do banco global",
      xp: 30,
      path: "/dashboard/banco-questoes",
      isComplete: metrics.questionsAnswered >= 10,
    },
    {
      id: "flashcards",
      day: 3,
      title: "Crie seus Flashcards",
      description: "Gere flashcards com IA sobre um tema",
      xp: 30,
      path: "/dashboard/agentes/flashcards",
      isComplete: stats.flashcards > 0,
    },
    {
      id: "cronograma",
      day: 4,
      title: "Monte seu Cronograma",
      description: "Adicione temas e ative a revisão espaçada",
      xp: 40,
      path: "/dashboard/cronograma",
      isComplete: stats.todayTotal > 0 || metrics.pendingRevisoes > 0,
    },
    {
      id: "simulado",
      day: 5,
      title: "Faça um Simulado",
      description: "Teste em condições de prova real",
      xp: 50,
      path: "/dashboard/simulados",
      isComplete: metrics.simuladosCompleted > 0,
    },
    {
      id: "clinical",
      day: 6,
      title: "Simulação Clínica",
      description: "Treine conduta médica com um caso interativo",
      xp: 50,
      path: "/dashboard/simulacao-clinica",
      isComplete: metrics.clinicalSimulations > 0,
    },
    {
      id: "tutor",
      day: 7,
      title: "Estude com o Tutor IA",
      description: "Aprofunde um tema com o protocolo ENAZIZI",
      xp: 40,
      path: "/dashboard/agentes",
      isComplete: metrics.summariesCreated > 0 || metrics.anamnesisCompleted > 0,
    },
  ], [stats, metrics, hasCompletedDiagnostic]);

  const completed = items.filter((i) => i.isComplete).length;
  const totalXp = items.filter((i) => i.isComplete).reduce((s, i) => s + i.xp, 0);
  const percent = Math.round((completed / items.length) * 100);
  const allDone = completed === items.length;

  // Auto-dismiss when all done
  useEffect(() => {
    if (allDone && !dismissed) {
      // keep visible for a bit so user sees 100%
    }
  }, [allDone, dismissed]);

  if (dismissed) return null;

  return (
    <Card className="border-primary/20 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Rocket className="h-5 w-5 text-primary" />
            Jornada de 7 Dias
            <Badge variant="secondary" className="text-xs">
              {completed}/{items.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
              <Star className="h-3 w-3" /> {totalXp} XP
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {allDone && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  localStorage.setItem(DISMISSED_KEY, "true");
                  setDismissed(true);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <Progress value={percent} className="h-2 mt-2" />
      </CardHeader>

      {expanded && (
        <CardContent className="pt-2 space-y-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
                item.isComplete
                  ? "bg-emerald-50 dark:bg-emerald-900/20 opacity-70"
                  : "bg-muted/50 hover:bg-muted"
              }`}
              onClick={() => !item.isComplete && navigate(item.path)}
            >
              <div
                className={`flex items-center justify-center h-7 w-7 rounded-full shrink-0 text-xs font-bold ${
                  item.isComplete
                    ? "bg-emerald-500 text-white"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {item.isComplete ? <Check className="h-4 w-4" /> : item.day}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.isComplete ? "line-through text-muted-foreground" : ""}`}>
                  {item.title}
                </p>
                <p className="text-[11px] text-muted-foreground">{item.description}</p>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                +{item.xp} XP
              </Badge>
            </div>
          ))}

          {allDone && (
            <div className="text-center py-3">
              <p className="text-sm font-medium text-primary">🎉 Parabéns! Jornada completa!</p>
              <p className="text-xs text-muted-foreground">Você desbloqueou {totalXp} XP explorando toda a plataforma.</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
