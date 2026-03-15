import { useState, useEffect, useCallback } from "react";
import { Shield, Users, CreditCard, TrendingUp, Ban, CheckCircle, UserCog, Search, RefreshCw, ChevronDown, ShieldCheck, ShieldOff, ClipboardList, KeyRound, Bell, UserCheck, UserX, Clock, BarChart3, BookOpen, Target, AlertTriangle, Activity, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  roles: string[];
  subscription: { status: string; plan_id: string; plans: { name: string; price: number } | null } | null;
  quota: { questions_used: number; questions_limit: number } | null;
}

interface Stats {
  totalUsers: number;
  blockedUsers: number;
  activeSubs: number;
  pendingUsers: number;
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
  const [activeTab, setActiveTab] = useState("all");

  const [planDialog, setPlanDialog] = useState<{ open: boolean; user: AdminUser | null; plan: string }>({ open: false, user: null, plan: "" });
  const [blockDialog, setBlockDialog] = useState<{ open: boolean; user: AdminUser | null; block: boolean }>({ open: false, user: null, block: false });
  const [adminDialog, setAdminDialog] = useState<{ open: boolean; user: AdminUser | null; makeAdmin: boolean }>({ open: false, user: null, makeAdmin: false });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; user: AdminUser | null; password: string }>({ open: false, user: null, password: "" });
  const [userDetailDialog, setUserDetailDialog] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null });
  const [trackingDialog, setTrackingDialog] = useState<{ open: boolean; user: AdminUser | null; data: any; loading: boolean }>({ open: false, user: null, data: null, loading: false });

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

  const loadUserTracking = useCallback(async (u: AdminUser) => {
    setTrackingDialog({ open: true, user: u, data: null, loading: true });
    try {
      const res = await callAdmin({ action: "get_user_tracking", target_user_id: u.user_id });
      setTrackingDialog((prev) => ({ ...prev, data: res, loading: false }));
    } catch (e) {
      toast({ title: "Erro", description: "Erro ao carregar dados do usuário", variant: "destructive" });
      setTrackingDialog((prev) => ({ ...prev, loading: false }));
    }
  }, [callAdmin, toast]);

  const handleApproveUser = async (u: AdminUser) => {
    setActionLoading(u.user_id);
    try {
      await callAdmin({ action: "approve_user", target_user_id: u.user_id });
      toast({ title: "Usuário aprovado!", description: `${u.display_name || u.email} agora pode acessar o sistema.` });
      loadData();
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUser = async (u: AdminUser) => {
    setActionLoading(u.user_id);
    try {
      await callAdmin({ action: "reject_user", target_user_id: u.user_id });
      toast({ title: "Usuário rejeitado", description: `${u.display_name || u.email} foi rejeitado.` });
      loadData();
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlock = async () => {
    if (!blockDialog.user) return;
    setActionLoading(blockDialog.user.user_id);
    try {
      await callAdmin({ action: "block_user", target_user_id: blockDialog.user.user_id, blocked: blockDialog.block });
      toast({ title: blockDialog.block ? "Usuário bloqueado" : "Usuário desbloqueado", description: `${blockDialog.user.display_name || blockDialog.user.email} foi ${blockDialog.block ? "bloqueado" : "desbloqueado"}.` });
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
      await callAdmin({ action: "change_plan", target_user_id: planDialog.user.user_id, plan_name: planDialog.plan });
      toast({ title: "Plano alterado", description: `${planDialog.user.display_name || planDialog.user.email} agora está no plano ${planDialog.plan}.` });
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
      await callAdmin({ action: "toggle_admin", target_user_id: adminDialog.user.user_id, make_admin: adminDialog.makeAdmin });
      toast({ title: adminDialog.makeAdmin ? "Admin promovido" : "Admin removido", description: `${adminDialog.user.display_name || adminDialog.user.email} ${adminDialog.makeAdmin ? "agora é administrador" : "não é mais administrador"}.` });
      setAdminDialog({ open: false, user: null, makeAdmin: false });
      loadData();
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async () => {
    if (!passwordDialog.user || !passwordDialog.password) return;
    if (passwordDialog.password.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    setActionLoading(passwordDialog.user.user_id);
    try {
      await callAdmin({ action: "reset_password", target_user_id: passwordDialog.user.user_id, new_password: passwordDialog.password });
      toast({ title: "Senha redefinida", description: `Senha de ${passwordDialog.user.display_name || passwordDialog.user.email} redefinida.` });
      setPasswordDialog({ open: false, user: null, password: "" });
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch = (u.display_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
    if (!matchesSearch) return false;
    
    switch (activeTab) {
      case "pending": return u.status === "pending";
      case "active": return u.status === "active" && !u.is_blocked;
      case "blocked": return u.is_blocked || u.status === "disabled";
      default: return true;
    }
  });

  const pendingCount = users.filter((u) => u.status === "pending").length;
  const activeCount = users.filter((u) => u.status === "active" && !u.is_blocked).length;
  const blockedCount = users.filter((u) => u.is_blocked || u.status === "disabled").length;
  const getUserPlan = (u: AdminUser) => u.subscription?.plans?.name || "Free";

  const getStatusBadge = (u: AdminUser) => {
    if (u.is_blocked) return <Badge variant="destructive" className="text-xs">Bloqueado</Badge>;
    switch (u.status) {
      case "pending": return <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">Pendente</Badge>;
      case "active": return <Badge variant="outline" className="text-xs text-green-600 border-green-600/30">Ativo</Badge>;
      case "disabled": return <Badge variant="destructive" className="text-xs">Rejeitado</Badge>;
      default: return <Badge variant="secondary" className="text-xs">{u.status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Painel Admin
          </h1>
          <p className="text-muted-foreground">Gerencie usuários, aprovações, planos e assinaturas.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-1.5">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {/* Pending notification */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Bell className="h-5 w-5 text-amber-500 animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-semibold">🔔 {pendingCount} novo{pendingCount > 1 ? "s" : ""} usuário{pendingCount > 1 ? "s" : ""} aguardando aprovação</p>
            <p className="text-xs text-muted-foreground">Clique na aba "Novos Usuários" para revisar</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setActiveTab("pending")}>
            <UserCheck className="h-4 w-4" /> Revisar
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Usuários totais", value: stats?.totalUsers ?? "—", icon: Users },
          { label: "Aguardando aprovação", value: pendingCount, icon: Clock, highlight: pendingCount > 0 },
          { label: "Ativos", value: activeCount, icon: CheckCircle },
          { label: "Bloqueados", value: blockedCount, icon: Ban },
          { label: "Assinaturas ativas", value: stats?.activeSubs ?? "—", icon: CreditCard },
        ].map((s) => (
          <div key={s.label} className={`glass-card p-5 ${(s as any).highlight ? "ring-2 ring-amber-500/30" : ""}`}>
            <s.icon className={`h-5 w-5 mb-3 ${(s as any).highlight ? "text-amber-500" : "text-primary"}`} />
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

      {/* Users with tabs */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserCog className="h-5 w-5" /> Gerenciar Usuários
          </h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="gap-1.5">
              Todos <Badge variant="secondary" className="text-xs ml-1">{users.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5">
              🔔 Novos Usuários
              {pendingCount > 0 && <Badge className="text-xs ml-1 bg-amber-500 text-white">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-1.5">
              Ativos <Badge variant="secondary" className="text-xs ml-1">{activeCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="blocked" className="gap-1.5">
              Bloqueados <Badge variant="secondary" className="text-xs ml-1">{blockedCount}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {activeTab === "pending" ? "Nenhum usuário aguardando aprovação." : "Nenhum usuário encontrado."}
              </p>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <div className="col-span-3">Usuário</div>
                  <div className="col-span-2">Email</div>
                  <div className="col-span-1">Plano</div>
                  <div className="col-span-1">Papel</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1">Cadastro</div>
                  <div className="col-span-3 text-right">Ações</div>
                </div>

                {filteredUsers.map((u) => {
                  const plan = getUserPlan(u);
                  const isCurrentlyActioning = actionLoading === u.user_id;
                  const isPending = u.status === "pending";

                  return (
                    <div
                      key={u.user_id}
                      className={`grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isPending ? "bg-amber-500/5 border border-amber-500/20" :
                        u.is_blocked || u.status === "disabled" ? "bg-destructive/5 border border-destructive/20" :
                        "bg-secondary/50 hover:bg-secondary/80"
                      }`}
                    >
                      <div className="col-span-3 flex items-center gap-2">
                        <button
                          onClick={() => setUserDetailDialog({ open: true, user: u })}
                          className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 hover:bg-primary/20 transition-colors"
                        >
                          {(u.display_name || u.email || "?")[0].toUpperCase()}
                        </button>
                        <button
                          onClick={() => setUserDetailDialog({ open: true, user: u })}
                          className="text-sm font-medium truncate hover:text-primary transition-colors"
                        >
                          {u.display_name || "Sem nome"}
                        </button>
                      </div>
                      <div className="col-span-2 flex items-center text-sm text-muted-foreground truncate">
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
                        {getStatusBadge(u)}
                      </div>
                      <div className="col-span-1 flex items-center text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </div>
                      <div className="col-span-3 flex items-center justify-end gap-1.5 flex-wrap">
                        {isPending ? (
                          <>
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1"
                              disabled={isCurrentlyActioning}
                              onClick={() => handleApproveUser(u)}
                            >
                              <UserCheck className="h-3 w-3" /> Aprovar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              disabled={isCurrentlyActioning}
                              onClick={() => handleRejectUser(u)}
                            >
                              <UserX className="h-3 w-3" /> Rejeitar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={isCurrentlyActioning}
                              onClick={() => setAdminDialog({ open: true, user: u, makeAdmin: !u.roles.includes("admin") })}>
                              {u.roles.includes("admin") ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                              {u.roles.includes("admin") ? "Remover Admin" : "Admin"}
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={isCurrentlyActioning}
                              onClick={() => setPlanDialog({ open: true, user: u, plan: getUserPlan(u) })}>
                              <CreditCard className="h-3 w-3" /> Plano
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={isCurrentlyActioning}
                              onClick={() => setPasswordDialog({ open: true, user: u, password: "" })}>
                              <KeyRound className="h-3 w-3" /> Senha
                            </Button>
                            <Button
                              variant={u.is_blocked ? "outline" : "destructive"}
                              size="sm" className="h-7 text-xs gap-1"
                              disabled={isCurrentlyActioning || u.roles.includes("admin")}
                              onClick={() => setBlockDialog({ open: true, user: u, block: !u.is_blocked })}>
                              {u.is_blocked ? <CheckCircle className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                              {u.is_blocked ? "Desbloquear" : "Bloquear"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Audit Log */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Log de Auditoria
          </h2>
          <Button variant="outline" size="sm"
            onClick={() => { setShowAuditLog(!showAuditLog); if (!showAuditLog && auditLogs.length === 0) loadAuditLog(); }}
            className="gap-1.5">
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
                  reset_password: { label: "Redefiniu senha", color: "text-orange-500" },
                  approve_user: { label: "Aprovou", color: "text-green-600" },
                  reject_user: { label: "Rejeitou", color: "text-destructive" },
                };
                const info = actionLabels[log.action] || { label: log.action, color: "text-foreground" };
                return (
                  <div key={log.id} className="flex items-start gap-3 px-4 py-3 rounded-lg bg-secondary/50 text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{log.admin_name}</span>
                      <span className={`mx-1.5 font-semibold ${info.color}`}>{info.label}</span>
                      {log.target_name && <span className="font-medium">{log.target_name}</span>}
                      {log.details?.plan_name && <span className="text-muted-foreground"> → {log.details.plan_name}</span>}
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

      {/* User Detail Dialog */}
      <Dialog open={userDetailDialog.open} onOpenChange={(open) => !open && setUserDetailDialog({ open: false, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Perfil do Usuário</DialogTitle>
          </DialogHeader>
          {userDetailDialog.user && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {(userDetailDialog.user.display_name || userDetailDialog.user.email || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{userDetailDialog.user.display_name || "Sem nome"}</p>
                  <p className="text-sm text-muted-foreground">{userDetailDialog.user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Data de cadastro:</span><br/>{new Date(userDetailDialog.user.created_at).toLocaleDateString("pt-BR")}</div>
                <div><span className="text-muted-foreground">Status:</span><br/>{getStatusBadge(userDetailDialog.user)}</div>
                <div><span className="text-muted-foreground">Plano:</span><br/>{getUserPlan(userDetailDialog.user)}</div>
                <div><span className="text-muted-foreground">Papel:</span><br/>{userDetailDialog.user.roles.includes("admin") ? "Administrador" : "Usuário"}</div>
                {userDetailDialog.user.approved_at && (
                  <div><span className="text-muted-foreground">Data da aprovação:</span><br/>{new Date(userDetailDialog.user.approved_at).toLocaleDateString("pt-BR")}</div>
                )}
                {userDetailDialog.user.approved_by && (
                  <div><span className="text-muted-foreground">Aprovado por:</span><br/>{users.find(u => u.user_id === userDetailDialog.user!.approved_by)?.display_name || userDetailDialog.user.approved_by}</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Block/Unblock Dialog */}
      <Dialog open={blockDialog.open} onOpenChange={(open) => !open && setBlockDialog({ open: false, user: null, block: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{blockDialog.block ? "Bloquear usuário" : "Desbloquear usuário"}</DialogTitle>
            <DialogDescription>
              {blockDialog.block
                ? `Tem certeza que deseja bloquear "${blockDialog.user?.display_name || blockDialog.user?.email}"?`
                : `Deseja desbloquear "${blockDialog.user?.display_name || blockDialog.user?.email}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialog({ open: false, user: null, block: false })}>Cancelar</Button>
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
            <DialogDescription>Alterar o plano de "{planDialog.user?.display_name || planDialog.user?.email}"</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={planDialog.plan} onValueChange={(v) => setPlanDialog((p) => ({ ...p, plan: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
              <SelectContent>
                {PLANS.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
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
            <Button variant="outline" onClick={() => setPlanDialog({ open: false, user: null, plan: "" })}>Cancelar</Button>
            <Button onClick={handleChangePlan} disabled={!!actionLoading || !planDialog.plan}>Confirmar alteração</Button>
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
                ? `Deseja tornar "${adminDialog.user?.display_name || adminDialog.user?.email}" um administrador?`
                : `Deseja remover o acesso admin de "${adminDialog.user?.display_name || adminDialog.user?.email}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminDialog({ open: false, user: null, makeAdmin: false })}>Cancelar</Button>
            <Button onClick={handleToggleAdmin} disabled={!!actionLoading}>
              {adminDialog.makeAdmin ? "Promover" : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={passwordDialog.open} onOpenChange={(open) => !open && setPasswordDialog({ open: false, user: null, password: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>Defina uma nova senha para "{passwordDialog.user?.display_name || passwordDialog.user?.email}"</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input type="password" placeholder="Nova senha (mín. 6 caracteres)" value={passwordDialog.password}
              onChange={(e) => setPasswordDialog((p) => ({ ...p, password: e.target.value }))} minLength={6} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog({ open: false, user: null, password: "" })}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={!!actionLoading || passwordDialog.password.length < 6}>Redefinir senha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
