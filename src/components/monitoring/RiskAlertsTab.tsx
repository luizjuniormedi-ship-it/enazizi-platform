import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, Activity, Lightbulb } from "lucide-react";
import { RiskAlert } from "./MonitoringTypes";

const severityConfig = {
  high: { border: "border-destructive/50 bg-destructive/5", icon: <XCircle className="h-4 w-4 text-destructive" />, label: "Alto" },
  medium: { border: "border-yellow-500/50 bg-yellow-500/5", icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />, label: "Médio" },
  low: { border: "border-primary/30 bg-primary/5", icon: <Activity className="h-4 w-4 text-primary" />, label: "Baixo" },
};

const profileEmoji: Record<string, string> = {
  consistent: "✅", oscillating: "📊", disengaged: "😴",
  studying_the_wrong_way: "⚠️", recovering: "📈",
};

export function RiskAlertsTab({ alerts, systemAlerts }: { alerts: RiskAlert[]; systemAlerts: any[] }) {
  const hasAny = alerts.length > 0 || systemAlerts.length > 0;

  if (!hasAny) {
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

  return (
    <div className="space-y-4">
      {alerts.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-sm font-semibold mb-2">⚠️ Alertas Pedagógicos ({alerts.length})</h3>
          {alerts.map((a, i) => {
            const cfg = severityConfig[a.severity] || severityConfig.low;
            return (
              <Card key={i} className={cfg.border}>
                <CardContent className="p-3 space-y-1.5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate">{a.display_name}</p>
                        <Badge variant="outline" className="text-[10px]">{cfg.label}</Badge>
                        {a.student_profile && (
                          <Badge variant="secondary" className="text-[9px]">
                            {profileEmoji[a.student_profile] || ""} {a.student_profile}
                          </Badge>
                        )}
                        {a.risk_score != null && (
                          <Badge variant="destructive" className="text-[9px]">Risco: {a.risk_score}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.reason}</p>
                    </div>
                  </div>
                  {a.details && (
                    <div className="flex gap-2 items-start ml-7">
                      <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <p className="text-[11px] text-muted-foreground">{a.details}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {systemAlerts.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-sm font-semibold mb-2">🔧 Alertas Técnicos ({systemAlerts.length})</h3>
          {systemAlerts.map((alert: any, i: number) => {
            const s = alert.severity as "critical" | "warning" | "info";
            const cfgMap = {
              critical: { border: "border-destructive/50 bg-destructive/5", icon: <XCircle className="h-4 w-4 text-destructive" /> },
              warning: { border: "border-yellow-500/50 bg-yellow-500/5", icon: <AlertTriangle className="h-4 w-4 text-yellow-500" /> },
              info: { border: "border-primary/30 bg-primary/5", icon: <Activity className="h-4 w-4 text-primary" /> },
            };
            const cfg = cfgMap[s] || cfgMap.info;
            return (
              <Card key={i} className={cfg.border}>
                <CardContent className="p-3 flex items-start gap-3">
                  <div className="mt-0.5">{cfg.icon}</div>
                  <div>
                    <p className="text-sm font-semibold">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
