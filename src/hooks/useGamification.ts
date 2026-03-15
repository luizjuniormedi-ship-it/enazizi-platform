import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: "study" | "streak" | "social" | "milestone";
  condition: (stats: GamificationStats) => boolean;
}

export interface GamificationStats {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  weeklyXp: number;
  totalQuestions: number;
  totalSimulados: number;
  totalFlashcards: number;
  totalPlantao: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { key: "first_question", title: "Primeira Questão", description: "Respondeu sua primeira questão", icon: "🎯", category: "milestone", condition: (s) => s.totalQuestions >= 1 },
  { key: "10_questions", title: "Dedicado", description: "Respondeu 10 questões", icon: "📝", category: "milestone", condition: (s) => s.totalQuestions >= 10 },
  { key: "50_questions", title: "Estudioso", description: "Respondeu 50 questões", icon: "📚", category: "milestone", condition: (s) => s.totalQuestions >= 50 },
  { key: "100_questions", title: "Centenário", description: "Respondeu 100 questões", icon: "💯", category: "milestone", condition: (s) => s.totalQuestions >= 100 },
  { key: "500_questions", title: "Mestre das Questões", description: "Respondeu 500 questões", icon: "🏅", category: "milestone", condition: (s) => s.totalQuestions >= 500 },
  { key: "first_simulado", title: "Primeiro Simulado", description: "Completou seu primeiro simulado", icon: "🏆", category: "study", condition: (s) => s.totalSimulados >= 1 },
  { key: "5_simulados", title: "Veterano de Provas", description: "Completou 5 simulados", icon: "🎖️", category: "study", condition: (s) => s.totalSimulados >= 5 },
  { key: "first_flashcard", title: "Memória Flash", description: "Criou seu primeiro flashcard", icon: "⚡", category: "study", condition: (s) => s.totalFlashcards >= 1 },
  { key: "50_flashcards", title: "Colecionador", description: "Criou 50 flashcards", icon: "🃏", category: "study", condition: (s) => s.totalFlashcards >= 50 },
  { key: "first_plantao", title: "Plantão Iniciante", description: "Completou seu primeiro plantão", icon: "🏥", category: "study", condition: (s) => s.totalPlantao >= 1 },
  { key: "streak_3", title: "Consistente", description: "Streak de 3 dias", icon: "🔥", category: "streak", condition: (s) => s.longestStreak >= 3 },
  { key: "streak_7", title: "Semana de Fogo", description: "Streak de 7 dias", icon: "🔥🔥", category: "streak", condition: (s) => s.longestStreak >= 7 },
  { key: "streak_14", title: "Duas Semanas Imparável", description: "Streak de 14 dias", icon: "💪", category: "streak", condition: (s) => s.longestStreak >= 14 },
  { key: "streak_30", title: "Mês de Ferro", description: "Streak de 30 dias", icon: "🏆🔥", category: "streak", condition: (s) => s.longestStreak >= 30 },
  { key: "level_5", title: "Nível 5", description: "Alcançou o nível 5", icon: "⭐", category: "milestone", condition: (s) => s.level >= 5 },
  { key: "level_10", title: "Nível 10", description: "Alcançou o nível 10", icon: "🌟", category: "milestone", condition: (s) => s.level >= 10 },
  { key: "level_25", title: "Nível 25", description: "Alcançou o nível 25", icon: "💫", category: "milestone", condition: (s) => s.level >= 25 },
  { key: "xp_1000", title: "Mil XP", description: "Acumulou 1.000 XP", icon: "🎉", category: "milestone", condition: (s) => s.xp >= 1000 },
  { key: "xp_5000", title: "5K XP", description: "Acumulou 5.000 XP", icon: "🚀", category: "milestone", condition: (s) => s.xp >= 5000 },
  { key: "xp_10000", title: "10K XP", description: "Acumulou 10.000 XP", icon: "👑", category: "milestone", condition: (s) => s.xp >= 10000 },
];

const XP_PER_LEVEL_BASE = 100;
const XP_GROWTH = 1.5;

export function xpForLevel(level: number): number {
  return Math.floor(XP_PER_LEVEL_BASE * Math.pow(XP_GROWTH, level - 1));
}

