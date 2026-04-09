import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RotateCw, FileSearch, ListChecks, Bug } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AlertActionsProps {
  alertType: string;
  runId: string | null;
  details: any;
}

export default function AlertActions({ alertType, runId, details }: AlertActionsProps) {
  const queryClient = useQueryClient();
  const [showDetails, setShowDetails] = useState(false);

  const rerunMutation = useMutation({
    mutationFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await supabase.functions.invoke("auto-generate-image-questions", {
        body: { manual: true, limit: 5 },
      });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-runs"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-alerts"] });
      toast.success("Nova execução iniciada");
    },
    onError: (e: any) => toast.error(`Erro ao reexecutar: ${e.message}`),
  });

  const [runDetails, setRunDetails] = useState<any>(null);
  const [loadingRun, setLoadingRun] = useState(false);

  const openRun = async () => {
    if (!runId) return;
    setLoadingRun(true);
    const { data } = await supabase
      .from("question_generation_runs" as any)
      .select("*")
      .eq("id", runId)
      .single();
    setRunDetails(data);
    setShowDetails(true);
    setLoadingRun(false);
  };

  const [eligibleAssets, setEligibleAssets] = useState<any[]>([]);
  const [showAssets, setShowAssets] = useState(false);

  const viewEligibleAssets = async () => {
    const { data } = await supabase
      .from("medical_image_assets" as any)
      .select("id, image_type, diagnosis, clinical_confidence, review_status")
      .eq("is_active", true)
      .eq("review_status", "published")
      .order("clinical_confidence", { ascending: false })
      .limit(20);
    setEligibleAssets((data as any) || []);
    setShowAssets(true);
  };

  return (
    <>
      <div className="flex items-center gap-1 mt-1">
        {alertType === "run_failed" && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-5 text-[10px] gap-1 px-1.5"
              onClick={() => rerunMutation.mutate()}
              disabled={rerunMutation.isPending}
            >
              <RotateCw className="h-3 w-3" />
              Rerun
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-5 text-[10px] gap-1 px-1.5"
              onClick={openRun}
              disabled={!runId || loadingRun}
            >
              <FileSearch className="h-3 w-3" />
              Abrir run
            </Button>
          </>
        )}

        {alertType === "run_sterile" && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-5 text-[10px] gap-1 px-1.5"
              onClick={viewEligibleAssets}
            >
              <ListChecks className="h-3 w-3" />
              Assets elegíveis
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-5 text-[10px] gap-1 px-1.5"
              onClick={openRun}
              disabled={!runId || loadingRun}
            >
              <FileSearch className="h-3 w-3" />
              Abrir run
            </Button>
          </>
        )}

        {alertType === "partial_failure" && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-5 text-[10px] gap-1 px-1.5"
              onClick={openRun}
              disabled={!runId || loadingRun}
            >
              <FileSearch className="h-3 w-3" />
              Ver run
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-5 text-[10px] gap-1 px-1.5"
              onClick={() => { setShowDetails(true); setRunDetails(details); }}
            >
              <Bug className="h-3 w-3" />
              Inspecionar
            </Button>
          </>
        )}
      </div>

      {/* Run / Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Detalhes</DialogTitle>
          </DialogHeader>
          <pre className="text-[11px] bg-muted/50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(runDetails, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>

      {/* Eligible Assets Dialog */}
      <Dialog open={showAssets} onOpenChange={setShowAssets}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Assets Elegíveis ({eligibleAssets.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {eligibleAssets.map((a: any) => (
              <div key={a.id} className="flex items-center gap-2 text-[11px] p-1.5 rounded bg-muted/30">
                <span className="font-medium">{a.image_type}</span>
                <span className="text-muted-foreground flex-1 truncate">{a.diagnosis}</span>
                <span className="text-muted-foreground/60">{(a.clinical_confidence * 100).toFixed(0)}%</span>
              </div>
            ))}
            {eligibleAssets.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum asset elegível encontrado.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
