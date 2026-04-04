import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Shield, Play, CheckCircle2, AlertTriangle, XCircle, Clock,
  ChevronDown, RefreshCw, Zap, Database, Brain, Bug,
  Wrench, ArrowUpCircle, Activity, BarChart3, Eye
} from "lucide-react";

type QARunRow = {
  id: string;
  run_type: string;
  status: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  warning_tests: number;
  summary_json: any;
  duration_ms: number;
  started_at: string;
  finished_at: string | null;
};

type QAResultRow = {
  id: string;
  run_id: string;
  test_suite: string;
  test_name: string;
  status: string;
  details_json: any;
  duration_ms: number;
  module_tested: string | null;
  error_message: string | null;
  suggestion: string | null;
};

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

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  passed: { icon: CheckCircle2, color: "text-green-500", label: "Aprovado" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", label: "Atenção" },
  failed: { icon: XCircle, color: "text-red-500", label: "Falhou" },
  running: { icon: RefreshCw, color: "text-blue-500 animate-spin", label: "Executando" },
  skipped: { icon: Clock, color: "text-muted-foreground", label: "Pulado" },
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

const suiteIcons: Record<string, typeof Brain> = {
  edge_function_health: Zap,
  ai_quality: Brain,
  cache_optimization: Database,
  database_integrity: Database,
  performance: Clock,
  error_handling: Bug,
};

const suiteLabels: Record<string, string> = {
  edge_function_health: "Saúde das Edge Functions",
  ai_quality: "Qualidade da IA",
  cache_optimization: "Cache e Otimização",
  database_integrity: "Integridade do Banco",
  performance: "Performance",
  error_handling: "Tratamento de Erros",
};

export default function AdminQAPanel() {
  const queryClient = useQueryClient();
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [autonomyLevel, setAutonomyLevel] = useState("2");

  // QA Test Runs (legacy)
  const { data: runs, isLoading } = useQuery({
    queryKey: ["qa-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qa_test_runs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as QARunRow[];
    },
  });

  const { data: results } = useQuery({
    queryKey: ["qa-results", expandedRun],
    queryFn: async () => {
      if (!expandedRun) return [];
      const { data, error } = await supabase
        .from("qa_test_results" as any)
        .select("*")
        .eq("run_id", expandedRun)
        .order("test_suite", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as QAResultRow[];
    },
    enabled: !!expandedRun,
  });

  // QA Events (autocorrective)
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

  // Run legacy QA tests
  const runMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("qa-agent", {
        body: { run_type: "manual" },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Testes QA iniciados!");
      [5000, 15000, 30000, 60000].forEach(ms =>
        setTimeout(() => queryClient.invalidateQueries({ queryKey: ["qa-runs"] }), ms)
      );
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  // Run autocorrect pipeline
  const autocorrectMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("qa-autocorrect", {
        body: { level: parseInt(autonomyLevel) },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const msg = `Pipeline concluído: ${data.corrected} corrigidos, ${data.escalated} escalados de ${data.total_issues} problemas`;
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ["qa-events"] });
      queryClient.invalidateQueries({ queryKey: ["qa-fixes"] });
      queryClient.invalidateQueries({ queryKey: ["qa-escalations"] });
    },
    onError: (e) => toast.error(`Erro no autocorretor: ${e.message}`),
  });

  const groupedResults = results?.reduce<Record<string, QAResultRow[]>>((acc, r) => {
    (acc[r.test_suite] = acc[r.test_suite] || []).push(r);
    return acc;
  }, {}) || {};

  const latestRun = runs?.[0];

  // Compute autocorrect stats
  const totalEvents = qaEvents?.length || 0;
  const correctedAuto = qaEvents?.filter(e => e.status === "corrigido_automaticamente").length || 0;
  const escalatedCount = qaEvents?.filter(e => e.status === "escalado").length || 0;
  const pendingCount = qaEvents?.filter(e => e.status === "detectado" || e.status === "falha_persistente").length || 0;
  const autoFixRate = totalEvents > 0 ? Math.round((correctedAuto / totalEvents) * 100) : 0;

  // Error frequency
  const errorFrequency = (qaEvents || []).reduce<Record<string, number>>((acc, e) => {
    acc[e.error_type] = (acc[e.error_type] || 0) + 1;
    return acc;
  }, {});
  const topErrors = Object.entries(errorFrequency).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Module instability
  const moduleFreq = (qaEvents || []).reduce<Record<string, number>>((acc, e) => {
    acc[e.module] = (acc[e.module] || 0) + 1;
    return acc;
  }, {});
  const unstableModules = Object.entries(moduleFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">QA Autocorretivo</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["qa-runs"] });
            queryClient.invalidateQueries({ queryKey: ["qa-events"] });
            queryClient.invalidateQueries({ queryKey: ["qa-fixes"] });
            queryClient.invalidateQueries({ queryKey: ["qa-escalations"] });
          }}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
          <Button size="sm" variant="outline" onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
            <Play className="h-4 w-4 mr-1" /> {runMutation.isPending ? "..." : "Testes QA"}
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
            <Button size="sm" onClick={() => autocorrectMutation.mutate()} disabled={autocorrectMutation.isPending}>
              <Wrench className="h-4 w-4 mr-1" /> {autocorrectMutation.isPending ? "Corrigindo..." : "Autocorrigir"}
            </Button>
          </div>
        </div>
      </div>

      {/* Autocorrect stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: "Eventos", value: totalEvents, icon: Eye, color: "text-foreground" },
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

      <Tabs defaultValue="events">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="events" className="text-xs">Eventos</TabsTrigger>
          <TabsTrigger value="fixes" className="text-xs">Correções</TabsTrigger>
          <TabsTrigger value="escalations" className="text-xs">Escalações</TabsTrigger>
          <TabsTrigger value="tests" className="text-xs">Testes</TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-3">
          {/* Top errors & unstable modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Card className="p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Erros Mais Frequentes</span>
              </div>
              {topErrors.length === 0 && <p className="text-xs text-muted-foreground">Nenhum evento registrado</p>}
              {topErrors.map(([type, count]) => (
                <div key={type} className="flex justify-between text-xs py-0.5">
                  <span className="font-mono">{type}</span>
                  <Badge variant="outline" className="text-[10px]">{count}</Badge>
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
                  <span>{mod}</span>
                  <Badge variant="outline" className="text-[10px]">{count}</Badge>
                </div>
              ))}
            </Card>
          </div>

          {/* Events list */}
          <Card>
            <CardContent className="pt-4 space-y-1.5 max-h-[400px] overflow-y-auto">
              {(!qaEvents || qaEvents.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento. Execute o autocorretor.</p>
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
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Módulo:</span> {event.module}
                    </div>
                    {event.causa_provavel && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Causa:</span> {event.causa_provavel}
                      </div>
                    )}
                    {event.impacto && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Impacto:</span> {event.impacto}
                      </div>
                    )}
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
                      {fix.success ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                      )}
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
                  {esc.hypothesis_primary && (
                    <div className="text-[10px] text-muted-foreground">
                      <span className="font-medium">Hipótese 1:</span> {esc.hypothesis_primary}
                    </div>
                  )}
                  {esc.hypothesis_secondary && (
                    <div className="text-[10px] text-muted-foreground">
                      <span className="font-medium">Hipótese 2:</span> {esc.hypothesis_secondary}
                    </div>
                  )}
                  {esc.recommended_action && (
                    <div className="text-[10px] text-amber-500 font-medium">
                      💡 {esc.recommended_action}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tests Tab (legacy) */}
        <TabsContent value="tests" className="space-y-3">
          {latestRun && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { label: "Total", value: latestRun.total_tests, color: "text-foreground" },
                { label: "Aprovados", value: latestRun.passed_tests, color: "text-green-500" },
                { label: "Atenção", value: latestRun.warning_tests, color: "text-yellow-500" },
                { label: "Falhas", value: latestRun.failed_tests, color: "text-red-500" },
                { label: "Tempo", value: `${((latestRun.duration_ms || 0) / 1000).toFixed(0)}s`, color: "text-muted-foreground" },
              ].map((stat) => (
                <Card key={stat.label} className="p-3">
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </Card>
              ))}
            </div>
          )}

          {latestRun?.summary_json?.critical_failures?.length > 0 && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-red-500">
                  <XCircle className="h-4 w-4" /> Falhas Críticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {latestRun.summary_json.critical_failures.map((f: any, i: number) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">{f.test}</span>
                    <span className="text-muted-foreground"> — {f.module}</span>
                    {f.suggestion && <p className="text-xs text-muted-foreground mt-0.5">💡 {f.suggestion}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Histórico de Execuções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
              {runs?.map((run) => {
                const cfg = statusConfig[run.status] || statusConfig.running;
                const Icon = cfg.icon;
                const isExpanded = expandedRun === run.id;
                return (
                  <Collapsible key={run.id} open={isExpanded} onOpenChange={(open) => setExpandedRun(open ? run.id : null)}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                          <span className="text-sm font-medium">
                            {new Date(run.started_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <Badge variant="outline" className="text-xs">{run.run_type}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="text-green-500">{run.passed_tests}✓</span>
                          {run.warning_tests > 0 && <span className="text-yellow-500">{run.warning_tests}⚠</span>}
                          {run.failed_tests > 0 && <span className="text-red-500">{run.failed_tests}✗</span>}
                          <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pl-6 pb-3 space-y-3">
                        {Object.entries(groupedResults).map(([suite, tests]) => {
                          const SuiteIcon = suiteIcons[suite] || Shield;
                          const suiteLabel = suiteLabels[suite] || suite;
                          const suiteFailed = tests.some(t => t.status === "failed");
                          return (
                            <div key={suite} className="space-y-1">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <SuiteIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{suiteLabel}</span>
                                {suiteFailed ? <XCircle className="h-3 w-3 text-red-500" /> : <CheckCircle2 className="h-3 w-3 text-green-500" />}
                              </div>
                              {tests.map((t) => {
                                const tCfg = statusConfig[t.status] || statusConfig.skipped;
                                const TIcon = tCfg.icon;
                                return (
                                  <div key={t.id} className="flex items-start gap-2 pl-5 text-xs">
                                    <TIcon className={`h-3 w-3 mt-0.5 shrink-0 ${tCfg.color}`} />
                                    <div>
                                      <span>{t.test_name}</span>
                                      {t.error_message && <p className="text-red-400 mt-0.5">{t.error_message}</p>}
                                      {t.suggestion && <p className="text-muted-foreground mt-0.5">💡 {t.suggestion}</p>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
              {!isLoading && (!runs || runs.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma execução ainda.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
