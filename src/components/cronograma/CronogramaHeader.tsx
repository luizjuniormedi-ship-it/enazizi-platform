import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Plus, BookOpen, BarChart3, Bell } from "lucide-react";

interface Props {
  tab: "painel" | "novo" | "temas" | "graficos";
  setTab: (t: "painel" | "novo" | "temas" | "graficos") => void;
  revisoesHoje: number;
}

const CronogramaHeader = ({ tab, setTab, revisoesHoje }: Props) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Cronograma Inteligente de Revisão
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Repetição espaçada • Active Recall • Treino com questões
        </p>
      </div>
      {revisoesHoje > 0 && (
        <Badge variant="destructive" className="animate-pulse text-sm px-3 py-1">
          <Bell className="h-3.5 w-3.5 mr-1" />
          {revisoesHoje} {revisoesHoje === 1 ? "revisão" : "revisões"} para hoje
        </Badge>
      )}
    </div>
    <div className="flex gap-2 overflow-x-auto pb-1">
      {[
        { key: "painel" as const, label: "📊 Painel", icon: BarChart3 },
        { key: "novo" as const, label: "➕ Novo Tema", icon: Plus },
        { key: "temas" as const, label: "📚 Meus Temas", icon: BookOpen },
        { key: "graficos" as const, label: "📈 Gráficos", icon: BarChart3 },
      ].map((t) => (
        <Button
          key={t.key}
          variant={tab === t.key ? "default" : "outline"}
          size="sm"
          onClick={() => setTab(t.key)}
          className="whitespace-nowrap"
        >
          {t.label}
        </Button>
      ))}
    </div>
  </div>
);

export default CronogramaHeader;
