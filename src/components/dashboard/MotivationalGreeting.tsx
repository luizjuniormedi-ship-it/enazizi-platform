import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

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
    "🏆 Tá voando, hein? Se a prova fosse hoje, o examinador ia pedir autógrafo!",
    "🔥 Sequência de {streak} dias! Você tá mais constante que plantão de domingo.",
    "💪 {accuracy}% de acerto? Isso sim é quem manda no Harrison, não quem só carrega.",
    "🚀 Tá estudando tanto que até o Guyton tá com ciúmes. Segue assim!",
    "👑 Nesse ritmo, a banca vai pensar que vazou a prova. Spoiler: não vazou, você é bom mesmo.",
    "🎯 {streak} dias seguidos! O único diagnóstico aqui é: futuro(a) residente confirmado(a).",
  ],
  good: [
    "😊 Bom te ver por aqui de novo! Sequência de {streak} dias — bora manter!",
    "📚 Tá no caminho certo! Não é o mais rápido que passa, é o mais constante.",
    "👍 {accuracy}% de acerto tá bom, mas você sabe que pode mais, né?",
    "💡 Dica do dia: quem estuda todo dia não surta na véspera. Tá indo bem!",
    "🩺 Progresso detectado! Continue assim e a vaga é sua.",
  ],
  meh: [
    "🤷 E aí, bora estudar ou vai ficar só olhando o dashboard?",
    "📖 Tá tranquilo, tá favorável... mas a prova não vai ser tranquila não, hein!",
    "⏰ Mais um dia, mais uma oportunidade de se preparar. Que tal começar agora?",
    "🧠 Seu cérebro tá esperando novos neurônios de medicina. Alimenta ele!",
    "🎬 Fim do intervalo! Hora de voltar pra aula.",
  ],
  slacking: [
    "😤 Cadê você?! A sequência zerou! Até o mascote tá decepcionado.",
    "🦥 Tá querendo passar na prova ou virar especialista em procrastinação?",
    "⚡ ALERTA: detectamos preguiça aguda. Tratamento: abrir o cronograma AGORA.",
    "🚨 Sua sequência de estudos morreu. Causa mortis: abandono. Bora ressuscitar!",
    "😬 Sem estudar hoje? Amanhã você vai se arrepender. Na verdade, no dia da prova.",
    "📉 Seu progresso tá mais parado que fila do SUS. Bora mexer isso!",
  ],
  danger: [
    "🚨 {days} DIAS PRA PROVA e o cronograma tá pela metade?! É agora ou nunca!",
    "⏳ Faltam {days} dias. Cada hora conta. PARA de rolar feed e ABRE o caderno!",
    "🔴 MODO EMERGÊNCIA: {days} dias restantes. Não tem mais tempo pra \"amanhã eu começo\".",
    "💀 {days} dias. Progresso baixo. Se não intensificar HOJE, vai ser turista na prova.",
    "🫠 Contagem regressiva: {days} dias. A prova não espera. E você, vai esperar o quê?",
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
        </div>
        <Sparkles className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-1 hidden sm:block" />
      </div>
    </div>
  );
};

export default MotivationalGreeting;
