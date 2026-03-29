import { useNavigate } from "react-router-dom";
import { useContentLock, type ContentLockStatus } from "@/hooks/useContentLock";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, ShieldCheck, ArrowRight, AlertTriangle } from "lucide-react";
import { useState } from "react";

const STATUS_CONFIG: Record<ContentLockStatus, {
  icon: typeof Shield;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
}> = {
  blocked: {
    icon: ShieldAlert,
    badgeClass: "bg-destructive/15 text-destructive border-destructive/30",
    borderClass: "border-destructive/30",
    bgClass: "bg-gradient-to-br from-destructive/5 to-background",
  },
  limited: {
    icon: Shield,
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    borderClass: "border-amber-500/30",
    bgClass: "bg-gradient-to-br from-amber-500/5 to-background",
  },
  allowed: {
    icon: ShieldCheck,
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    borderClass: "border-emerald-500/30",
    bgClass: "bg-gradient-to-br from-emerald-500/5 to-background",
  },
};

export default function ContentLockStatus() {
  const navigate = useNavigate();
  const { data: lock, isLoading } = useContentLock();
  const [overridden, setOverridden] = useState(false);

  if (isLoading || !lock) return null;
  // Don't show card if everything is fine
  if (lock.status === "allowed") return null;

  const config = STATUS_CONFIG[lock.status];
  const Icon = config.icon;

  return (
    <Card className={`${config.borderClass} ${config.bgClass} animate-fade-in`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-card flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={`text-[10px] ${config.badgeClass}`}>
                {lock.label}
              </Badge>
            </div>
            <p className="text-sm font-medium">{lock.message}</p>
            {lock.reasons.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {lock.reasons.map((r, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {lock.status === "blocked" && (
            <Button
              className="flex-1 gap-1.5"
              size="sm"
              onClick={() => navigate("/dashboard/planner")}
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Ir para Revisões
            </Button>
          )}
          {lock.status === "blocked" && !overridden && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                setOverridden(true);
                // Track override in localStorage
                const key = "content-lock-overrides";
                const overrides = JSON.parse(localStorage.getItem(key) || "[]");
                overrides.push({ at: new Date().toISOString(), status: lock.status });
                localStorage.setItem(key, JSON.stringify(overrides.slice(-50)));
              }}
            >
              Avançar mesmo assim
            </Button>
          )}
          {overridden && (
            <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
              <AlertTriangle className="h-2.5 w-2.5" />
              Conteúdo liberado temporariamente. Suas revisões continuam pendentes.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
