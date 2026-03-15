import { Outlet } from "react-router-dom";
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";
import DashboardSidebar from "./DashboardSidebar";
import { Menu, LogOut, User, Shield } from "lucide-react";
import StudyTimer from "@/components/dashboard/StudyTimer";
import enazizi from "@/assets/enazizi-mascot.png";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";

const mobileNavItems = [
  { to: "/dashboard", label: "📊 Dashboard" },
  { to: "/dashboard/chatgpt", label: "🤖 Tutor IA (Principal)" },
  { to: "/dashboard/plano-dia", label: "⚡ Plano do Dia" },
  { to: "/dashboard/diagnostico", label: "🩺 Diagnóstico Inicial" },
  { to: "/dashboard/cronograma", label: "📅 Cronograma" },
  { to: "/dashboard/flashcards", label: "🃏 Flashcards" },
  { to: "/dashboard/simulados", label: "📝 Simulados" },
  { to: "/dashboard/simulado-completo", label: "🏆 Simulado Completo" },
  { to: "/dashboard/questoes", label: "❓ Gerador de Questões" },
  { to: "/dashboard/banco-questoes", label: "🗃️ Banco de Questões" },
  { to: "/dashboard/resumos", label: "📖 Resumidor" },
  { to: "/dashboard/coach", label: "💪 Coach Motivacional" },
  { to: "/dashboard/predictor", label: "📈 Previsão de Desempenho" },
  { to: "/dashboard/banco-erros", label: "🚨 Banco de Erros" },
  { to: "/dashboard/mapa-dominio", label: "🗺️ Mapa de Evolução" },
  { to: "/dashboard/uploads", label: "📤 Uploads" },
  { to: "/dashboard/analytics", label: "📊 Analytics" },
];

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="lg:hidden p-2"><Menu className="h-6 w-6" /></button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-sidebar border-sidebar-border w-72 p-0 flex flex-col">
        <div className="p-6 border-b border-sidebar-border flex-shrink-0">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <img src={enazizi} alt="ENAZIZI" className="h-7 w-7 rounded-lg object-cover" />
            <span className="font-bold">ENAZIZI</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <nav className="px-3 py-2 space-y-1">
            {mobileNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.to ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-sidebar-border space-y-1">
              <Link
                to="/dashboard/perfil"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === "/dashboard/perfil" ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70"
                }`}
              >
                <User className="h-4 w-4" />
                Meu Perfil
              </Link>
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </nav>
        </ScrollArea>
        <div className="border-t border-sidebar-border flex-shrink-0">
          <StudyTimer />
        </div>
      </SheetContent>
    </Sheet>
  );
};

const DashboardLayout = () => (
  <div className="flex min-h-screen bg-background">
    <DashboardSidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <header className="lg:hidden h-14 border-b border-border flex items-center px-4 gap-3 flex-shrink-0">
        <MobileNav />
        <img src={enazizi} alt="ENAZIZI" className="h-6 w-6 rounded object-cover" />
        <span className="font-bold text-sm">ENAZIZI</span>
      </header>
      <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-auto relative">
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-0">
          <img
            src={enazizi}
            alt=""
            className="w-[40vmin] h-[40vmin] object-contain opacity-[0.25] select-none"
            draggable={false}
          />
        </div>
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  </div>
);

export default DashboardLayout;
