import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, XCircle, Clock, Zap, Activity } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PipelineRun {
  id: string;
  run_type: string;
  status: string;
  target_assets: number;
  processed_assets: number;
  generated_questions: number;
  failed_assets: number;
  started_at: string;
  finished_at: string | null;
  notes: string | null;
}

interface PipelineAlert {
  id: string;
  run_id: string | null;
  alert_type: string;
  severity: string;
  message: string;
  details: any;
  acknowledged: boolean;
  created_at: string;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  completed: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30", label: "Concluído" },
  partial: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "bg-amber-500/15 text-amber-700 border-amber-500/30", label: "Parcial" },
  failed: { icon: <XCircle className="h-3.5 w-3.5" />, color: "bg-red-500/15 text-red-700 border-red-500/30", label: "Falhou" },
  running: { icon: <Activity className="h-3.5 w-3.5 animate-pulse" />, color: "bg-blue-500/15 text-blue-700 border-blue-500/30", label: "Executando" },
};

const severityConfig: Record<string, string> = {
  critical: "bg-red-500/15 text-red-700 border-red-500/30",
  warning: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  info: "bg-blue-500/15 text-blue-700 border-blue-500/30",
};

const alertTypeLabels: Record<string, string> = {
  run_failed: "Run Falhou",
  run_sterile: "Run Estéril",
  partial_failure: "Falha Parcial",
};

export default function AdminPipelineMonitor() {
  const { data: runs } = useQuery<PipelineRun[]>({
    queryKey: ["pipeline-runs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("question_generation_runs" as any)
        .select("*")
        .order("started_at", { ascending: false })
        .limit(15);
      return (data as any) || [];
    },
    refetchInterval: 30_000,
  });

  const { data: alerts } = useQuery<PipelineAlert[]>({
    queryKey: ["pipeline-alerts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pipeline_alerts" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data as any) || [];
    },
    refetchInterval: 30_000,
  });

  const unacknowledged = alerts?.filter(a => !a.acknowledged).length || 0;

  return (
    <div className="space-y-4">
      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Alertas Operacionais
              {unacknowledged > 0 && (
                <Badge variant="destructive" className="text-[10px] h-4 px-1.5">{unacknowledged}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                <Badge className={`${severityConfig[alert.severity] || severityConfig.info} text-[10px] shrink-0`}>
                  {alertTypeLabels[alert.alert_type] || alert.alert_type}
                </Badge>
                <span className="text-muted-foreground flex-1">{alert.message}</span>
                <span className="text-muted-foreground/60 shrink-0">
                  {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Runs History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Últimas Execuções do Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!runs || runs.length === 0) ? (
            <p className="text-xs text-muted-foreground">Nenhuma execução registrada.</p>
          ) : (
            <div className="space-y-1.5">
              {runs.map(run => {
                const cfg = statusConfig[run.status] || statusConfig.failed;
                const duration = run.finished_at && run.started_at
                  ? Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)
                  : null;

                return (
                  <div key={run.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                    <Badge className={`${cfg.color} text-[10px] gap-1 shrink-0`}>
                      {cfg.icon}
                      {cfg.label}
                    </Badge>
                    <span className="text-muted-foreground shrink-0">
                      {format(new Date(run.started_at), "dd/MM HH:mm")}
                    </span>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="font-medium text-foreground">{run.generated_questions}q</span>
                      {run.failed_assets > 0 && (
                        <span className="text-destructive">{run.failed_assets} falha(s)</span>
                      )}
                      <span className="text-muted-foreground/60">{run.processed_assets}/{run.target_assets} assets</span>
                    </div>
                    {duration !== null && (
                      <span className="text-muted-foreground/60 shrink-0 flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {duration}s
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
