import { Shield, Users, CreditCard, TrendingUp, Building } from "lucide-react";

const Admin = () => (
  <div className="space-y-8 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        Painel Admin
      </h1>
      <p className="text-muted-foreground">Gerencie usuários, planos e organizações.</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Usuários ativos", value: "1.248", icon: Users },
        { label: "Organizações", value: "37", icon: Building },
        { label: "Receita mensal", value: "R$ 48.7k", icon: CreditCard },
        { label: "Crescimento", value: "+23%", icon: TrendingUp },
      ].map((s) => (
        <div key={s.label} className="glass-card p-5">
          <s.icon className="h-5 w-5 text-primary mb-3" />
          <div className="text-2xl font-bold">{s.value}</div>
          <div className="text-sm text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Últimos usuários</h2>
        <div className="space-y-3">
          {[
            { name: "Ana Silva", email: "ana@email.com", plan: "Pro" },
            { name: "Carlos Santos", email: "carlos@email.com", plan: "Free" },
            { name: "Mariana Costa", email: "mariana@email.com", plan: "Enterprise" },
            { name: "Pedro Lima", email: "pedro@email.com", plan: "Pro" },
          ].map((u) => (
            <div key={u.email} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <div className="text-sm font-medium">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                u.plan === "Enterprise" ? "bg-accent/20 text-accent" : u.plan === "Pro" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
              }`}>
                {u.plan}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Assinaturas por plano</h2>
        <div className="space-y-4">
          {[
            { plan: "Free", count: 856, pct: 68 },
            { plan: "Pro", count: 312, pct: 25 },
            { plan: "Enterprise", count: 80, pct: 7 },
          ].map((p) => (
            <div key={p.plan}>
              <div className="flex justify-between text-sm mb-1">
                <span>{p.plan}</span>
                <span className="text-muted-foreground">{p.count} ({p.pct}%)</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${p.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default Admin;
