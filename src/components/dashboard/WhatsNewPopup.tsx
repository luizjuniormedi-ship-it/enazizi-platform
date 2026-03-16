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

const CURRENT_VERSION = "3.3.0";
const STORAGE_KEY = "enazizi_last_seen_version";

interface UpdateItem {
  icon: "sparkles" | "check" | "rocket";
  title: string;
  description: string;
}

const updates: UpdateItem[] = [
  {
    icon: "rocket",
    title: "Dificuldade nos Simulados",
    description:
      "Escolha entre Fácil, Intermediário, Difícil ou Misto ao criar simulados. A IA adapta a complexidade dos casos clínicos ao nível selecionado.",
  },
  {
    icon: "sparkles",
    title: "Cronômetro Configurável nos Simulados",
    description:
      "Defina tempo por questão (30s a 5min) com contagem regressiva visual. Alerta vermelho nos últimos 60 segundos e auto-submit ao zerar.",
  },
  {
    icon: "rocket",
    title: "Modo Sprint — Flashcards Cronometrados",
    description:
      "Revise flashcards contra o relógio! Escolha quantidade e tempo, receba estatísticas detalhadas (acertos, erros, pulados) ao final.",
  },
  {
    icon: "sparkles",
    title: "Quick Actions Expandidos",
    description:
      "Gerador de Questões e Flashcards agora cobrem 20+ especialidades: GO, Emergência, Preventiva, Endócrino, Reumato, Psiquiatria, Hematologia e mais.",
  },
  {
    icon: "check",
    title: "XP nas Questões Interativas",
    description:
      "Responda questões no chat dos agentes e ganhe XP automaticamente! Acertos valem +15 XP, tentativas +5 XP. Erros são salvos no Caderno de Erros.",
  },
  {
    icon: "check",
    title: "Simulados Salvos com Relatório por Área",
    description:
      "Todas as sessões de simulado são salvas com gráfico de desempenho por especialidade e caderno de erros detalhado para revisão.",
  },
  {
    icon: "rocket",
    title: "Exam Simulator Aprimorado",
    description:
      "Pool de até 1000 questões do banco, filtro por dificuldade e botão 'Estudar com Tutor IA' para cada erro no relatório final.",
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
