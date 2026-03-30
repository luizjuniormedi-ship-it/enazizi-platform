import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, AlertTriangle, AlertCircle, Clock } from "lucide-react";

interface HealthLog {
  id: string;
  run_date: string;
  overall_status: string;
  critical_count: number;
  warning_count: number;
  info_count: number;
  study_engine_ok: boolean;
  ai_ok: boolean;
  avg_ai_response_ms: number;
  total_checks: number;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  ok: { label: "OK", color: "bg-emerald-500", icon: CheckCircle2 },
  warning: { label: "ALERTA", color: "bg-yellow-500", icon: AlertCircle },
  critical: { label: "CRÍTICO", color: "bg-red-500", icon: AlertTriangle },
};

export default function AdminHealthHistory() {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("system_health_logs")
        .select("id, run_date, overall_status, critical_count, warning_count, info_count, study_engine_ok, ai_ok, avg_ai_response_ms, total_checks, created_at")
        .order("run_date", { ascending: false })
        .limit(7);
      setLogs((data as unknown as HealthLog[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Saúde do Sistema — Últimos 7 dias
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum log de monitoramento encontrado.</p>
        ) : (
          <div className="space-y-2">
            {/* Visual status bar */}
            <div className="flex gap-1 mb-4">
              {logs.map((log) => {
                const cfg = STATUS_CONFIG[log.overall_status] || STATUS_CONFIG.ok;
                return (
                  <div
                    key={log.id}
                    className={`flex-1 h-8 rounded ${cfg.color} opacity-90 flex items-center justify-center`}
                    title={`${log.run_date}: ${cfg.label}`}
                  >
                    <span className="text-[9px] font-bold text-white">
                      {new Date(log.run_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Detail rows */}
            {logs.map((log) => {
              const cfg = STATUS_CONFIG[log.overall_status] || STATUS_CONFIG.ok;
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 text-xs">
                  <Icon className={`h-4 w-4 shrink-0 ${log.overall_status === "ok" ? "text-emerald-500" : log.overall_status === "warning" ? "text-yellow-500" : "text-red-500"}`} />
                  <span className="font-medium min-w-[70px]">
                    {new Date(log.run_date + "T12:00:00").toLocaleDateString("pt-BR")}
                  </span>
                  <Badge variant={log.overall_status === "ok" ? "secondary" : "destructive"} className="text-[10px]">
                    {cfg.label}
                  </Badge>
                  <div className="flex items-center gap-3 ml-auto text-muted-foreground">
                    {log.critical_count > 0 && <span className="text-red-500">{log.critical_count} crít.</span>}
                    {log.warning_count > 0 && <span className="text-yellow-500">{log.warning_count} avisos</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {log.avg_ai_response_ms}ms
                    </span>
                    <span>{log.total_checks} checks</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
