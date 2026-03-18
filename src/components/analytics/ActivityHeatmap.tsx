import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  dates: string[]; // ISO date strings of activity days
}

const ActivityHeatmap = ({ dates }: Props) => {
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const totalDays = 120; // ~4 months
    const start = new Date(today);
    start.setDate(start.getDate() - totalDays + 1);
    // Align to Sunday
    start.setDate(start.getDate() - start.getDay());

    const dateSet = new Set(dates);
    const countMap = new Map<string, number>();
    for (const d of dates) {
      countMap.set(d, (countMap.get(d) || 0) + 1);
    }

    const weeks: { date: Date; key: string; count: number; isInRange: boolean }[][] = [];
    const monthLabels: { label: string; weekIdx: number }[] = [];
    let currentWeek: typeof weeks[0] = [];
    let lastMonth = -1;

    const cursor = new Date(start);
    while (cursor <= today || currentWeek.length > 0) {
      const key = cursor.toISOString().split("T")[0];
      const isInRange = cursor >= new Date(today.getTime() - totalDays * 86400000) && cursor <= today;
      currentWeek.push({
        date: new Date(cursor),
        key,
        count: countMap.get(key) || 0,
        isInRange,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        if (cursor.getMonth() !== lastMonth) {
          const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
          monthLabels.push({ label: months[cursor.getMonth()], weekIdx: weeks.length - 1 });
          lastMonth = cursor.getMonth();
        }
        currentWeek = [];
      }

      cursor.setDate(cursor.getDate() + 1);
      if (cursor > today && currentWeek.length === 0) break;
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return { weeks, monthLabels };
  }, [dates]);

  const getColor = (count: number) => {
    if (count === 0) return "bg-secondary";
    if (count <= 2) return "bg-primary/30";
    if (count <= 5) return "bg-primary/50";
    if (count <= 10) return "bg-primary/70";
    return "bg-primary";
  };

  const dayLabels = ["", "Seg", "", "Qua", "", "Sex", ""];

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold mb-4">Atividade dos últimos 4 meses</h2>
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 mr-1">
          {dayLabels.map((l, i) => (
            <div key={i} className="h-3 text-[10px] text-muted-foreground leading-3 flex items-center">{l}</div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-[3px] relative">
            {/* Month labels */}
            <div className="absolute -top-4 left-0 flex text-[10px] text-muted-foreground">
              {monthLabels.map((m) => (
                <span key={m.weekIdx} className="absolute" style={{ left: `${m.weekIdx * 15}px` }}>{m.label}</span>
              ))}
            </div>
            <TooltipProvider delayDuration={100}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day) => (
                    <Tooltip key={day.key}>
                      <TooltipTrigger asChild>
                        <div
                          className={`w-3 h-3 rounded-sm ${day.isInRange ? getColor(day.count) : "bg-transparent"}`}
                        />
                      </TooltipTrigger>
                      {day.isInRange && (
                        <TooltipContent side="top" className="text-xs">
                          {day.count} atividade{day.count !== 1 ? "s" : ""} em {day.date.toLocaleDateString("pt-BR")}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ))}
                </div>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
        <span>Menos</span>
        <div className="flex gap-[2px]">
          {["bg-secondary", "bg-primary/30", "bg-primary/50", "bg-primary/70", "bg-primary"].map((c) => (
            <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
        </div>
        <span>Mais</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
