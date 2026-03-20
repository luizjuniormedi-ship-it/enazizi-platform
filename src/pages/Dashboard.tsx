import { Loader2 } from "lucide-react";
import XpWidget from "@/components/gamification/XpWidget";
import AchievementToast from "@/components/gamification/AchievementToast";
import DashboardWarnings from "@/components/dashboard/DashboardWarnings";
import TopicEvolution from "@/components/dashboard/TopicEvolution";
import MotivationalGreeting from "@/components/dashboard/MotivationalGreeting";
import WhatsNewPopup from "@/components/dashboard/WhatsNewPopup";
import SystemGuidePopup from "@/components/dashboard/SystemGuidePopup";
import SpecialtyBenchmark from "@/components/dashboard/SpecialtyBenchmark";
import OnboardingTour from "@/components/dashboard/OnboardingTour";
import WeeklyProgressCard from "@/components/dashboard/WeeklyProgressCard";
import PerformanceReport from "@/components/dashboard/PerformanceReport";
import MiniLeaderboard from "@/components/dashboard/MiniLeaderboard";
import DailyPlanWidget from "@/components/dashboard/DailyPlanWidget";
import ActiveVideoRoomBanner from "@/components/dashboard/ActiveVideoRoomBanner";
import DashboardMetricsGrid from "@/components/dashboard/DashboardMetricsGrid";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import { useRevisionNotifier } from "@/hooks/useRevisionNotifier";
import { useDashboardData } from "@/hooks/useDashboardData";

const Dashboard = () => {
  useRevisionNotifier();
  const { data, isLoading } = useDashboardData();

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const { stats, metrics, displayName } = data;
  const taskPercent = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <WhatsNewPopup />
      <SystemGuidePopup />
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
        <DashboardWarnings
          todayCompleted={stats.todayCompleted}
          todayTotal={stats.todayTotal}
          completedTasks={stats.completedTasks}
          totalTasks={stats.totalTasks}
          streak={stats.streak}
          daysUntilExam={stats.daysUntilExam}
        />
      </div>

      <DashboardMetricsGrid stats={stats} metrics={metrics} />
      <DailyPlanWidget />
      <DashboardCharts stats={stats} metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyProgressCard />
        <MiniLeaderboard />
      </div>

      <TopicEvolution />
      <SpecialtyBenchmark />
    </div>
  );
};

export default Dashboard;
