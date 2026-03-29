import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, AlertTriangle, CheckCircle2, Brain } from "lucide-react";
import type { StudyRecommendation } from "@/hooks/useStudyEngine";
import type { Revisao, TemaEstudado, TemaComputado } from "@/pages/CronogramaInteligente";

interface Props {
  revisoes: Revisao[];
  temas: TemaEstudado[];
  temasComputados: TemaComputado[];
  engineRecs: StudyRecommendation[];
  onStartRevisao: (revisao: Revisao) => void;
}

export default function PlannerDayView({ revisoes, temas, temasComputados, engineRecs, onStartRevisao }: Props) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const revisoesHoje = revisoes.filter(r => r.data_revisao <= today && r.status === "pendente");
  const completedToday = revisoes.filter(r => r.data_revisao <= today && r.status === "concluida" && r.concluida_em?.startsWith(today));

  const totalTasks = revisoesHoje.length + Math.min(engineRecs.length, 3);
  const completedCount = completedToday.length;
  const progress = totalTasks > 0 ? Math.round((completedCount / (completedCount + totalTasks)) * 100) : 0;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-sm font-bold flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Tarefas de Hoje
          </span>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{completedCount + totalTasks} feitas
          </Badge>
        </CardTitle>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {/* Overdue reviews first */}
        {revisoesHoje.length === 0 && engineRecs.length === 0 && (
          <div className="text-center py-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Tudo em dia! 🎉</p>
            <p className="text-xs text-muted-foreground">Nenhuma tarefa pendente.</p>
          </div>
        )}

        {revisoesHoje.slice(0, 5).map(rev => {
          const tema = temas.find(t => t.id === rev.tema_id);
          const isOverdue = rev.data_revisao < today;
          return (
            <div
              key={rev.id}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border/60 hover:border-primary/30 transition-colors group"
            >
              {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{tema?.tema || "Revisão"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-[9px] px-1 py-0">{rev.tipo_revisao}</Badge>
                  {isOverdue && <span className="text-[9px] text-red-500">Atrasada</span>}
                </div>
              </div>
              <Button size="sm" variant="ghost" className="shrink-0 text-xs h-7 px-2" onClick={() => onStartRevisao(rev)}>
                <Play className="h-3 w-3 mr-1" /> Revisar
              </Button>
            </div>
          );
        })}

        {/* Study Engine recommendations */}
        {engineRecs.slice(0, 3).map(rec => (
          <div
            key={rec.id}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border/60 hover:border-primary/30 transition-colors cursor-pointer group"
            onClick={() => navigate(rec.targetPath)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{rec.topic}</p>
              <p className="text-[10px] text-muted-foreground">{rec.reason}</p>
            </div>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
              <Clock className="h-3 w-3" />
              {rec.estimatedMinutes}min
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
