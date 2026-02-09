import { BarChart3, TrendingUp, Target, Clock } from "lucide-react";

const weeklyData = [
  { day: "Seg", hours: 4 },
  { day: "Ter", hours: 3.5 },
  { day: "Qua", hours: 5 },
  { day: "Qui", hours: 2 },
  { day: "Sex", hours: 4.5 },
  { day: "Sáb", hours: 6 },
  { day: "Dom", hours: 2 },
];

const maxHours = Math.max(...weeklyData.map((d) => d.hours));

const Analytics = () => (
  <div className="space-y-8 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" />
        Analytics
      </h1>
      <p className="text-muted-foreground">Acompanhe seu desempenho e evolução.</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[
        { label: "Horas esta semana", value: "27h", icon: Clock, color: "text-primary" },
        { label: "Acertos em simulados", value: "73%", icon: Target, color: "text-success" },
        { label: "Melhoria semanal", value: "+12%", icon: TrendingUp, color: "text-warning" },
      ].map((s) => (
        <div key={s.label} className="glass-card p-5">
          <s.icon className={`h-5 w-5 ${s.color} mb-3`} />
          <div className="text-2xl font-bold">{s.value}</div>
          <div className="text-sm text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </div>

    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold mb-6">Horas de estudo — Última semana</h2>
      <div className="flex items-end gap-3 h-48">
        {weeklyData.map((d) => (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground">{d.hours}h</span>
            <div
              className="w-full rounded-t-lg bg-primary/80 transition-all hover:bg-primary"
              style={{ height: `${(d.hours / maxHours) * 100}%` }}
            />
            <span className="text-xs text-muted-foreground">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Analytics;
