import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { MedicalTermProvider } from "@/contexts/MedicalTermContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import ProfessorRoute from "@/components/auth/ProfessorRoute";
import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/layout/ErrorBoundary";

// Eager-load shell layout (always needed)
import DashboardLayout from "./components/layout/DashboardLayout";

// Lazy-load all pages
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const FlashcardGenerator = lazy(() => import("./pages/FlashcardGenerator"));
const CronogramaInteligente = lazy(() => import("./pages/CronogramaInteligente"));
const Simulados = lazy(() => import("./pages/Simulados"));
const Uploads = lazy(() => import("./pages/Uploads"));
const QuestionGenerator = lazy(() => import("./pages/QuestionGenerator"));
const QuestionsBank = lazy(() => import("./pages/QuestionsBank"));
const ContentSummarizer = lazy(() => import("./pages/ContentSummarizer"));
const MotivationalCoach = lazy(() => import("./pages/MotivationalCoach"));
const AgentsHub = lazy(() => import("./pages/AgentsHub"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const DailyPlan = lazy(() => import("./pages/DailyPlan"));
const PerformancePredictor = lazy(() => import("./pages/PerformancePredictor"));
const Diagnostic = lazy(() => import("./pages/Diagnostic"));
const ExamSimulator = lazy(() => import("./pages/ExamSimulator"));
const ChatGPT = lazy(() => import("./pages/ChatGPT"));
const ErrorBank = lazy(() => import("./pages/ErrorBank"));
const MedicalDomainMap = lazy(() => import("./pages/MedicalDomainMap"));
const ProfessorDashboard = lazy(() => import("./pages/ProfessorDashboard"));
const StudentSimulados = lazy(() => import("./pages/StudentSimulados"));
const DiscursiveQuestions = lazy(() => import("./pages/DiscursiveQuestions"));
const ClinicalSimulation = lazy(() => import("./pages/ClinicalSimulation"));
const Achievements = lazy(() => import("./pages/Achievements"));
const MedicalReviewer = lazy(() => import("./pages/MedicalReviewer"));
const InterviewSimulator = lazy(() => import("./pages/InterviewSimulator"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AnamnesisTrainer = lazy(() => import("./pages/AnamnesisTrainer"));
const Install = lazy(() => import("./pages/Install"));
const StudyGuides = lazy(() => import("./pages/StudyGuides"));
const MedicalChronicles = lazy(() => import("./pages/MedicalChronicles"));
const FeynmanTrainer = lazy(() => import("./pages/FeynmanTrainer"));
const AIMentor = lazy(() => import("./pages/AIMentor"));
const SmartPlanner = lazy(() => import("./pages/SmartPlanner"));
const AdminMonitoring = lazy(() => import("./pages/AdminMonitoring"));
const MissionMode = lazy(() => import("./pages/MissionMode"));
const StudySession = lazy(() => import("./pages/StudySession"));
const MedicalImageQuiz = lazy(() => import("./pages/MedicalImageQuiz"));


const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const PageSkeleton = lazy(() => import("./components/layout/PageSkeleton"));

const PageLoader = () => (
  <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
    <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
    </div>
    <div className="h-64 rounded-xl bg-muted animate-pulse" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min cache
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <MedicalTermProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="cronograma" element={<CronogramaInteligente />} />
                <Route path="flashcards" element={<Flashcards />} />
                <Route path="gerar-flashcards" element={<FlashcardGenerator />} />
                <Route path="simulados" element={<Simulados />} />
                <Route path="uploads" element={<Uploads />} />
                <Route path="agentes" element={<AgentsHub />} />
                <Route path="questoes" element={<QuestionGenerator />} />
                <Route path="banco-questoes" element={<QuestionsBank />} />
                <Route path="resumos" element={<ContentSummarizer />} />
                <Route path="apostilas" element={<StudyGuides />} />
                
                <Route path="coach" element={<MotivationalCoach />} />
                <Route path="chatgpt" element={<ChatGPT />} />
                <Route path="plano-dia" element={<DailyPlan />} />
                <Route path="predictor" element={<PerformancePredictor />} />
                <Route path="diagnostico" element={<Diagnostic />} />
                
                <Route path="banco-erros" element={<ErrorBank />} />
                <Route path="mapa-dominio" element={<MedicalDomainMap />} />
                <Route path="proficiencia" element={<StudentSimulados />} />
                <Route path="discursivas" element={<DiscursiveQuestions />} />
                <Route path="plantao" element={<ClinicalSimulation />} />
                <Route path="simulacao-clinica" element={<ClinicalSimulation />} />
                <Route path="revisor" element={<MedicalReviewer />} />
                <Route path="entrevista" element={<InterviewSimulator />} />
                <Route path="conquistas" element={<Achievements />} />
                <Route path="anamnese" element={<AnamnesisTrainer />} />
                <Route path="cronicas" element={<MedicalChronicles />} />
                <Route path="feynman" element={<FeynmanTrainer />} />
                <Route path="mentor" element={<AIMentor />} />
                <Route path="planner" element={<SmartPlanner />} />
                <Route path="missao" element={<MissionMode />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="perfil" element={<Profile />} />
                <Route path="sessao-estudo" element={<StudySession />} />
                <Route path="image-quiz" element={<MedicalImageQuiz />} />
              </Route>
              <Route path="/admin" element={<AdminRoute><DashboardLayout /></AdminRoute>}>
                <Route index element={<Admin />} />
                <Route path="monitoring" element={<AdminMonitoring />} />
              </Route>
              <Route path="/professor" element={<ProfessorRoute><DashboardLayout /></ProfessorRoute>}>
                <Route index element={<ProfessorDashboard />} />
              </Route>
              <Route path="/install" element={<Install />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </MedicalTermProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);
export default App;
