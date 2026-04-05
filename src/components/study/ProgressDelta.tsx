import { useEffect, useRef, useState } from "react";
import { TrendingDown, CheckCircle2, Target } from "lucide-react";

interface DeltaItem {
  label: string;
  before: number;
  after: number;
  /** "less" = going down is good (pendências). "more" = going up is good (progresso). */
  direction?: "less" | "more";
  suffix?: string;
}

interface ProgressDeltaProps {
  items: DeltaItem[];
}

function AnimatedNumber({ value, duration = 600 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = to;
    if (from === to) return;

    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3); // easeOutCubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (pct < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{display}</>;
}

export default function ProgressDelta({ items }: ProgressDeltaProps) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => {
        const diff = item.after - item.before;
        const isGood =
          item.direction === "less" ? diff < 0 :
          item.direction === "more" ? diff > 0 : diff !== 0;
        const diffText = diff > 0 ? `+${diff}` : `${diff}`;

        return (
          <div
            key={item.label}
            className="rounded-xl bg-secondary/50 p-2.5 text-center space-y-0.5 animate-fade-in"
          >
            <div className="text-[10px] text-muted-foreground truncate">{item.label}</div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs text-muted-foreground/60 line-through">
                {item.before}{item.suffix || ""}
              </span>
              <span className="text-xs text-muted-foreground">→</span>
              <span className={`text-sm font-bold ${isGood ? "text-emerald-500" : "text-foreground"}`}>
                <AnimatedNumber value={item.after} />
                {item.suffix || ""}
              </span>
            </div>
            {diff !== 0 && (
              <div className={`text-[10px] font-medium ${isGood ? "text-emerald-500" : "text-muted-foreground"}`}>
                {diffText}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
