import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  Shield, Play, CheckCircle2, AlertTriangle, XCircle, Clock,
  ChevronDown, RefreshCw, Zap, Database, Brain, Bug
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

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  passed: { icon: CheckCircle2, color: "text-green-500", label: "Aprovado" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", label: "Atenção" },
  failed: { icon: XCircle, color: "text-red-500", label: "Falhou" },
  running: { icon: RefreshCw, color: "text-blue-500 animate-spin", label: "Executando" },
  skipped: { icon: Clock, color: "text-muted-foreground", label: "Pulado" },
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

  const runMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("qa-agent", {
        body: { run_type: "manual" },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Testes QA iniciados! Os resultados aparecerão em breve.");
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["qa-runs"] }), 5000);
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["qa-runs"] }), 15000);
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["qa-runs"] }), 30000);
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["qa-runs"] }), 60000);
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["qa-runs"] }), 120000);
    },
    onError: (e) => toast.error(`Erro ao iniciar testes: ${e.message}`),
  });

  const groupedResults = results?.reduce<Record<string, QAResultRow[]>>((acc, r) => {
    (acc[r.test_suite] = acc[r.test_suite] || []).push(r);
    return acc;
  }, {}) || {};

  const latestRun = runs?.[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">QA Automatizado</h2>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["qa-runs"] })}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
          <Button
            size="sm"
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
          >
            <Play className="h-4 w-4 mr-1" />
            {runMutation.isPending ? "Iniciando..." : "Executar Testes"}
          </Button>
        </div>
      </div>

      {/* Latest run summary */}
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

      {/* Critical alerts from latest run */}
      {latestRun?.summary_json?.critical_failures?.length > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-500">
              <XCircle className="h-4 w-4" />
              Falhas Críticas
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

      {/* Run history */}
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
              <Collapsible
                key={run.id}
                open={isExpanded}
                onOpenChange={(open) => setExpandedRun(open ? run.id : null)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                      <span className="text-sm font-medium">
                        {new Date(run.started_at).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                      <Badge variant="outline" className="text-xs">{run.run_type}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="text-green-500">{run.passed_tests}✓</span>
                      {run.warning_tests > 0 && <span className="text-yellow-500">{run.warning_tests}⚠</span>}
                      {run.failed_tests > 0 && <span className="text-red-500">{run.failed_tests}✗</span>}
                      <span>{((run.duration_ms || 0) / 1000).toFixed(0)}s</span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="pl-6 pb-3 space-y-3">
                    {Object.entries(groupedResults).map(([suite, tests]) => {
                      const SuiteIcon = suiteIcons[suite] || Shield;
                      const suiteLabel = suiteLabels[suite] || suite;
                      const suitePassed = tests.every(t => t.status === "passed");
                      const suiteFailed = tests.some(t => t.status === "failed");

                      return (
                        <div key={suite} className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <SuiteIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{suiteLabel}</span>
                            {suitePassed && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                            {suiteFailed && <XCircle className="h-3 w-3 text-red-500" />}
                          </div>
                          {tests.map((t) => {
                            const tCfg = statusConfig[t.status] || statusConfig.skipped;
                            const TIcon = tCfg.icon;
                            return (
                              <div key={t.id} className="flex items-start gap-2 pl-5 text-xs">
                                <TIcon className={`h-3 w-3 mt-0.5 shrink-0 ${tCfg.color}`} />
                                <div>
                                  <span>{t.test_name}</span>
                                  {t.duration_ms > 0 && (
                                    <span className="text-muted-foreground ml-1">({(t.duration_ms / 1000).toFixed(1)}s)</span>
                                  )}
                                  {t.error_message && (
                                    <p className="text-red-400 mt-0.5">{t.error_message}</p>
                                  )}
                                  {t.suggestion && (
                                    <p className="text-muted-foreground mt-0.5">💡 {t.suggestion}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                    {(!results || results.length === 0) && (
                      <p className="text-xs text-muted-foreground">Carregando resultados...</p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {!isLoading && (!runs || runs.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma execução ainda. Clique em "Executar Testes" para começar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
