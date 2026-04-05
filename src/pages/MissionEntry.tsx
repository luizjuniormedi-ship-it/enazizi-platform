import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { Button } from "@/components/ui/button";
import { Rocket, Target, Flame, Brain, BookOpen, ArrowRight } from "lucide-react";

const SESSION_KEY = "enazizi_mission_entry_seen";

export default function MissionEntry() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useDashboardData();
  const { isEnabled, loading: flagsLoading } = useFeatureFlags();

  useEffect(() => {
    if (flagsLoading) return;
    if (!isEnabled("mission_entry_enabled")) {
      navigate("/dashboard", { replace: true });
    }
  }, [flagsLoading, isEnabled, navigate]);

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, "true");
  }, []);

  if (!user || flagsLoading) return null;
  if (!isEnabled("mission_entry_enabled")) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <Rocket className="w-10 h-10 text-primary animate-bounce" />
          <p className="text-muted-foreground text-sm">Preparando sua missão…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const stats = data.stats;
  const metrics = data.metrics;
  const missionStarted = (stats?.todayCompleted ?? 0) > 0;

  const handleStart = () => {
    navigate("/mission?autostart=mission");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {missionStarted ? "Continue sua missão" : "Missão de hoje"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Seu plano foi ajustado com base no seu desempenho e na sua prova.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCard
            icon={<Target className="w-4 h-4 text-primary" />}
            label="Acerto geral"
            value={`${Math.round(metrics?.accuracy ?? 0)}%`}
          />
          <InfoCard
            icon={<Flame className="w-4 h-4 text-orange-500" />}
            label="Streak"
            value={`${stats?.streak ?? 0} dias`}
          />
          <InfoCard
            icon={<Brain className="w-4 h-4 text-purple-500" />}
            label="Revisões pendentes"
            value={`${metrics?.pendingRevisoes ?? 0}`}
          />
          <InfoCard
            icon={<BookOpen className="w-4 h-4 text-blue-500" />}
            label="Questões hoje"
            value={`${stats?.questionsToday ?? 0}`}
          />
        </div>

        {/* Tasks breakdown */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Hoje você vai focar em:
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {metrics?.pendingRevisoes ?? 2} revisões importantes
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
              {metrics?.errorsCount ?? 1} correções de erro
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {stats?.questionsToday ?? 5} questões estratégicas
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Reforço com tutor
            </li>
          </ul>
        </div>

        {/* Why */}
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-1">
          <p className="text-xs font-semibold text-primary">Por que isso?</p>
          <p className="text-xs text-muted-foreground">
            Essas tarefas têm o maior impacto na sua aprovação hoje.
          </p>
        </div>

        {/* Progress indicator */}
        {missionStarted && (
          <p className="text-center text-xs text-muted-foreground">
            Progresso: {stats?.todayCompleted ?? 0} tarefas concluídas
          </p>
        )}

        {/* CTA */}
        <Button
          onClick={handleStart}
          className="w-full h-14 text-lg font-bold gap-2"
          size="lg"
        >
          {missionStarted ? "CONTINUAR MISSÃO" : "COMEÇAR MISSÃO"}
          <ArrowRight className="w-5 h-5" />
        </Button>

        {/* Secondary link */}
        <div className="text-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Ir para dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-lg font-bold text-foreground">{value}</span>
    </div>
  );
}
