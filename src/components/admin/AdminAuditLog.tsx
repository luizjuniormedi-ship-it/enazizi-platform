import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminAuditLogProps {
  auditLogs: any[];
  auditLoading: boolean;
  loadAuditLog: () => void;
}

const AdminAuditLog = ({ auditLogs, auditLoading, loadAuditLog }: AdminAuditLogProps) => {
  const [showAuditLog, setShowAuditLog] = useState(false);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardList className="h-5 w-5" /> Log de Auditoria
        </h2>
        <Button variant="outline" size="sm"
          onClick={() => { setShowAuditLog(!showAuditLog); if (!showAuditLog && auditLogs.length === 0) loadAuditLog(); }}
          className="gap-1.5">
          {showAuditLog ? "Ocultar" : "Ver log"}
        </Button>
      </div>

      {showAuditLog && (
        auditLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : auditLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma ação registrada ainda.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditLogs.map((log) => {
              const actionLabels: Record<string, { label: string; color: string }> = {
                block_user: { label: "Bloqueou", color: "text-destructive" },
                unblock_user: { label: "Desbloqueou", color: "text-green-600" },
                change_plan: { label: "Alterou plano", color: "text-primary" },
                promote_admin: { label: "Promoveu admin", color: "text-accent" },
                demote_admin: { label: "Removeu admin", color: "text-muted-foreground" },
                promote_professor: { label: "Promoveu professor", color: "text-emerald-500" },
                demote_professor: { label: "Removeu professor", color: "text-muted-foreground" },
                reset_password: { label: "Redefiniu senha", color: "text-orange-500" },
                approve_user: { label: "Aprovou", color: "text-green-600" },
                reject_user: { label: "Rejeitou", color: "text-destructive" },
                force_logout: { label: "Desconectou", color: "text-orange-500" },
              };
              const info = actionLabels[log.action] || { label: log.action, color: "text-foreground" };
              return (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3 rounded-lg bg-secondary/50 text-sm">
                  <div className="flex-1">
                    <span className="font-medium">{log.admin_name}</span>
                    <span className={`mx-1.5 font-semibold ${info.color}`}>{info.label}</span>
                    {log.target_name && <span className="font-medium">{log.target_name}</span>}
                    {log.details?.plan_name && <span className="text-muted-foreground"> → {log.details.plan_name}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(log.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default AdminAuditLog;
