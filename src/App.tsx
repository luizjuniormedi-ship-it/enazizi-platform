import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import ProfessorRoute from "@/components/auth/ProfessorRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Flashcards from "./pages/Flashcards";
import FlashcardGenerator from "./pages/FlashcardGenerator";
import CronogramaInteligente from "./pages/CronogramaInteligente";
import Simulados from "./pages/Simulados";
import Uploads from "./pages/Uploads";

import QuestionGenerator from "./pages/QuestionGenerator";
import QuestionsBank from "./pages/QuestionsBank";
import ContentSummarizer from "./pages/ContentSummarizer";
import MotivationalCoach from "./pages/MotivationalCoach";
import AgentsHub from "./pages/AgentsHub";
import Analytics from "./pages/Analytics";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import DailyPlan from "./pages/DailyPlan";
import PerformancePredictor from "./pages/PerformancePredictor";
import Diagnostic from "./pages/Diagnostic";
import ExamSimulator from "./pages/ExamSimulator";

import ChatGPT from "./pages/ChatGPT";
import ErrorBank from "./pages/ErrorBank";
import MedicalDomainMap from "./pages/MedicalDomainMap";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProfessorDashboard from "./pages/ProfessorDashboard";
import StudentSimulados from "./pages/StudentSimulados";
import DiscursiveQuestions from "./pages/DiscursiveQuestions";
import ClinicalSimulation from "./pages/ClinicalSimulation";
import Achievements from "./pages/Achievements";
import MedicalReviewer from "./pages/MedicalReviewer";
import InterviewSimulator from "./pages/InterviewSimulator";
import NotFound from "./pages/NotFound";
import AnamnesisTrainer from "./pages/AnamnesisTrainer";
import Install from "./pages/Install";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
              {/* mentor removed - merged into ChatGPT */}
              <Route path="questoes" element={<QuestionGenerator />} />
              <Route path="banco-questoes" element={<QuestionsBank />} />
              <Route path="resumos" element={<ContentSummarizer />} />
              <Route path="coach" element={<MotivationalCoach />} />
              {/* estudar removed - merged into ChatGPT */}
              <Route path="chatgpt" element={<ChatGPT />} />
              <Route path="plano-dia" element={<DailyPlan />} />
              <Route path="predictor" element={<PerformancePredictor />} />
              <Route path="diagnostico" element={<Diagnostic />} />
              <Route path="simulado-completo" element={<ExamSimulator />} />
              <Route path="banco-erros" element={<ErrorBank />} />
              <Route path="mapa-dominio" element={<MedicalDomainMap />} />
              <Route path="proficiencia" element={<StudentSimulados />} />
              <Route path="discursivas" element={<DiscursiveQuestions />} />
              <Route path="plantao" element={<ClinicalSimulation />} />
              <Route path="revisor" element={<MedicalReviewer />} />
              <Route path="entrevista" element={<InterviewSimulator />} />
              <Route path="conquistas" element={<Achievements />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="perfil" element={<Profile />} />
            </Route>
            <Route path="/admin" element={<AdminRoute><DashboardLayout /></AdminRoute>}>
              <Route index element={<Admin />} />
            </Route>
            <Route path="/professor" element={<ProfessorRoute><DashboardLayout /></ProfessorRoute>}>
              <Route index element={<ProfessorDashboard />} />
            </Route>
            <Route path="/install" element={<Install />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