export function levelFromXp(totalXp: number): { level: number; currentLevelXp: number; nextLevelXp: number } {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return { level, currentLevelXp: remaining, nextLevelXp: xpForLevel(level) };
}

// XP rewards
export const XP_REWARDS = {
  question_answered: 5,
  question_correct: 10,
  simulado_completed: 50,
  flashcard_created: 3,
  plantao_completed: 75,
  discursive_completed: 30,
  daily_login: 10,
  streak_bonus: 5, // multiplied by streak days
};

export function useGamification() {
  const { user } = useAuth();
  const [gamification, setGamification] = useState<{ xp: number; level: number; currentStreak: number; longestStreak: number; weeklyXp: number; lastActivityDate: string | null } | null>(null);
  const [unlockedKeys, setUnlockedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [gamRes, achRes] = await Promise.all([
      supabase.from("user_gamification").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_achievements").select("achievement_key").eq("user_id", user.id),
    ]);

    if (!gamRes.data) {
      // Initialize
      const { data } = await supabase.from("user_gamification").insert({ user_id: user.id }).select().single();
      if (data) {
        setGamification({ xp: 0, level: 1, currentStreak: 0, longestStreak: 0, weeklyXp: 0, lastActivityDate: null });
      }
    } else {
      const g = gamRes.data as any;
      setGamification({
        xp: g.xp, level: g.level, currentStreak: g.current_streak,
        longestStreak: g.longest_streak, weeklyXp: g.weekly_xp,
        lastActivityDate: g.last_activity_date,
      });
    }

    setUnlockedKeys(new Set((achRes.data || []).map((a: any) => a.achievement_key)));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addXp = useCallback(async (amount: number, activityType?: string) => {
    if (!user || !gamification) return;
    
    const today = new Date().toISOString().split("T")[0];
    const lastDate = gamification.lastActivityDate;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    
    let newStreak = gamification.currentStreak;
    if (lastDate !== today) {
      newStreak = lastDate === yesterday ? gamification.currentStreak + 1 : 1;
    }
    const longestStreak = Math.max(gamification.longestStreak, newStreak);
    
    // Streak bonus
    const streakBonus = newStreak > 1 ? XP_REWARDS.streak_bonus * Math.min(newStreak, 10) : 0;
    const totalAmount = amount + streakBonus;
    
    const newXp = gamification.xp + totalAmount;
    const { level } = levelFromXp(newXp);
    const newWeeklyXp = gamification.weeklyXp + totalAmount;

    await supabase.from("user_gamification").update({
      xp: newXp, level, current_streak: newStreak, longest_streak: longestStreak,
      weekly_xp: newWeeklyXp, last_activity_date: today, updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);

    const newGam = { xp: newXp, level, currentStreak: newStreak, longestStreak, weeklyXp: newWeeklyXp, lastActivityDate: today };
    setGamification(newGam);

    // Check achievements
    const stats: GamificationStats = {
      xp: newXp, level, currentStreak: newStreak, longestStreak,
      weeklyXp: newWeeklyXp, totalQuestions: 0, totalSimulados: 0, totalFlashcards: 0, totalPlantao: 0,
    };

    // Fetch counts for achievement checks
    const [qRes, simRes, fcRes] = await Promise.all([
      supabase.from("practice_attempts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("exam_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "finished"),
      supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    stats.totalQuestions = qRes.count || 0;
    stats.totalSimulados = simRes.count || 0;
    stats.totalFlashcards = fcRes.count || 0;

    for (const ach of ACHIEVEMENTS) {
      if (!unlockedKeys.has(ach.key) && ach.condition(stats)) {
        await supabase.from("user_achievements").insert({ user_id: user.id, achievement_key: ach.key });
        setUnlockedKeys(prev => new Set(prev).add(ach.key));
        setNewAchievement(ach);
        setTimeout(() => setNewAchievement(null), 4000);
      }
    }

    return totalAmount;
  }, [user, gamification, unlockedKeys]);

  const dismissAchievement = useCallback(() => setNewAchievement(null), []);

  return { gamification, loading, addXp, unlockedKeys, newAchievement, dismissAchievement, refetch: fetchData };
}
