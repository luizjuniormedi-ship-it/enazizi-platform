import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const EXAM_LABELS: Record<string, string> = {
  enare: "ENARE", revalida: "Revalida", usp: "USP", unicamp: "UNICAMP",
  unifesp: "UNIFESP", "sus-sp": "SUS-SP", "sus-rj": "SUS-RJ", amrigs: "AMRIGS",
  "ses-df": "SES-DF", "psu-mg": "PSU-MG", hcpa: "HCPA",
  "santa-casa-sp": "Santa Casa SP", einstein: "Einstein",
  "sirio-libanes": "Sírio-Libanês", outra: "Outra",
};

interface GreetingProps {
  streak: number;
  todayCompleted: number;
  todayTotal: number;
  completedTasks: number;
  totalTasks: number;
  daysUntilExam: number | null;
  questionsAnswered: number;
  accuracy: number;
  displayName: string | null;
  targetExams?: string[];
}

type Mood = "champion" | "good" | "meh" | "slacking" | "danger";

const getMood = (props: GreetingProps): Mood => {
  const { streak, todayCompleted, todayTotal, completedTasks, totalTasks, daysUntilExam, accuracy } = props;
  const taskPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Champion: streak >= 5 AND good accuracy AND tasks on track
  if (streak >= 5 && accuracy >= 70 && taskPercent >= 50) return "champion";
  // Good: streak > 0 AND decent progress
  if (streak >= 2 && taskPercent >= 30) return "good";
  // Danger: exam close AND low progress
  if (daysUntilExam !== null && daysUntilExam <= 30 && taskPercent < 40) return "danger";
  // Slacking: no streak or very low progress
  if (streak === 0 && totalTasks > 3) return "slacking";
  if (todayTotal > 0 && todayCompleted === 0) return "slacking";
  // Default
  return "meh";
};

const PHRASES: Record<Mood, string[]> = {
  champion: [
    "🏆 {accuracy}% de acerto e {streak} dias seguidos. Tá voando!",
    "🔥 {streak} dias de dedicação. Os resultados estão aparecendo.",
    "👑 Ritmo impressionante. Continue assim e a vaga é sua.",
    "🎯 {accuracy}% de precisão. Consistência de quem está pronto.",
    "🧠 Desempenho acima da média. Agora é manter o nível.",
    "⚡ Seu progresso mostra preparo real. Siga firme.",
    "🏅 Performance sólida. A confiança vem do trabalho bem feito.",
    "🔬 {accuracy}% de acurácia. Esse nível exige manutenção — siga revisando.",
    "🚀 {streak} dias consistentes. Quem mantém o ritmo, colhe o resultado.",
  ],
  good: [
    "📚 {streak} dias seguidos. Bom ritmo — agora é não parar.",
    "📈 Progresso consistente. Continue e os resultados virão.",
    "💡 Tá no caminho certo. Foco nas revisões e vai evoluir ainda mais.",
    "🩺 {accuracy}% mostra dedicação. O próximo passo é refinar os pontos fracos.",
    "💪 Cada dia de estudo conta. Você está construindo algo sólido.",
    "🧩 Boa evolução. Revise os temas mais difíceis para consolidar.",
    "⏳ Progresso firme. Mantenha a constância que os resultados aparecem.",
  ],
  meh: [
    "📋 Vamos retomar? Cada sessão de estudo faz diferença.",
    "☕ Um bom começo: abra uma sessão de revisão ou resolva algumas questões.",
    "🎯 Hoje pode ser um dia produtivo. Que tal começar pelo Plano do Dia?",
    "📱 Você já está aqui — o mais difícil já foi. Agora é só começar.",
    "🪞 Disciplina supera motivação. Mesmo nos dias difíceis, 20 minutos fazem diferença.",
    "🌱 Pequenos passos diários levam a grandes resultados. Comece agora.",
  ],
  slacking: [
    "📉 Sua sequência zerou. Que tal recomeçar hoje com pelo menos uma sessão?",
    "⚠️ Sem estudo recente. Voltar agora evita acúmulo de revisões.",
    "🔄 Pausas acontecem, mas voltar rápido é o que diferencia quem passa.",
    "📖 Seus concorrentes estão estudando. Vamos retomar o ritmo?",
    "🎯 Uma sessão hoje já é um passo na direção certa.",
    "💡 Não precisa ser perfeito — precisa ser constante. Comece por 15 minutos.",
  ],
  danger: [
    "⏳ {days} dias até a prova. Cada hora de estudo conta agora.",
    "🔴 {days} dias restantes e progresso abaixo do ideal. Hora de intensificar.",
    "⚠️ {days} dias. Foque nas revisões e nos temas com mais peso na prova.",
    "📢 {days} dias. Priorize o essencial — revisões e questões dos temas fracos.",
    "🎯 Reta final: {days} dias. Concentre-se no que mais cai e revise todos os dias.",
    "💪 {days} dias. Difícil, mas possível. Estude com foco e consistência.",
  ],
};

const EMOJIS: Record<Mood, string> = {
  champion: "🏆",
  good: "😊",
  meh: "🤔",
  slacking: "😤",
  danger: "🚨",
};

const COLORS: Record<Mood, string> = {
  champion: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
  good: "from-primary/20 to-primary/5 border-primary/30",
  meh: "from-amber-500/15 to-amber-500/5 border-amber-500/30",
  slacking: "from-orange-500/20 to-orange-500/5 border-orange-500/30",
  danger: "from-destructive/20 to-destructive/5 border-destructive/30",
};

const MotivationalGreeting = (props: GreetingProps) => {
  const [phrase, setPhrase] = useState("");
  const [mood, setMood] = useState<Mood>("meh");

  useEffect(() => {
    const m = getMood(props);
    setMood(m);
    const pool = PHRASES[m];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const formatted = pick
      .replace("{streak}", String(props.streak))
      .replace("{accuracy}", String(Math.round(props.accuracy)))
      .replace("{days}", String(props.daysUntilExam || "?"));
    setPhrase(formatted);
  }, [props.streak, props.accuracy, props.todayCompleted, props.daysUntilExam]);

  const name = props.displayName?.split(" ")[0] || "Doutor(a)";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-r ${COLORS[mood]} p-4 sm:p-5 animate-fade-in`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl sm:text-3xl flex-shrink-0 mt-0.5">{EMOJIS[mood]}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">
            {greeting}, <span className="text-foreground font-semibold">{name}</span>!
          </p>
          <p className="text-sm sm:text-base font-medium text-foreground mt-1 leading-relaxed">
            {phrase}
          </p>
          {props.targetExams && props.targetExams.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {props.targetExams.map(e => (
                <Badge key={e} variant="outline" className="text-[10px] px-1.5 py-0">
                  {EXAM_LABELS[e] || e}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <Sparkles className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-1 hidden sm:block" />
      </div>
    </div>
  );
};

export default MotivationalGreeting;
