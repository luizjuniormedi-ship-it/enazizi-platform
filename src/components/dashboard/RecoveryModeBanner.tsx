import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useStudyEngine } from "@/hooks/useStudyEngine";

export default function RecoveryModeBanner() {
  const { adaptive } = useStudyEngine();

  if (!adaptive?.recoveryMode) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/10 shrink-0">
          <Shield className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">
            Modo recuperação ativo
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {adaptive.recoveryReason || "Vamos reorganizar seu plano para você retomar o ritmo."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
