import { Flame, Star, TrendingUp } from "lucide-react";
import { useGamification, levelFromXp, getLevelName } from "@/hooks/useGamification";
import { Link } from "react-router-dom";

const XpWidget = () => {
  const { gamification, loading } = useGamification();

  if (loading || !gamification) return null;

  const { currentLevelXp, nextLevelXp } = levelFromXp(gamification.xp);
  const progress = Math.round((currentLevelXp / nextLevelXp) * 100);
  const levelName = getLevelName(gamification.level);

  return (
    <Link to="/dashboard/conquistas" className="block">
      <div className="glass-card p-3 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
              {gamification.level}
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">{levelName}</div>
              <div className="text-[10px] text-muted-foreground">{gamification.xp.toLocaleString()} XP total</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {gamification.currentStreak > 0 && (
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="h-4 w-4" />
                <span className="text-xs font-bold">{gamification.currentStreak}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium">+{gamification.weeklyXp} sem</span>
            </div>
          </div>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">{currentLevelXp} / {nextLevelXp} XP</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Star className="h-3 w-3" /> Conquistas
          </span>
        </div>
      </div>
    </Link>
  );
};

export default XpWidget;
