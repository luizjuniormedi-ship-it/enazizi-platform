import { useState, useEffect } from "react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, Shield, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HealthAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  metric?: number;
  threshold?: number;
}

interface HealthReport {
  id: string;
  check_date: string;
  alerts: HealthAlert[];
  total_critical: number;
  total_warning: number;
  total_info: number;
  created_at: string;
}

const severityConfig = {
  critical: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10 border-red-500/30", label: "Crítico" },
  warning: { icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/30", label: "Aviso" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30", label: "Info" },
};

const AdminSystemAlerts = () => {
  const { isAdmin } = useAdminCheck();
  const [report, setReport] = useState<HealthReport | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) return;

    const fetchReport = async () => {
      const { data } = await supabase
        .from("system_health_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data || (data as any).total_critical + (data as any).total_warning === 0) return;

      const r = data as unknown as HealthReport;
      const dismissKey = `admin_health_dismissed_${r.id}`;
      if (localStorage.getItem(dismissKey)) return;

      setReport(r);
      setOpen(true);
    };

    fetchReport();
  }, [isAdmin]);

  if (!isAdmin || !report) return null;

  const dismiss = () => {
    localStorage.setItem(`admin_health_dismissed_${report.id}`, "1");
    setOpen(false);
  };

  const alerts = (report.alerts as unknown as HealthAlert[]) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Saúde do Sistema
          </DialogTitle>
          <DialogDescription>
            Relatório de {new Date(report.check_date).toLocaleDateString("pt-BR")} — {alerts.length} alerta(s) detectado(s)
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          {report.total_critical > 0 && (
            <Badge variant="destructive">{report.total_critical} Crítico(s)</Badge>
          )}
          {report.total_warning > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/40">{report.total_warning} Aviso(s)</Badge>
          )}
          {report.total_info > 0 && (
            <Badge variant="secondary">{report.total_info} Info</Badge>
          )}
        </div>

        <div className="space-y-3">
          {alerts
            .sort((a, b) => {
              const order = { critical: 0, warning: 1, info: 2 };
              return order[a.severity] - order[b.severity];
            })
            .map((alert) => {
              const config = severityConfig[alert.severity];
              const Icon = config.icon;
              return (
                <div key={alert.id} className={`p-3 rounded-lg border ${config.bg}`}>
                  <div className="flex items-start gap-2">
                    <Icon className={`h-4 w-4 mt-0.5 ${config.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{alert.title}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="outline" size="sm" onClick={() => { navigate("/admin"); setOpen(false); }}>
            Ver Painel Admin
          </Button>
          <Button variant="ghost" size="sm" onClick={dismiss}>
            <X className="h-4 w-4 mr-1" /> Dispensar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminSystemAlerts;
