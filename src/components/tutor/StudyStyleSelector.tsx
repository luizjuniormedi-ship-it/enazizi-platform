import { Zap, BookOpen, Brain, AlertCircle, HelpCircle } from "lucide-react";

export type StudyMode = "compact" | "full" | "review" | "correction" | "practice";

interface StudyStyleOption {
  mode: StudyMode;
  emoji: string;
  icon: typeof Zap;
  label: string;
  description: string;
  color: string;
}

const STUDY_STYLES: StudyStyleOption[] = [
  {
    mode: "compact",
    emoji: "⚡",
    icon: Zap,
    label: "Rápido e direto ao ponto",
    description: "Explicação curta com Feynman + aplicação + ponto-chave",
    color: "from-amber-500/15 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50",
  },
  {
    mode: "full",
    emoji: "📚",
    icon: BookOpen,
    label: "Aula completa e aprofundada",
    description: "Protocolo pedagógico completo com fisiopatologia e referências",
    color: "from-primary/15 to-primary/5 border-primary/30 hover:border-primary/50",
  },
  {
    mode: "review",
    emoji: "🧠",
    icon: Brain,
    label: "Revisão para prova",
    description: "Foco em pegadinhas, pontos cobrados e diagnósticos diferenciais",
    color: "from-purple-500/15 to-violet-500/10 border-purple-500/30 hover:border-purple-500/50",
  },
  {
    mode: "correction",
    emoji: "❌",
    icon: AlertCircle,
    label: "Corrigir meus erros",
    description: "Focado nos seus erros anteriores nesse tema",
    color: "from-destructive/15 to-destructive/5 border-destructive/30 hover:border-destructive/50",
  },
  {
    mode: "practice",
    emoji: "🧩",
    icon: HelpCircle,
    label: "Ir direto para questão",
    description: "Questão comentada com caso clínico imediatamente",
    color: "from-teal-500/15 to-cyan-500/10 border-teal-500/30 hover:border-teal-500/50",
  },
];

interface StudyStyleSelectorProps {
  topic: string;
  onSelect: (mode: StudyMode) => void;
  hasErrors?: boolean;
}

const StudyStyleSelector = ({ topic, onSelect, hasErrors }: StudyStyleSelectorProps) => {
  return (
    <div className="max-w-xl w-full mx-auto space-y-4 animate-fade-in">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-foreground">
          Como você quer estudar <span className="text-primary">{topic}</span>?
        </h3>
        <p className="text-xs text-muted-foreground">
          Escolha o estilo que melhor se adapta ao seu momento agora.
        </p>
      </div>

      <div className="grid gap-2">
        {STUDY_STYLES.map((style) => {
          if (style.mode === "correction" && !hasErrors) return null;
          const Icon = style.icon;
          return (
            <button
              key={style.mode}
              onClick={() => onSelect(style.mode)}
              className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${style.color} border transition-all group text-left`}
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-background/60 flex items-center justify-center">
                <span className="text-xl group-hover:scale-110 transition-transform">{style.emoji}</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{style.label}</div>
                <div className="text-[11px] text-muted-foreground">{style.description}</div>
              </div>
              <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-auto group-hover:text-foreground transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StudyStyleSelector;
