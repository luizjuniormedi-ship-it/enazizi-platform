import { useState } from "react";
import { FlipVertical, RotateCcw, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const sampleCards = [
  { q: "Quais são as atribuições exclusivas do Delegado de Polícia Federal?", a: "Dirigir investigações de infrações penais federais, exercer funções de polícia judiciária da União, apurar crimes contra a ordem política e social." },
  { q: "Qual a diferença entre inquérito policial e termo circunstanciado?", a: "O inquérito policial é procedimento mais complexo, para crimes com pena superior a 2 anos. O termo circunstanciado é simplificado, para infrações de menor potencial ofensivo (JECrim)." },
  { q: "O que é a prisão temporária e quando se aplica?", a: "Prisão cautelar com prazo determinado (5 dias, prorrogáveis por mais 5), cabível durante o inquérito policial para crimes específicos listados na Lei 7.960/89." },
];

const Flashcards = () => {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = sampleCards[idx];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FlipVertical className="h-6 w-6 text-primary" />
          Flashcards
        </h1>
        <p className="text-muted-foreground">Revise seus flashcards com repetição espaçada.</p>
      </div>

      <div className="flex items-center justify-center">
        <div
          className="glass-card w-full max-w-2xl min-h-[320px] p-8 cursor-pointer flex flex-col items-center justify-center text-center relative group hover:border-primary/30 transition-all"
          onClick={() => setFlipped(!flipped)}
        >
          <div className="absolute top-4 right-4 text-xs text-muted-foreground">
            {idx + 1}/{sampleCards.length} • Clique para virar
          </div>
          <div className="text-xs uppercase tracking-wider text-primary mb-4 font-semibold">
            {flipped ? "Resposta" : "Pergunta"}
          </div>
          <p className="text-lg leading-relaxed">
            {flipped ? card.a : card.q}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => { setIdx(Math.max(0, idx - 1)); setFlipped(false); }}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setFlipped(false)}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="icon" title="Não sabia">
          <X className="h-4 w-4" />
        </Button>
        <Button size="icon" className="bg-success hover:bg-success/90" title="Sabia">
          <Check className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => { setIdx(Math.min(sampleCards.length - 1, idx + 1)); setFlipped(false); }}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Flashcards;
