import { useEffect, useRef, lazy, Suspense, useState, useMemo, memo } from "react";
import { Loader2, Target, Calendar, Flame, ClipboardList } from "lucide-react";
import XpWidget from "@/components/gamification/XpWidget";
import AchievementToast from "@/components/gamification/AchievementToast";
import DashboardWarnings from "@/components/dashboard/DashboardWarnings";
import MotivationalGreeting from "@/components/dashboard/MotivationalGreeting";
import WhatsNewPopup from "@/components/dashboard/WhatsNewPopup";
import FeedbackSurveyPopup from "@/components/dashboard/FeedbackSurveyPopup";
import SystemGuidePopup from "@/components/dashboard/SystemGuidePopup";
import OnboardingTour from "@/components/dashboard/OnboardingTour";
import PerformanceReport from "@/components/dashboard/PerformanceReport";
import DailyPlanWidget from "@/components/dashboard/DailyPlanWidget";
import DailyGoalWidget from "@/components/dashboard/DailyGoalWidget";
import ActiveVideoRoomBanner from "@/components/dashboard/ActiveVideoRoomBanner";
import DashboardMetricsGrid from "@/components/dashboard/DashboardMetricsGrid";
import QuickStartCard from "@/components/dashboard/QuickStartCard";
const SmartRecommendations = lazy(() => import("@/components/dashboard/SmartRecommendations"));
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import AdminSystemAlerts from "@/components/admin/AdminSystemAlerts";
import InstallAppBanner from "@/components/dashboard/InstallAppBanner";
import AdminMessagesBanner from "@/components/dashboard/AdminMessagesBanner";
import DashboardSummaryCard from "@/components/dashboard/DashboardSummaryCard";
import { useRevisionNotifier } from "@/hooks/useRevisionNotifier";
import { useDashboardData } from "@/hooks/useDashboardData";
import { fireCelebration } from "@/lib/celebrations";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy load heavy chart/analytics components
const StreakCalendar = lazy(() => import("@/components/dashboard/StreakCalendar"));
const SpecialtyProgressCard = lazy(() => import("@/components/dashboard/SpecialtyProgressCard"));
const DashboardCharts = lazy(() => import("@/components/dashboard/DashboardCharts"));
const WeeklyProgressCard = lazy(() => import("@/components/dashboard/WeeklyProgressCard"));
const MiniLeaderboard = lazy(() => import("@/components/dashboard/MiniLeaderboard"));
const ApprovalThermometer = lazy(() => import("@/components/dashboard/ApprovalThermometer"));
const TopicEvolution = lazy(() => import("@/components/dashboard/TopicEvolution"));
const SpecialtyBenchmark = lazy(() => import("@/components/dashboard/SpecialtyBenchmark"));

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
      <AdminSystemAlerts />
      <WhatsNewPopup />
      <SystemGuidePopup />
      <FeedbackSurveyPopup />
      <OnboardingTour />

      {/* Top bar — always visible */}
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
        <InstallAppBanner />
        <AdminMessagesBanner />
        <ActiveVideoRoomBanner />
      </div>

      <DashboardWarnings
        todayCompleted={stats.todayCompleted}
        todayTotal={stats.todayTotal}
        completedTasks={stats.completedTasks}
        totalTasks={stats.totalTasks}
        streak={stats.streak}
        daysUntilExam={stats.daysUntilExam}
      />

      {/* Quick Start for new users */}
      <QuickStartCard
        questionsAnswered={metrics.questionsAnswered}
        flashcards={stats.flashcards}
        hasCompletedDiagnostic={hasCompletedDiagnostic}
      />

      {/* Onboarding Checklist */}
      <OnboardingChecklist
        stats={stats}
        metrics={metrics}
        hasCompletedDiagnostic={hasCompletedDiagnostic}
      />

      {!isNewUser && (
        <Suspense fallback={<div className="space-y-4"><ChartFallback /><ChartFallback /></div>}>
          {/* Approval Thermometer — top visibility */}
          <ApprovalThermometer metrics={metrics} />

          {/* Summary cards grid */}
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
              title="Cronograma"
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

          {/* Daily Plan Widget inline */}
          <DailyPlanWidget />
        </Suspense>
      )}

      {/* Smart Recommendations */}
      <SmartRecommendations
        stats={stats}
        metrics={metrics}
        hasCompletedDiagnostic={hasCompletedDiagnostic}
      />

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
            </Suspense>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={openSection === "cronograma"} onOpenChange={(o) => !o && setOpenSection(null)}>
        <SheetContent side={sheetSide} className={isMobile ? "h-[85vh] overflow-y-auto" : "sm:max-w-lg overflow-y-auto"}>
          <SheetHeader>
            <SheetTitle>Cronograma & Revisões</SheetTitle>
            <SheetDescription>Plano do dia e metas de estudo</SheetDescription>
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
