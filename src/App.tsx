import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Flashcards from "./pages/Flashcards";
import StudyPlan from "./pages/StudyPlan";
import Simulados from "./pages/Simulados";
import Uploads from "./pages/Uploads";
import AIMentor from "./pages/AIMentor";
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
import DashboardLayout from "./components/layout/DashboardLayout";
import NotFound from "./pages/NotFound";

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
              <Route path="cronograma" element={<StudyPlan />} />
              <Route path="flashcards" element={<Flashcards />} />
              <Route path="simulados" element={<Simulados />} />
              <Route path="uploads" element={<Uploads />} />
              <Route path="agentes" element={<AgentsHub />} />
              <Route path="mentor" element={<AIMentor />} />
              <Route path="questoes" element={<QuestionGenerator />} />
              <Route path="banco-questoes" element={<QuestionsBank />} />
              <Route path="resumos" element={<ContentSummarizer />} />
              <Route path="coach" element={<MotivationalCoach />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="perfil" element={<Profile />} />
            </Route>
            <Route path="/admin" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
