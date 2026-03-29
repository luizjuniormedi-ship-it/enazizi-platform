import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { StudentRow } from "./MonitoringTypes";
import { Search, ArrowUpDown, Lightbulb, AlertTriangle, BookOpen, Brain, Target, Clock } from "lucide-react";

const statusConfig = {
  active: { label: "Ativo", className: "bg-emerald-500", textClass: "text-emerald-600" },
  attention: { label: "Atenção", className: "bg-yellow-500", textClass: "text-yellow-600" },
  risk: { label: "Risco", className: "bg-orange-500", textClass: "text-orange-600" },
  critical: { label: "Crítico", className: "bg-destructive", textClass: "text-destructive" },
};

const profileLabels: Record<string, { label: string; emoji: string }> = {
  consistent: { label: "Consistente", emoji: "✅" },
  oscillating: { label: "Oscilante", emoji: "📊" },
  disengaged: { label: "Desengajado", emoji: "😴" },
  studying_the_wrong_way: { label: "Estudando errado", emoji: "⚠️" },
  recovering: { label: "Em recuperação", emoji: "📈" },
};

function ScoreBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${color || ""}`}>{value}</span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

function StudentDetailSheet({ student, open, onClose }: { student: StudentRow | null; open: boolean; onClose: () => void }) {
  if (!student) return null;
  const s = student;
  const cfg = statusConfig[s.student_status] || statusConfig.active;
  const profile = profileLabels[s.student_profile] || profileLabels.consistent;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <div className={`h-3 w-3 rounded-full shrink-0 ${cfg.className}`} />
            {s.display_name}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">{s.email}</p>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Status & Profile */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className={`${cfg.textClass} border-current`}>{cfg.label}</Badge>
            <Badge variant="secondary">{profile.emoji} {profile.label}</Badge>
          </div>

          {/* Main Scores */}
          <div className="grid grid-cols-3 gap-2">
            <Card><CardContent className="p-3 text-center">
              <p className="text-2xl font-black text-primary">{s.approval_score}%</p>
              <p className="text-[10px] text-muted-foreground">Aprovação</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className={`text-2xl font-black ${s.risk_score >= 50 ? "text-destructive" : s.risk_score >= 30 ? "text-yellow-600" : "text-emerald-600"}`}>{s.risk_score}</p>
              <p className="text-[10px] text-muted-foreground">Risco</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className={`text-2xl font-black ${s.engagement_score >= 60 ? "text-emerald-600" : s.engagement_score >= 35 ? "text-yellow-600" : "text-destructive"}`}>{s.engagement_score}</p>
              <p className="text-[10px] text-muted-foreground">Engajamento</p>
            </CardContent></Card>
          </div>

          {/* Next Best Action */}
          {s.risk_reason !== "Nenhum" && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-3">
                <div className="flex gap-2 items-start">
                  <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold">Ação recomendada</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.next_best_action}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Reason */}
          {s.risk_reason !== "Nenhum" && (
            <Card className="border-destructive/20">
              <CardContent className="p-3">
                <div className="flex gap-2 items-center">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-xs"><span className="font-semibold">Motivo principal:</span> {s.risk_reason}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Risk Components */}
          <div>
            <h4 className="text-xs font-semibold mb-2">Componentes de Risco</h4>
            <div className="space-y-2">
              <ScoreBar label="Inatividade" value={s.risk_components.inactivity} color={s.risk_components.inactivity > 50 ? "text-destructive" : ""} />
              <ScoreBar label="Tarefas atrasadas" value={s.risk_components.overdue_tasks} color={s.risk_components.overdue_tasks > 50 ? "text-destructive" : ""} />
              <ScoreBar label="Revisões atrasadas" value={s.risk_components.overdue_reviews} color={s.risk_components.overdue_reviews > 50 ? "text-destructive" : ""} />
              <ScoreBar label="Queda aprovação" value={s.risk_components.approval_drop} color={s.risk_components.approval_drop > 30 ? "text-destructive" : ""} />
              <ScoreBar label="Baixo engajamento" value={s.risk_components.low_engagement} color={s.risk_components.low_engagement > 50 ? "text-destructive" : ""} />
            </div>
          </div>

          <Separator />

          {/* Engagement Components */}
          <div>
            <h4 className="text-xs font-semibold mb-2">Componentes de Engajamento</h4>
            <div className="space-y-2">
              <ScoreBar label="Dias ativos (7d)" value={s.engagement_components.active_days} color="text-emerald-600" />
              <ScoreBar label="Tempo de estudo" value={s.engagement_components.study_time} color="text-emerald-600" />
              <ScoreBar label="Execução do plano" value={s.engagement_components.plan_execution} color="text-emerald-600" />
              <ScoreBar label="Uso Tutor IA" value={s.engagement_components.tutor_usage} color="text-emerald-600" />
              <ScoreBar label="Simulados" value={s.engagement_components.simulado_usage} color="text-emerald-600" />
              <ScoreBar label="Revisões concluídas" value={s.engagement_components.review_completion} color="text-emerald-600" />
            </div>
          </div>

          <Separator />

          {/* Weakest Topics */}
          {s.weakest_topics.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold mb-2">🔴 Temas Mais Fracos</h4>
              <div className="space-y-2">
                {s.weakest_topics.map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{t.topic}</p>
                      <p className="text-[10px] text-muted-foreground">{t.specialty}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <span className="text-[10px] text-destructive font-semibold">{t.accuracy}%</span>
                      <Badge variant="outline" className="text-[10px]">M{t.mastery}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Activity Summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-xs">
              <Target className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{s.completed_tasks_7d}/{s.scheduled_tasks_7d} tarefas (7d)</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{s.overdue_reviews} revisões atrasadas</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Brain className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{s.tutor_sessions_7d} sessões Tutor (7d)</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{Math.round(s.total_study_minutes_7d / 60)}h estudo (7d)</span>
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground pt-2">
            Última atividade: {s.last_seen_at ? new Date(s.last_seen_at).toLocaleString("pt-BR") : "Nunca"}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function StudentsTab({ students }: { students: StudentRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "attention" | "risk" | "critical">("all");
  const [sortBy, setSortBy] = useState<"risk" | "score" | "engagement" | "name">("risk");
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);

  const filtered = students
    .filter(s => statusFilter === "all" || s.student_status === statusFilter)
    .filter(s => !search || s.display_name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "risk") return b.risk_score - a.risk_score;
      if (sortBy === "score") return b.approval_score - a.approval_score;
      if (sortBy === "engagement") return b.engagement_score - a.engagement_score;
      return a.display_name.localeCompare(b.display_name);
    });

  const sortLabels = { risk: "Risco", score: "Score", engagement: "Engajamento", name: "Nome" };
  const nextSort = { risk: "score" as const, score: "engagement" as const, engagement: "name" as const, name: "risk" as const };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(["all", "critical", "risk", "attention", "active"] as const).map(s => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="text-xs">
              {s === "all" ? "Todos" : statusConfig[s].label}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => setSortBy(nextSort[sortBy])} className="text-xs gap-1">
          <ArrowUpDown className="h-3 w-3" />
          {sortLabels[sortBy]}
        </Button>
      </div>

      {/* Student List */}
      {filtered.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhum aluno encontrado</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => {
            const cfg = statusConfig[s.student_status];
            const profile = profileLabels[s.student_profile] || profileLabels.consistent;
            return (
              <Card key={s.user_id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedStudent(s)}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full shrink-0 ${cfg.className}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{s.display_name}</p>
                        <Badge variant="secondary" className="text-[9px] shrink-0">{profile.emoji} {profile.label}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{s.risk_reason !== "Nenhum" ? s.risk_reason : s.email}</p>
                    </div>
                    <div className="flex gap-3 shrink-0 text-center">
                      <div>
                        <p className="text-sm font-bold text-primary">{s.approval_score}%</p>
                        <p className="text-[9px] text-muted-foreground">Aprov.</p>
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${s.risk_score >= 50 ? "text-destructive" : s.risk_score >= 30 ? "text-yellow-600" : "text-emerald-600"}`}>{s.risk_score}</p>
                        <p className="text-[9px] text-muted-foreground">Risco</p>
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${s.engagement_score >= 60 ? "text-emerald-600" : "text-yellow-600"}`}>{s.engagement_score}</p>
                        <p className="text-[9px] text-muted-foreground">Engaj.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <StudentDetailSheet student={selectedStudent} open={!!selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
}
