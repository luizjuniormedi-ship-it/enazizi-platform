import { Badge } from "@/components/ui/badge";

const EXAM_LABELS: Record<string, string> = {
  enare: "ENARE", revalida: "Revalida", usp: "USP", unicamp: "UNICAMP",
  unifesp: "UNIFESP", "sus-sp": "SUS-SP", "sus-rj": "SUS-RJ", amrigs: "AMRIGS",
  "ses-df": "SES-DF", "psu-mg": "PSU-MG", hcpa: "HCPA",
  "santa-casa-sp": "Santa Casa SP", einstein: "Einstein",
  "sirio-libanes": "Sírio-Libanês", outra: "Outra",
};

import { useEffect, useRef, lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SafeCard from "@/components/layout/SafeCard";
import { Loader2, Target, Calendar, Flame, ClipboardList } from "lucide-react";
import XpWidget from "@/components/gamification/XpWidget";
import AchievementToast from "@/components/gamification/AchievementToast";

// Dashboard 2.0 — Action-focused blocks
import HeroStudyCard from "@/components/dashboard/HeroStudyCard";
import ExamReadinessCard from "@/components/dashboard/ExamReadinessCard";
import MentorshipBanner from "@/components/dashboard/MentorshipBanner";
import SmartAlertCard from "@/components/dashboard/SmartAlertCard";
import StreakBanner from "@/components/dashboard/StreakBanner";
import WeeklyEvolutionBar from "@/components/dashboard/WeeklyEvolutionBar";
import WeeklyGoalsCard from "@/components/dashboard/WeeklyGoalsCard";
import FreeStudyCard from "@/components/dashboard/FreeStudyCard";
import ActiveVideoRoomBanner from "@/components/dashboard/ActiveVideoRoomBanner";
import ExamSetupReminder from "@/components/dashboard/ExamSetupReminder";
import AdminMessagesBanner from "@/components/dashboard/AdminMessagesBanner";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import RecoveryModeBanner from "@/components/dashboard/RecoveryModeBanner";

import ResumeMissionBanner from "@/components/dashboard/ResumeMissionBanner";
import DashboardSummaryCard from "@/components/dashboard/DashboardSummaryCard";
import PreparationIndexCard from "@/components/dashboard/PreparationIndexCard";
import DashboardMetricsGrid from "@/components/dashboard/DashboardMetricsGrid";
import DailyPlanWidget from "@/components/dashboard/DailyPlanWidget";
import DailyGoalWidget from "@/components/dashboard/DailyGoalWidget";

import { useRevisionNotifier } from "@/hooks/useRevisionNotifier";
import { useMessageDelivery } from "@/hooks/useMessageDelivery";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useCoreData } from "@/hooks/useCoreData";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { fireCelebration } from "@/lib/celebrations";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy load popups — only 1 per session via queue
const WhatsNewPopup = lazy(() => import("@/components/dashboard/WhatsNewPopup"));
const SystemGuidePopup = lazy(() => import("@/components/dashboard/SystemGuidePopup"));
const FeedbackSurveyPopup = lazy(() => import("@/components/dashboard/FeedbackSurveyPopup"));
const OnboardingTour = lazy(() => import("@/components/dashboard/OnboardingTour"));
const DashboardSmartPopups = lazy(() => import("@/components/onboarding/DashboardSmartPopups"));
const EndOfDaySummary = lazy(() => import("@/components/dashboard/EndOfDaySummary"));

// Lazy load drill-down content
const DashboardCharts = lazy(() => import("@/components/dashboard/DashboardCharts"));
const SpecialtyProgressCard = lazy(() => import("@/components/dashboard/SpecialtyProgressCard"));
const TopicEvolution = lazy(() => import("@/components/dashboard/TopicEvolution"));
const ApprovalTimeline = lazy(() => import("@/components/dashboard/ApprovalTimeline"));
const StreakCalendar = lazy(() => import("@/components/dashboard/StreakCalendar"));
const WeeklyProgressCard = lazy(() => import("@/components/dashboard/WeeklyProgressCard"));
const MiniLeaderboard = lazy(() => import("@/components/dashboard/MiniLeaderboard"));
const SpecialtyBenchmark = lazy(() => import("@/components/dashboard/SpecialtyBenchmark"));
const CurriculumCoverageCard = lazy(() => import("@/components/dashboard/CurriculumCoverageCard"));
const InstallAppBanner = lazy(() => import("@/components/dashboard/InstallAppBanner"));

