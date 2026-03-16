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

const CURRENT_VERSION = "3.2.0";
const STORAGE_KEY = "enazizi_last_seen_version";

interface UpdateItem {
  icon: "sparkles" | "check" | "rocket";
  title: string;
  description: string;
}

const updates: UpdateItem[] = [
  {
    icon: "rocket",
    title: "Plantão Clínico — Dermatologia & Angiologia",
    description:
      "Novas especialidades no Modo Plantão: simule casos de Dermatologia (psoríase, dermatites, melanoma) e Angiologia (TVP, DAP, varizes) com avaliação completa.",
  },
  {
    icon: "sparkles",
    title: "Gerador de Questões Anti-Repetição",
    description:
      "O gerador agora analisa o histórico da conversa e nunca repete questões. Catálogo expandido com 20+ especialidades e centenas de subtemas para máxima variedade.",
  },
  {
    icon: "rocket",
    title: "Painel do Professor — Seleção Individual de Alunos",
    description:
      "Ao criar simulados, o professor pode selecionar ou desmarcar alunos individualmente com checkboxes, além de filtrar por faculdade e período.",
  },
  {
    icon: "check",
    title: "Aba Aluno Individual no Painel Professor",
    description:
      "Nova aba para visualizar detalhes individuais de cada aluno: maestria por especialidade, erros frequentes, streak, simulados realizados e uso de cota.",
  },
  {
    icon: "sparkles",
    title: "Cronograma Inteligente Unificado",
    description:
      "Repetição espaçada adaptativa + Plano de Estudos até a prova integrados em um único módulo com revisões extras automáticas.",
  },
  {
    icon: "rocket",
    title: "PWA Completa — Instale no Celular",
    description:
      "O ENAZIZI funciona como app nativo! Instale direto do navegador no iOS e Android com suporte offline.",
  },
  {
    icon: "check",
    title: "Modo Plantão — Simulação Clínica",
    description:
      "Simule plantões médicos com 15 especialidades, cronômetro, ajuda do preceptor e avaliação pedagógica completa.",
  },
  {
    icon: "sparkles",
    title: "Conquistas, XP & Ranking Semanal",
    description:
      "Sistema de gamificação com XP, streaks, níveis e ranking para motivar seus estudos diários.",
  },
  {
    icon: "check",
    title: "Questões Discursivas com Correção por IA",
    description:
      "Pratique questões discursivas e receba correção detalhada com nota e feedback da IA.",
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
