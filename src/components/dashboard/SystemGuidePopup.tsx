import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import mascot from "@/assets/enazizi-mascot.png";

const STORAGE_KEY = "enazizi_guide_seen";

const features = [
  { emoji: "🧠", name: "Tutor IA", desc: "Aprenda qualquer assunto fazendo perguntas. O tutor explica, testa e corrige seus erros." },
  { emoji: "📝", name: "Gerador de Questões", desc: "Gere questões estilo ENARE com casos clínicos. Responda e veja o gabarito na hora." },
  { emoji: "🗂️", name: "Banco de Questões", desc: "Pratique com questões de provas reais (USP, UNICAMP, AMRIGS) organizadas por tema." },
  { emoji: "📚", name: "Flashcards", desc: "Crie e revise flashcards com repetição espaçada para fixar o conteúdo." },
  { emoji: "🏥", name: "Simulados", desc: "Simule provas completas com cronômetro e resultado detalhado por área." },
  { emoji: "❌", name: "Banco de Erros", desc: "Seus erros são salvos automaticamente. Revise seus pontos fracos com foco." },
  { emoji: "📊", name: "Mapa de Domínio", desc: "Veja seu nível em cada especialidade médica num mapa visual interativo." },
  { emoji: "📅", name: "Plano de Estudos", desc: "IA monta seu cronograma semanal personalizado até a data da prova." },
  { emoji: "🎓", name: "Proficiência", desc: "Resolva simulados criados pelo seu professor e acompanhe seu desempenho." },
  { emoji: "💪", name: "Coach Motivacional", desc: "Precisa de um empurrão? O coach te mantém focado e motivado." },
];

const SystemGuidePopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  return (
    <>
      {/* Floating help button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-40 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-transform hover:scale-110 flex items-center justify-center"
        title="Guia do sistema"
      >
        <img src={mascot} alt="Guia" className="h-9 w-9 object-contain" />
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
        <DialogContent className="sm:max-w-lg border-primary/20 p-0 overflow-hidden">
          {/* Header with mascot */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 pt-5 pb-3 flex items-center gap-4">
            <img src={mascot} alt="ENAZIZI" className="h-16 w-16 object-contain drop-shadow-md" />
            <DialogHeader className="space-y-0.5 text-left">
              <DialogTitle className="text-lg">Olá! Eu sou o ENAZIZI 🐊</DialogTitle>
              <DialogDescription className="text-xs">
                Deixa eu te mostrar tudo que você pode fazer aqui!
              </DialogDescription>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[55vh] px-5">
            <div className="space-y-2 py-3">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5 hover:bg-muted/40 transition-colors"
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{f.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">{f.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="px-5 pb-4">
            <Button onClick={handleClose} className="w-full">
              Bora estudar! 🚀
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SystemGuidePopup;
