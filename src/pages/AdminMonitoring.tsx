import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity, Users, Brain, Cpu, TrendingUp, AlertTriangle,
  CheckCircle2, XCircle, Clock, RefreshCw, Zap, BookOpen,
  BarChart3, Target, Server, Wifi, WifiOff,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(142 76% 36%)",
  "hsl(38 92% 50%)",
  "hsl(262 83% 58%)",
  "hsl(199 89% 48%)",
  "hsl(339 90% 51%)",
  "hsl(25 95% 53%)",
];

interface DashboardData {
  system: { status: string; uptime: string; apiResponseTime: number; errorRate: number };
  users: { activeNow: number; totalApproved: number; pendingApproval: number };
  studyEngine: { dailyPlansToday: number; tasksCompleted: number; overdueTasks: number; executionRate: number };
  ai: { totalCalls24h: number; avgResponseTime: number; failureRate: number; byModule: { name: string; calls: number }[] };
  learning: {
    avgApprovalScore: number;
    totalQuestionsBank: number;
    recentErrors: number;
    topTopics: { topic: string; count: number }[];
    weakTopics: { topic: string; accuracy: number; questions: number }[];
  };
  timestamp: string;
}

function MetricCard({ icon: Icon, label, value, subtitle, color = "text-primary", trend }: {
  icon: any; label: string; value: string | number; subtitle?: string; color?: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-black tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground/70">{subtitle}</p>}
          </div>
          {trend && (
            <TrendingUp className={`h-4 w-4 ${
              trend === "up" ? "text-emerald-500" : trend === "down" ? "text-destructive rotate-180" : "text-muted-foreground"
            }`} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AlertCard({ alerts }: { alerts: any[] }) {
  if (!alerts || alerts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-semibold">Tudo funcionando normalmente</p>
          <p className="text-xs text-muted-foreground">Nenhum alerta ativo</p>
        </CardContent>
      </Card>
    );
  }

  const severityColors = {
    critical: "border-destructive/50 bg-destructive/5",
    warning: "border-yellow-500/50 bg-yellow-500/5",
    info: "border-primary/30 bg-primary/5",
  };
  const severityIcons = {
    critical: <XCircle className="h-4 w-4 text-destructive" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    info: <Activity className="h-4 w-4 text-primary" />,
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert: any, i: number) => (
        <Card key={i} className={severityColors[alert.severity as keyof typeof severityColors] || ""}>
          <CardContent className="p-3 flex items-start gap-3">
            <div className="mt-0.5">{severityIcons[alert.severity as keyof typeof severityIcons]}</div>
            <div>
              <p className="text-sm font-semibold">{alert.title}</p>
              <p className="text-xs text-muted-foreground">{alert.message}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminMonitoring() {
  const { session } = useAuth();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: dashboard, isLoading, refetch, isFetching } = useQuery<DashboardData>({
    queryKey: ["admin-monitoring-dashboard"],
    queryFn: async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("system-health-check", {
        headers: { Authorization: `Bearer ${s?.access_token}` },
        body: null,
      });
      // Pass mode as query param by using the full URL
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/system-health-check?mode=dashboard`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${s?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch monitoring data");
      return response.json();
    },
    enabled: !!session,
    staleTime: 30_000,
    refetchInterval: autoRefresh ? 60_000 : false,
  });

  const { data: alertsData } = useQuery({
    queryKey: ["admin-monitoring-alerts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("system_health_reports" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!session,
    staleTime: 60_000,
  });

  const d = dashboard;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Server className="h-6 w-6 text-primary" />
            Monitoramento do Sistema
          </h1>
          <p className="text-xs text-muted-foreground">
            {d?.timestamp ? `Última atualização: ${new Date(d.timestamp).toLocaleTimeString("pt-BR")}` : "Carregando..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-1 text-xs"
          >
            {autoRefresh ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {autoRefresh ? "Auto" : "Manual"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : d ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
            <TabsTrigger value="users" className="text-xs">Usuários</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">IA</TabsTrigger>
            <TabsTrigger value="learning" className="text-xs">Aprendizado</TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs">Alertas</TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW ── */}
          <TabsContent value="overview" className="space-y-4">
            {/* System status */}
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${d.system.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-destructive"}`} />
              <span className="text-sm font-semibold">
                Sistema {d.system.status === "online" ? "Online" : "Offline"}
              </span>
              <Badge variant="outline" className="text-[10px]">Uptime: {d.system.uptime}</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard icon={Users} label="Usuários online" value={d.users.activeNow} color="text-emerald-500" />
              <MetricCard icon={Zap} label="Chamadas IA (24h)" value={d.ai.totalCalls24h} color="text-primary" />
              <MetricCard icon={Clock} label="Resp. IA (ms)" value={`${d.ai.avgResponseTime}ms`} color="text-yellow-500" />
              <MetricCard icon={AlertTriangle} label="Taxa de erro" value={`${d.system.errorRate}%`} color={d.system.errorRate > 5 ? "text-destructive" : "text-emerald-500"} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard icon={Target} label="Planos hoje" value={d.studyEngine.dailyPlansToday} />
              <MetricCard icon={CheckCircle2} label="Tarefas concluídas" value={d.studyEngine.tasksCompleted} color="text-emerald-500" />
              <MetricCard icon={XCircle} label="Tarefas atrasadas" value={d.studyEngine.overdueTasks} color={d.studyEngine.overdueTasks > 10 ? "text-destructive" : "text-yellow-500"} />
              <MetricCard icon={BarChart3} label="Taxa execução" value={`${d.studyEngine.executionRate}%`} color="text-primary" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Approval Score gauge */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Score Médio de Aprovação</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-2">
                  <div className="text-4xl font-black text-primary tabular-nums">{d.learning.avgApprovalScore}%</div>
                  <Progress value={d.learning.avgApprovalScore} className="h-3 w-full" />
                  <p className="text-xs text-muted-foreground">{d.learning.totalQuestionsBank} questões no banco</p>
                </CardContent>
              </Card>

              {/* AI by module */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">IA por Módulo (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  {d.ai.byModule.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={d.ai.byModule.slice(0, 6)} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-8">Sem dados de IA nas últimas 24h</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── USERS ── */}
          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MetricCard icon={Users} label="Online agora" value={d.users.activeNow} color="text-emerald-500" />
              <MetricCard icon={Users} label="Total aprovados" value={d.users.totalApproved} />
              <MetricCard icon={Clock} label="Pendentes aprovação" value={d.users.pendingApproval} color={d.users.pendingApproval > 0 ? "text-yellow-500" : "text-muted-foreground"} />
            </div>
          </TabsContent>

          {/* ── AI ── */}
          <TabsContent value="ai" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard icon={Zap} label="Total chamadas (24h)" value={d.ai.totalCalls24h} />
              <MetricCard icon={Clock} label="Tempo médio" value={`${d.ai.avgResponseTime}ms`} />
              <MetricCard icon={XCircle} label="Taxa de falha" value={`${d.ai.failureRate}%`} color={d.ai.failureRate > 5 ? "text-destructive" : "text-emerald-500"} />
              <MetricCard icon={Brain} label="Módulos ativos" value={d.ai.byModule.length} />
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Chamadas por Módulo</CardTitle>
              </CardHeader>
              <CardContent>
                {d.ai.byModule.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={d.ai.byModule}
                        dataKey="calls"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, calls }) => `${name.replace(/-/g, " ")} (${calls})`}
                        labelLine={false}
                      >
                        {d.ai.byModule.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── LEARNING ── */}
          <TabsContent value="learning" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MetricCard icon={Target} label="Score médio aprovação" value={`${d.learning.avgApprovalScore}%`} />
              <MetricCard icon={BookOpen} label="Questões no banco" value={d.learning.totalQuestionsBank} />
              <MetricCard icon={XCircle} label="Erros recentes (7d)" value={d.learning.recentErrors} color="text-destructive" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">📈 Temas Mais Estudados</CardTitle>
                </CardHeader>
                <CardContent>
                  {d.learning.topTopics.length > 0 ? (
                    <div className="space-y-2">
                      {d.learning.topTopics.map((t, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs truncate flex-1">{t.topic}</span>
                          <Badge variant="secondary" className="text-[10px] ml-2">{t.count} questões</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">🔴 Temas Mais Fracos</CardTitle>
                </CardHeader>
                <CardContent>
                  {d.learning.weakTopics.length > 0 ? (
                    <div className="space-y-2">
                      {d.learning.weakTopics.map((t, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs truncate flex-1">{t.topic}</span>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-[10px] text-destructive font-semibold">{t.accuracy}%</span>
                            <Badge variant="outline" className="text-[10px]">{t.questions}q</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── ALERTS ── */}
          <TabsContent value="alerts" className="space-y-4">
            <AlertCard alerts={(alertsData as any)?.alerts || []} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm">Erro ao carregar dados de monitoramento</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
