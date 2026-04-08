import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Play, CheckCircle2, AlertTriangle, BarChart3, RefreshCw } from "lucide-react";
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
  const [lastError, setLastError] = useState<string | null>(null);

  const { data: stats, isLoading, isError, error: statsError } = useQuery({
    queryKey: ["image-question-stats"],
    queryFn: async (): Promise<StatsData> => {
      try {
        const { data, error } = await supabase.functions.invoke("upgrade-image-questions", {
          body: { action: "stats" },
        });
        if (error) throw new Error(error.message || "Erro ao buscar estatísticas");
        if (!data || !data.counts) throw new Error("Resposta inválida do servidor");
        return data as StatsData;
      } catch (e: any) {
        console.warn("[ImageQuestionUpgradePanel] Stats error:", e);
        throw e;
      }
    },
    refetchInterval: isUpgrading ? 5000 : 30000,
    retry: 2,
    retryDelay: 3000,
  });

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      setIsUpgrading(true);
      setLastError(null);
      const { data, error } = await supabase.functions.invoke("upgrade-image-questions", {
        body: { action: "upgrade", batch_size: 3 },
      });
      if (error) throw new Error(error.message || "Erro na chamada da função");
      if (!data) throw new Error("Resposta vazia do servidor");
      return data;
    },
    onSuccess: (data) => {
      setIsUpgrading(false);
      queryClient.invalidateQueries({ queryKey: ["image-question-stats"] });
      const msg = `Lote processado: ${data.upgraded || 0} aprovadas, ${data.rejected || 0} rejeitadas, ${data.failed || 0} falhas`;
      if ((data.failed || 0) > 0) {
        toast.warning(msg);
      } else {
        toast.success(msg);
      }
    },
    onError: (err: any) => {
      setIsUpgrading(false);
      const msg = err?.message || "Erro desconhecido no upgrade";
      setLastError(msg);
      toast.error(`Erro no upgrade: ${msg}`);
    },
  });

  const publishAllMutation = useMutation({
    mutationFn: async () => {
      setIsPublishing(true);
      setLastError(null);
      const { data, error } = await supabase.functions.invoke("upgrade-image-questions", {
        body: { action: "publish_all" },
      });
      if (error) throw new Error(error.message || "Erro na publicação");
      if (!data) throw new Error("Resposta vazia do servidor");
      return data;
    },
    onSuccess: (data) => {
      setIsPublishing(false);
      queryClient.invalidateQueries({ queryKey: ["image-question-stats"] });
      toast.success(`Publicação: ${data.published || 0} publicadas, ${data.rejected || 0} rejeitadas`);
    },
    onError: (err: any) => {
      setIsPublishing(false);
      const msg = err?.message || "Erro desconhecido na publicação";
      setLastError(msg);
      toast.error(`Erro na publicação: ${msg}`);
    },
  });

  const counts = stats?.counts || {};
  const total = stats?.total || 0;
  const publishedPct = total > 0 ? ((counts.published || 0) / total * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Pipeline de Questões com Imagem
        </h2>
        <Button
          variant="ghost" size="sm"
          onClick={() => {
            setLastError(null);
            queryClient.invalidateQueries({ queryKey: ["image-question-stats"] });
          }}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Error banner */}
      {(isError || lastError) && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive font-medium">
                {lastError || (statsError as Error)?.message || "Erro ao carregar dados"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                O painel continua funcional. Tente novamente.
              </p>
            </div>
            <Button
              variant="outline" size="sm"
              onClick={() => {
                setLastError(null);
                queryClient.invalidateQueries({ queryKey: ["image-question-stats"] });
              }}
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando estatísticas...
        </div>
      ) : (
        <>
          {/* Status cards */}
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

          {/* Progress bar */}
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
          <div className="flex gap-3">
            <Button
              onClick={() => upgradeMutation.mutate()}
              disabled={isUpgrading || (counts.draft || 0) === 0}
              className="flex-1"
            >
              {isUpgrading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" /> Upgrade Lote (3)</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => publishAllMutation.mutate()}
              disabled={isPublishing || (counts.needs_review || 0) === 0}
              className="flex-1"
            >
              {isPublishing ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Publicando...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Publicar Revisadas ({counts.needs_review || 0})</>
              )}
            </Button>
          </div>

          {/* Recent errors */}
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
