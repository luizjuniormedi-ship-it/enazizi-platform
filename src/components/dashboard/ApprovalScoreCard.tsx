import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { adjustPlanByApprovalScore } from "@/lib/approvalScoreWeights";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, TrendingUp, ChevronRight } from "lucide-react";
import type { DashboardMetrics } from "@/hooks/useDashboardData";

interface Props {
  metrics: DashboardMetrics;
}

const STATUS_CONFIG = [
  { max: 50, label: "Crítico", color: "text-destructive", bg: "bg-destructive", border: "border-destructive/30", emoji: "🔴" },
  { max: 70, label: "Atenção", color: "text-warning", bg: "bg-warning", border: "border-warning/30", emoji: "🟡" },
  { max: 85, label: "Competitivo", color: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-500/30", emoji: "🟢" },
  { max: 100, label: "Pronto!", color: "text-primary", bg: "bg-primary", border: "border-primary/30", emoji: "🏆" },
];

function getStatus(score: number) {
  return STATUS_CONFIG.find((s) => score <= s.max) || STATUS_CONFIG[STATUS_CONFIG.length - 1];
}

export default function ApprovalScoreCard({ metrics }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: domainData } = useQuery({
    queryKey: ["approval-score-domains", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("medical_domain_map")
        .select("specialty, domain_score, questions_answered")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
    staleTime: 3 * 60 * 1000,
  });

  const { data: reviewCount } = useQuery({
    queryKey: ["pending-reviews-count", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("revisoes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "pendente")
        .lte("data_revisao", today);
      return count || 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const specialties = domainData || [];
  const avgDomain = specialties.length > 0
    ? specialties.reduce((s, d) => s + (d.domain_score || 0), 0) / specialties.length
    : 0;

  const volumeScore = Math.min((metrics.questionsAnswered / 500) * 100, 100);
  const activities = [
    metrics.questionsAnswered > 0,
    metrics.simuladosCompleted > 0,
    metrics.clinicalSimulations > 0,
    metrics.anamnesisCompleted > 0,
    metrics.discursivasCompleted > 0,
    metrics.summariesCreated > 0,
  ].filter(Boolean).length;
  const diversityScore = (activities / 6) * 100;

  const readiness = Math.round(
    metrics.accuracy * 0.35 +
    avgDomain * 0.25 +
    volumeScore * 0.20 +
    diversityScore * 0.20
  );

  const status = getStatus(readiness);

  // Build improvement points
  const issues: string[] = [];
  const weakSpecs = specialties
    .filter((s) => s.domain_score < 50 && s.questions_answered > 0)
    .sort((a, b) => a.domain_score - b.domain_score);
  if (weakSpecs.length > 0) issues.push(`${weakSpecs[0].specialty} abaixo do esperado`);
  if ((reviewCount || 0) > 3) issues.push(`${reviewCount} revisões atrasadas`);
  if (metrics.questionsAnswered < 100) issues.push("Volume de questões baixo");
  if (activities < 3) issues.push("Baixa diversidade de módulos");

  return (
    <Card className={`${status.border} overflow-hidden`}>
      <CardContent className="p-0">
        {/* Score header */}
        <div className="flex items-center gap-4 p-4 pb-3">
          <div className="relative">
            <div className={`h-16 w-16 rounded-2xl ${status.bg}/10 flex items-center justify-center`}>
              <span className="text-2xl font-black tabular-nums" style={{ color: `hsl(var(--${readiness > 70 ? 'primary' : readiness > 50 ? 'warning' : 'destructive'}))` }}>
                {readiness}%
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className={`h-4 w-4 ${status.color}`} />
              <span className={`text-sm font-bold ${status.color}`}>
                {status.emoji} {status.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Chance de aprovação</p>
            <Progress value={readiness} className="h-2 mt-1.5" />
          </div>
        </div>

        {/* Improvement points */}
        {issues.length > 0 && (
          <div className="px-4 pb-3">
            <p className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Você precisa melhorar:
            </p>
            <div className="space-y-1">
              {issues.slice(0, 3).map((issue) => (
                <p key={issue} className="text-xs text-foreground/80 pl-4">• {issue}</p>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="px-4 pb-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs h-8 text-primary hover:text-primary"
            onClick={() => navigate("/dashboard/planner")}
          >
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Ver plano para melhorar
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
