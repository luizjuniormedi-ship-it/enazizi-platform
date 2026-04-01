import { useEffect, useRef, lazy, Suspense, useState } from "react";
import SafeCard from "@/components/layout/SafeCard";
import { Loader2, Target, Calendar, Flame, ClipboardList } from "lucide-react";
import XpWidget from "@/components/gamification/XpWidget";
import AchievementToast from "@/components/gamification/AchievementToast";

import MotivationalGreeting from "@/components/dashboard/MotivationalGreeting";
import PerformanceReport from "@/components/dashboard/PerformanceReport";
import DailyPlanWidget from "@/components/dashboard/DailyPlanWidget";
import DailyGoalWidget from "@/components/dashboard/DailyGoalWidget";
import ActiveVideoRoomBanner from "@/components/dashboard/ActiveVideoRoomBanner";
import DashboardMetricsGrid from "@/components/dashboard/DashboardMetricsGrid";

// Dashboard 2.0 — Strategic blocks
import TodayStudyCard from "@/components/dashboard/TodayStudyCard";
import ApprovalScoreCard from "@/components/dashboard/ApprovalScoreCard";
import PendingReviewsCard from "@/components/dashboard/PendingReviewsCard";
import WeakTopicsCard from "@/components/dashboard/WeakTopicsCard";
import FreeStudyCard from "@/components/dashboard/FreeStudyCard";
import PracticalTrainingCard from "@/components/dashboard/PracticalTrainingCard";
import DiagnosticSummaryCard from "@/components/dashboard/DiagnosticSummaryCard";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";

import MissionStartButton from "@/components/dashboard/MissionStartButton";
import AdaptiveModeCard from "@/components/dashboard/AdaptiveModeCard";
import ExamSetupReminder from "@/components/dashboard/ExamSetupReminder";
import AdminMessagesBanner from "@/components/dashboard/AdminMessagesBanner";
import DashboardSummaryCard from "@/components/dashboard/DashboardSummaryCard";
import ApprovalTimeline from "@/components/dashboard/ApprovalTimeline";
import { useRevisionNotifier } from "@/hooks/useRevisionNotifier";
import { useMessageDelivery } from "@/hooks/useMessageDelivery";
import { useDashboardData } from "@/hooks/useDashboardData";
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

