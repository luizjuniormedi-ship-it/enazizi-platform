import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Brain, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Início" },
  { to: "/dashboard/chatgpt", icon: Brain, label: "Tutor IA" },
  { to: "/dashboard/simulados", icon: ClipboardList, label: "Simulados" },
  { to: "/dashboard/perfil", icon: User, label: "Perfil" },
];

const BottomTabBar = () => {
  const location = useLocation();

  return (
    <nav className="landscape-tablet:hidden lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around h-14 safe-area-bottom">
      {tabs.map((tab) => {
        const active = location.pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <tab.icon className={cn("h-5 w-5", active && "text-primary")} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomTabBar;
