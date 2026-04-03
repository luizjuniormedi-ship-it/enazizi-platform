import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Loader2 } from "lucide-react";
import { useTopicEvolution, EVOLUTION_CONFIG, type TopicEvolution } from "@/hooks/useTopicEvolution";

function EvolutionRow({ item }: { item: TopicEvolution }) {
  const cfg = EVOLUTION_CONFIG[item.status];
  return (
    <div className={`flex items-center gap-2.5 p-2.5 rounded-xl ${cfg.bgColor}`}>
      <span className="text-base">{cfg.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.topic}</p>
        <p className={`text-[11px] ${cfg.color}`}>{item.label}</p>
      </div>
      <Badge variant="outline" className={`text-[10px] shrink-0 border-0 ${cfg.bgColor} ${cfg.color}`}>
        {item.accuracy}%
        {item.delta !== 0 && (
          <span className="ml-1">
            {item.delta > 0 ? `+${item.delta}` : item.delta}
          </span>
        )}
      </Badge>
    </div>
  );
}

export default function RecentProgressCard() {
  const { data: evolutions, isLoading } = useTopicEvolution();

  if (isLoading) {
    return (
      <Card className="border-border/40">
        <CardContent className="p-5 flex items-center justify-center min-h-[120px]">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!evolutions || evolutions.length === 0) return null;

  // Pick top 3: prioritize 1 improving + 1 needs reinforcement + 1 stable
  const improving = evolutions.filter((e) => e.status === "melhorando");
  const reinforcing = evolutions.filter((e) => e.status === "reforcar");
  const stable = evolutions.filter((e) => e.status === "estavel");

  const picked: TopicEvolution[] = [];
  if (improving[0]) picked.push(improving[0]);
  if (reinforcing[0]) picked.push(reinforcing[0]);
  if (stable[0]) picked.push(stable[0]);
  // Fill remaining slots
  for (const e of evolutions) {
    if (picked.length >= 3) break;
    if (!picked.includes(e)) picked.push(e);
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="h-4 w-4 text-primary" />
          Seu progresso recente
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-1.5">
        {picked.map((item) => (
          <EvolutionRow key={item.topic} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}