// Lazy load heavy chart/analytics components
const StreakCalendar = lazy(() => import("@/components/dashboard/StreakCalendar"));
const SpecialtyProgressCard = lazy(() => import("@/components/dashboard/SpecialtyProgressCard"));
const SpecialtyLevelsCard = lazy(() => import("@/components/dashboard/SpecialtyLevelsCard"));
const DashboardCharts = lazy(() => import("@/components/dashboard/DashboardCharts"));
const WeeklyProgressCard = lazy(() => import("@/components/dashboard/WeeklyProgressCard"));
const MiniLeaderboard = lazy(() => import("@/components/dashboard/MiniLeaderboard"));
const ApprovalThermometer = lazy(() => import("@/components/dashboard/ApprovalThermometer"));
const TopicEvolution = lazy(() => import("@/components/dashboard/TopicEvolution"));
const SpecialtyBenchmark = lazy(() => import("@/components/dashboard/SpecialtyBenchmark"));
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
  const { evaluateAndDeliver } = useMessageDelivery();
  const { data, isLoading } = useDashboardData();
  const prevLevelRef = useRef<number | null>(null);
  const prevStreakRef = useRef<number | null>(null);
  const [openSection, setOpenSection] = useState<SectionKey>(null);
  const isMobile = useIsMobile();

  // Celebrate level ups and streak milestones
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

  // Smart message delivery
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

  const { stats, metrics, displayName, hasCompletedDiagnostic } = data;
  const taskPercent = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  const isNewUser = metrics.questionsAnswered === 0 && stats.flashcards === 0;

  const sheetSide = isMobile ? "bottom" as const : "right" as const;

  return (
    <div className="space-y-4 animate-fade-in pb-16 lg:pb-0">
      {/* System alerts (admin only) */}
      <SafeCard name="AdminAlerts" fallback={null}>
        <AdminSystemAlerts />
      </SafeCard>

      {/* Popup queue — lazy loaded, each checks internally if should show */}
      <Suspense fallback={null}>
        <OnboardingTour />
        <WhatsNewPopup />
        <FeedbackSurveyPopup />
        <SystemGuidePopup />
        <DashboardSmartPopups />
        <EndOfDaySummary />
      </Suspense>

      {/* ══════════════════════════════════════════
          TOP — Saudação + XP (mínimo de ruído)
         ══════════════════════════════════════════ */}
      <div>
        <MotivationalGreeting
          streak={stats.streak}
          todayCompleted={stats.todayCompleted}
          todayTotal={stats.todayTotal}
          completedTasks={stats.completedTasks}
          totalTasks={stats.totalTasks}
          daysUntilExam={stats.daysUntilExam}
          questionsAnswered={metrics.questionsAnswered}
          accuracy={metrics.accuracy}
          displayName={displayName}
        />
        <div className="mt-3 mb-1 flex items-center justify-between">
          <XpWidget />
          <PerformanceReport />
        </div>
        <AchievementToast />
        {/* Video room is urgent — stays at top */}
        <ActiveVideoRoomBanner />
      </div>

      {/* Configuração obrigatória — action-driven, bloqueia progresso */}
      <ExamSetupReminder />


      {/* ══════════════════════════════════════════
          BLOCO 0 — MISSÃO DO DIA (CTA principal)
         ══════════════════════════════════════════ */}
      <SafeCard name="MissionStart">
        <MissionStartButton />
      </SafeCard>

      {/* Onboarding checklist — high visibility for new users */}
      {isNewUser && (
        <OnboardingChecklist
          stats={stats}
          metrics={metrics}
          hasCompletedDiagnostic={hasCompletedDiagnostic}
        />
      )}

      {/* ══════════════════════════════════════════
          BLOCO 1 — O que estudar hoje
         ══════════════════════════════════════════ */}
      <SafeCard name="TodayStudy">
        <TodayStudyCard />
      </SafeCard>

      {/* ══════════════════════════════════════════
          BLOCO 1.5 — MODO ADAPTATIVO (feedback sutil + ação)
         ══════════════════════════════════════════ */}
      {!isNewUser && <SafeCard name="AdaptiveMode"><AdaptiveModeCard /></SafeCard>}

      {/* ══════════════════════════════════════════
          BLOCO 2 — PROGRESSO E APROVAÇÃO
         ══════════════════════════════════════════ */}
      {!isNewUser && <SafeCard name="ApprovalScore"><ApprovalScoreCard /></SafeCard>}

      {/* Nivelamento — only if user has completed it */}
      <DiagnosticSummaryCard />

      {/* ══════════════════════════════════════════
          BLOCO 2.5 — NÍVEL POR ESPECIALIDADE
         ══════════════════════════════════════════ */}
      {!isNewUser && (
        <Suspense fallback={<ChartFallback />}>
          <SpecialtyLevelsCard />
        </Suspense>
      )}
      {/* ══════════════════════════════════════════
          BLOCO 3 — REVISÕES E FRAQUEZAS
         ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SafeCard name="PendingReviews"><PendingReviewsCard /></SafeCard>
        <SafeCard name="WeakTopics"><WeakTopicsCard /></SafeCard>
      </div>

      {/* ══════════════════════════════════════════
          BLOCO 4 — TREINO PRÁTICO
         ══════════════════════════════════════════ */}
      <SafeCard name="PracticalTraining"><PracticalTrainingCard /></SafeCard>

      {/* ══════════════════════════════════════════
          BLOCO 5 — MÉTRICAS DRILL-DOWN
         ══════════════════════════════════════════ */}
      {!isNewUser && (
        <Suspense fallback={<div className="space-y-4"><ChartFallback /><ChartFallback /></div>}>
          <div className="grid grid-cols-2 gap-3">
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
            <DashboardSummaryCard
              icon={Calendar}
              title="Plano Geral"
              accentClass="text-blue-500 bg-blue-500/10"
              onClick={() => setOpenSection("cronograma")}
              metrics={[
                { label: "Tarefas", value: `${stats.completedTasks}/${stats.totalTasks}` },
                { label: "Concluído", value: `${taskPercent}%` },
              ]}
            />
            <DashboardSummaryCard
              icon={Flame}
              title="Streak & Metas"
              accentClass="text-orange-500 bg-orange-500/10"
              onClick={() => setOpenSection("streak")}
              metrics={[
                { label: "Streak", value: `🔥 ${stats.streak} dias` },
                { label: "Nível", value: metrics.gamificationLevel },
              ]}
            />
            <DashboardSummaryCard
              icon={ClipboardList}
              title="Simulados"
              accentClass="text-emerald-500 bg-emerald-500/10"
              onClick={() => setOpenSection("simulados")}
              metrics={[
                { label: "Hoje", value: `${stats.todayCompleted}/${stats.todayTotal}` },
                { label: "Dias p/ prova", value: stats.daysUntilExam ?? "—" },
              ]}
            />
          </div>
        </Suspense>
      )}

      {/* ══════════════════════════════════════════
          BLOCO 6 — ACESSO LIVRE
         ══════════════════════════════════════════ */}
      <FreeStudyCard />

      {/* Mensagens do admin — secundário */}
      <AdminMessagesBanner />

      {/* Install app — secundário, lazy loaded */}
      <Suspense fallback={null}>
        <InstallAppBanner />
      </Suspense>

      {/* Onboarding checklist for returning users (non-new) */}
      {!isNewUser && (
        <OnboardingChecklist
          stats={stats}
          metrics={metrics}
          hasCompletedDiagnostic={hasCompletedDiagnostic}
        />
      )}

      {/* ===== Drill-down Sheets ===== */}
      <Sheet open={openSection === "desempenho"} onOpenChange={(o) => !o && setOpenSection(null)}>
        <SheetContent side={sheetSide} className={isMobile ? "h-[85vh] overflow-y-auto" : "sm:max-w-lg overflow-y-auto"}>
          <SheetHeader>
            <SheetTitle>Desempenho Detalhado</SheetTitle>
            <SheetDescription>Gráficos e evolução por especialidade</SheetDescription>
          </SheetHeader>
          <div className="space-y-6 mt-4">
            <Suspense fallback={<ChartFallback />}>
              <DashboardCharts stats={stats} metrics={metrics} />
              <SpecialtyProgressCard />
              <TopicEvolution />
              <ApprovalTimeline />
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
            <DailyPlanWidget />
            <DailyGoalWidget />
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
              <StreakCalendar />
              <WeeklyProgressCard />
              <MiniLeaderboard />
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
              <DashboardMetricsGrid stats={stats} metrics={metrics} />
              <SpecialtyBenchmark />
            </Suspense>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Dashboard;
