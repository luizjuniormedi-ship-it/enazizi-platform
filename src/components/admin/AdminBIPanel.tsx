import { useState, useEffect, useCallback } from "react";
import { BarChart3, Users, Target, TrendingUp, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BIData {
  kpis: { totalQuestions: number; avgAccuracy: number; activeUsers7d: number; retention: number; totalUsers: number };
  dailyActivity: { date: string; count: number }[];
  moduleEngagement: { module: string; count: number }[];
  byFaculdade: { name: string; value: number }[];
  byPeriodo: { name: string; value: number }[];
  topUsers: { user_id: string; name: string; questions: number; accuracy: number; last_seen: string | null }[];
  peakHours: { hour: string; count: number }[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(220, 70%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(340, 65%, 50%)",
  "hsl(45, 80%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(200, 70%, 50%)",
];

interface Props {
  callAdmin: (body: Record<string, unknown>) => Promise<any>;
}

const AdminBIPanel = ({ callAdmin }: Props) => {
  const [data, setData] = useState<BIData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBI = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callAdmin({ action: "get_bi_data" });
      setData(res);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [callAdmin]);

  useEffect(() => { loadBI(); }, [loadBI]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-center text-muted-foreground py-8">Erro ao carregar dados de BI.</p>;

  const { kpis, dailyActivity, moduleEngagement, byFaculdade, byPeriodo, topUsers, peakHours } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Business Intelligence
        </h2>
        <Button variant="outline" size="sm" onClick={loadBI} className="gap-1.5">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Questões", value: kpis.totalQuestions.toLocaleString(), icon: Target, color: "text-primary" },
          { label: "Acurácia Média", value: `${kpis.avgAccuracy}%`, icon: TrendingUp, color: "text-green-500" },
          { label: "Ativos (7d)", value: kpis.activeUsers7d, icon: Users, color: "text-blue-500" },
          { label: "Retenção (7d)", value: `${kpis.retention}%`, icon: TrendingUp, color: "text-amber-500" },
          { label: "Total Usuários", value: kpis.totalUsers, icon: Users, color: "text-muted-foreground" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <kpi.icon className={`h-5 w-5 mb-2 ${kpi.color}`} />
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="text-xs text-muted-foreground">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Activity Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Atividade Diária (30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ count: { label: "Questões", color: "hsl(var(--primary))" } }} className="h-64 w-full">
            <AreaChart data={dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v + "T00:00:00"), "dd/MM", { locale: ptBR })} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Module Engagement */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Engajamento por Módulo</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: "Total", color: "hsl(var(--primary))" } }} className="h-64 w-full">
              <BarChart data={moduleEngagement} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="module" type="category" width={80} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* By Faculdade */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição por Universidade</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={256}>
              <PieChart>
                <Pie data={byFaculdade} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name.substring(0, 12)}${name.length > 12 ? '…' : ''} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {byFaculdade.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Periodo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: "Usuários", color: "hsl(var(--primary))" } }} className="h-64 w-full">
              <BarChart data={byPeriodo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Horários de Pico</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: "Acessos", color: "hsl(var(--primary))" } }} className="h-64 w-full">
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--primary) / 0.7)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Users */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Top 10 Usuários Mais Ativos (30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead className="text-right">Questões</TableHead>
                <TableHead className="text-right">Acurácia</TableHead>
                <TableHead className="text-right">Último Acesso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topUsers.map((u, i) => (
                <TableRow key={u.user_id}>
                  <TableCell className="font-medium">{i + 1}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{u.name}</TableCell>
                  <TableCell className="text-right">{u.questions}</TableCell>
                  <TableCell className="text-right">{u.accuracy}%</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {u.last_seen ? format(new Date(u.last_seen), "dd/MM HH:mm") : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {topUsers.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sem dados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBIPanel;
