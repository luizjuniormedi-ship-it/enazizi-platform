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
    "🏆 {accuracy}% de acerto? Calma, deixa um pouco pros outros errarem também.",
    "🔥 {streak} dias seguidos? Cuidado que a banca vai pedir pra VOCÊ corrigir a prova.",
    "💀 Tá tão bom que dá até medo. Os concorrentes que se cuidem.",
    "👑 Nesse ritmo, o Harrison vai pedir pra ser SEU resumo. Não deixa subir à cabeça.",
    "🎯 {accuracy}% e {streak} dias? Tá suspeitosamente bom. Certeza que não vazou a prova?",
    "🧠 Seu cérebro tá operando em modo turbo. Aproveita antes que ele perceba.",
    "⚡ A essa altura, até o preceptor ia te chamar de 'doutor(a)' sem ironia.",
    "🏅 Performance absurda. Mas relaxa que a prova sempre guarda uma surpresinha.",
    "🔬 {accuracy}% de precisão cirúrgica. Se medicina não der certo... brincadeira, vai dar.",
    "😏 Tá estudando tanto que já pode abrir uma liga acadêmica de 'como passar'.",
    "🦸 {streak} dias sem falhar. Se existisse Olimpíada de estudar, você era ouro.",
    "💎 Esse desempenho é tão bom que eu desconfiaria de mim mesmo. Mas tá certo.",
    "🚀 Se aprovação fosse doença, seu prognóstico seria excelente. Segue o tratamento.",
  ],
  good: [
    "😏 Tá bem, mas não se acha não. A prova é cruel e não perdoa confiança excessiva.",
    "📚 {streak} dias seguidos? Bonito. Agora faz isso por mais 60 e a gente conversa.",
    "👀 {accuracy}% tá decente. Decente. Não excelente. Bora melhorar?",
    "🤨 Progresso bom, mas 'bom' não passa em residência. 'Excelente' passa.",
    "💡 Tá no caminho certo. O problema é que o caminho é longo e a prova é curta.",
    "📈 Evoluindo? Sim. Suficiente? Pergunte ao espelho e seja honesto(a).",
    "🩺 {streak} dias mostra disciplina. Falta aquele 'tchan' de quem domina de verdade.",
    "🎭 Tá estudando direitinho. Quase dá pra acreditar que vai manter esse ritmo.",
    "⏳ Tá indo bem, mas lembra: seus concorrentes também estão. E talvez mais.",
    "🧩 Cada dia de estudo conta. Cada dia sem estudar, a concorrência agradece.",
    "💪 {accuracy}%? Nada mal. Mas 'nada mal' é o que o reprovado fala na saída.",
    "🌊 Tá surfando uma onda boa. Só não cai, porque o mar tá cheio de tubarão.",
  ],
  meh: [
    "🤷 Netflix tá te esperando né? Ela sempre espera. A prova não.",
    "📋 Planilha de estudo linda. Pena que não abriu ela hoje.",
    "🛋️ Confortável aí no sofá? A cadeira da residência é mais confortável. Estuda.",
    "😐 Entrou no app. Parabéns. Agora faz alguma coisa útil além de olhar o dashboard.",
    "🍿 Tá tratando o app como cinema — só assiste. Bora interagir, vai.",
    "💤 Se estudar fosse dormir, você já teria um PhD. Acorda e abre uma questão.",
    "🎭 Fingindo que vai estudar de novo? O app já conhece esse roteiro.",
    "📱 Abriu o app e fechou o caderno? Inovador. Agora inverte.",
    "🐌 Seu ritmo de estudo tá mais lento que evolução de doença crônica.",
    "☕ Pega um café, larga as desculpas e resolve pelo menos 10 questões. PELO MENOS.",
    "🪞 Olha no espelho e fala: 'hoje eu vou estudar DE VERDADE'. Agora cumpre.",
    "🎪 O circo tá montado: você aqui, o estudo ali, e ninguém se encontra.",
    "🫠 Motivação zero? Normal. Disciplina > motivação. Abre o cronograma.",
  ],
  slacking: [
    "😤 A concorrência AGRADECE sua folga. Manda um abraço pra eles.",
    "🦥 Seu currículo Lattes tá chorando. E a sequência de estudo morreu. RIP.",
    "💀 Sequência zerou. Causa mortis: preguiça aguda. Sem necropsia necessária.",
    "🚨 ALERTA: você tá mais parado que fila do SUS. E olha que aquilo anda devagar.",
    "😬 Sem estudar? Tá bom. Depois não chora no grupo de WhatsApp quando reprovar.",
    "📉 Seu gráfico de desempenho tá parecendo ECG em assistolia. Reanima isso!",
    "🪫 Bateria acadêmica em 0%. Diagnóstico: procrastinação severa. Tratamento: ESTUDAR.",
    "🎭 'Amanhã eu estudo' — frase favorita de quem vai fazer prova de novo ano que vem.",
    "🐢 Parado há dias. Até uma tartaruga com hérnia de disco se move mais que você.",
    "📵 Tempo de tela no Instagram: 3h. Tempo de estudo: 0h. Prioridades, né?",
    "🏳️ Já desistiu? Nem começou direito e já tá com bandeira branca?",
    "😴 Dormiu no ponto. Literalmente. Acorda e faz alguma coisa antes que seja tarde.",
    "🗑️ Jogou a disciplina no lixo? Vai lá buscar. A prova não aceita atestado de preguiça.",
  ],
  danger: [
    "🚨 {days} DIAS e você tá aqui de turismo?! Abre o caderno AGORA ou assina a desistência.",
    "⏳ {days} dias. Sabe o que dá pra fazer? TUDO, se parar de enrolar. Ou NADA, se continuar assim.",
    "💀 {days} dias e progresso baixo. Se fosse paciente, já teria dado óbito acadêmico.",
    "🔴 CÓDIGO VERMELHO: {days} dias restantes. Protocolo: largar TUDO e estudar. Sem exceção.",
    "🫠 {days} dias e tá de boa? A prova não vai ter 'questão fácil pra quem não estudou'.",
    "⚠️ {days} dias. Seus concorrentes tão no 5º café do dia. E você? Nem abriu o livro.",
    "🆘 {days} dias. Se isso fosse UTI, você seria o paciente E o motivo da internação.",
    "🔥 {days} dias! Se não reagir HOJE, vai virar estatística de reprovação. Escolhe.",
    "⏰ {days} dias e contando. Cada minuto no sofá é um ponto a menos. Matemática simples.",
    "📢 ATENÇÃO: {days} dias. Não tem milagre. Não tem atalho. Tem estudo ou tem reprovação.",
    "💣 {days} dias. Bomba armada. Só quem estuda consegue desarmar. Bora ou vai explodir?",
    "🩸 {days} dias, progresso crítico. Diagnóstico: negação. Prescrição: 8h/dia de estudo, sem choro.",
    "🧨 {days} dias e navegando no app sem estudar? A ironia é que o app SERVE pra estudar.",
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
