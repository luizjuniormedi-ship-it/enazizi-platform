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
import HeroStudyCard from "@/components/dashboard/HeroStudyCard";
import ApprovalScoreCard from "@/components/dashboard/ApprovalScoreCard";
import PendingReviewsCard from "@/components/dashboard/PendingReviewsCard";
import WeakTopicsCard from "@/components/dashboard/WeakTopicsCard";
import FreeStudyCard from "@/components/dashboard/FreeStudyCard";
import RecentProgressCard from "@/components/dashboard/RecentProgressCard";
import PracticalTrainingCard from "@/components/dashboard/PracticalTrainingCard";
import PracticalPerformanceCard from "@/components/dashboard/PracticalPerformanceCard";
import DiagnosticSummaryCard from "@/components/dashboard/DiagnosticSummaryCard";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";

import AdaptiveModeCard from "@/components/dashboard/AdaptiveModeCard";
import ExamSetupReminder from "@/components/dashboard/ExamSetupReminder";
import AdminMessagesBanner from "@/components/dashboard/AdminMessagesBanner";
import MentorshipBanner from "@/components/dashboard/MentorshipBanner";
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

  const { stats, metrics, displayName, hasCompletedDiagnostic } = data || {};

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

  return (
    <div className="space-y-4 animate-fade-in pb-16 lg:pb-0">

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
        <SafeCard name="Greeting">
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
        </SafeCard>
        <div className="mt-3 mb-1 flex items-center justify-between">
          <SafeCard name="XpWidget"><XpWidget /></SafeCard>
          <SafeCard name="PerformanceReport"><PerformanceReport /></SafeCard>
        </div>
        <SafeCard name="AchievementToast"><AchievementToast /></SafeCard>
        {/* Video room is urgent — stays at top */}
        <SafeCard name="VideoRoom"><ActiveVideoRoomBanner /></SafeCard>
      </div>

      {/* Configuração obrigatória — action-driven, bloqueia progresso */}
      <SafeCard name="ExamSetup"><ExamSetupReminder /></SafeCard>

      {/* ══════════════════════════════════════════
          BLOCO PRINCIPAL — Fluxo Único de Estudo
         ══════════════════════════════════════════ */}
      <SafeCard name="HeroStudy">
        <HeroStudyCard />
      </SafeCard>

      {/* Onboarding checklist — high visibility for new users */}
      {isNewUser && (
        <SafeCard name="OnboardingNew">
          <OnboardingChecklist
            stats={stats}
            metrics={metrics}
            hasCompletedDiagnostic={hasCompletedDiagnostic}
          />
        </SafeCard>
      )}

      {/* ══════════════════════════════════════════
          BLOCO 1.5 — MODO ADAPTATIVO (feedback sutil + ação)
         ══════════════════════════════════════════ */}
      {!isNewUser && <SafeCard name="AdaptiveMode"><AdaptiveModeCard /></SafeCard>}

      {/* ══════════════════════════════════════════
          BLOCO 2 — PROGRESSO E APROVAÇÃO
         ══════════════════════════════════════════ */}
      {!isNewUser && <SafeCard name="ApprovalScore"><ApprovalScoreCard /></SafeCard>}

      {/* Nivelamento — only if user has completed it */}
      <SafeCard name="DiagnosticSummary"><DiagnosticSummaryCard /></SafeCard>

      {/* ══════════════════════════════════════════
          BLOCO 2.5 — NÍVEL POR ESPECIALIDADE
         ══════════════════════════════════════════ */}
      {!isNewUser && (
        <Suspense fallback={<ChartFallback />}>
          <SafeCard name="SpecialtyLevels"><SpecialtyLevelsCard /></SafeCard>
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
          BLOCO 3.5 — PROGRESSO RECENTE POR TEMA
         ══════════════════════════════════════════ */}
      {!isNewUser && <SafeCard name="RecentProgress"><RecentProgressCard /></SafeCard>}

      {/* ══════════════════════════════════════════
          BLOCO 4 — TREINO PRÁTICO
         ══════════════════════════════════════════ */}
      <SafeCard name="PracticalTraining"><PracticalTrainingCard /></SafeCard>
      <SafeCard name="PracticalPerformance"><PracticalPerformanceCard /></SafeCard>

      {/* ══════════════════════════════════════════
          BLOCO 5 — MÉTRICAS DRILL-DOWN
         ══════════════════════════════════════════ */}
      {!isNewUser && (
        <Suspense fallback={<div className="space-y-4"><ChartFallback /><ChartFallback /></div>}>
          <div className="grid grid-cols-2 gap-3">
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
                title="Plano Geral"
                accentClass="text-blue-500 bg-blue-500/10"
                onClick={() => setOpenSection("cronograma")}
                metrics={[
                  { label: "Tarefas", value: `${stats.completedTasks}/${stats.totalTasks}` },
                  { label: "Concluído", value: `${taskPercent}%` },
                ]}
              />
            </SafeCard>
            <SafeCard name="SummaryStreak">
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
            </SafeCard>
            <SafeCard name="SummarySimulados">
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
            </SafeCard>
          </div>
        </Suspense>
      )}

      {/* ══════════════════════════════════════════
          BLOCO 6 — ACESSO LIVRE
         ══════════════════════════════════════════ */}
      <SafeCard name="FreeStudy"><FreeStudyCard /></SafeCard>

      {/* Mensagens do admin — secundário */}
      <SafeCard name="AdminMessages"><AdminMessagesBanner /></SafeCard>

      {/* Mentoria do professor */}
      <SafeCard name="MentorshipBanner"><MentorshipBanner /></SafeCard>

      {/* Install app — secundário, lazy loaded */}
      <Suspense fallback={null}>
        <SafeCard name="InstallApp"><InstallAppBanner /></SafeCard>
      </Suspense>

      {/* Onboarding checklist for returning users (non-new) */}
      {!isNewUser && (
        <SafeCard name="OnboardingReturning">
          <OnboardingChecklist
            stats={stats}
            metrics={metrics}
            hasCompletedDiagnostic={hasCompletedDiagnostic}
          />
        </SafeCard>
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
