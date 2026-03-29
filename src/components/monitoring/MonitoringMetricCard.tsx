import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export function MetricCard({ icon: Icon, label, value, subtitle, color = "text-primary", trend }: {
  icon: any; label: string; value: string | number; subtitle?: string; color?: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-black tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground/70">{subtitle}</p>}
          </div>
          {trend && (
            <TrendingUp className={`h-4 w-4 ${
              trend === "up" ? "text-emerald-500" : trend === "down" ? "text-destructive rotate-180" : "text-muted-foreground"
            }`} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
