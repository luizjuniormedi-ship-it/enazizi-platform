import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Snowflake } from "lucide-react";

/**
 * Compact streak banner — shows current streak inline on dashboard.
 * Professional tone, no gamification fluff.
 */
export default function StreakBanner() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["streak-banner", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: gam } = await supabase
        .from("user_gamification")
        .select("current_streak, longest_streak, freeze_available")
        .eq("user_id", user!.id)
        .maybeSingle();
      return gam;
    },
  });

  if (!data || data.current_streak === 0) return null;

  const streak = data.current_streak;
  const best = data.longest_streak;
  const freeze = data.freeze_available ?? 0;
  const isNearBest = streak >= best - 1 && best > 3;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 animate-fade-in">
      <Flame className="h-4 w-4 text-orange-500 shrink-0" />
      <span className="text-sm font-medium flex-1">
        {streak} dia{streak > 1 ? "s" : ""} consecutivo{streak > 1 ? "s" : ""} estudando
        {isNearBest && <span className="text-orange-500 ml-1">· próximo do recorde!</span>}
      </span>
      {freeze > 0 && (
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5" title="Proteção de streak disponível">
          <Snowflake className="h-3 w-3" /> {freeze}
        </span>
      )}
    </div>
  );
}
