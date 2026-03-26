import { Ban, CheckCircle, ShieldCheck, ShieldOff, CreditCard, KeyRound, UserCheck, UserX, BarChart3, GraduationCap, LogOut, Lock, Target, BookOpen, Activity, Brain, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdminUser } from "./AdminTypes";

interface AdminUserRowProps {
  u: AdminUser;
  actionLoading: string | null;
  session: { user?: { id: string } } | null;
  getStatusBadge: (u: AdminUser) => React.ReactNode;
  getUserPlan: (u: AdminUser) => string;
  onApprove: (u: AdminUser) => void;
  onReject: (u: AdminUser) => void;
  onOpenDetail: (u: AdminUser) => void;
  onOpenAdmin: (u: AdminUser, makeAdmin: boolean) => void;
  onOpenProfessor: (u: AdminUser, makeProfessor: boolean) => void;
  onOpenPlan: (u: AdminUser, plan: string) => void;
  onOpenPassword: (u: AdminUser) => void;
  onOpenBlock: (u: AdminUser, block: boolean) => void;
  onOpenLogout: (u: AdminUser) => void;
  onOpenTracking: (u: AdminUser) => void;
  onOpenAccess: (u: AdminUser) => void;
}

const AdminUserRow = ({
  u, actionLoading, session, getStatusBadge, getUserPlan,
  onApprove, onReject, onOpenDetail, onOpenAdmin, onOpenProfessor,
  onOpenPlan, onOpenPassword, onOpenBlock, onOpenLogout, onOpenTracking, onOpenAccess,
}: AdminUserRowProps) => {
  const plan = getUserPlan(u);
  const isCurrentlyActioning = actionLoading === u.user_id;
  const isPending = u.status === "pending";
  const evo = u.evolution;

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-14 gap-3 px-4 py-3 rounded-lg transition-colors ${
        isPending ? "bg-amber-500/5 border border-amber-500/20" :
        u.is_blocked || u.status === "disabled" ? "bg-destructive/5 border border-destructive/20" :
        "bg-secondary/50 hover:bg-secondary/80"
      }`}
    >
      <div className="col-span-2 flex items-center gap-2">
        <button onClick={() => onOpenDetail(u)}
          className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 hover:bg-primary/20 transition-colors">
          {(u.display_name || u.email || "?")[0].toUpperCase()}
        </button>
        <button onClick={() => onOpenDetail(u)} className="text-sm font-medium truncate hover:text-primary transition-colors">
          {u.display_name || "Sem nome"}
        </button>
        {u.roles.includes("professor") && <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Prof.</Badge>}
        {u.roles.includes("admin") && <Badge className="text-[9px]">Admin</Badge>}
      </div>
      <div className="col-span-2 flex items-center text-sm text-muted-foreground truncate">{u.email}</div>
      <div className="col-span-1 flex items-center">
        <Badge variant={plan === "Free" ? "secondary" : plan === "Enterprise" ? "default" : "outline"} className="text-xs">{plan}</Badge>
      </div>
      <div className="col-span-1 flex items-center">{getStatusBadge(u)}</div>
      <div className="col-span-1 flex items-center">
        {u.last_seen_at ? (
          <span className="text-xs text-muted-foreground" title={new Date(u.last_seen_at).toLocaleString("pt-BR")}>
            {(() => {
              const diff = Date.now() - new Date(u.last_seen_at).getTime();
              const mins = Math.floor(diff / 60000);
              if (mins < 5) return <span className="text-green-600 font-medium">Online</span>;
              if (mins < 60) return `${mins}min`;
              const hours = Math.floor(mins / 60);
              if (hours < 24) return `${hours}h`;
              return `${Math.floor(hours / 24)}d`;
            })()}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">Nunca</span>
        )}
      </div>
      <div className="col-span-3 flex items-center gap-2">
        {evo && (evo.totalQuestions > 0 || evo.recentAttempts > 0) ? (
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
              <Target className="h-3 w-3" /> {evo.avgScore}%
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
              <BookOpen className="h-3 w-3" /> {evo.totalQuestions}q
            </span>
            {evo.recentAttempts > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/10 text-green-600">
                <Activity className="h-3 w-3" /> {evo.recentAttempts} (7d)
              </span>
            )}
            {evo.specialties > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                <Brain className="h-3 w-3" /> {evo.specialties}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">Sem atividade</span>
        )}
      </div>
      <div className="col-span-4 flex items-center justify-end gap-1.5 flex-wrap">
        {isPending ? (
          <>
            <Button size="sm" className="h-7 text-xs gap-1" disabled={isCurrentlyActioning} onClick={() => onApprove(u)}>
              <UserCheck className="h-3 w-3" /> Aprovar
            </Button>
            <Button variant="destructive" size="sm" className="h-7 text-xs gap-1" disabled={isCurrentlyActioning} onClick={() => onReject(u)}>
              <UserX className="h-3 w-3" /> Rejeitar
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={isCurrentlyActioning}
              onClick={() => onOpenAdmin(u, !u.roles.includes("admin"))}>
              {u.roles.includes("admin") ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
              {u.roles.includes("admin") ? "Remover Admin" : "Admin"}
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={isCurrentlyActioning}
              onClick={() => onOpenProfessor(u, !u.roles.includes("professor"))}>
              <GraduationCap className="h-3 w-3" />
              {u.roles.includes("professor") ? "Remover Prof." : "Professor"}
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={isCurrentlyActioning}
              onClick={() => onOpenPlan(u, getUserPlan(u))}>
              <CreditCard className="h-3 w-3" /> Plano
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={isCurrentlyActioning}
              onClick={() => onOpenPassword(u)}>
              <KeyRound className="h-3 w-3" /> Senha
            </Button>
            <Button
              variant={u.is_blocked ? "outline" : "destructive"}
              size="sm" className="h-7 text-xs gap-1"
              disabled={isCurrentlyActioning || u.roles.includes("admin")}
              onClick={() => onOpenBlock(u, !u.is_blocked)}>
              {u.is_blocked ? <CheckCircle className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
              {u.is_blocked ? "Desbloquear" : "Bloquear"}
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
              disabled={isCurrentlyActioning || u.user_id === session?.user?.id}
              onClick={() => onOpenLogout(u)}>
              <LogOut className="h-3 w-3" /> Desconectar
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-sky-500/30 text-sky-600 hover:bg-sky-500/10"
              disabled={isCurrentlyActioning} onClick={() => onOpenDetail(u)}>
              <Eye className="h-3 w-3" /> Cadastro
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
              disabled={isCurrentlyActioning} onClick={() => onOpenTracking(u)}>
              <BarChart3 className="h-3 w-3" /> Acompanhar
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-violet-500/30 text-violet-600 hover:bg-violet-500/10"
              disabled={isCurrentlyActioning} onClick={() => onOpenAccess(u)}>
              <Lock className="h-3 w-3" /> Acessos
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUserRow;
