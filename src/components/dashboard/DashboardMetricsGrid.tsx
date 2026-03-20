import { Link } from "react-router-dom";
import {
  Target, CheckCircle2, Flame, CalendarDays, AlertTriangle, Award,
  FlipVertical, TrendingUp, PenTool, Activity, ClipboardList,
  Upload, FileCheck, Stethoscope, BookOpen, HelpCircle, Globe
} from "lucide-react";
import type { DashboardStats, DashboardMetrics } from "@/hooks/useDashboardData";

interface Props {
  stats: DashboardStats;
  metrics: DashboardMetrics;
}

const DashboardMetricsGrid = ({ stats, metrics }: Props) => (
  <>
    {/* Primary KPIs */}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <Link to="/dashboard/banco-questoes" className="glass-card p-4 hover:border-primary/30 transition-all text-center">
        <Target className="h-5 w-5 text-primary mx-auto mb-2" />
        <div className="text-2xl font-bold">{metrics.questionsAnswered}</div>
        <div className="text-xs text-muted-foreground">Questões respondidas</div>
      </Link>
      <Link to="/dashboard/banco-questoes" className="glass-card p-4 hover:border-primary/30 transition-all text-center">
        <CheckCircle2 className={`h-5 w-5 mx-auto mb-2 ${metrics.accuracy >= 70 ? "text-green-500" : metrics.accuracy >= 50 ? "text-yellow-500" : "text-red-500"}`} />
        <div className="text-2xl font-bold">{metrics.accuracy}%</div>
        <div className="text-xs text-muted-foreground">Taxa de acerto</div>
      </Link>
      <Link to="/dashboard/conquistas" className="glass-card p-4 hover:border-primary/30 transition-all text-center">
        <Flame className={`h-5 w-5 mx-auto mb-2 ${stats.streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
        <div className="text-2xl font-bold">{stats.streak}</div>
        <div className="text-xs text-muted-foreground">Dias de streak</div>
      </Link>
      <Link to="/dashboard/cronograma" className="glass-card p-4 hover:border-primary/30 transition-all text-center">
        <CalendarDays className={`h-5 w-5 mx-auto mb-2 ${metrics.pendingRevisoes > 0 ? "text-yellow-500" : "text-green-500"}`} />
        <div className="text-2xl font-bold">{metrics.pendingRevisoes}</div>
        <div className="text-xs text-muted-foreground">Revisões pendentes</div>
      </Link>
      <Link to="/dashboard/banco-erros" className="glass-card p-4 hover:border-primary/30 transition-all text-center">
        <AlertTriangle className={`h-5 w-5 mx-auto mb-2 ${metrics.errorsCount > 0 ? "text-red-500" : "text-green-500"}`} />
        <div className="text-2xl font-bold">{metrics.errorsCount}</div>
        <div className="text-xs text-muted-foreground">Erros registrados</div>
      </Link>
      <Link to="/dashboard/simulado-completo" className="glass-card p-4 hover:border-primary/30 transition-all text-center">
        <Award className="h-5 w-5 text-primary mx-auto mb-2" />
        <div className="text-2xl font-bold">{metrics.simuladosCompleted}</div>
        <div className="text-xs text-muted-foreground">Simulados feitos</div>
      </Link>
    </div>

    {/* Secondary Stats */}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {[
        { to: "/dashboard/flashcards", icon: FlipVertical, value: stats.flashcards, label: "Flashcards" },
        { to: "/dashboard/questoes", icon: PenTool, value: metrics.questionsCreated, label: "Questões criadas" },
        { to: "/dashboard/plantao", icon: Activity, value: metrics.clinicalSimulations, label: "Simulações clínicas" },
        { to: "/dashboard/anamnese", icon: ClipboardList, value: metrics.anamnesisCompleted, label: "Anamneses realizadas" },
        { to: "/dashboard/cronograma", icon: CheckCircle2, value: `${stats.completedTasks}/${stats.totalTasks}`, label: "Tarefas concluídas" },
        { to: "/dashboard/uploads", icon: Upload, value: stats.uploads, label: "Uploads", iconColor: "text-emerald-500" },
        { to: "/dashboard/resumos", icon: FileCheck, value: metrics.summariesCreated, label: "Resumos gerados" },
        { to: "/dashboard/discursivas", icon: Stethoscope, value: metrics.discursivasCompleted, label: "Discursivas feitas" },
      ].map((item) => (
        <Link key={item.to} to={item.to} className="glass-card p-5 hover:border-primary/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <item.icon className={`h-5 w-5 ${item.iconColor || "text-primary"}`} />
            <TrendingUp className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-2xl font-bold">{item.value}</div>
          <div className="text-sm text-muted-foreground">{item.label}</div>
        </Link>
      ))}
    </div>

    {/* Global Knowledge Base Banner */}
    {(metrics.globalFlashcards > 0 || metrics.globalQuestions > 0) && (
      <div className="glass-card p-5 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Base de Conhecimento Global</h3>
            <p className="text-xs text-muted-foreground">Conteúdo colaborativo gerado por todos os usuários</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/dashboard/flashcards" className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <FlipVertical className="h-4 w-4 text-primary flex-shrink-0" />
            <div>
              <div className="text-lg font-bold">{metrics.globalFlashcards}</div>
              <div className="text-xs text-muted-foreground">Flashcards globais</div>
            </div>
          </Link>
          <Link to="/dashboard/banco-questoes" className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
            <div>
              <div className="text-lg font-bold">{metrics.globalQuestions}</div>
              <div className="text-xs text-muted-foreground">Questões globais</div>
            </div>
          </Link>
        </div>
      </div>
    )}
  </>
);

export default DashboardMetricsGrid;
