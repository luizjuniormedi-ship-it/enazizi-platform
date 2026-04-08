import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Play, CheckCircle2, AlertTriangle, BarChart3, RefreshCw, RotateCcw, Globe } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  upgrading: { label: "Processando", color: "bg-yellow-500/20 text-yellow-400" },
  upgraded: { label: "Atualizada", color: "bg-blue-500/20 text-blue-400" },
  needs_review: { label: "Aguardando Revisão", color: "bg-orange-500/20 text-orange-400" },
  published: { label: "Publicada", color: "bg-green-500/20 text-green-400" },
  rejected: { label: "Rejeitada", color: "bg-destructive/20 text-destructive" },
};

interface StatsData {
  counts: Record<string, number>;
  total: number;
  fail_rate_pct: string;
  recent_errors: Array<{ question_id: string; reason: string; created_at: string }>;
}

export default function ImageQuestionUpgradePanel() {
  const queryClient = useQueryClient();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isSearchingReal, setIsSearchingReal] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const { data: stats, isLoading, isError, error: statsError } = useQuery({
    queryKey: ["image-question-stats"],
    queryFn: async (): Promise<StatsData> => {
      const { data, error } = await supabase.functions.invoke("upgrade-image-questions", {
        body: { action: "stats" },
      });
      if (error) throw new Error(error.message || "Erro ao buscar estatísticas");
      if (!data || !data.counts) throw new Error("Resposta inválida do servidor");
      return data as StatsData;
    },
    refetchInterval: isUpgrading ? 5000 : 30000,
    retry: 2,
    retryDelay: 3000,
  });

  const refresh = () => {
    setLastError(null);
    queryClient.invalidateQueries({ queryKey: ["image-question-stats"] });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("image-pipeline-updated"));
    }
  };

  const invokeAction = async (action: string, body: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("upgrade-image-questions", {
      body: { action, ...body },
    });
    if (error) throw new Error(error.message || "Erro na chamada");
    if (!data) throw new Error("Resposta vazia");
    return data;
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    setLastError(null);
    try {
      const data = await invokeAction("upgrade", { batch_size: 3 });
      const msg = `Lote processado: ${data.upgraded || 0} aprovadas, ${data.rejected || 0} rejeitadas, ${data.failed || 0} falhas`;
      (data.failed || 0) > 0 ? toast.warning(msg) : toast.success(msg);
    } catch (err: any) {
      setLastError(err.message);
      toast.error(`Erro no upgrade: ${err.message}`);
    }
    setIsUpgrading(false);
    refresh();
  };

  const handlePublishAll = async () => {
    setIsPublishing(true);
    setLastError(null);
    try {
      const data = await invokeAction("publish_all");
      toast.success(`Publicação: ${data.published || 0} publicadas, ${data.rejected || 0} rejeitadas`);
    } catch (err: any) {
      setLastError(err.message);
      toast.error(`Erro na publicação: ${err.message}`);
    }
    setIsPublishing(false);
    refresh();
  };

  const handleRetryRejected = async () => {
    setIsRetrying(true);
    setLastError(null);
    try {
      const data = await invokeAction("retry_rejected", { batch_size: 20 });
      toast.success(`${data.reset || 0} questões rejeitadas voltaram para draft para reprocessamento`);
    } catch (err: any) {
      setLastError(err.message);
      toast.error(`Erro: ${err.message}`);
    }
    setIsRetrying(false);
    refresh();
  };

  const handleSearchRealImages = async (imageType: string) => {
    setIsSearchingReal(true);
    setLastError(null);
    try {
      const { data, error } = await supabase.functions.invoke("search-real-medical-images", {
        body: { image_type: imageType, batch_mode: true, batch_size: 3 },
      });
      if (error) throw new Error(error.message);
      const found = data?.results?.filter((r: any) => r.status === "found").length || 0;
      const notFound = data?.results?.filter((r: any) => r.status === "not_found").length || 0;
      if (found > 0) {
        toast.success(`🟢 ${found} imagens reais encontradas! ${notFound > 0 ? `(${notFound} sem resultado)` : ""}`);
      } else {
        toast.warning("Nenhuma imagem real encontrada neste lote");
      }
    } catch (err: any) {
      setLastError(err.message);
      toast.error(`Erro na busca: ${err.message}`);
    }
    setIsSearchingReal(false);
    refresh();
  };

  const counts = stats?.counts || {};
  const total = stats?.total || 0;
  const publishedPct = total > 0 ? ((counts.published || 0) / total * 100) : 0;
  const hasDrafts = (counts.draft || 0) > 0;
  const hasNeedsReview = (counts.needs_review || 0) > 0;
  const hasRejected = (counts.rejected || 0) > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Pipeline de Questões com Imagem
        </h2>
        <Button variant="ghost" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {(isError || lastError) && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive font-medium">
                {lastError || (statsError as Error)?.message || "Erro ao carregar dados"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={refresh}>Tentar novamente</Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando estatísticas...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
              <Card key={key} className="border-border">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <Badge className={`text-xs ${color}`}>{counts[key] || 0}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso geral</span>
                <span className="text-muted-foreground">{publishedPct.toFixed(1)}% publicadas</span>
              </div>
              <Progress value={publishedPct} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{counts.draft || 0} na fila</span>
                <span>Taxa de falha: {stats?.fail_rate_pct || "0"}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                onClick={handleUpgrade}
                disabled={isUpgrading || !hasDrafts}
                className="w-full"
              >
                {isUpgrading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
                ) : (
                  <><Play className="h-4 w-4 mr-2" /> Upgrade Lote ({counts.draft || 0})</>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handlePublishAll}
                disabled={isPublishing || !hasNeedsReview}
                className="w-full"
              >
                {isPublishing ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Publicando...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 mr-2" /> Publicar Revisadas ({counts.needs_review || 0})</>
                )}
              </Button>
            </div>

            {hasRejected && (
              <Button
                variant="secondary"
                onClick={handleRetryRejected}
                disabled={isRetrying}
                className="w-full"
              >
                {isRetrying ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Reprocessando...</>
                ) : (
                  <><RotateCcw className="h-4 w-4 mr-2" /> Reprocessar Rejeitadas ({counts.rejected || 0})</>
                )}
              </Button>
            )}
          </div>

          {stats?.recent_errors && stats.recent_errors.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Erros Recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-1">
                {stats.recent_errors.slice(0, 5).map((e, i) => (
                  <div key={i} className="text-xs text-muted-foreground flex justify-between">
                    <span className="truncate max-w-[70%]">{e.reason}</span>
                    <span>{new Date(e.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
