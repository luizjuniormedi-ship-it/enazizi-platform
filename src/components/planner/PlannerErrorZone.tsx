import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ErrorEntry {
  id: string;
  tema: string;
  subtema?: string | null;
  vezes_errado: number;
  categoria_erro?: string | null;
  motivo_erro?: string | null;
}

interface Props {
  errors: ErrorEntry[];
}

export default function PlannerErrorZone({ errors }: Props) {
  const navigate = useNavigate();

  if (errors.length === 0) return null;

  const criticalErrors = errors.filter(e => e.vezes_errado >= 3);
  const recentErrors = errors.filter(e => e.vezes_errado < 3).slice(0, 3);

  return (
    <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold flex items-center gap-1.5 text-red-700 dark:text-red-400">
          <Flame className="h-3.5 w-3.5" /> Zona de Erro Ativo
        </p>
        <Badge variant="destructive" className="text-[9px]">
          {errors.length} erro{errors.length > 1 ? "s" : ""}
        </Badge>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Erros recentes não dominados. O planner prioriza automaticamente esses temas.
      </p>

      {criticalErrors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] uppercase tracking-wide text-red-600 font-medium">Críticos ({criticalErrors.length})</p>
          {criticalErrors.slice(0, 3).map(e => (
            <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg bg-red-100/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium truncate">{e.tema}</p>
                {e.subtema && <p className="text-[9px] text-muted-foreground">{e.subtema}</p>}
              </div>
              <Badge variant="destructive" className="text-[8px] shrink-0">{e.vezes_errado}x</Badge>
            </div>
          ))}
        </div>
      )}

      {recentErrors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] uppercase tracking-wide text-amber-600 font-medium">Recentes ({recentErrors.length})</p>
          {recentErrors.map(e => (
            <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium truncate">{e.tema}</p>
              </div>
              <Badge variant="outline" className="text-[8px] shrink-0 border-amber-300">{e.vezes_errado}x</Badge>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => navigate("/dashboard/banco-erros")}>
        Ver Banco de Erros Completo <ArrowRight className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
}
