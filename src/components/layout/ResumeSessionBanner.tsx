import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumeSessionBannerProps {
  updatedAt: string;
  onResume: () => void;
  onDiscard: () => void;
}

const ResumeSessionBanner = ({ updatedAt, onResume, onDiscard }: ResumeSessionBannerProps) => {
  const timeAgo = formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: ptBR });

  return (
    <div className="mb-4 p-3 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-2 text-sm">
        <History className="h-4 w-4 text-primary shrink-0" />
        <span>
          Sessão em andamento <span className="text-muted-foreground">(salva {timeAgo})</span>
        </span>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" variant="default" onClick={onResume} className="gap-1.5 h-8">
          <Play className="h-3.5 w-3.5" /> Continuar
        </Button>
        <Button size="sm" variant="ghost" onClick={onDiscard} className="gap-1.5 h-8 text-muted-foreground">
          <X className="h-3.5 w-3.5" /> Descartar
        </Button>
      </div>
    </div>
  );
};

export default ResumeSessionBanner;
