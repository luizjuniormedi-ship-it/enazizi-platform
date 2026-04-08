/**
 * Painel de analytics por modalidade — visão do aluno.
 * Mostra desempenho imagem vs texto, acerto por modalidade, insights automáticos
 * e prioridades adaptativas do próximo simulado.
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchUserModalityStats,
  generateModalityInsights,
  type ModalityStats,
  type ModalityInsight,
} from "@/lib/modalityAnalytics";
import {
  generateAdaptiveBlueprint,
  getBlueprintSummary,
  type AdaptiveBlueprint,
  type AdaptiveInsight,
} from "@/lib/adaptiveModalityEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";
import {
  Eye, Image, FileText, TrendingUp, TrendingDown, AlertTriangle, Info,
  Zap, Clock, Target, Brain, Crosshair,
} from "lucide-react";

const MODALITY_LABELS: Record<string, string> = {
  ecg: "ECG", xray: "Raio-X", dermatology: "Dermatologia",
  ct: "Tomografia", us: "Ultrassom", pathology: "Patologia", ophthalmology: "Oftalmologia",
};

const MODALITY_COLORS: Record<string, string> = {
  ecg: "#ef4444", xray: "#3b82f6", dermatology: "#f59e0b",
  ct: "#8b5cf6", us: "#06b6d4", pathology: "#10b981", ophthalmology: "#ec4899",
};

const MODE_COLORS: Record<string, string> = {
  image: "#3b82f6",
  text: "#6b7280",
  fallback_text: "#f59e0b",
};

const INSIGHT_ICONS: Record<string, any> = {
  strength: TrendingUp,
  weakness: TrendingDown,
  info: Info,
  alert: AlertTriangle,
  priority: Crosshair,
  reduction: TrendingDown,
  format: Image,
};

const INSIGHT_COLORS: Record<string, string> = {
  strength: "text-green-600 bg-green-50 border-green-200",
  weakness: "text-red-600 bg-red-50 border-red-200",
  info: "text-blue-600 bg-blue-50 border-blue-200",
  alert: "text-amber-600 bg-amber-50 border-amber-200",
  priority: "text-purple-600 bg-purple-50 border-purple-200",
  reduction: "text-emerald-600 bg-emerald-50 border-emerald-200",
  format: "text-indigo-600 bg-indigo-50 border-indigo-200",
};

export default function ModalityAnalyticsPanel() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ModalityStats[]>([]);
  const [insights, setInsights] = useState<ModalityInsight[]>([]);
  const [blueprint, setBlueprint] = useState<AdaptiveBlueprint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      const [data, bp] = await Promise.all([
        fetchUserModalityStats(user.id),
        generateAdaptiveBlueprint(user.id),
      ]);
      setStats(data);
      setInsights(generateModalityInsights(data));
      setBlueprint(bp);
      setLoading(false);
    })();
  }, [user?.id]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader><CardTitle className="text-lg">Carregando analytics...</CardTitle></CardHeader>
        <CardContent><div className="h-48 bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  const totalAll = stats.reduce((a, s) => a + s.totalQuestions, 0);
  if (totalAll === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Eye className="h-5 w-5" /> Analytics por Modalidade</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Complete pelo menos um simulado para ver seus analytics por modalidade.</p>
        </CardContent>
      </Card>
    );
  }

  // Aggregations
  const imageStats = stats.filter(s => s.mode === "image");
  const textStats = stats.filter(s => s.mode === "text");
  const fallbackStats = stats.filter(s => s.mode === "fallback_text");

  const imageTotal = imageStats.reduce((a, s) => a + s.totalQuestions, 0);
  const textTotal = textStats.reduce((a, s) => a + s.totalQuestions, 0);
  const fallbackTotal = fallbackStats.reduce((a, s) => a + s.totalQuestions, 0);

  const imageCorrect = imageStats.reduce((a, s) => a + s.correctCount, 0);
  const textCorrect = textStats.reduce((a, s) => a + s.correctCount, 0);

  const imageAcc = imageTotal > 0 ? Math.round((imageCorrect / imageTotal) * 100) : 0;
  const textAcc = textTotal > 0 ? Math.round((textCorrect / textTotal) * 100) : 0;

  const barData = imageStats
    .filter(s => s.totalQuestions >= 1)
    .map(s => ({
      name: MODALITY_LABELS[s.imageType || ""] || s.imageType || "Outro",
      acerto: s.accuracyPercent,
      total: s.totalQuestions,
      tempo: s.avgResponseTime,
      color: MODALITY_COLORS[s.imageType || ""] || "#6b7280",
    }))
    .sort((a, b) => b.acerto - a.acerto);

  const pieData = [
    { name: "Com Imagem", value: imageTotal, color: MODE_COLORS.image },
    { name: "Textual", value: textTotal, color: MODE_COLORS.text },
    ...(fallbackTotal > 0 ? [{ name: "Fallback", value: fallbackTotal, color: MODE_COLORS.fallback_text }] : []),
  ].filter(d => d.value > 0);

  const bpSummary = blueprint ? getBlueprintSummary(blueprint) : null;

  // Merge insights from analytics + adaptive engine
  const allInsights: { type: string; message: string }[] = [
    ...insights.map(i => ({ type: i.type, message: i.message })),
    ...(blueprint?.insights || []).map(i => ({ type: i.type, message: i.message })),
  ];

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totalAll}</p>
            <p className="text-xs text-muted-foreground">Questões Analisadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Image className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold">{imageAcc}%</p>
            <p className="text-xs text-muted-foreground">Acerto Imagem</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 mx-auto mb-1 text-gray-500" />
            <p className="text-2xl font-bold">{textAcc}%</p>
            <p className="text-xs text-muted-foreground">Acerto Texto</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold">{bpSummary?.imagePercent ?? 20}%</p>
            <p className="text-xs text-muted-foreground">Imagem Adaptativo</p>
          </CardContent>
        </Card>
      </div>

      {/* Adaptive Priority Card */}
      {bpSummary && bpSummary.topPriorities.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              Motor Adaptativo — Próximo Simulado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {bpSummary.topPriorities.map((p) => (
                <Badge
                  key={p.modality}
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: MODALITY_COLORS[p.modality] || "#6b7280" }}
                >
                  {p.label}: {Math.round(p.score * 100)}%
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              O motor adaptativo ajusta automaticamente a composição do simulado com base no seu desempenho por modalidade.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {barData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Acerto por Modalidade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number, name: string) => name === "acerto" ? [`${value}%`, "Acerto"] : [value, name]} />
                  <Bar dataKey="acerto" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição Imagem vs Texto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Per-modality Detail */}
      {imageStats.filter(s => s.totalQuestions >= 1).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" /> Detalhamento por Modalidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {imageStats
                .filter(s => s.totalQuestions >= 1)
                .sort((a, b) => b.totalQuestions - a.totalQuestions)
                .map((s) => {
                  const label = MODALITY_LABELS[s.imageType || ""] || s.imageType || "Outro";
                  const color = MODALITY_COLORS[s.imageType || ""] || "#6b7280";
                  const priority = blueprint?.modalitiesPriority[s.imageType || ""];
                  return (
                    <div key={s.imageType} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">
                            {label}
                            {priority && priority.difficultyAdjustment && (
                              <Badge variant="outline" className="ml-2 text-[10px] py-0">
                                {priority.difficultyAdjustment === "dificil" ? "↑ difícil" : priority.difficultyAdjustment === "intermediario" ? "→ médio" : ""}
                              </Badge>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {s.correctCount}/{s.totalQuestions} ({s.accuracyPercent}%) · {s.avgResponseTime}s
                          </span>
                        </div>
                        <Progress value={s.accuracyPercent} className="h-2" />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {allInsights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" /> Insights Automáticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allInsights.map((insight, idx) => {
                const Icon = INSIGHT_ICONS[insight.type] || Info;
                const colorClass = INSIGHT_COLORS[insight.type] || INSIGHT_COLORS.info;
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 p-3 rounded-lg border ${colorClass}`}
                  >
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{insight.message}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
