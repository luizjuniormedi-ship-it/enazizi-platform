import { useEffect, useRef, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
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
import SmartRecommendations from "@/components/dashboard/SmartRecommendations";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import ErrorReviewCard from "@/components/dashboard/ErrorReviewCard";
import SmartNotifications from "@/components/dashboard/SmartNotifications";
import AdminSystemAlerts from "@/components/admin/AdminSystemAlerts";
import InstallAppBanner from "@/components/dashboard/InstallAppBanner";
import AdminMessagesBanner from "@/components/dashboard/AdminMessagesBanner";
import { useRevisionNotifier } from "@/hooks/useRevisionNotifier";
import { useDashboardData } from "@/hooks/useDashboardData";
import { fireCelebration } from "@/lib/celebrations";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

const Dashboard = () => {
  useRevisionNotifier();
  const { data, isLoading } = useDashboardData();
  const prevLevelRef = useRef<number | null>(null);
  const prevStreakRef = useRef<number | null>(null);

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

  return (
    <div className="space-y-6 animate-fade-in pb-16 lg:pb-0">
      <AdminSystemAlerts />
      <WhatsNewPopup />
      <SystemGuidePopup />
      <FeedbackSurveyPopup />
      <OnboardingTour />

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
        <div className="mt-4 mb-2">
          <XpWidget />
        </div>
        <AchievementToast />
        <InstallAppBanner />
        <AdminMessagesBanner />

        <div className="flex items-center justify-between mt-5">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              {stats.daysUntilExam
                ? `${stats.daysUntilExam} dias até a prova • ${taskPercent}% das tarefas concluídas`
                : "Bem-vindo de volta! Aqui está seu progresso."}
            </p>
          </div>
          <PerformanceReport />
        </div>

        <ActiveVideoRoomBanner />
        <SmartNotifications />
        <DashboardWarnings
          todayCompleted={stats.todayCompleted}
          todayTotal={stats.todayTotal}
          completedTasks={stats.completedTasks}
          totalTasks={stats.totalTasks}
          streak={stats.streak}
          daysUntilExam={stats.daysUntilExam}
        />
        <ErrorReviewCard />
      </div>

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

      {/* Smart Recommendations */}
      <SmartRecommendations
        stats={stats}
        metrics={metrics}
        hasCompletedDiagnostic={hasCompletedDiagnostic}
      />

      {!isNewUser && (
        <Suspense fallback={<div className="space-y-6"><ChartFallback /><ChartFallback /></div>}>
          {/* Streak Calendar + Daily Goal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StreakCalendar />
            <DailyGoalWidget />
          </div>

          {/* KPIs */}
          <DashboardMetricsGrid stats={stats} metrics={metrics} />
          <DailyPlanWidget />

          {/* Specialty Progress */}
          <SpecialtyProgressCard />

          <DashboardCharts stats={stats} metrics={metrics} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeeklyProgressCard />
            <MiniLeaderboard />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ApprovalThermometer metrics={metrics} />
            <TopicEvolution />
          </div>

          <SpecialtyBenchmark />
        </Suspense>
      )}
    </div>
  );
};

export default Dashboard;
