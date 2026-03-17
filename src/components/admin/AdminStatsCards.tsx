import { Users, CreditCard, Ban, CheckCircle, Clock, Wifi } from "lucide-react";
import type { Stats } from "./AdminTypes";

interface AdminStatsCardsProps {
  stats: Stats | null;
  pendingCount: number;
  activeCount: number;
  blockedCount: number;
}

const AdminStatsCards = ({ stats, pendingCount, activeCount, blockedCount }: AdminStatsCardsProps) => {
  const items = [
    { label: "Usuários totais", value: stats?.totalUsers ?? "—", icon: Users },
    { label: "Online agora", value: stats?.onlineUsers ?? 0, icon: Wifi, highlight: (stats?.onlineUsers || 0) > 0, highlightColor: "text-green-500" },
    { label: "Aguardando aprovação", value: pendingCount, icon: Clock, highlight: pendingCount > 0 },
    { label: "Ativos", value: activeCount, icon: CheckCircle },
    { label: "Bloqueados", value: blockedCount, icon: Ban },
    { label: "Assinaturas ativas", value: stats?.activeSubs ?? "—", icon: CreditCard },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map((s) => (
        <div key={s.label} className={`glass-card p-5 ${s.highlight ? "ring-2 ring-primary/30" : ""}`}>
          <s.icon className={`h-5 w-5 mb-3 ${s.highlightColor || (s.highlight ? "text-amber-500" : "text-primary")}`} />
          <div className="text-2xl font-bold">{s.value}</div>
          <div className="text-sm text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </div>
  );
};

export default AdminStatsCards;
