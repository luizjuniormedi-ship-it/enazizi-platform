import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Brain, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const BottomTabBar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const { data: pendingCount } = useQuery({
    queryKey: ["bottom-tab-pending", user?.id],
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { count } = await supabase
        .from("revisoes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "pendente");
      return count || 0;
    },
  });

  const tabs = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Início", badge: 0 },
    { to: "/dashboard/chatgpt", icon: Brain, label: "Tutor IA", badge: 0 },
    { to: "/dashboard/simulados", icon: ClipboardList, label: "Simulados", badge: pendingCount || 0 },
    { to: "/dashboard/perfil", icon: User, label: "Perfil", badge: 0 },
  ];

  return (
    <nav className="landscape-tablet:hidden lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-around h-14 safe-area-bottom">
      {tabs.map((tab) => {
        const active = location.pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors relative",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div className="relative">
              <tab.icon className={cn("h-5 w-5", active && "text-primary")} />
              {tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </div>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomTabBar;
