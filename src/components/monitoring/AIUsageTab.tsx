import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "./MonitoringMetricCard";
import { DashboardData } from "./MonitoringTypes";
import { Zap, Clock, XCircle, Brain } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))", "hsl(var(--destructive))", "hsl(142 76% 36%)",
  "hsl(38 92% 50%)", "hsl(262 83% 58%)", "hsl(199 89% 48%)",
  "hsl(339 90% 51%)", "hsl(25 95% 53%)",
];

export function AIUsageTab({ d }: { d: DashboardData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Zap} label="Total chamadas (24h)" value={d.ai.totalCalls24h} />
        <MetricCard icon={Clock} label="Tempo médio" value={`${d.ai.avgResponseTime}ms`} />
        <MetricCard icon={XCircle} label="Taxa de falha" value={`${d.ai.failureRate}%`} color={d.ai.failureRate > 5 ? "text-destructive" : "text-emerald-500"} />
        <MetricCard icon={Brain} label="Módulos ativos" value={d.ai.byModule.length} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Chamadas por Módulo</CardTitle>
        </CardHeader>
        <CardContent>
          {d.ai.byModule.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={d.ai.byModule}
                  dataKey="calls"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, calls }) => `${name.replace(/-/g, " ")} (${calls})`}
                  labelLine={false}
                >
                  {d.ai.byModule.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
