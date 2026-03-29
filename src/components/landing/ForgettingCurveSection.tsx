import { useEffect, useState, useRef } from "react";

const WITHOUT_REVIEW = [100, 58, 44, 36, 33, 28, 25, 21];
const WITH_SRS      = [100, 92, 88, 90, 87, 89, 91, 90];
const LABELS        = ["Dia 0", "Dia 1", "Dia 2", "Dia 3", "Dia 7", "Dia 14", "Dia 21", "Dia 30"];

const ForgettingCurveSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const maxH = 180;

  return (
    <section ref={ref} className="py-16 sm:py-24 relative overflow-hidden bg-secondary/30">
      <div className="container relative z-10 px-4">
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Ciência da memória
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3">
            Sem revisão, você <span className="text-destructive">esquece 80%</span> em 30 dias
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Com repetição espaçada inteligente, a retenção fica acima de 85%.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Chart */}
          <div className="flex items-end justify-between gap-1 sm:gap-2 h-[220px] sm:h-[260px]">
            {LABELS.map((label, i) => {
              const hNo  = (WITHOUT_REVIEW[i] / 100) * maxH;
              const hSrs = (WITH_SRS[i] / 100) * maxH;
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-0.5 sm:gap-1 w-full justify-center" style={{ height: maxH }}>
                    {/* without */}
                    <div
                      className="flex-1 max-w-5 sm:max-w-7 rounded-t-md bg-destructive/60 transition-all duration-700 ease-out"
                      style={{ height: visible ? hNo : 0 }}
                    />
                    {/* with SRS */}
                    <div
                      className="flex-1 max-w-5 sm:max-w-7 rounded-t-md bg-primary transition-all duration-700 ease-out"
                      style={{ height: visible ? hSrs : 0, transitionDelay: "0.2s" }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground mt-1 whitespace-nowrap">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-destructive/60" />
              <span className="text-xs sm:text-sm text-muted-foreground">Sem revisão</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-primary" />
              <span className="text-xs sm:text-sm text-muted-foreground">Com SRS (ENAZIZI)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgettingCurveSection;
