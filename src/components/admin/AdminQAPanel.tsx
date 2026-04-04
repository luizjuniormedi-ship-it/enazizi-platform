import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Shield, Play, CheckCircle2, AlertTriangle, XCircle, Clock,
  RefreshCw, Zap, Database, Brain, Bug,
  Wrench, ArrowUpCircle, Activity, BarChart3, Eye,
  Bot, TrendingUp, TrendingDown, Minus, History
} from "lucide-react";

type QAEvent = {
  id: string;
  error_type: string;
  module: string;
  severity: string;
  status: string;
  causa_provavel: string | null;
  impacto: string | null;
  details: any;
  created_at: string;
  resolved_at: string | null;
};

type QAAutoFix = {
  id: string;
  event_id: string;
  action_taken: string;
  result_before: any;
  result_after: any;
  success: boolean;
  duration_ms: number;
  created_at: string;
};

type QAEscalation = {
  id: string;
  event_id: string;
  report: string;
  hypothesis_primary: string | null;
  hypothesis_secondary: string | null;
  recommended_action: string | null;
  acknowledged: boolean;
  created_at: string;
};

type QARun = {
  id: string;
  run_type: string;
  level: number;
  status: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  modules_checked: any;
  total_findings: number;
  total_corrected: number;
  total_partial: number;
  total_escalated: number;
  total_detected: number;
  auto_fix_rate_pct: number;
  summary_report: any;
  previous_comparison: any;
};

const fixStatusConfig: Record<string, { color: string; label: string }> = {
  detectado: { color: "bg-blue-500/10 text-blue-500", label: "Detectado" },
  corrigido_automaticamente: { color: "bg-green-500/10 text-green-500", label: "Corrigido Auto" },
  corrigido_com_retry: { color: "bg-green-500/10 text-green-600", label: "Corrigido c/ Retry" },
  corrigido_parcialmente: { color: "bg-yellow-500/10 text-yellow-600", label: "Parcial" },
  falha_persistente: { color: "bg-red-500/10 text-red-500", label: "Falha Persistente" },
  escalado: { color: "bg-orange-500/10 text-orange-500", label: "Escalado" },
};

const severityColors: Record<string, string> = {
  critico: "bg-red-500/10 text-red-500 border-red-500/20",
  alto: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  medio: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  baixo: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const runStatusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  completed: { icon: CheckCircle2, color: "text-green-500", label: "Saudável" },
  critical_open: { icon: XCircle, color: "text-red-500", label: "Crítico Aberto" },
  running: { icon: RefreshCw, color: "text-blue-500 animate-spin", label: "Executando" },
};

