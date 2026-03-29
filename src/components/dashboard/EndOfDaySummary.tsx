import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Moon, TrendingUp, TrendingDown, Minus, Target, Brain, Flame } from "lucide-react";

const STORAGE_KEY = "enazizi_eod_summary_date";

export default function EndOfDaySummary() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["eod-summary", user?.id],
    enabled: !!user,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const startOfDay = `${today}T00:00:00Z`;

      // Questions answered today
      const { count: questionsToday } = await supabase
        .from("practice_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gte("created_at", startOfDay);

      const { data: attempts } = await supabase
        .from("practice_attempts")
        .select("correct")
        .eq("user_id", user!.id)
        .gte("created_at", startOfDay);

      const correct = attempts?.filter((a) => a.correct).length ?? 0;
      const accuracy = (questionsToday || 0) > 0 ? Math.round((correct / (questionsToday || 1)) * 100) : 0;

      // Gamification
      const { data: gam } = await supabase
        .from("user_gamification")
        .select("current_streak, xp, weekly_xp")
        .eq("user_id", user!.id)
        .maybeSingle();

      return {
        questionsToday: questionsToday || 0,
        accuracy,
        correct,
        streak: gam?.current_streak ?? 0,
        xpToday: gam?.weekly_xp ?? 0,
      };
    },
  });

  useEffect(() => {
    if (!data || data.questionsToday < 3) return;
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown === today) return;

    const hour = new Date().getHours();
    if (hour >= 19) {
      const timer = setTimeout(() => setOpen(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toDateString());
    setOpen(false);
  };

  if (!data) return null;

  const getTrend = () => {
    if (data.accuracy >= 70) return { icon: <TrendingUp className="h-5 w-5 text-emerald-500" />, msg: "Excelente dia! Continue assim amanhã! 🚀" };
    if (data.accuracy >= 50) return { icon: <Minus className="h-5 w-5 text-amber-500" />, msg: "Dia razoável. Foque nas revisões amanhã! 💪" };
    return { icon: <TrendingDown className="h-5 w-5 text-destructive" />, msg: "Dia difícil. Revise os erros e volte mais forte! 🔥" };
  };

  const trend = getTrend();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-sm border-primary/20">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Moon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">Resumo do dia 📊</DialogTitle>
              <DialogDescription className="text-xs">Veja como foi seu estudo hoje</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted/50 p-3">
              <Target className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{data.questionsToday}</p>
              <p className="text-[10px] text-muted-foreground">Questões</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <Brain className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{data.accuracy}%</p>
              <p className="text-[10px] text-muted-foreground">Acerto</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <Flame className="h-4 w-4 text-orange-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{data.streak}</p>
              <p className="text-[10px] text-muted-foreground">Streak</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
            {trend.icon}
            <p className="text-sm">{trend.msg}</p>
          </div>
        </div>

        <Button onClick={handleClose} className="w-full">
          Boa noite! 🌙
        </Button>
      </DialogContent>
    </Dialog>
  );
}
