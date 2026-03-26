import { useState, useEffect } from "react";
import { Trophy, Flame, Target, BookOpen, Users, Loader2, Medal } from "lucide-react";
import { ACHIEVEMENTS, useGamification, levelFromXp, type Achievement } from "@/hooks/useGamification";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const categoryLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  milestone: { label: "Marcos", icon: <Target className="h-4 w-4" /> },
  study: { label: "Estudo", icon: <BookOpen className="h-4 w-4" /> },
  streak: { label: "Consistência", icon: <Flame className="h-4 w-4" /> },
  social: { label: "Social", icon: <Users className="h-4 w-4" /> },
};

const Achievements = () => {
  const { user } = useAuth();
  const { gamification, unlockedKeys, loading } = useGamification();
  const [ranking, setRanking] = useState<{ userId: string; displayName: string; xp: number; level: number; weeklyXp: number }[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [isWeeklyRanking, setIsWeeklyRanking] = useState(true);

  useEffect(() => {
    const loadRanking = async () => {
      const { data } = await supabase
        .from("user_gamification")
        .select("user_id, xp, level, weekly_xp")
        .order("weekly_xp", { ascending: false })
        .limit(20);

      if (!data) return;

      const hasWeeklyXp = data.some((r: any) => r.weekly_xp > 0);
      let finalData = data;

      if (!hasWeeklyXp) {
        const { data: totalData } = await supabase
          .from("user_gamification")
          .select("user_id, xp, level, weekly_xp")
          .order("xp", { ascending: false })
          .limit(20);
        if (totalData && totalData.length > 0) finalData = totalData;
        setIsWeeklyRanking(false);
      } else {
        setIsWeeklyRanking(true);
      }

      const userIds = finalData.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.display_name]));
      setRanking(finalData.map((r: any) => ({
        userId: r.user_id,
        displayName: nameMap.get(r.user_id) || "Anônimo",
        xp: r.xp,
        level: r.level,
        weeklyXp: r.weekly_xp,
      })));
    };
    loadRanking();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const filtered = filter === "all" ? ACHIEVEMENTS : ACHIEVEMENTS.filter(a => a.category === filter);
  const unlockedCount = ACHIEVEMENTS.filter(a => unlockedKeys.has(a.key)).length;
  const { currentLevelXp, nextLevelXp } = levelFromXp(gamification?.xp || 0);
  const progress = gamification ? Math.round((currentLevelXp / nextLevelXp) * 100) : 0;

  const userRankIndex = ranking.findIndex(r => r.userId === user?.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          Conquistas & Ranking
        </h1>
        <p className="text-muted-foreground">Seu progresso, conquistas e posição no ranking semanal.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold shadow-lg mb-2">
            {gamification?.level || 1}
          </div>
          <div className="text-xs text-muted-foreground">Nível atual</div>
          <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">{currentLevelXp}/{nextLevelXp} XP</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{gamification?.xp?.toLocaleString() || 0}</div>
          <div className="text-xs text-muted-foreground">XP Total</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
            <Flame className="h-5 w-5" />
            <span className="text-2xl font-bold">{gamification?.currentStreak || 0}</span>
          </div>
          <div className="text-xs text-muted-foreground">Streak atual</div>
          <div className="text-[10px] text-muted-foreground">Recorde: {gamification?.longestStreak || 0} dias</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{unlockedCount}/{ACHIEVEMENTS.length}</div>
          <div className="text-xs text-muted-foreground">Conquistas</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Achievements */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              Todas
            </button>
            {Object.entries(categoryLabels).map(([key, { label, icon }]) => (
              <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {icon} {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((ach) => {
              const unlocked = unlockedKeys.has(ach.key);
              return (
                <div key={ach.key} className={`glass-card p-4 text-center transition-all ${unlocked ? "border-amber-400/30 shadow-amber-500/10 shadow-lg" : "opacity-40 grayscale"}`}>
                  <div className="text-3xl mb-2">{ach.icon}</div>
                  <div className="text-sm font-semibold text-foreground">{ach.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{ach.description}</div>
                  {unlocked && <div className="text-[10px] text-amber-500 font-medium mt-2">✅ Desbloqueada</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Ranking */}
        <div className="space-y-4">
          <div className="glass-card p-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Medal className="h-5 w-5 text-amber-500" />
              Ranking Semanal
            </h2>
            {ranking.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado ainda.</p>
            ) : (
              <div className="space-y-2">
                {ranking.slice(0, 10).map((r, i) => {
                  const isMe = r.userId === user?.id;
                  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
                  return (
                    <div key={r.userId} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${isMe ? "bg-primary/10 border border-primary/20" : "bg-secondary/30"}`}>
                      <span className="text-lg w-8 text-center font-bold">{medal}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{isMe ? "Você" : r.displayName}</div>
                        <div className="text-[10px] text-muted-foreground">Nível {r.level} • {r.xp.toLocaleString()} XP</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-primary">+{r.weeklyXp}</div>
                        <div className="text-[10px] text-muted-foreground">semana</div>
                      </div>
                    </div>
                  );
                })}
                {userRankIndex > 9 && (
                  <>
                    <div className="text-center text-muted-foreground text-xs py-1">...</div>
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-lg w-8 text-center font-bold">{userRankIndex + 1}</span>
                      <div className="flex-1"><div className="text-sm font-medium">Você</div></div>
                      <div className="text-sm font-bold text-primary">+{ranking[userRankIndex]?.weeklyXp}</div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;
