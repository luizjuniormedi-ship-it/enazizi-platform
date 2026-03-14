import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Brain, LayoutDashboard, CalendarDays, FlipVertical,
  FileText, Upload, MessageSquare, BarChart3, LogOut, Shield, User,
  HelpCircle, BookOpen, Heart, Bot, Database, Zap, TrendingUp, Stethoscope, Award, Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/dashboard/chatgpt", icon: Sparkles, label: "🤖 ChatGPT Médico" },
  { to: "/dashboard/estudar", icon: Brain, label: "📚 Estudar (ENAZIZI)" },
  { to: "/dashboard/plano-dia", icon: Zap, label: "Plano do Dia" },
  { to: "/dashboard/diagnostico", icon: Stethoscope, label: "Diagnóstico" },
  { to: "/dashboard/cronograma", icon: CalendarDays, label: "Cronograma" },
  { to: "/dashboard/flashcards", icon: FlipVertical, label: "Flashcards" },
  { to: "/dashboard/simulados", icon: FileText, label: "Simulados" },
  { to: "/dashboard/simulado-completo", icon: Award, label: "Simulado Completo" },
  { to: "/dashboard/uploads", icon: Upload, label: "Uploads" },
  { to: "/dashboard/agentes", icon: Bot, label: "Agentes IA" },
  { to: "/dashboard/mentor", icon: MessageSquare, label: "Mentor IA" },
  { to: "/dashboard/questoes", icon: HelpCircle, label: "Gerador de Questões" },
  { to: "/dashboard/banco-questoes", icon: Database, label: "Banco de Questões" },
  { to: "/dashboard/resumos", icon: BookOpen, label: "Resumidor" },
  { to: "/dashboard/coach", icon: Heart, label: "Coach Motivacional" },
  { to: "/dashboard/predictor", icon: TrendingUp, label: "Previsão de Desempenho" },
  { to: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-sidebar-border bg-sidebar min-h-screen">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">ENAZIZI</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        <div className="pt-4 border-t border-sidebar-border mt-4 space-y-1">
          <Link
            to="/dashboard/perfil"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === "/dashboard/perfil"
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}
          >
            <User className="h-4 w-4" />
            Meu Perfil
          </Link>
          <Link
            to="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        </div>
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
