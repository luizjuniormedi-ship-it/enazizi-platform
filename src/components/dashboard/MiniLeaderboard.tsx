import { useEffect, useState } from "react";
import { Crown, ChevronRight, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface RankEntry {
  userId: string;
  displayName: string;
  weeklyXp: number;
  xp: number;
  level: number;
}

const MiniLeaderboard = () => {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isWeekly, setIsWeekly] = useState(true);

  useEffect(() => {
    const load = async () => {
      const now = new Date().toISOString();

      // Only count weekly_xp for users whose reset hasn't passed yet (current week)
      const { data } = await supabase
        .from("user_gamification")
        .select("user_id, weekly_xp, xp, level, weekly_reset_at")
        .order("weekly_xp", { ascending: false })
        .limit(20);

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      // Zero out weekly_xp for users whose week already expired
      const adjusted = data.map((r: any) => ({
        ...r,
        weekly_xp: r.weekly_reset_at && new Date(r.weekly_reset_at) > new Date() ? r.weekly_xp : 0,
      }));

      const hasWeeklyXp = adjusted.some((r: any) => r.weekly_xp > 0);
      let finalData: any[];

      if (!hasWeeklyXp) {
        finalData = [...adjusted].sort((a: any, b: any) => b.xp - a.xp).slice(0, 5);
        setIsWeekly(false);
      } else {
        finalData = [...adjusted].sort((a: any, b: any) => b.weekly_xp - a.weekly_xp).slice(0, 5);
        setIsWeekly(true);
      }

      const userIds = finalData.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.display_name]));

      const entries = finalData.map((r: any) => ({
        userId: r.user_id,
        displayName: nameMap.get(r.user_id) || "Anônimo",
        weeklyXp: r.weekly_xp,
        xp: r.xp,
        level: r.level,
      }));

      setRanking(entries);

      const idx = entries.findIndex((e) => e.userId === user?.id);
      if (idx >= 0) {
        setUserRank(idx + 1);
      } else {
        const { count } = await supabase
          .from("user_gamification")
          .select("id", { count: "exact", head: true })
          .gt(hasWeeklyXp ? "weekly_xp" : "xp", 0);
        setUserRank(count ? count + 1 : null);
      }

      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="glass-card p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {isWeekly ? (
            <Crown className="h-5 w-5 text-amber-500" />
          ) : (
            <Trophy className="h-5 w-5 text-amber-500" />
          )}
          {isWeekly ? "Ranking Semanal" : "Ranking Geral"}
        </h2>
        <Link
          to="/dashboard/conquistas"
          className="text-xs text-primary hover:underline flex items-center gap-0.5"
        >
          Ver tudo <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {ranking.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">🏆</div>
          <p className="text-sm text-muted-foreground">
            Comece a estudar para aparecer no ranking!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranking.map((r, i) => {
            const isMe = r.userId === user?.id;
            const displayXp = isWeekly ? r.weeklyXp : r.xp;
            return (
              <div
                key={r.userId}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                  isMe
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-secondary/30"
                }`}
              >
                <span className="text-lg w-7 text-center font-bold">
                  {i < 3 ? medals[i] : i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {isMe ? "Você" : r.displayName}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Nível {r.level}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-primary">
                    {isWeekly ? `+${displayXp}` : displayXp.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground">XP</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {userRank && userRank > 5 && (
        <div className="mt-3 text-center text-xs text-muted-foreground">
          Sua posição: <span className="font-bold text-foreground">#{userRank}</span>
        </div>
      )}
    </div>
  );
};

export default MiniLeaderboard;
