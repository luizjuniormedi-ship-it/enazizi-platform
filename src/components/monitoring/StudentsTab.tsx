import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StudentRow } from "./MonitoringTypes";
import {
  Search, ArrowUpDown, Lightbulb, AlertTriangle, BookOpen,
  Brain, Target, Clock, ChevronLeft, ChevronRight, User,
  TrendingUp, Activity, Zap, FileText,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const statusConfig = {
  active: { label: "Ativo", bg: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30", dot: "bg-emerald-500" },
  attention: { label: "Atenção", bg: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30", dot: "bg-yellow-500" },
  risk: { label: "Risco", bg: "bg-orange-500/15 text-orange-700 border-orange-500/30", dot: "bg-orange-500" },
  critical: { label: "Crítico", bg: "bg-destructive/15 text-destructive border-destructive/30", dot: "bg-destructive" },
};

const profileLabels: Record<string, { label: string; emoji: string }> = {
  consistent: { label: "Consistente", emoji: "✅" },
  oscillating: { label: "Oscilante", emoji: "📊" },
  disengaged: { label: "Desengajado", emoji: "😴" },
  studying_the_wrong_way: { label: "Estudando errado", emoji: "⚠️" },
  recovering: { label: "Em recuperação", emoji: "📈" },
};

type SortKey = "risk" | "score" | "engagement" | "name" | "activity";

const PAGE_SIZE = 10;

function ScoreBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold tabular-nums ${color || ""}`}>{value}</span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

function StudentDetailDrawer({ student, open, onClose }: { student: StudentRow | null; open: boolean; onClose: () => void }) {
  if (!student) return null;
  const s = student;
  const cfg = statusConfig[s.student_status] || statusConfig.active;
  const profile = profileLabels[s.student_profile] || profileLabels.consistent;

  const engagementRadar = [
    { subject: "Dias ativos", value: s.engagement_components.active_days },
    { subject: "Tempo estudo", value: s.engagement_components.study_time },
    { subject: "Plano", value: s.engagement_components.plan_execution },
    { subject: "Tutor IA", value: s.engagement_components.tutor_usage },
    { subject: "Simulados", value: s.engagement_components.simulado_usage },
    { subject: "Revisões", value: s.engagement_components.review_completion },
  ];

  // Simulate score trend
  const scoreTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const jitter = Math.round((Math.random() - 0.5) * 6);
    scoreTrend.push({
      label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      approval: Math.max(0, Math.min(100, s.approval_score + jitter - i)),
      engagement: Math.max(0, Math.min(100, s.engagement_score + jitter - i * 0.5)),
    });
  }

  const execPct = s.scheduled_tasks_7d > 0
    ? Math.round((s.completed_tasks_7d / s.scheduled_tasks_7d) * 100)
    : 0;

  return (
    <Drawer open={open} onOpenChange={onClose} direction="right">
      <DrawerContent className="fixed right-0 top-0 bottom-0 left-auto w-full sm:w-[480px] h-full rounded-none border-l overflow-y-auto">
        <DrawerHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DrawerTitle className="text-base truncate">{s.display_name}</DrawerTitle>
              <DrawerDescription className="text-xs truncate">{s.email}</DrawerDescription>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mt-2">
            <Badge variant="outline" className={cfg.bg}>{cfg.label}</Badge>
            <Badge variant="secondary" className="text-xs">{profile.emoji} {profile.label}</Badge>
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-5">
          {/* Score Cards */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-0 shadow-none bg-primary/5">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-black text-primary tabular-nums">{s.approval_score}%</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Aprovação</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-none bg-destructive/5">
              <CardContent className="p-3 text-center">
                <p className={`text-2xl font-black tabular-nums ${s.risk_score >= 50 ? "text-destructive" : s.risk_score >= 30 ? "text-yellow-600" : "text-emerald-600"}`}>
                  {s.risk_score}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Risco</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-none bg-emerald-500/5">
              <CardContent className="p-3 text-center">
                <p className={`text-2xl font-black tabular-nums ${s.engagement_score >= 60 ? "text-emerald-600" : s.engagement_score >= 35 ? "text-yellow-600" : "text-destructive"}`}>
                  {s.engagement_score}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Engajamento</p>
              </CardContent>
            </Card>
          </div>

          {/* Recommended Action */}
          {s.risk_reason !== "Nenhum" && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-3">
                <div className="flex gap-2 items-start">
                  <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-primary">Ação Recomendada</p>
                    <p className="text-sm text-foreground mt-1">{s.next_best_action}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Reason */}
          {s.risk_reason !== "Nenhum" && (
            <div className="flex gap-2 items-center p-2.5 rounded-lg border border-destructive/20 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs"><span className="font-semibold">Motivo:</span> {s.risk_reason}</p>
            </div>
          )}

          {/* Performance Chart */}
          <div>
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Tendência (7 dias)
            </h4>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={scoreTrend}>
                <defs>
                  <linearGradient id="detailApproval" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={25} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="approval" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#detailApproval)" name="Aprovação" />
                <Area type="monotone" dataKey="engagement" stroke="hsl(142 76% 36%)" strokeWidth={1.5} fill="none" strokeDasharray="4 2" name="Engajamento" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Engagement Radar */}
          <div>
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              Engajamento
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={engagementRadar}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <Separator />

          {/* Weakest Topics */}
          {s.weakest_topics.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold mb-2">🔴 Temas Mais Fracos</h4>
              <div className="space-y-2">
                {s.weakest_topics.map((t, i) => (
                  <div key={i} className="p-2 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate">{t.topic}</span>
                      <span className="text-xs font-bold text-destructive tabular-nums">{t.accuracy}%</span>
                    </div>
                    <Progress value={t.accuracy} className="h-1" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t.specialty} · Maestria {t.mastery}</p>
                  </div>
                ))}
              </div>
            </div>
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

          {/* Activity Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-lg border bg-card">
              <Target className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-bold tabular-nums">{s.completed_tasks_7d}/{s.scheduled_tasks_7d}</p>
                <p className="text-[10px] text-muted-foreground">Tarefas (7d) · {execPct}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg border bg-card">
              <BookOpen className="h-4 w-4 text-yellow-500 shrink-0" />
              <div>
                <p className="text-sm font-bold tabular-nums">{s.overdue_reviews}</p>
                <p className="text-[10px] text-muted-foreground">Revisões atrasadas</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg border bg-card">
              <Brain className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-bold tabular-nums">{s.tutor_sessions_7d}</p>
                <p className="text-[10px] text-muted-foreground">Sessões Tutor (7d)</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg border bg-card">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-bold tabular-nums">{Math.round(s.total_study_minutes_7d / 60)}h</p>
                <p className="text-[10px] text-muted-foreground">Estudo (7d)</p>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground pt-1">
            Última atividade: {s.last_seen_at ? new Date(s.last_seen_at).toLocaleString("pt-BR") : "Nunca"}
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function StudentsTab({ students }: { students: StudentRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "attention" | "risk" | "critical">("all");
  const [sortBy, setSortBy] = useState<SortKey>("risk");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return students
      .filter(s => statusFilter === "all" || s.student_status === statusFilter)
      .filter(s => !search || s.display_name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === "risk") diff = b.risk_score - a.risk_score;
        else if (sortBy === "score") diff = b.approval_score - a.approval_score;
        else if (sortBy === "engagement") diff = b.engagement_score - a.engagement_score;
        else if (sortBy === "activity") {
          const aTime = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
          const bTime = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
          diff = bTime - aTime;
        } else diff = a.display_name.localeCompare(b.display_name);
        return sortAsc ? -diff : diff;
      });
  }, [students, statusFilter, search, sortBy, sortAsc]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
    setPage(0);
  };

  const statusCounts = useMemo(() => {
    const counts = { all: students.length, active: 0, attention: 0, risk: 0, critical: 0 };
    students.forEach(s => { counts[s.student_status]++; });
    return counts;
  }, [students]);

  function SortableHead({ label, sortKey }: { label: string; sortKey: SortKey }) {
    const active = sortBy === sortKey;
    return (
      <TableHead
        className="cursor-pointer select-none hover:text-foreground transition-colors"
        onClick={() => handleSort(sortKey)}
      >
        <span className="flex items-center gap-1">
          {label}
          <ArrowUpDown className={`h-3 w-3 ${active ? "text-primary" : "text-muted-foreground/40"}`} />
        </span>
      </TableHead>
    );
  }

  const relativeTime = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Agora";
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="pl-8"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(["all", "critical", "risk", "attention", "active"] as const).map(s => {
            const isActive = statusFilter === s;
            const count = statusCounts[s];
            return (
              <Button
                key={s}
                size="sm"
                variant={isActive ? "default" : "outline"}
                onClick={() => { setStatusFilter(s); setPage(0); }}
                className="text-xs gap-1"
              >
                {s === "all" ? "Todos" : statusConfig[s].label}
                <Badge variant="secondary" className="text-[9px] ml-0.5 h-4 px-1">
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="Aluno" sortKey="name" />
                <SortableHead label="Aprovação" sortKey="score" />
                <SortableHead label="Risco" sortKey="risk" />
                <SortableHead label="Engajamento" sortKey="engagement" />
                <TableHead>Status</TableHead>
                <SortableHead label="Última Ativ." sortKey="activity" />
                <TableHead className="hidden lg:table-cell">Motivo</TableHead>
                <TableHead className="hidden xl:table-cell">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum aluno encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map(s => {
                  const cfg = statusConfig[s.student_status];
                  return (
                    <TableRow
                      key={s.user_id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedStudent(s)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <div className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{s.display_name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{s.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary tabular-nums">{s.approval_score}%</span>
                          <Progress value={s.approval_score} className="h-1 w-12 hidden sm:block" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-bold tabular-nums ${
                          s.risk_score >= 75 ? "text-destructive" :
                          s.risk_score >= 50 ? "text-orange-500" :
                          s.risk_score >= 30 ? "text-yellow-600" : "text-emerald-600"
                        }`}>
                          {s.risk_score}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-bold tabular-nums ${
                          s.engagement_score >= 60 ? "text-emerald-600" :
                          s.engagement_score >= 35 ? "text-yellow-600" : "text-destructive"
                        }`}>
                          {s.engagement_score}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${cfg.bg}`}>
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {relativeTime(s.last_seen_at)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground truncate block max-w-[160px]">
                          {s.risk_reason !== "Nenhum" ? s.risk_reason : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <span className="text-xs text-muted-foreground truncate block max-w-[200px]">
                          {s.risk_reason !== "Nenhum" ? s.next_best_action : "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              {filtered.length} aluno{filtered.length !== 1 ? "s" : ""} · Página {page + 1} de {totalPages}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <StudentDetailDrawer student={selectedStudent} open={!!selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
}
