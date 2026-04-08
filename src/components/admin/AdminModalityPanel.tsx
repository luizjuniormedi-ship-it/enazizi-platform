/**
 * Painel admin de analytics por modalidade — cobertura, fallback, qualidade do acervo.
 */

import { useEffect, useState } from "react";
import {
  fetchAdminModalityCoverage,
  detectQualityAlerts,
  type AdminModalityCoverage,
  type QualityAlert,
} from "@/lib/modalityAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Image, BarChart3,
} from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  ecg: "ECG", xray: "Raio-X", dermatology: "Dermato",
  ct: "TC", us: "US", pathology: "Patologia", ophthalmology: "Oftalmo",
};

const TYPE_COLORS: Record<string, string> = {
  ecg: "#ef4444", xray: "#3b82f6", dermatology: "#f59e0b",
  ct: "#8b5cf6", us: "#06b6d4", pathology: "#10b981", ophthalmology: "#ec4899",
};

export default function AdminModalityPanel() {
  const [coverage, setCoverage] = useState<AdminModalityCoverage[]>([]);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchAdminModalityCoverage();
      setCoverage(data);
      setAlerts(detectQualityAlerts(data));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader><CardTitle>Carregando cobertura multimodal...</CardTitle></CardHeader>
        <CardContent><div className="h-64 bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  const totalAssets = coverage.reduce((a, c) => a + c.totalAssets, 0);
  const totalPublished = coverage.reduce((a, c) => a + c.publishedAssets, 0);
  const totalQuestions = coverage.reduce((a, c) => a + c.publishedQuestions, 0);
  const globalCoverage = totalAssets > 0 ? Math.round((totalPublished / totalAssets) * 100) : 0;

  const barData = coverage.map(c => ({
    name: TYPE_LABELS[c.imageType] || c.imageType,
    cobertura: c.coveragePercent,
    acerto: c.avgStudentAccuracy,
    fallback: c.fallbackRate,
    color: TYPE_COLORS[c.imageType] || "#6b7280",
  }));

  return (
    <div className="space-y-4">
      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Image className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totalAssets}</p>
            <p className="text-xs text-muted-foreground">Assets Totais</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold">{totalPublished}</p>
            <p className="text-xs text-muted-foreground">Assets Publicados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold">{totalQuestions}</p>
            <p className="text-xs text-muted-foreground">Questões Publicadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold">{globalCoverage}%</p>
            <p className="text-xs text-muted-foreground">Cobertura Global</p>
          </CardContent>
        </Card>
      </div>

      {/* Coverage by Type */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Cobertura por Especialidade</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="cobertura" name="Cobertura" radius={[4, 4, 0, 0]}>
                {barData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Detalhamento por Modalidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Modalidade</th>
                  <th className="p-2 text-center">Assets</th>
                  <th className="p-2 text-center">Publicados</th>
                  <th className="p-2 text-center">Bloqueados</th>
                  <th className="p-2 text-center">Questões</th>
                  <th className="p-2 text-center">Cobertura</th>
                  <th className="p-2 text-center">Acerto Médio</th>
                  <th className="p-2 text-center">Fallback</th>
                </tr>
              </thead>
              <tbody>
                {coverage.map((c) => (
                  <tr key={c.imageType} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: TYPE_COLORS[c.imageType] || "#6b7280" }}
                      />
                      {TYPE_LABELS[c.imageType] || c.imageType}
                    </td>
                    <td className="p-2 text-center">{c.totalAssets}</td>
                    <td className="p-2 text-center text-green-600 font-medium">{c.publishedAssets}</td>
                    <td className="p-2 text-center text-red-600">{c.blockedAssets}</td>
                    <td className="p-2 text-center">{c.publishedQuestions}</td>
                    <td className="p-2 text-center">
                      <div className="flex items-center gap-2">
                        <Progress value={c.coveragePercent} className="h-2 flex-1" />
                        <span className="text-xs w-8">{c.coveragePercent}%</span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      {c.avgStudentAccuracy > 0 ? `${c.avgStudentAccuracy}%` : "—"}
                    </td>
                    <td className="p-2 text-center">
                      {c.fallbackRate > 30 ? (
                        <Badge variant="destructive" className="text-xs">{c.fallbackRate}%</Badge>
                      ) : c.fallbackRate > 0 ? (
                        <Badge variant="secondary" className="text-xs">{c.fallbackRate}%</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">0%</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quality Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Alertas de Qualidade do Acervo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-3 rounded-lg border ${
                    alert.severity === "critical"
                      ? "bg-red-50 border-red-200 text-red-700"
                      : alert.severity === "warning"
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-blue-50 border-blue-200 text-blue-700"
                  }`}
                >
                  {alert.severity === "critical" ? (
                    <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <p className="text-sm">{alert.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