export default function AdminQAPanel() {
  const queryClient = useQueryClient();
  const [autonomyLevel, setAutonomyLevel] = useState("2");

  const invalidateAll = () => {
    ["qa-events", "qa-fixes", "qa-escalations", "qa-bot-runs"].forEach(k =>
      queryClient.invalidateQueries({ queryKey: [k] })
    );
  };

  // QA Bot Runs
  const { data: botRuns } = useQuery({
    queryKey: ["qa-bot-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qa_runs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as QARun[];
    },
  });

  // QA Events
  const { data: qaEvents } = useQuery({
    queryKey: ["qa-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qa_events" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as QAEvent[];
    },
  });

  // QA Auto Fixes
  const { data: qaFixes } = useQuery({
    queryKey: ["qa-fixes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qa_auto_fixes" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as QAAutoFix[];
    },
  });

  // QA Escalations
  const { data: qaEscalations } = useQuery({
    queryKey: ["qa-escalations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qa_escalations" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as QAEscalation[];
    },
  });

  // Run bot
  const botMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("qa-autocorrect", {
        body: { level: parseInt(autonomyLevel), run_type: "manual", max_loops: 3 },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const msg = `Bot QA concluído: ${data.corrected} corrigidos, ${data.escalated} escalados (${data.loops_executed} loops, ${Math.round(data.duration_ms / 1000)}s)`;
      toast.success(msg);
      invalidateAll();
    },
    onError: (e) => toast.error(`Erro no Bot QA: ${e.message}`),
  });

  const latestRun = botRuns?.[0];
  const latestComparison = latestRun?.previous_comparison;

  // Stats
  const totalEvents = qaEvents?.length || 0;
  const correctedAuto = qaEvents?.filter(e => e.status === "corrigido_automaticamente").length || 0;
  const escalatedCount = qaEvents?.filter(e => e.status === "escalado").length || 0;
  const pendingCount = qaEvents?.filter(e => e.status === "detectado" || e.status === "falha_persistente").length || 0;
  const autoFixRate = totalEvents > 0 ? Math.round((correctedAuto / totalEvents) * 100) : 0;

  const errorFrequency = (qaEvents || []).reduce<Record<string, number>>((acc, e) => {
    acc[e.error_type] = (acc[e.error_type] || 0) + 1;
    return acc;
  }, {});
  const topErrors = Object.entries(errorFrequency).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const moduleFreq = (qaEvents || []).reduce<Record<string, number>>((acc, e) => {
    acc[e.module] = (acc[e.module] || 0) + 1;
    return acc;
  }, {});
  const unstableModules = Object.entries(moduleFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const TrendIcon = latestComparison?.trend === "melhorando" ? TrendingUp : latestComparison?.trend === "piorando" ? TrendingDown : Minus;
  const trendColor = latestComparison?.trend === "melhorando" ? "text-green-500" : latestComparison?.trend === "piorando" ? "text-red-500" : "text-muted-foreground";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Bot QA Autônomo</h2>
          {latestRun && (
            <Badge variant="outline" className={`text-[10px] ${latestRun.status === "completed" ? "text-green-500 border-green-500/30" : latestRun.status === "running" ? "text-blue-500 border-blue-500/30" : "text-red-500 border-red-500/30"}`}>
              {runStatusConfig[latestRun.status]?.label || latestRun.status}
            </Badge>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={invalidateAll}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
          <div className="flex items-center gap-1">
            <Select value={autonomyLevel} onValueChange={setAutonomyLevel}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Nível 1: Diagnóstico</SelectItem>
                <SelectItem value="2">Nível 2: Correção</SelectItem>
                <SelectItem value="3">Nível 3: Debug</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => botMutation.mutate()} disabled={botMutation.isPending}>
              <Play className="h-4 w-4 mr-1" /> {botMutation.isPending ? "Executando..." : "Executar Bot"}
            </Button>
          </div>
        </div>
      </div>

      {/* Bot Status Card */}
      {latestRun && (
        <Card className={`border ${latestRun.status === "completed" ? "border-green-500/20 bg-green-500/5" : latestRun.status === "critical_open" ? "border-red-500/20 bg-red-500/5" : "border-blue-500/20 bg-blue-500/5"}`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Última Execução</span>
                <Badge variant="outline" className="text-[10px]">{latestRun.run_type}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(latestRun.started_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                {latestRun.duration_ms && ` · ${Math.round(latestRun.duration_ms / 1000)}s`}
              </span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
              {[
                { label: "Achados", value: latestRun.total_findings, color: "text-foreground" },
                { label: "Corrigidos", value: latestRun.total_corrected, color: "text-green-500" },
                { label: "Parciais", value: latestRun.total_partial, color: "text-yellow-500" },
                { label: "Escalados", value: latestRun.total_escalated, color: "text-orange-500" },
                { label: "Detectados", value: latestRun.total_detected, color: "text-blue-500" },
                { label: "Taxa Fix", value: `${latestRun.auto_fix_rate_pct}%`, color: "text-primary" },
              ].map(s => (
                <div key={s.label}>
                  <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
            {latestComparison && (
              <div className="mt-2 flex items-center gap-2 text-xs border-t pt-2">
                <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
                <span className={trendColor}>
                  {latestComparison.trend === "melhorando" ? "Sistema melhorando" : latestComparison.trend === "piorando" ? "Sistema piorando" : "Sistema estável"}
                </span>
                <span className="text-muted-foreground">
                  vs anterior: {latestComparison.findings_delta > 0 ? "+" : ""}{latestComparison.findings_delta} achados
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: "Eventos Total", value: totalEvents, icon: Eye, color: "text-foreground" },
          { label: "Corrigidos Auto", value: correctedAuto, icon: CheckCircle2, color: "text-green-500" },
          { label: "Escalados", value: escalatedCount, icon: ArrowUpCircle, color: "text-orange-500" },
          { label: "Pendentes", value: pendingCount, icon: Clock, color: "text-yellow-500" },
          { label: "Taxa Autocorreção", value: `${autoFixRate}%`, icon: Activity, color: "text-primary" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-3">
              <div className="flex items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
                <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
              </div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="bot">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="bot" className="text-xs">Bot</TabsTrigger>
          <TabsTrigger value="events" className="text-xs">Eventos</TabsTrigger>
          <TabsTrigger value="fixes" className="text-xs">Correções</TabsTrigger>
          <TabsTrigger value="escalations" className="text-xs">Escalações</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">Histórico</TabsTrigger>
        </TabsList>

        {/* Bot Tab - Overview */}
        <TabsContent value="bot" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Card className="p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Erros Mais Frequentes</span>
              </div>
              {topErrors.length === 0 && <p className="text-xs text-muted-foreground">Nenhum evento registrado</p>}
              {topErrors.map(([type, count]) => (
                <div key={type} className="flex justify-between text-xs py-0.5">
                  <span className="font-mono truncate">{type}</span>
                  <Badge variant="outline" className="text-[10px] ml-1">{count}</Badge>
                </div>
              ))}
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Bug className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Módulos Mais Instáveis</span>
              </div>
              {unstableModules.length === 0 && <p className="text-xs text-muted-foreground">Nenhum módulo com erros</p>}
              {unstableModules.map(([mod, count]) => (
                <div key={mod} className="flex justify-between text-xs py-0.5">
                  <span className="truncate">{mod}</span>
                  <Badge variant="outline" className="text-[10px] ml-1">{count}</Badge>
                </div>
              ))}
            </Card>
          </div>

          {/* Modules health */}
          {latestRun?.modules_checked && Array.isArray(latestRun.modules_checked) && (
            <Card className="p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Database className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Módulos Verificados</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(latestRun.modules_checked as string[]).map(m => (
                  <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events">
          <Card>
            <CardContent className="pt-4 space-y-1.5 max-h-[400px] overflow-y-auto">
              {(!qaEvents || qaEvents.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento. Execute o bot.</p>
              )}
              {qaEvents?.map((event) => {
                const fCfg = fixStatusConfig[event.status] || fixStatusConfig.detectado;
                const sCfg = severityColors[event.severity] || severityColors.medio;
                return (
                  <div key={event.id} className="border rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={`text-[10px] ${sCfg}`}>{event.severity}</Badge>
                        <span className="text-xs font-mono font-medium">{event.error_type}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge className={`text-[10px] ${fCfg.color} border-0`}>{fCfg.label}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(event.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground"><span className="font-medium">Módulo:</span> {event.module}</div>
                    {event.causa_provavel && <div className="text-xs text-muted-foreground"><span className="font-medium">Causa:</span> {event.causa_provavel}</div>}
                    {event.impacto && <div className="text-xs text-muted-foreground"><span className="font-medium">Impacto:</span> {event.impacto}</div>}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fixes Tab */}
        <TabsContent value="fixes">
          <Card>
            <CardContent className="pt-4 space-y-1.5 max-h-[400px] overflow-y-auto">
              {(!qaFixes || qaFixes.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma correção automática registrada.</p>
              )}
              {qaFixes?.map((fix) => (
                <div key={fix.id} className="border rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {fix.success ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                      <span className="text-xs font-medium">{fix.action_taken}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{fix.duration_ms}ms</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="font-medium text-muted-foreground">Antes:</span>
                      <pre className="bg-muted/50 rounded p-1 mt-0.5 overflow-x-auto">{JSON.stringify(fix.result_before, null, 1)}</pre>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Depois:</span>
                      <pre className="bg-muted/50 rounded p-1 mt-0.5 overflow-x-auto">{JSON.stringify(fix.result_after, null, 1)}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Escalations Tab */}
        <TabsContent value="escalations">
          <Card>
            <CardContent className="pt-4 space-y-1.5 max-h-[400px] overflow-y-auto">
              {(!qaEscalations || qaEscalations.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma escalação pendente.</p>
              )}
              {qaEscalations?.map((esc) => (
                <div key={esc.id} className={`border rounded-lg p-2.5 space-y-1.5 ${esc.acknowledged ? "opacity-60" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ArrowUpCircle className="h-3.5 w-3.5 text-orange-500" />
                      <span className="text-xs font-medium">Escalação</span>
                    </div>
                    {esc.acknowledged && <Badge variant="outline" className="text-[10px]">Reconhecida</Badge>}
                  </div>
                  <p className="text-xs">{esc.report}</p>
                  {esc.hypothesis_primary && <div className="text-[10px] text-muted-foreground"><span className="font-medium">Hipótese 1:</span> {esc.hypothesis_primary}</div>}
                  {esc.hypothesis_secondary && <div className="text-[10px] text-muted-foreground"><span className="font-medium">Hipótese 2:</span> {esc.hypothesis_secondary}</div>}
                  {esc.recommended_action && <div className="text-[10px] text-amber-500 font-medium">💡 {esc.recommended_action}</div>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" /> Histórico de Execuções do Bot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {(!botRuns || botRuns.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma execução registrada.</p>
              )}
              {botRuns?.map((run) => {
                const cfg = runStatusConfig[run.status] || runStatusConfig.completed;
                const Icon = cfg.icon;
                return (
                  <div key={run.id} className="border rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                        <span className="text-xs font-medium">
                          {new Date(run.started_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <Badge variant="outline" className="text-[10px]">{run.run_type}</Badge>
                        <Badge variant="outline" className="text-[10px]">Nível {run.level}</Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {run.duration_ms ? `${Math.round(run.duration_ms / 1000)}s` : "..."}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="text-foreground">{run.total_findings} achados</span>
                      <span className="text-green-500">{run.total_corrected} corrigidos</span>
                      {run.total_escalated > 0 && <span className="text-orange-500">{run.total_escalated} escalados</span>}
                      <span className="text-primary">{run.auto_fix_rate_pct}% taxa</span>
                    </div>
                    {run.previous_comparison && (
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        {run.previous_comparison.trend === "melhorando" ? <TrendingUp className="h-3 w-3 text-green-500" /> : run.previous_comparison.trend === "piorando" ? <TrendingDown className="h-3 w-3 text-red-500" /> : <Minus className="h-3 w-3" />}
                        <span>{run.previous_comparison.trend} vs anterior ({run.previous_comparison.findings_delta > 0 ? "+" : ""}{run.previous_comparison.findings_delta})</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
