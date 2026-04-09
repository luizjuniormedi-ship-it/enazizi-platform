import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, TrendingUp, Clock, Target, Star, AlertTriangle, Zap } from "lucide-react";
import { useAdaptiveProgress, type ModalityAccuracy, type ModalityTrend, type ResponseTimeAlert, type AdaptiveInsight, type PriorityWeakness, type ErrorPatternDetection } from "@/hooks/useAdaptiveProgress";

const MODALITY_LABELS: Record<string, string> = {
  ecg: "ECG", xray: "RX", dermatology: "Dermatologia",
  ct: "Tomografia", us: "Ultrassom", pathology: "Patologia",
  ophthalmology: "Oftalmologia", text: "Textual",
};

function ml(mod: string) { return MODALITY_LABELS[mod] || mod.toUpperCase(); }

const LEVEL_CONFIG = {
  critica: { emoji: "🔴", color: "text-red-600", bg: "bg-red-500/10", label: "Fraqueza Crítica" },
  moderada: { emoji: "🟠", color: "text-orange-600", bg: "bg-orange-500/10", label: "Fraqueza Moderada" },
  estavel: { emoji: "🟡", color: "text-yellow-600", bg: "bg-yellow-500/10", label: "Estável" },
  forte: { emoji: "🟢", color: "text-emerald-600", bg: "bg-emerald-500/10", label: "Forte" },
};

const TREND_CONFIG = {
  melhorando: { emoji: "📈", color: "text-emerald-600" },
  piorando: { emoji: "📉", color: "text-red-600" },
  estavel: { emoji: "➖", color: "text-muted-foreground" },
};

// ── Sub-components ──

function WeaknessRow({ item }: { item: ModalityAccuracy }) {
  const cfg = LEVEL_CONFIG[item.level];
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-xl ${cfg.bg}`}>
      <div className="flex items-center gap-2">
        <span>{cfg.emoji}</span>
        <span className="text-sm font-medium">{ml(item.modality)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={item.accuracy} className="w-16 h-1.5" />
        <span className={`text-sm font-bold ${cfg.color} min-w-[36px] text-right`}>{item.accuracy}%</span>
      </div>
    </div>
  );
}

function TrendRow({ item }: { item: ModalityTrend }) {
  const cfg = TREND_CONFIG[item.trend];
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
      <span className="text-sm font-medium">{ml(item.modality)}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">
          {item.history.map((h, i) => (
            <span key={i}>{h}%{i < item.history.length - 1 ? " → " : ""}</span>
          ))}
        </span>
        <span className={cfg.color}>{cfg.emoji}</span>
      </div>
    </div>
  );
}

function TimeRow({ item }: { item: ResponseTimeAlert }) {
  return (
    <div className={`flex items-center justify-between p-2 rounded-lg ${item.isAlert ? "bg-red-500/10" : "bg-secondary/30"}`}>
      <span className="text-sm font-medium">{ml(item.modality)}</span>
      <span className={`text-sm font-bold ${item.isAlert ? "text-red-600" : "text-muted-foreground"}`}>
        {item.avgSeconds}s {item.isAlert && "⚠️"}
      </span>
    </div>
  );
}

function InsightRow({ item }: { item: AdaptiveInsight }) {
  const cfg = {
    strength: { icon: Zap, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    weakness: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/10" },
    info: { icon: Brain, color: "text-primary", bg: "bg-primary/10" },
    alert: { icon: Clock, color: "text-orange-600", bg: "bg-orange-500/10" },
  }[item.type];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-start gap-2 p-2.5 rounded-xl ${cfg.bg}`}>
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
      <p className="text-sm">{item.message}</p>
    </div>
  );
}

// ── Main ──

export default function AdaptiveProgressDashboard() {
  const { data, isLoading } = useAdaptiveProgress();

  if (isLoading) {
    return (
      <Card className="border-border/40">
        <CardContent className="p-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.weaknesses.length === 0) {
    return (
      <Card className="border-border/40">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Complete mais simulados para ver sua evolução adaptativa.
        </CardContent>
      </Card>
    );
  }

  const { weaknesses, priority_weaknesses, trends, responseTimes, slow_modalities, error_patterns_detected, quality, profile, nextFocus, insights } = data;

  return (
    <div className="space-y-4">
      {/* Profile + Insights */}
      <Card className="border-border/40">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Brain className="h-4 w-4 text-primary" />
            Evolução Adaptativa
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {/* Profile badge */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <span className="text-2xl">{profile.emoji}</span>
            <div>
              <p className="text-xs text-muted-foreground">Seu perfil</p>
              <p className="text-sm font-semibold">{profile.label}</p>
            </div>
          </div>

          {/* Insights */}
          {insights.slice(0, 4).map((ins, i) => (
            <InsightRow key={i} item={ins} />
          ))}
        </CardContent>
      </Card>

      {/* Priority Weaknesses */}
      {priority_weaknesses.length > 0 && (
        <Card className="border-border/40 border-red-500/20">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Fraquezas Prioritárias
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {priority_weaknesses.map((pw, i) => (
              <div key={pw.modality} className="flex items-center justify-between p-2.5 rounded-xl bg-red-500/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-600">#{i + 1}</span>
                  <span className="text-sm font-medium">{ml(pw.modality)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-bold text-red-600">{pw.accuracy}%</span>
                  {pw.responseTime > 0 && <span>{pw.responseTime}s</span>}
                  {pw.inErrorPatterns && <span className="text-red-500">⚠️</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Weaknesses */}
      <Card className="border-border/40">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Target className="h-4 w-4 text-red-500" />
            Desempenho por Modalidade
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-1.5">
          {weaknesses.slice(0, 5).map((w) => (
            <WeaknessRow key={w.modality} item={w} />
          ))}
        </CardContent>
      </Card>

      {/* Error Patterns */}
      {error_patterns_detected.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Padrões de Erro
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {error_patterns_detected.slice(0, 4).map((ep, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-orange-500/5">
                <span className="text-sm">{ml(ep.pattern)}</span>
                <Badge variant="outline" className="text-[10px]">{ep.label}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Trends */}
      {trends.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" />
              Evolução Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {trends.slice(0, 5).map((t) => (
              <TrendRow key={t.modality} item={t} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Response Times */}
      {responseTimes.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-orange-500" />
              Tempo de Resposta
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {responseTimes.slice(0, 4).map((rt) => (
              <TimeRow key={rt.modality} item={rt} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quality */}
      <Card className="border-border/40">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Star className="h-4 w-4 text-yellow-500" />
            Qualidade do Último Simulado
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Multimodal", value: quality.multimodal, emoji: "🖼️", total: quality.total },
              { label: "Textual", value: quality.textual, emoji: "📝", total: quality.total },
              { label: "Excellent", value: quality.excellent, emoji: "⭐", total: quality.total },
              { label: "Good", value: quality.good, emoji: "✅", total: quality.total },
            ].map((q) => (
              <div key={q.label} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                <span>{q.emoji}</span>
                <div>
                  <p className="text-[11px] text-muted-foreground">{q.label}</p>
                  <p className="text-sm font-bold">{q.total > 0 ? Math.round((q.value / q.total) * 100) : 0}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Focus */}
      <Card className="border-border/40 border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-primary mb-1">Foco do Próximo Simulado</p>
              <p className="text-sm">{nextFocus.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
