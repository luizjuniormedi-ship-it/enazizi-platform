import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, Rocket } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const CURRENT_VERSION = "6.0.0";
const STORAGE_KEY = "enazizi_last_seen_version_v2";

interface UpdateItem {
  icon: "sparkles" | "check" | "rocket";
  title: string;
  description: string;
}

const updates: UpdateItem[] = [
  {
    icon: "rocket",
    title: "🆕 Crônicas Médicas — Mente de Residente",
    description:
      "Novo módulo! Aprenda medicina através de narrativas clínicas imersivas. Você é o médico no plantão: enfrente armadilhas diagnósticas, tome decisões sob pressão e responda questões de prova ao final.",
  },
  {
    icon: "sparkles",
    title: "Barra de Progresso nas Crônicas",
    description:
      "Acompanhe visualmente em qual etapa da crônica você está: Cenário → Raciocínio → Armadilha → Diferencial → Questão.",
  },
  {
    icon: "check",
    title: "Ações Rápidas nas Crônicas",
    description:
      "Use botões como '🔥 Nível Extremo', '🔬 Aprofundar' e '⚖️ Diferenciais' para personalizar sua experiência de aprendizado.",
  },
  {
    icon: "rocket",
    title: "Favoritos e Histórico de Crônicas",
    description:
      "Salve suas crônicas favoritas com ❤️ e acesse o histórico completo de casos clínicos estudados.",
  },
  {
    icon: "sparkles",
    title: "Aba de Feedbacks no Admin",
    description:
      "Administradores agora visualizam todas as avaliações dos usuários com notas por módulo, NPS e comentários.",
  },
];
const iconMap = {
  sparkles: Sparkles,
  check: CheckCircle2,
  rocket: Rocket,
};

const WhatsNewPopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const lastSeen = localStorage.getItem(STORAGE_KEY);
    if (lastSeen !== CURRENT_VERSION) {
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogContent className="sm:max-w-md border-primary/20">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Novidades 🎉</DialogTitle>
              <DialogDescription className="text-xs">
                Versão {CURRENT_VERSION} — Veja o que melhorou
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-2">
          <div className="space-y-3 py-2">
            {updates.map((item, i) => {
              const Icon = iconMap[item.icon];
              return (
                <div
                  key={i}
                  className="flex gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/60"
                >
                  <div className="mt-0.5 h-7 w-7 shrink-0 rounded-md bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <Button onClick={handleClose} className="w-full mt-1">
          Entendi, vamos estudar! 🚀
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsNewPopup;
