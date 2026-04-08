/**
 * Painel de Integridade Clínica — Assets de Imagem Médica
 * Mostra métricas de qualidade, bloqueios e problemas por especialidade.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, ShieldAlert, ImageIcon, Ban, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface IntegrityRow {
  image_type: string;
  review_status: string;
  total: number;
  unique_images: number;
  avg_confidence: number;
  is_active: boolean;
  integrity_issues: number;
}

const TYPE_LABELS: Record<string, string> = {
  ecg: "ECG", xray: "Raio-X", ct: "Tomografia", mri: "Ressonância",
  us: "Ultrassom", dermatology: "Dermatologia", pathology: "Patologia",
  ophthalmology: "Oftalmologia", endoscopy: "Endoscopia",
  obstetric_trace: "Traçado Fetal",
};

const PHASE_ORDER = ["ecg", "xray", "dermatology", "ct", "us", "ophthalmology", "pathology", "endoscopy", "obstetric_trace", "mri"];

const PHASE_LABELS: Record<number, string> = {
  0: "Fase 1 — Prioridade Máxima",
  3: "Fase 2 — Prioridade Alta",
  6: "Fase 3 — Prioridade Moderada",
};

export default function ImageIntegrityPanel() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["image-integrity-panel"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_image_integrity_summary");
      if (error) {
        // Fallback direto
        const { data: raw } = await (supabase as any)
          .from("medical_image_assets")
          .select("image_type, review_status, is_active, clinical_confidence, image_url, integrity_status");
        if (!raw) return [];
        const groups: Record<string, IntegrityRow> = {};
        const urlSets: Record<string, Set<string>> = {};
        for (const r of raw as any[]) {
          const key = `${r.image_type}-${r.review_status}`;
          if (!groups[key]) {
            groups[key] = { image_type: r.image_type, review_status: r.review_status, total: 0, unique_images: 0, avg_confidence: 0, is_active: r.is_active, integrity_issues: 0 };
            urlSets[key] = new Set();
          }
          groups[key].total++;
          groups[key].avg_confidence += Number(r.clinical_confidence || 0);
          urlSets[key].add(r.image_url);
          if (["mismatch_type", "mismatch_diagnosis", "generic_image", "duplicate_unresolved"].includes(r.integrity_status)) {
            groups[key].integrity_issues++;
          }
        }
        return Object.entries(groups).map(([k, g]) => ({
          ...g,
          unique_images: urlSets[k].size,
          avg_confidence: g.total > 0 ? +(g.avg_confidence / g.total).toFixed(2) : 0,
        }));
      }
      return (data || []) as IntegrityRow[];
    },
  });

  const totalAssets = rows.reduce((s, r) => s + r.total, 0);
  const totalBlocked = rows.filter(r => r.review_status === "blocked_clinical").reduce((s, r) => s + r.total, 0);
  const totalPublished = rows.filter(r => r.review_status === "published").reduce((s, r) => s + r.total, 0);
  const totalNeedsReview = rows.filter(r => r.review_status === "needs_review").reduce((s, r) => s + r.total, 0);
  const totalIssues = rows.reduce((s, r) => s + (r.integrity_issues || 0), 0);

  // Agrupar por tipo
  const byType = rows.reduce((acc, r) => {
    if (!acc[r.image_type]) acc[r.image_type] = [];
    acc[r.image_type].push(r);
    return acc;
  }, {} as Record<string, IntegrityRow[]>);

  if (isLoading) return <div className="p-4 text-muted-foreground">Carregando integridade clínica...</div>;

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <ShieldAlert className="h-6 w-6" /> Painel de Integridade Clínica Multimodal
      </h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard icon={<ImageIcon className="h-5 w-5" />} value={totalAssets} label="Total Assets" />
        <KpiCard icon={<CheckCircle className="h-5 w-5 text-green-600" />} value={totalPublished} label="Publicados" variant="success" />
        <KpiCard icon={<Eye className="h-5 w-5 text-yellow-600" />} value={totalNeedsReview} label="Em Revisão" variant="warning" />
        <KpiCard icon={<Ban className="h-5 w-5 text-red-600" />} value={totalBlocked} label="Bloqueados" variant="danger" />
        <KpiCard icon={<AlertTriangle className="h-5 w-5 text-orange-600" />} value={totalIssues} label="Problemas" variant="danger" />
      </div>

      {/* Barra de saúde geral */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Saúde do Acervo</span>
            <span className="font-mono">{totalAssets > 0 ? Math.round((totalPublished / totalAssets) * 100) : 0}%</span>
          </div>
          <Progress value={totalAssets > 0 ? (totalPublished / totalAssets) * 100 : 0} className="h-3" />
        </CardContent>
      </Card>

      {/* Detalhamento por fase/tipo */}
      {PHASE_ORDER.map((type, idx) => {
        const items = byType[type];
        if (!items) return null;
        const phaseLabel = PHASE_LABELS[idx];
        const typeTotal = items.reduce((s, i) => s + i.total, 0);
        const typeBlocked = items.filter(i => i.review_status === "blocked_clinical").reduce((s, i) => s + i.total, 0);
        const typeIssues = items.reduce((s, i) => s + (i.integrity_issues || 0), 0);
        const typeUniqueImages = items.reduce((s, i) => s + i.unique_images, 0);
        const avgConf = items.reduce((s, i) => s + i.avg_confidence * i.total, 0) / (typeTotal || 1);

        return (
          <div key={type}>
            {phaseLabel && <h3 className="text-sm font-semibold mt-4 mb-2 text-muted-foreground">{phaseLabel}</h3>}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{TYPE_LABELS[type] || type}</span>
                  <div className="flex gap-1">
                    {typeBlocked > 0 && <Badge variant="destructive" className="text-xs">{typeBlocked} bloq.</Badge>}
                    {typeIssues > 0 && <Badge variant="outline" className="text-xs border-orange-400">{typeIssues} problemas</Badge>}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  <Metric label="Assets" value={typeTotal} />
                  <Metric label="Imagens Únicas" value={typeUniqueImages} />
                  <Metric label="Compartilhadas" value={Math.max(0, typeTotal - typeUniqueImages)} alert={typeTotal - typeUniqueImages > 5} />
                  <Metric label="Confiança Média" value={avgConf.toFixed(2)} alert={avgConf < 0.6} />
                  <div className="flex flex-wrap gap-1">
                    {items.map((item, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {item.review_status}: {item.total}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

function KpiCard({ icon, value, label, variant }: { icon: React.ReactNode; value: number; label: string; variant?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 text-center">
        <div className="mx-auto mb-1 flex justify-center">{icon}</div>
        <div className={`text-2xl font-bold ${variant === "success" ? "text-green-700" : variant === "danger" ? "text-red-700" : variant === "warning" ? "text-yellow-700" : ""}`}>
          {value}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, alert }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <div className={`text-center p-1 rounded ${alert ? "bg-red-50 dark:bg-red-950" : ""}`}>
      <div className={`font-bold ${alert ? "text-red-700" : ""}`}>{value}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}
