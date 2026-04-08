/**
 * Painel de Integridade Clínica — Assets de Imagem Médica
 * Mostra métricas de qualidade e bloqueios do acervo multimodal.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, ShieldAlert, ImageIcon } from "lucide-react";

interface IntegrityRow {
  image_type: string;
  review_status: string;
  total: number;
  unique_images: number;
  avg_confidence: number;
  is_active: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  ecg: "ECG", xray: "Raio-X", ct: "TC", mri: "RM",
  us: "US", dermatology: "Dermato", pathology: "Patologia",
  ophthalmology: "Oftalmo", endoscopy: "Endoscopia",
  obstetric_trace: "CTG",
};

const STATUS_COLORS: Record<string, string> = {
  published: "bg-green-100 text-green-800",
  needs_review: "bg-yellow-100 text-yellow-800",
  blocked_clinical: "bg-red-100 text-red-800",
  experimental_only: "bg-orange-100 text-orange-800",
  validated: "bg-blue-100 text-blue-800",
  draft: "bg-gray-100 text-gray-800",
};

export default function ImageIntegrityPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["image-integrity"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_image_integrity_summary");
      if (error) throw error;
      return data as IntegrityRow[];
    },
  });

  // Fallback: query direta se RPC não existir
  const { data: fallbackData } = useQuery({
    queryKey: ["image-integrity-fallback"],
    enabled: !data,
    queryFn: async () => {
      const { data: raw } = await (supabase as any)
        .from("medical_image_assets")
        .select("image_type, review_status, is_active, clinical_confidence, image_url");
      if (!raw) return [];

      const groups: Record<string, IntegrityRow> = {};
      for (const r of raw as any[]) {
        const key = `${r.image_type}-${r.review_status}`;
        if (!groups[key]) {
          groups[key] = {
            image_type: r.image_type,
            review_status: r.review_status,
            total: 0,
            unique_images: 0,
            avg_confidence: 0,
            is_active: r.is_active,
          };
        }
        groups[key].total++;
        groups[key].avg_confidence += Number(r.clinical_confidence || 0);
      }
      return Object.values(groups).map(g => ({
        ...g,
        avg_confidence: g.total > 0 ? +(g.avg_confidence / g.total).toFixed(2) : 0,
      }));
    },
  });

  const rows = data || fallbackData || [];
  const totalAssets = rows.reduce((s, r) => s + r.total, 0);
  const blocked = rows.filter(r => r.review_status === "blocked_clinical").reduce((s, r) => s + r.total, 0);
  const published = rows.filter(r => r.review_status === "published").reduce((s, r) => s + r.total, 0);
  const needsReview = rows.filter(r => r.review_status === "needs_review").reduce((s, r) => s + r.total, 0);

  if (isLoading) return <div className="p-4 text-muted-foreground">Carregando integridade...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <ShieldAlert className="h-5 w-5" /> Painel de Integridade Clínica
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <ImageIcon className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{totalAssets}</div>
            <div className="text-xs text-muted-foreground">Total de Assets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-1 text-green-600" />
            <div className="text-2xl font-bold text-green-700">{published}</div>
            <div className="text-xs text-muted-foreground">Publicados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-yellow-600" />
            <div className="text-2xl font-bold text-yellow-700">{needsReview}</div>
            <div className="text-xs text-muted-foreground">Em Revisão</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <ShieldAlert className="h-6 w-6 mx-auto mb-1 text-red-600" />
            <div className="text-2xl font-bold text-red-700">{blocked}</div>
            <div className="text-xs text-muted-foreground">Bloqueados</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Detalhamento por Tipo</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(
              rows.reduce((acc, r) => {
                if (!acc[r.image_type]) acc[r.image_type] = [];
                acc[r.image_type].push(r);
                return acc;
              }, {} as Record<string, IntegrityRow[]>)
            ).map(([type, items]) => (
              <div key={type} className="flex items-center justify-between p-2 rounded border">
                <span className="font-medium text-sm">{TYPE_LABELS[type] || type}</span>
                <div className="flex items-center gap-2">
                  {items.map((item, i) => (
                    <Badge key={i} className={`text-xs ${STATUS_COLORS[item.review_status] || ""}`}>
                      {item.review_status}: {item.total} (conf: {item.avg_confidence})
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
