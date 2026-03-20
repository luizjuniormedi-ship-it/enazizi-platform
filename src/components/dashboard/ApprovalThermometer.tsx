import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Thermometer, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { DashboardMetrics } from "@/hooks/useDashboardData";

interface Props {
  metrics: DashboardMetrics;
}

const LEVEL_CONFIG = [
  { max: 30, label: "Início da jornada", color: "text-red-500", bg: "bg-red-500" },
  { max: 50, label: "Construindo base", color: "text-orange-500", bg: "bg-orange-500" },
  { max: 65, label: "Em evolução", color: "text-amber-500", bg: "bg-amber-500" },
  { max: 80, label: "Zona competitiva", color: "text-emerald-500", bg: "bg-emerald-500" },
  { max: 100, label: "Pronto para aprovação", color: "text-primary", bg: "bg-primary" },
];

function getLevel(score: number) {
  return LEVEL_CONFIG.find((l) => score <= l.max) || LEVEL_CONFIG[LEVEL_CONFIG.length - 1];
}

export default function ApprovalThermometer({ metrics }: Props) {
  const { user } = useAuth();

  const { data: domainData } = useQuery({
    queryKey: ["domain-map-thermo", user?.id],
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

  // Calculate composite readiness score
  const specialties = domainData || [];
  const avgDomainScore =
    specialties.length > 0
      ? specialties.reduce((s, d) => s + (d.domain_score || 0), 0) / specialties.length
      : 0;

  const accuracyWeight = 0.35;
  const domainWeight = 0.25;
  const volumeWeight = 0.2;
  const diversityWeight = 0.2;

  // Volume: up to 500 questions = 100%
  const volumeScore = Math.min((metrics.questionsAnswered / 500) * 100, 100);

  // Diversity: how many different activities done (max 6)
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
    metrics.accuracy * accuracyWeight +
    avgDomainScore * domainWeight +
    volumeScore * volumeWeight +
    diversityScore * diversityWeight
  );

  const level = getLevel(readiness);

  // Weak specialties
  const weakSpecialties = specialties
    .filter((s) => s.domain_score < 50 && s.questions_answered > 0)
    .sort((a, b) => a.domain_score - b.domain_score)
    .slice(0, 3);

  const trendIcon =
    metrics.accuracy >= 70 ? (
      <TrendingUp className="h-4 w-4 text-emerald-500" />
    ) : metrics.accuracy < 50 ? (
      <TrendingDown className="h-4 w-4 text-red-500" />
    ) : (
      <Minus className="h-4 w-4 text-muted-foreground" />
    );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Thermometer className="h-5 w-5 text-primary" />
          Termômetro de Aprovação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main score */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className={`text-4xl font-bold ${level.color}`}>{readiness}%</span>
            {trendIcon}
          </div>
          <p className={`text-sm font-medium ${level.color}`}>{level.label}</p>
          <Progress value={readiness} className="h-3" />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between p-2 rounded bg-muted/50">
            <span className="text-muted-foreground">Precisão</span>
            <span className="font-medium">{metrics.accuracy}%</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-muted/50">
            <span className="text-muted-foreground">Domínio</span>
            <span className="font-medium">{Math.round(avgDomainScore)}%</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-muted/50">
            <span className="text-muted-foreground">Volume</span>
            <span className="font-medium">{metrics.questionsAnswered} questões</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-muted/50">
            <span className="text-muted-foreground">Diversidade</span>
            <span className="font-medium">{activities}/6 módulos</span>
          </div>
        </div>

        {/* Weak specialties */}
        {weakSpecialties.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">⚠ Especialidades que precisam de atenção:</p>
            {weakSpecialties.map((s) => (
              <div key={s.specialty} className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-red-50 dark:bg-red-900/20">
                <span>{s.specialty}</span>
                <span className="font-medium text-red-600 dark:text-red-400">{Math.round(s.domain_score)}%</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
