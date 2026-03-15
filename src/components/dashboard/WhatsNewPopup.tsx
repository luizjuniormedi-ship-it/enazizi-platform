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

const CURRENT_VERSION = "3.0.0";
const STORAGE_KEY = "enazizi_last_seen_version";

interface UpdateItem {
  icon: "sparkles" | "check" | "rocket";
  title: string;
  description: string;
}

const updates: UpdateItem[] = [
  {
    icon: "rocket",
    title: "PWA Completa — Instale no Celular",
    description:
      "O ENAZIZI agora funciona como app nativo! Instale direto do navegador no iOS e Android com suporte offline completo.",
  },
  {
    icon: "sparkles",
    title: "Modo Claro / Escuro",
    description:
      "Novo toggle de tema no dashboard. Alterne entre modo escuro e claro com persistência automática.",
  },
  {
    icon: "check",
    title: "Exportação em PDF",
    description:
      "Exporte seus flashcards e questões do banco em PDF formatado para estudar offline ou imprimir.",
  },
  {
    icon: "rocket",
    title: "Benchmark Comparativo por Especialidade",
    description:
      "Veja seu percentil anônimo em cada especialidade médica comparado com outros alunos da plataforma.",
  },
  {
    icon: "sparkles",
    title: "Conquistas & Ranking com Gamificação",
    description:
      "Sistema de XP, streaks, níveis e ranking semanal para motivar seus estudos diários.",
  },
  {
    icon: "check",
    title: "Modo Plantão — Simulação Clínica",
    description:
      "Simule plantões médicos com casos clínicos interativos e tome decisões em tempo real.",
  },
  {
    icon: "rocket",
    title: "Questões Discursivas com Correção por IA",
    description:
      "Pratique questões discursivas e receba correção detalhada com nota e feedback da IA.",
  },
  {
    icon: "check",
    title: "Painel do Professor",
    description:
      "Professores podem criar simulados personalizados e acompanhar o desempenho dos alunos.",
  },
  {
    icon: "sparkles",
    title: "Mapa de Evolução por Domínio",
    description:
      "Visualize seu progresso em cada especialidade médica com scores detalhados e histórico.",
  },
  {
    icon: "rocket",
    title: "Melhorias de Performance e Estabilidade",
    description:
      "Service worker com cache inteligente, responsividade mobile aprimorada e fallback de IA otimizado.",
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
