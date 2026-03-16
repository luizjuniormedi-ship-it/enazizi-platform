import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Bell, AlertTriangle, ShieldAlert } from "lucide-react";
import type { TabCronograma } from "@/pages/CronogramaInteligente";

interface Props {
  tab: TabCronograma;
  setTab: (t: TabCronograma) => void;
  revisoesHoje: number;
  revisoesAtrasadas: number;
  temasCriticos: number;
}

const TABS: { key: TabCronograma; label: string }[] = [
  { key: "visao", label: "📊 Visão Geral" },
  { key: "hoje", label: "📅 Agenda" },
  { key: "novo", label: "➕ Novo Tema" },
  { key: "temas", label: "📚 Temas" },
  { key: "criticos", label: "⚠️ Críticos" },
  { key: "historico", label: "📜 Histórico" },
  { key: "graficos", label: "📈 Gráficos" },
  { key: "config", label: "⚙️ Config" },
];

const CronogramaHeader = ({ tab, setTab, revisoesHoje, revisoesAtrasadas, temasCriticos }: Props) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Cronograma Inteligente
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Central de decisão de estudo • Repetição espaçada baseada em erros
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {revisoesAtrasadas > 0 && (
          <Badge variant="destructive" className="animate-pulse text-xs px-2.5 py-1 cursor-pointer" onClick={() => setTab("hoje")}>
            <AlertTriangle className="h-3 w-3 mr-1" />
            {revisoesAtrasadas} atrasada{revisoesAtrasadas > 1 ? "s" : ""}
          </Badge>
        )}
        {revisoesHoje > 0 && (
          <Badge variant="destructive" className="text-xs px-2.5 py-1 cursor-pointer" onClick={() => setTab("hoje")}>
            <Bell className="h-3 w-3 mr-1" />
            {revisoesHoje} para hoje
          </Badge>
        )}
        {temasCriticos > 0 && (
          <Badge variant="secondary" className="text-xs px-2.5 py-1 cursor-pointer" onClick={() => setTab("criticos")}>
            <ShieldAlert className="h-3 w-3 mr-1" />
            {temasCriticos} crítico{temasCriticos > 1 ? "s" : ""}
          </Badge>
        )}
      </div>
    </div>
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {TABS.map((t) => (
        <Button
          key={t.key}
          variant={tab === t.key ? "default" : "ghost"}
          size="sm"
          onClick={() => setTab(t.key)}
          className="whitespace-nowrap text-xs px-3 h-8"
        >
          {t.label}
        </Button>
      ))}
    </div>
  </div>
);

export default CronogramaHeader;
