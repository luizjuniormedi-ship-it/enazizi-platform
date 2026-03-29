import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "./MonitoringMetricCard";
import { DashboardData } from "./MonitoringTypes";
import { Users, Zap, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

export function SystemHealthTab({ d }: { d: DashboardData }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${d.system.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-destructive"}`} />
        <span className="text-sm font-semibold">
          Sistema {d.system.status === "online" ? "Online" : "Offline"}
        </span>
        <Badge variant="outline" className="text-[10px]">Uptime: {d.system.uptime}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Users} label="Usuários online" value={d.users.activeNow} color="text-emerald-500" />
        <MetricCard icon={Clock} label="Resp. API (ms)" value={`${d.system.apiResponseTime}ms`} color="text-yellow-500" />
        <MetricCard icon={AlertTriangle} label="Taxa de erro" value={`${d.system.errorRate}%`} color={d.system.errorRate > 5 ? "text-destructive" : "text-emerald-500"} />
        <MetricCard icon={Users} label="Pendentes aprovação" value={d.users.pendingApproval} color={d.users.pendingApproval > 0 ? "text-yellow-500" : "text-muted-foreground"} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">IA por Módulo (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          {d.ai.byModule.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={d.ai.byModule.slice(0, 6)} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">Sem dados de IA nas últimas 24h</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
