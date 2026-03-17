import { useEffect, useState } from "react";
import { Medal, Crown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface RankEntry {
  userId: string;
  displayName: string;
  weeklyXp: number;
  level: number;
}

const MiniLeaderboard = () => {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("user_gamification")
        .select("user_id, weekly_xp, level")
        .order("weekly_xp", { ascending: false })
        .limit(5);

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      const userIds = data.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.display_name]));

      const entries = data.map((r: any) => ({
        userId: r.user_id,
        displayName: nameMap.get(r.user_id) || "Anônimo",
        weeklyXp: r.weekly_xp,
        level: r.level,
      }));

      setRanking(entries);

      // Find user rank if not in top 5
      const idx = entries.findIndex((e) => e.userId === user?.id);
      if (idx >= 0) {
        setUserRank(idx + 1);
      } else {
        // Count how many have more weekly XP
        const userEntry = data.find((r: any) => r.user_id === user?.id);
        if (!userEntry) {
          const { count } = await supabase
            .from("user_gamification")
            .select("id", { count: "exact", head: true })
            .gt("weekly_xp", 0);
          setUserRank(count ? count + 1 : null);
        }
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

  if (ranking.length === 0) return null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          Ranking Semanal
        </h2>
        <Link
          to="/dashboard/conquistas"
          className="text-xs text-primary hover:underline flex items-center gap-0.5"
        >
          Ver tudo <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {ranking.map((r, i) => {
          const isMe = r.userId === user?.id;
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
                  +{r.weeklyXp}
                </div>
                <div className="text-[10px] text-muted-foreground">XP</div>
              </div>
            </div>
          );
        })}
      </div>

      {userRank && userRank > 5 && (
        <div className="mt-3 text-center text-xs text-muted-foreground">
          Sua posição: <span className="font-bold text-foreground">#{userRank}</span>
        </div>
      )}
    </div>
  );
};

export default MiniLeaderboard;