const ChartFallback = () => (
  <Card>
    <CardContent className="p-6">
      <Skeleton className="h-6 w-40 mb-4" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </CardContent>
  </Card>
);

type SectionKey = "desempenho" | "cronograma" | "streak" | "simulados" | null;

const Dashboard = () => {
  useRevisionNotifier();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { evaluateAndDeliver } = useMessageDelivery();
  const { isEnabled, loading: flagsLoading } = useFeatureFlags();
  useCoreData(); // preload shared data layer
  const { data, isLoading } = useDashboardData();
  const prevLevelRef = useRef<number | null>(null);
  const prevStreakRef = useRef<number | null>(null);

  // Redirect to MissionEntry on fresh login if flag enabled
  useEffect(() => {
    if (flagsLoading) return;
    if (!isEnabled("mission_entry_enabled")) return;
    const loginTs = localStorage.getItem("enazizi_last_login_ts");
    if (!loginTs) return;
    const elapsed = Date.now() - Number(loginTs);
    // Only redirect if login happened < 15 seconds ago (fresh login)
    if (elapsed < 15_000) {
      localStorage.removeItem("enazizi_last_login_ts");
      navigate("/mission", { replace: true });
    }
  }, [flagsLoading, isEnabled, navigate]);
  const [openSection, setOpenSection] = useState<SectionKey>(null);
  const isMobile = useIsMobile();

  // Realtime subscription with debounce for critical tables
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;

    const debouncedInvalidate = (keys: string[][]) => {
      keys.forEach(k => pendingKeysRef.current.add(JSON.stringify(k)));
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        pendingKeysRef.current.forEach(k =>
          queryClient.invalidateQueries({ queryKey: JSON.parse(k) })
        );
        pendingKeysRef.current.clear();
      }, 1500);
    };

    const onPractice = () => debouncedInvalidate([["core-data"], ["dashboard-data"], ["weekly-goals"]]);
    const onRevisoes = () => debouncedInvalidate([["core-data"], ["dashboard-data"], ["weekly-goals"]]);
    const onExam = () => debouncedInvalidate([["core-data"], ["dashboard-data"], ["exam-readiness"]]);
    const onLight = () => debouncedInvalidate([["core-data"], ["dashboard-data"]]);

    const channel = supabase
      .channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'practice_attempts', filter: `user_id=eq.${user.id}` }, onPractice)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'revisoes', filter: `user_id=eq.${user.id}` }, onRevisoes)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fsrs_cards', filter: `user_id=eq.${user.id}` }, onLight)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_gamification', filter: `user_id=eq.${user.id}` }, onLight)
      .subscribe();
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
  useEffect(() => {
    if (!data) return;
    const { metrics, stats } = data;
    if (prevLevelRef.current !== null && metrics.gamificationLevel > prevLevelRef.current) {
      fireCelebration("levelup");
    }
    prevLevelRef.current = metrics.gamificationLevel;
    if (prevStreakRef.current !== null && stats.streak > prevStreakRef.current && stats.streak % 7 === 0) {
      fireCelebration("streak");
    }
    prevStreakRef.current = stats.streak;
  }, [data]);

  useEffect(() => {
    if (data) evaluateAndDeliver();
  }, [data, evaluateAndDeliver]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const { stats, metrics, displayName, hasCompletedDiagnostic, targetExams } = data;

  if (!stats || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const taskPercent = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  const isNewUser = metrics.questionsAnswered === 0 && stats.flashcards === 0;
  const sheetSide = isMobile ? "bottom" as const : "right" as const;

  // Greeting — minimal, no card
  const name = displayName?.split(" ")[0] || "Doutor(a)";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in pb-20 lg:pb-0">

      {/* Popup queue */}
      <Suspense fallback={null}>
        <OnboardingTour />
        <WhatsNewPopup />
        <FeedbackSurveyPopup />
        <SystemGuidePopup />
        <DashboardSmartPopups />
        <EndOfDaySummary />
      </Suspense>

      {/* ══════════════════════════════════════════
          GREETING — compact, inline, thumb-safe zone
         ══════════════════════════════════════════ */}
      <div className="flex items-center justify-between px-1 py-1">
        <div>
          <p className="text-base sm:text-sm text-muted-foreground">
            {greeting}, <span className="text-foreground font-semibold">{name}</span>
          </p>
          {stats.streak > 0 && (
            <p className="text-sm sm:text-xs text-muted-foreground mt-0.5">🔥 {stats.streak} dias seguidos</p>
          )}
          {targetExams && targetExams.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {targetExams.map((e: string) => (
                <Badge key={e} variant="outline" className="text-[10px] px-1.5 py-0">
                  {EXAM_LABELS[e] || e}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <SafeCard name="XpWidget"><XpWidget /></SafeCard>
        </div>
      </div>

      <SafeCard name="AchievementToast"><AchievementToast /></SafeCard>

      {/* ══════════════════════════════════════════
          BLOCO PRINCIPAL — HERO (40-50% da tela)
         ══════════════════════════════════════════ */}
      <SafeCard name="HeroStudy">
        <HeroStudyCard />
      </SafeCard>

      {/* Streak — inline, compact */}
      <SafeCard name="StreakBanner">
        <StreakBanner />
      </SafeCard>

      {/* ══════════════════════════════════════════
          ÍNDICE DE PREPARAÇÃO — indicador central
         ══════════════════════════════════════════ */}
      {!isNewUser && (
        <SafeCard name="PreparationIndex">
          <PreparationIndexCard />
        </SafeCard>
      )}

      {/* ══════════════════════════════════════════
          ALERTA INTELIGENTE — máximo 1
         ══════════════════════════════════════════ */}
      <SafeCard name="RecoveryMode"><RecoveryModeBanner /></SafeCard>
      <SafeCard name="SmartAlert"><SmartAlertCard /></SafeCard>

      {/* ══════════════════════════════════════════
          MENTORIA ATIVA (condicional)
         ══════════════════════════════════════════ */}
      <SafeCard name="MentorshipBanner"><MentorshipBanner /></SafeCard>

      {/* Onboarding checklist — new users only */}
      {isNewUser && (
        <SafeCard name="OnboardingNew">
          <OnboardingChecklist stats={stats} metrics={metrics} hasCompletedDiagnostic={hasCompletedDiagnostic} />
        </SafeCard>
      )}

      {/* ══════════════════════════════════════════
          PROGRESSO SEMANAL — visual simples
         ══════════════════════════════════════════ */}
      {!isNewUser && <SafeCard name="WeeklyEvolution"><WeeklyEvolutionBar /></SafeCard>}
      {!isNewUser && <SafeCard name="WeeklyGoals"><WeeklyGoalsCard /></SafeCard>}

      {/* ══════════════════════════════════════════
          CHANCE POR PROVA — readiness per exam
         ══════════════════════════════════════════ */}
      {!isNewUser && (
        <SafeCard name="ExamReadiness"><ExamReadinessCard /></SafeCard>
      )}

      {/* ══════════════════════════════════════════
          MÉTRICAS DRILL-DOWN — grid compacto
         ══════════════════════════════════════════ */}
      {!isNewUser && (
        <div className="grid grid-cols-2 gap-2.5">
          <SafeCard name="SummaryDesempenho">
            <DashboardSummaryCard
              icon={Target}
              title="Desempenho"
              accentClass="text-primary bg-primary/10"
              onClick={() => setOpenSection("desempenho")}
              metrics={[
                { label: "Acerto", value: `${metrics.accuracy}%` },
                { label: "Questões", value: metrics.questionsAnswered },
              ]}
            />
          </SafeCard>
          <SafeCard name="SummaryCronograma">
            <DashboardSummaryCard
              icon={Calendar}
              title="Plano"
              accentClass="text-blue-500 bg-blue-500/10"
              onClick={() => setOpenSection("cronograma")}
              metrics={[
                { label: "Tarefas", value: `${stats.completedTasks}/${stats.totalTasks}` },
                { label: "Concluído", value: `${taskPercent}%` },
              ]}
            />
          </SafeCard>
          <SafeCard name="SummaryEvolucao">
            <DashboardSummaryCard
              icon={Target}
              title="Evolução"
              accentClass="text-emerald-500 bg-emerald-500/10"
              onClick={() => setOpenSection("desempenho")}
              metrics={[
                { label: "Acerto", value: `${metrics.accuracy}%` },
                { label: "Nível", value: metrics.gamificationLevel },
              ]}
            />
          </SafeCard>
          <SafeCard name="SummarySimulados">
            <DashboardSummaryCard
              icon={ClipboardList}
              title="Simulados"
              accentClass="text-emerald-500 bg-emerald-500/10"
              onClick={() => setOpenSection("simulados")}
              metrics={[
                { label: "Feitos", value: metrics.simuladosCompleted },
                { label: "Prova", value: stats.daysUntilExam ? `${stats.daysUntilExam}d` : "—" },
              ]}
            />
          </SafeCard>
        </div>
      )}

      {/* ══════════════════════════════════════════
          ACESSO RÁPIDO — rodapé discreto
         ══════════════════════════════════════════ */}
      <SafeCard name="FreeStudy"><FreeStudyCard /></SafeCard>

      {/* Admin messages — secondary */}
      <SafeCard name="AdminMessages"><AdminMessagesBanner /></SafeCard>

      {/* Install app — secondary */}
      <Suspense fallback={null}>
        <SafeCard name="InstallApp"><InstallAppBanner /></SafeCard>
      </Suspense>

      {/* ===== Drill-down Sheets ===== */}
      <Sheet open={openSection === "desempenho"} onOpenChange={(o) => !o && setOpenSection(null)}>
        <SheetContent side={sheetSide} className={isMobile ? "h-[85vh] overflow-y-auto" : "sm:max-w-lg overflow-y-auto"}>
          <SheetHeader>
            <SheetTitle>Desempenho Detalhado</SheetTitle>
            <SheetDescription>Gráficos e evolução por especialidade</SheetDescription>
          </SheetHeader>
          <div className="space-y-6 mt-4">
            <Suspense fallback={<ChartFallback />}>
              <SafeCard name="SheetCharts"><DashboardCharts stats={stats} metrics={metrics} /></SafeCard>
              <SafeCard name="SheetSpecialty"><SpecialtyProgressCard /></SafeCard>
              <SafeCard name="SheetTopicEvo"><TopicEvolution /></SafeCard>
              <SafeCard name="SheetTimeline"><ApprovalTimeline /></SafeCard>
            </Suspense>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={openSection === "cronograma"} onOpenChange={(o) => !o && setOpenSection(null)}>
        <SheetContent side={sheetSide} className={isMobile ? "h-[85vh] overflow-y-auto" : "sm:max-w-lg overflow-y-auto"}>
          <SheetHeader>
            <SheetTitle>Plano Geral & Revisões</SheetTitle>
            <SheetDescription>Visão geral do seu plano de estudo</SheetDescription>
          </SheetHeader>
          <div className="space-y-6 mt-4">
            <SafeCard name="SheetDailyPlan"><DailyPlanWidget /></SafeCard>
            <SafeCard name="SheetDailyGoal"><DailyGoalWidget /></SafeCard>
            <Suspense fallback={<ChartFallback />}>
              <SafeCard name="SheetCurriculum"><CurriculumCoverageCard /></SafeCard>
            </Suspense>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={openSection === "streak"} onOpenChange={(o) => !o && setOpenSection(null)}>
        <SheetContent side={sheetSide} className={isMobile ? "h-[85vh] overflow-y-auto" : "sm:max-w-lg overflow-y-auto"}>
          <SheetHeader>
            <SheetTitle>Streak & Gamificação</SheetTitle>
            <SheetDescription>Calendário de atividade e ranking</SheetDescription>
          </SheetHeader>
          <div className="space-y-6 mt-4">
            <Suspense fallback={<ChartFallback />}>
              <SafeCard name="SheetStreak"><StreakCalendar /></SafeCard>
              <SafeCard name="SheetWeekly"><WeeklyProgressCard /></SafeCard>
              <SafeCard name="SheetLeaderboard"><MiniLeaderboard /></SafeCard>
            </Suspense>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={openSection === "simulados"} onOpenChange={(o) => !o && setOpenSection(null)}>
        <SheetContent side={sheetSide} className={isMobile ? "h-[85vh] overflow-y-auto" : "sm:max-w-lg overflow-y-auto"}>
          <SheetHeader>
            <SheetTitle>Simulados & Prática</SheetTitle>
            <SheetDescription>Métricas detalhadas e benchmarks</SheetDescription>
          </SheetHeader>
          <div className="space-y-6 mt-4">
            <Suspense fallback={<ChartFallback />}>
              <SafeCard name="SheetMetrics"><DashboardMetricsGrid stats={stats} metrics={metrics} /></SafeCard>
              <SafeCard name="SheetBenchmark"><SpecialtyBenchmark /></SafeCard>
            </Suspense>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Dashboard;
