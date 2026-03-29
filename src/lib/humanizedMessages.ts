/**
 * Humanized AI motivational messages based on context.
 * Used across the platform for a warmer UX.
 */

const greetings: Record<string, string[]> = {
  morning: [
    "Bom dia! Pronto para mais um dia de evolução? ☀️",
    "Bom dia! Cada questão te aproxima da aprovação 🚀",
    "Bom dia! Seu futuro paciente conta com você 💪",
  ],
  afternoon: [
    "Boa tarde! Que tal uma sessão de estudo focada? 📚",
    "Boa tarde! Mantenha o ritmo, você está indo bem! 💪",
    "Boa tarde! Uma revisão agora vale ouro 🧠",
  ],
  evening: [
    "Boa noite! Revisão noturna consolida a memória 🌙",
    "Boa noite! Uma sessão leve antes de dormir faz diferença 📖",
    "Boa noite! Você estudou bem hoje. Continue amanhã! ⭐",
  ],
};

const streakMessages: Record<string, string[]> = {
  low: [
    "Cada dia sem estudar é um dia que a curva de esquecimento vence 💡",
    "10 minutos hoje valem mais que 2 horas amanhã. Comece agora!",
  ],
  medium: [
    "Streak crescendo! Quem para agora, perde o que construiu 🔥",
    "Consistência separa quem passa de quem quase passa. Continue!",
  ],
  high: [
    "Seu padrão é de quem vai passar. Não desacelere agora 🏆",
    "Poucos chegam nesse nível de consistência. Você está entre eles 🌟",
  ],
};

const completionMessages = [
  "Bloco concluído! Excelente trabalho 🎯",
  "Mais um passo rumo à aprovação ✅",
  "Ótimo! Seu cérebro agradece 🧠",
  "Concluído! Você está evoluindo 📈",
];

const encouragement = [
  "Errar faz parte. O importante é aprender com o erro 💪",
  "Não desanime! Cada erro é uma oportunidade de crescimento 🌱",
  "Continue tentando. A persistência vence o talento 🔥",
];

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return pick(greetings.morning);
  if (hour < 18) return pick(greetings.afternoon);
  return pick(greetings.evening);
}

export function getStreakMessage(streak: number): string {
  if (streak >= 7) return pick(streakMessages.high);
  if (streak >= 3) return pick(streakMessages.medium);
  return pick(streakMessages.low);
}

export function getCompletionMessage(): string {
  return pick(completionMessages);
}

export function getEncouragement(): string {
  return pick(encouragement);
}

export function getProgressReinforcement(accuracy: number, questionsToday: number): string {
  if (questionsToday >= 30 && accuracy >= 80) return "Dia incrível! Performance de campeão 🏆";
  if (questionsToday >= 20) return `${questionsToday} questões hoje! Ritmo forte 💪`;
  if (accuracy >= 70) return `${accuracy}% de acerto — excelente precisão! 🎯`;
  if (questionsToday >= 10) return "Bom progresso! Continue para consolidar 📈";
  return "Cada questão conta. Continue! 🚀";
}
