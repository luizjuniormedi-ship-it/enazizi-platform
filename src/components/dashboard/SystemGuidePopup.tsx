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
import { ChevronDown } from "lucide-react";
import mascot from "@/assets/enazizi-mascot.png";

const STORAGE_KEY = "enazizi_guide_seen_v2";

const features = [
  {
    emoji: "🧠", name: "Tutor IA", desc: "Aprenda qualquer assunto fazendo perguntas. O tutor explica, testa e corrige seus erros.",
    howTo: ["Digite um tema médico e inicie a sessão de estudo", "O tutor explica em blocos: técnico → leigo → questão → correção", "Responda as questões no chat — erros vão pro Banco de Erros automaticamente", "Finalize a sessão para salvar seu progresso e ganhar XP"],
  },
  {
    emoji: "📝", name: "Gerador de Questões", desc: "Gere questões estilo ENARE com casos clínicos. Responda e veja o gabarito na hora.",
    howTo: ["Escolha uma especialidade ou clique em uma ação rápida", "A IA gera questões com caso clínico, alternativas e gabarito", "Responda interativamente e veja a explicação detalhada", "Clique em 'Salvar no Banco' para guardar as questões geradas"],
  },
  {
    emoji: "🗂️", name: "Banco de Questões", desc: "Pratique com questões de provas reais (USP, UNICAMP, AMRIGS) organizadas por tema.",
    howTo: ["Filtre por especialidade, dificuldade ou fonte (banca)", "Responda cada questão e veja a explicação", "Erros são salvos automaticamente no Banco de Erros", "Acompanhe sua taxa de acerto por tema"],
  },
  {
    emoji: "📚", name: "Flashcards", desc: "Crie e revise flashcards com repetição espaçada para fixar o conteúdo.",
    howTo: ["Vá em 'Gerar Flashcards' para criar flashcards por IA", "Revise marcando Fácil, Médio ou Difícil", "O algoritmo agenda revisões automáticas (1, 3, 7, 14, 30 dias)", "Cards difíceis aparecem mais vezes até você dominar"],
  },
  {
    emoji: "🏥", name: "Simulados", desc: "Simule provas completas com cronômetro e resultado detalhado por área.",
    howTo: ["Escolha o tema, quantidade de questões e dificuldade", "Responda dentro do tempo — simula prova real", "Veja resultado detalhado por especialidade ao final", "Erros vão automaticamente para o Banco de Erros"],
  },
  {
    emoji: "❌", name: "Banco de Erros", desc: "Seus erros são salvos automaticamente. Revise seus pontos fracos com foco.",
    howTo: ["Os erros são coletados automaticamente de todos os módulos", "Filtre por tema ou categoria de erro", "Clique em 'Revisar' para estudar com o Tutor IA focado no erro", "Acompanhe a evolução dos seus pontos fracos"],
  },
  {
    emoji: "📊", name: "Mapa de Domínio", desc: "Veja seu nível em cada especialidade médica num mapa visual interativo.",
    howTo: ["O mapa se atualiza automaticamente conforme você estuda", "Verde = domínio alto, Vermelho = precisa revisar", "Clique em uma especialidade para ver detalhes", "Use para priorizar seus estudos nas áreas mais fracas"],
  },
  {
    emoji: "📅", name: "Cronograma", desc: "Organize revisões por repetição espaçada com agenda e alertas automáticos.",
    howTo: ["Adicione temas na aba 'Novo Tema' com dificuldade e fonte", "A aba 'Agenda' mostra revisões do dia com prioridade", "Registre desempenho ao concluir — o algoritmo ajusta intervalos", "Veja temas críticos e gráficos de evolução"],
  },
  {
    emoji: "🎓", name: "Proficiência", desc: "Resolva simulados criados pelo seu professor e acompanhe seu desempenho.",
    howTo: ["Seu professor publica simulados e casos clínicos", "Acesse pela aba 'Proficiência' no menu", "Resolva dentro do prazo e veja sua nota", "Compare seu desempenho com a turma"],
  },
  {
    emoji: "💪", name: "Coach Motivacional", desc: "Precisa de um empurrão? O coach te mantém focado e motivado.",
    howTo: ["Acesse quando precisar de motivação ou organização", "Conte seus desafios — o coach sugere estratégias", "Receba planos de ação personalizados", "Use antes de sessões longas para manter o foco"],
  },
];

const SystemGuidePopup = () => {
  const [open, setOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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

  const toggleExpand = (i: number) => {
    setExpandedIndex(expandedIndex === i ? null : i);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-40 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-transform hover:scale-110 flex items-center justify-center"
        title="Guia do sistema"
      >
        <img src={mascot} alt="ENAZIZI" className="h-9 w-9 object-contain" />
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
        <DialogContent className="sm:max-w-lg border-primary/20 p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 pt-5 pb-3 flex items-center gap-4">
            <img src={mascot} alt="ENAZIZI" className="h-16 w-16 object-contain drop-shadow-md" />
            <DialogHeader className="space-y-0.5 text-left">
              <DialogTitle className="text-lg">Olá! Eu sou o ENAZIZI 🐊</DialogTitle>
              <DialogDescription className="text-xs">
                Clique em cada módulo para ver como usar!
              </DialogDescription>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[55vh] px-5">
            <div className="space-y-2 py-3">
              {features.map((f, i) => (
                <div key={i} className="rounded-lg border border-border/40 bg-muted/20 overflow-hidden transition-colors hover:bg-muted/40">
                  <button
                    onClick={() => toggleExpand(i)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                  >
                    <span className="text-xl flex-shrink-0">{f.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight">{f.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${expandedIndex === i ? "rotate-180" : ""}`} />
                  </button>

                  {expandedIndex === i && (
                    <div className="px-3 pb-3 pt-1 border-t border-border/30 animate-fade-in">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Passo a passo</p>
                      <div className="space-y-1.5">
                        {f.howTo.map((step, j) => (
                          <div key={j} className="flex items-start gap-2">
                            <span className="flex-shrink-0 h-4 w-4 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                              {j + 1}
                            </span>
                            <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
