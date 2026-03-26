import { ReactNode } from "react";
import { ChevronRight, LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface SummaryMetric {
  label: string;
  value: string | number;
}

interface DashboardSummaryCardProps {
  icon: LucideIcon;
  title: string;
  metrics: SummaryMetric[];
  onClick: () => void;
  accentClass?: string;
  children?: ReactNode;
}

const DashboardSummaryCard = ({
  icon: Icon,
  title,
  metrics,
  onClick,
  accentClass = "text-primary bg-primary/10",
}: DashboardSummaryCardProps) => {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all p-4 flex items-start gap-3 group active:scale-[0.98]"
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${accentClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="mt-1 space-y-0.5">
          {metrics.map((m, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate">{m.label}</span>
              <span className="font-medium text-foreground ml-2">{m.value}</span>
            </div>
          ))}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
    </Card>
  );
};

export default DashboardSummaryCard;
