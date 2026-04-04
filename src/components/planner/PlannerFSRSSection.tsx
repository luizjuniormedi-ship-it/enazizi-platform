import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";

interface FsrsCard {
  id: string;
  card_ref_id: string;
  card_type: string;
  due: string;
  stability: number;
  difficulty: number;
  state: number;
  reps: number;
  lapses: number;
}

interface Props {
  cards: FsrsCard[];
}

function categorizeCards(cards: FsrsCard[]) {
  const now = new Date();
  const critical: FsrsCard[] = [];
  const near: FsrsCard[] = [];
  const light: FsrsCard[] = [];

  for (const card of cards) {
    const due = new Date(card.due);
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue < 0 || card.stability < 5 || card.lapses >= 3) {
      critical.push(card);
    } else if (hoursUntilDue < 48 || card.stability < 15) {
      near.push(card);
    } else {
      light.push(card);
    }
  }

  return { critical, near, light };
}

export default function PlannerFSRSSection({ cards }: Props) {
  const { critical, near, light } = categorizeCards(cards);

  if (cards.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/60 p-3 space-y-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
        <RefreshCw className="h-3 w-3" /> Motor de Revisão (FSRS)
      </p>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-3.5 w-3.5 mx-auto mb-1 text-red-600" />
          <p className="text-lg font-bold text-red-600">{critical.length}</p>
          <p className="text-[9px] text-red-600/80">Revisão Crítica</p>
          <p className="text-[8px] text-muted-foreground">Risco alto de esquecimento</p>
        </div>

        <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <RefreshCw className="h-3.5 w-3.5 mx-auto mb-1 text-amber-600" />
          <p className="text-lg font-bold text-amber-600">{near.length}</p>
          <p className="text-[9px] text-amber-600/80">Revisão Próxima</p>
          <p className="text-[8px] text-muted-foreground">Revisar em até 48h</p>
        </div>

        <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5 mx-auto mb-1 text-emerald-600" />
          <p className="text-lg font-bold text-emerald-600">{light.length}</p>
          <p className="text-[9px] text-emerald-600/80">Revisão Leve</p>
          <p className="text-[8px] text-muted-foreground">Sob controle</p>
        </div>
      </div>
    </div>
  );
}
