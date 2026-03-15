import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, FlipVertical,
  FileText, Upload, MessageSquare, BarChart3, LogOut, Shield, User,
  HelpCircle, BookOpen, Heart, Bot, Database, Zap, TrendingUp, Stethoscope, Award, Sparkles, AlertTriangle, Map, GraduationCap, PenLine
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useProfessorCheck } from "@/hooks/useProfessorCheck";
import enazizi from "@/assets/enazizi-mascot.png";
import StudyTimer from "@/components/dashboard/StudyTimer";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/dashboard/chatgpt", icon: Sparkles, label: "🤖 Tutor IA (Principal)" },
  { to: "/dashboard/plano-dia", icon: Zap, label: "⚡ Plano do Dia" },
  { to: "/dashboard/diagnostico", icon: Stethoscope, label: "🩺 Diagnóstico Inicial" },
  { to: "/dashboard/cronograma", icon: CalendarDays, label: "📅 Cronograma" },
  { to: "/dashboard/flashcards", icon: FlipVertical, label: "🃏 Flashcards" },
  { to: "/dashboard/gerar-flashcards", icon: FlipVertical, label: "🃏 Gerador de Flashcards" },
  { to: "/dashboard/simulados", icon: FileText, label: "📝 Simulados" },
  { to: "/dashboard/simulado-completo", icon: Award, label: "🏆 Simulado Completo" },
  { to: "/dashboard/questoes", icon: HelpCircle, label: "❓ Gerador de Questões" },
  { to: "/dashboard/banco-questoes", icon: Database, label: "🗃️ Banco de Questões" },
  { to: "/dashboard/resumos", icon: BookOpen, label: "📖 Resumidor" },
  { to: "/dashboard/coach", icon: Heart, label: "💪 Coach Motivacional" },
  { to: "/dashboard/predictor", icon: TrendingUp, label: "📈 Previsão de Desempenho" },
  { to: "/dashboard/banco-erros", icon: AlertTriangle, label: "🚨 Banco de Erros" },
  { to: "/dashboard/mapa-dominio", icon: Map, label: "🗺️ Mapa de Evolução" },
  { to: "/dashboard/proficiencia", icon: GraduationCap, label: "🎓 Proficiência" },
  { to: "/dashboard/uploads", icon: Upload, label: "📤 Uploads" },
  { to: "/dashboard/analytics", icon: BarChart3, label: "📊 Analytics" },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { isProfessor } = useProfessorCheck();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      <div className="p-6 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <img src={enazizi} alt="ENAZIZI" className="h-9 w-9 rounded-lg object-cover" />
          <span className="text-lg font-bold text-sidebar-foreground">ENAZIZI</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto min-h-0">
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
          {(isProfessor || isAdmin) && (
            <Link
              to="/professor"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/professor"
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              Painel Professor
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/admin"
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </div>
      </nav>

      <div className="border-t border-sidebar-border pt-2 flex-shrink-0">
        <StudyTimer />
        <div className="px-3 pb-3">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
