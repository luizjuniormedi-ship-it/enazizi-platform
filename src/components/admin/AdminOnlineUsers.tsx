import { Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Stats } from "./AdminTypes";

interface AdminOnlineUsersProps {
  stats: Stats | null;
  onUserClick?: (userId: string) => void;
}

const AdminOnlineUsers = ({ stats, onUserClick }: AdminOnlineUsersProps) => (
  <div className="glass-card p-6">
    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <Wifi className="h-5 w-5 text-green-500" />
      Usuários online agora
      <Badge variant="outline" className="text-green-600 border-green-500/30 ml-1">{stats?.onlineUsers ?? 0}</Badge>
    </h2>
    {(stats?.onlineUsersData?.length || 0) > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stats?.onlineUsersData?.map((ou) => {
          const pageName = ou.current_page === "/dashboard" ? "Dashboard" : ou.current_page?.replace("/dashboard/", "") || "—";
          const seenAgo = Math.round((Date.now() - new Date(ou.last_seen_at).getTime()) / 60000);
          return (
            <div key={ou.user_id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {(ou.display_name || "?")[0].toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{ou.display_name || ou.email}</div>
                <div className="text-xs text-muted-foreground truncate">
                  📍 {pageName} • {seenAgo < 1 ? "agora" : `${seenAgo}min atrás`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">Nenhum usuário online no momento.</p>
    )}
  </div>
);

export default AdminOnlineUsers;
