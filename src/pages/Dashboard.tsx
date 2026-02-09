import { CalendarDays, FlipVertical, FileText, Upload, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { label: "Flashcards", value: "248", icon: FlipVertical, color: "text-primary", to: "/dashboard/flashcards" },
  { label: "Simulados", value: "12", icon: FileText, color: "text-accent", to: "/dashboard/simulados" },
  { label: "Uploads", value: "34", icon: Upload, color: "text-success", to: "/dashboard/uploads" },
  { label: "Horas estudadas", value: "186h", icon: Clock, color: "text-warning", to: "/dashboard/analytics" },
];

const recentTopics = [
  { topic: "Direito Constitucional", progress: 78 },
  { topic: "Direito Penal", progress: 65 },
  { topic: "Direito Administrativo", progress: 52 },
  { topic: "Legislação Especial", progress: 40 },
  { topic: "Criminologia", progress: 30 },
];

const Dashboard = () => (
  <div className="space-y-8 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Bem-vindo de volta! Aqui está seu progresso.</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Link key={s.label} to={s.to} className="glass-card p-5 hover:border-primary/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <TrendingUp className="h-4 w-4 text-success opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-2xl font-bold">{s.value}</div>
          <div className="text-sm text-muted-foreground">{s.label}</div>
        </Link>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Próximas revisões
        </h2>
        <div className="space-y-3">
          {["Direito Penal - Crimes contra a pessoa", "Direito Constitucional - Direitos fundamentais", "Legislação Especial - Lei de Drogas"].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <span className="text-sm">{item}</span>
              <span className="text-xs text-muted-foreground">{i === 0 ? "Hoje" : i === 1 ? "Amanhã" : "3 dias"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Progresso por matéria</h2>
        <div className="space-y-4">
          {recentTopics.map((t) => (
            <div key={t.topic}>
              <div className="flex justify-between text-sm mb-1">
                <span>{t.topic}</span>
                <span className="text-muted-foreground">{t.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${t.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;
