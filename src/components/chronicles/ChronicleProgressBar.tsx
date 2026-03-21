import { useMemo } from "react";

const MILESTONES = [
  { emoji: "🩺", label: "Cenário", color: "bg-blue-400" },
  { emoji: "🔬", label: "Fisiopatologia", color: "bg-teal-400" },
  { emoji: "🖼️", label: "Imagem", color: "bg-cyan-400" },
  { emoji: "🧠", label: "Raciocínio", color: "bg-purple-400" },
  { emoji: "⚠️", label: "Armadilha", color: "bg-amber-400" },
  { emoji: "⚖️", label: "Diferencial", color: "bg-emerald-400" },
  { emoji: "🎯", label: "Memória", color: "bg-orange-400" },
  { emoji: "📝", label: "Questão", color: "bg-violet-400" },
];

interface Props {
  content: string;
}

const ChronicleProgressBar = ({ content }: Props) => {
  const reached = useMemo(() => {
    return MILESTONES.map((m) => content.includes(m.emoji));
  }, [content]);

  const reachedCount = reached.filter(Boolean).length;
  if (reachedCount === 0) return null;

  return (
    <div className="flex items-center gap-1 sm:gap-2 px-2 py-1.5 rounded-lg bg-muted/50 border border-border/50 overflow-x-auto">
      {MILESTONES.map((m, i) => (
        <div key={m.emoji} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div
            className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-medium transition-all duration-500 ${
              reached[i]
                ? `${m.color}/20 text-foreground`
                : "bg-transparent text-muted-foreground/40"
            }`}
          >
            <span className={`text-xs sm:text-sm transition-all ${reached[i] ? "scale-110" : "grayscale opacity-40"}`}>
              {m.emoji}
            </span>
            <span className="hidden sm:inline">{m.label}</span>
          </div>
          {i < MILESTONES.length - 1 && (
            <div
              className={`w-3 sm:w-6 h-0.5 rounded-full transition-all duration-500 ${
                reached[i + 1] ? "bg-primary/50" : "bg-border/50"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ChronicleProgressBar;
