import { useState, useEffect, useCallback } from "react";
import { Shield, Users, CreditCard, TrendingUp, Ban, CheckCircle, UserCog, Search, RefreshCw, ChevronDown, ShieldCheck, ShieldOff, ClipboardList, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminUser {
  user_id: string;
  display_name: string | null;
  email: string | null;
  is_blocked: boolean;
  created_at: string;
  roles: string[];
  subscription: { status: string; plan_id: string; plans: { name: string; price: number } | null } | null;
  quota: { questions_used: number; questions_limit: number } | null;
}

interface Stats {
  totalUsers: number;
  blockedUsers: number;
  activeSubs: number;
  planCounts: Record<string, number>;
}

const PLANS = ["Free", "Pro", "Premium", "Enterprise"];

const Admin = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog state for plan change
  const [planDialog, setPlanDialog] = useState<{ open: boolean; user: AdminUser | null; plan: string }>({
    open: false, user: null, plan: "",
  });
  // Dialog state for block/unblock
  const [blockDialog, setBlockDialog] = useState<{ open: boolean; user: AdminUser | null; block: boolean }>({
    open: false, user: null, block: false,
  });
  // Dialog state for admin toggle
  const [adminDialog, setAdminDialog] = useState<{ open: boolean; user: AdminUser | null; makeAdmin: boolean }>({
    open: false, user: null, makeAdmin: false,
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`;

  const callAdmin = useCallback(async (body: Record<string, unknown>) => {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Erro na operação");
    return data;
  }, [session, API_URL]);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        callAdmin({ action: "list_users" }),
        callAdmin({ action: "get_stats" }),
      ]);
      setUsers(usersRes.users || []);
      setStats(statsRes);
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [session, callAdmin, toast]);

  const loadAuditLog = useCallback(async () => {
    if (!session) return;
    setAuditLoading(true);
    try {
      const res = await callAdmin({ action: "get_audit_log", limit: 50 });
      setAuditLogs(res.logs || []);
    } catch (e) {
      toast({ title: "Erro", description: "Erro ao carregar log de auditoria", variant: "destructive" });
    } finally {
      setAuditLoading(false);
    }
  }, [session, callAdmin, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleBlock = async () => {
    if (!blockDialog.user) return;
    setActionLoading(blockDialog.user.user_id);
    try {
      await callAdmin({
        action: "block_user",
        target_user_id: blockDialog.user.user_id,
        blocked: blockDialog.block,
      });
      toast({
        title: blockDialog.block ? "Usuário bloqueado" : "Usuário desbloqueado",
        description: `${blockDialog.user.display_name || blockDialog.user.email} foi ${blockDialog.block ? "bloqueado" : "desbloqueado"}.`,
      });
      setBlockDialog({ open: false, user: null, block: false });
      loadData();
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangePlan = async () => {
    if (!planDialog.user || !planDialog.plan) return;
    setActionLoading(planDialog.user.user_id);
    try {
      await callAdmin({
        action: "change_plan",
        target_user_id: planDialog.user.user_id,
        plan_name: planDialog.plan,
      });
      toast({
        title: "Plano alterado",
        description: `${planDialog.user.display_name || planDialog.user.email} agora está no plano ${planDialog.plan}.`,
      });
      setPlanDialog({ open: false, user: null, plan: "" });
      loadData();
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAdmin = async () => {
    if (!adminDialog.user) return;
    setActionLoading(adminDialog.user.user_id);
    try {
      await callAdmin({
        action: "toggle_admin",
        target_user_id: adminDialog.user.user_id,
        make_admin: adminDialog.makeAdmin,
      });
      toast({
        title: adminDialog.makeAdmin ? "Admin promovido" : "Admin removido",
        description: `${adminDialog.user.display_name || adminDialog.user.email} ${adminDialog.makeAdmin ? "agora é administrador" : "não é mais administrador"}.`,
      });
      setAdminDialog({ open: false, user: null, makeAdmin: false });
      loadData();
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.display_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  const getUserPlan = (u: AdminUser) => u.subscription?.plans?.name || "Free";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Painel Admin
          </h1>
          <p className="text-muted-foreground">Gerencie usuários, planos e assinaturas.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-1.5">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Usuários totais", value: stats?.totalUsers ?? "—", icon: Users },
          { label: "Assinaturas ativas", value: stats?.activeSubs ?? "—", icon: CreditCard },
          { label: "Bloqueados", value: stats?.blockedUsers ?? "—", icon: Ban },
          { label: "Planos ativos", value: stats?.planCounts ? Object.keys(stats.planCounts).length : "—", icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5">
            <s.icon className="h-5 w-5 text-primary mb-3" />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      {stats?.planCounts && Object.keys(stats.planCounts).length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Distribuição por plano</h2>
          <div className="space-y-3">
            {Object.entries(stats.planCounts).map(([plan, count]) => {
              const total = stats.totalUsers || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={plan}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{plan}</span>
                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserCog className="h-5 w-5" /> Gerenciar Usuários
          </h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado.</p>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <div className="col-span-3">Usuário</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-1">Plano</div>
              <div className="col-span-1">Papel</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Uso</div>
              <div className="col-span-2 text-right">Ações</div>
            </div>

            {filteredUsers.map((u) => {
              const plan = getUserPlan(u);
              const isBlocked = u.is_blocked;
              const isCurrentlyActioning = actionLoading === u.user_id;

              return (
                <div
                  key={u.user_id}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isBlocked ? "bg-destructive/5 border border-destructive/20" : "bg-secondary/50 hover:bg-secondary/80"
                  }`}
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {(u.display_name || u.email || "?")[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate">{u.display_name || "Sem nome"}</span>
                  </div>
                  <div className="col-span-3 flex items-center text-sm text-muted-foreground truncate">
                    {u.email}
                  </div>
                  <div className="col-span-1 flex items-center">
                    <Badge variant={plan === "Free" ? "secondary" : plan === "Enterprise" ? "default" : "outline"} className="text-xs">
                      {plan}
                    </Badge>
                  </div>
                  <div className="col-span-1 flex items-center">
                    {u.roles.includes("admin") ? (
                      <Badge className="text-xs bg-accent/20 text-accent border-0">Admin</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">User</span>
                    )}
                  </div>
                  <div className="col-span-1 flex items-center">
                    {isBlocked ? (
                      <Badge variant="destructive" className="text-xs">Bloqueado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-600/30">Ativo</Badge>
                    )}
                  </div>
                  <div className="col-span-1 flex items-center text-xs text-muted-foreground">
                    {u.quota ? `${u.quota.questions_used}/${u.quota.questions_limit}` : "—"}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1.5 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      disabled={isCurrentlyActioning}
                      onClick={() => setAdminDialog({ open: true, user: u, makeAdmin: !u.roles.includes("admin") })}
                    >
                      {u.roles.includes("admin") ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                      {u.roles.includes("admin") ? "Remover Admin" : "Admin"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      disabled={isCurrentlyActioning}
                      onClick={() => setPlanDialog({ open: true, user: u, plan: getUserPlan(u) })}
                    >
                      <CreditCard className="h-3 w-3" /> Plano
                    </Button>
                    <Button
                      variant={isBlocked ? "outline" : "destructive"}
                      size="sm"
                      className="h-7 text-xs gap-1"
                      disabled={isCurrentlyActioning || u.roles.includes("admin")}
                      onClick={() => setBlockDialog({ open: true, user: u, block: !isBlocked })}
                    >
                      {isBlocked ? <CheckCircle className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                      {isBlocked ? "Desbloquear" : "Bloquear"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Audit Log Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Log de Auditoria
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowAuditLog(!showAuditLog); if (!showAuditLog && auditLogs.length === 0) loadAuditLog(); }}
            className="gap-1.5"
          >
            {showAuditLog ? "Ocultar" : "Ver log"}
          </Button>
        </div>

        {showAuditLog && (
          auditLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma ação registrada ainda.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditLogs.map((log) => {
                const actionLabels: Record<string, { label: string; color: string }> = {
                  block_user: { label: "Bloqueou", color: "text-destructive" },
                  unblock_user: { label: "Desbloqueou", color: "text-green-600" },
                  change_plan: { label: "Alterou plano", color: "text-primary" },
                  promote_admin: { label: "Promoveu admin", color: "text-accent" },
                  demote_admin: { label: "Removeu admin", color: "text-muted-foreground" },
                };
                const info = actionLabels[log.action] || { label: log.action, color: "text-foreground" };

                return (
                  <div key={log.id} className="flex items-start gap-3 px-4 py-3 rounded-lg bg-secondary/50 text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{log.admin_name}</span>
                      <span className={`mx-1.5 font-semibold ${info.color}`}>{info.label}</span>
                      {log.target_name && (
                        <span className="font-medium">{log.target_name}</span>
                      )}
                      {log.details?.plan_name && (
                        <span className="text-muted-foreground"> → {log.details.plan_name}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(log.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Block/Unblock Dialog */}
      <Dialog open={blockDialog.open} onOpenChange={(open) => !open && setBlockDialog({ open: false, user: null, block: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{blockDialog.block ? "Bloquear usuário" : "Desbloquear usuário"}</DialogTitle>
            <DialogDescription>
              {blockDialog.block
                ? `Tem certeza que deseja bloquear "${blockDialog.user?.display_name || blockDialog.user?.email}"? O usuário não poderá acessar a plataforma.`
                : `Deseja desbloquear "${blockDialog.user?.display_name || blockDialog.user?.email}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialog({ open: false, user: null, block: false })}>
              Cancelar
            </Button>
            <Button variant={blockDialog.block ? "destructive" : "default"} onClick={handleBlock} disabled={!!actionLoading}>
              {blockDialog.block ? "Bloquear" : "Desbloquear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={planDialog.open} onOpenChange={(open) => !open && setPlanDialog({ open: false, user: null, plan: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar plano</DialogTitle>
            <DialogDescription>
              Alterar o plano de "{planDialog.user?.display_name || planDialog.user?.email}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={planDialog.plan} onValueChange={(v) => setPlanDialog((p) => ({ ...p, plan: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                {PLANS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-3 text-xs text-muted-foreground">
              {planDialog.plan === "Free" && "50 questões/mês • Gratuito"}
              {planDialog.plan === "Pro" && "2.000 questões/mês • R$59,90"}
              {planDialog.plan === "Premium" && "8.000 questões/mês • R$99,90"}
              {planDialog.plan === "Enterprise" && "Ilimitado • R$299,90"}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialog({ open: false, user: null, plan: "" })}>
              Cancelar
            </Button>
            <Button onClick={handleChangePlan} disabled={!!actionLoading || !planDialog.plan}>
              Confirmar alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Admin Dialog */}
      <Dialog open={adminDialog.open} onOpenChange={(open) => !open && setAdminDialog({ open: false, user: null, makeAdmin: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{adminDialog.makeAdmin ? "Promover a Administrador" : "Remover Administrador"}</DialogTitle>
            <DialogDescription>
              {adminDialog.makeAdmin
                ? `Deseja tornar "${adminDialog.user?.display_name || adminDialog.user?.email}" um administrador? Ele terá acesso total ao painel de gestão.`
                : `Deseja remover o acesso admin de "${adminDialog.user?.display_name || adminDialog.user?.email}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminDialog({ open: false, user: null, makeAdmin: false })}>
              Cancelar
            </Button>
            <Button onClick={handleToggleAdmin} disabled={!!actionLoading}>
              {adminDialog.makeAdmin ? "Promover" : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
