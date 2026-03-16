import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

/**
 * Checks for pending reviews and streak risk on mount,
 * then shows toast notifications once per session.
 */
export function useRevisionNotifier() {
  const { user } = useAuth();
  const { toast } = useToast();
  const hasNotified = useRef(false);

  useEffect(() => {
    if (!user || hasNotified.current) return;

    const check = async () => {
      const today = new Date().toISOString().slice(0, 10);

      const [pendingRes, gamifRes] = await Promise.all([
        supabase
          .from("revisoes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "pendente")
          .lte("data_revisao", today),
        supabase
          .from("user_gamification")
          .select("current_streak, last_activity_date")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      hasNotified.current = true;

      const pendingCount = pendingRes.count || 0;
      if (pendingCount > 0) {
        toast({
          title: `📚 ${pendingCount} revisão(ões) pendente(s)!`,
          description: "Revise agora para manter o conhecimento fresco.",
          duration: 8000,
        });
      }

      // Streak risk: last activity was yesterday and no activity today yet
      const gamif = gamifRes.data;
      if (gamif && gamif.current_streak >= 3) {
        const lastDate = gamif.last_activity_date;
        if (lastDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().slice(0, 10);

          if (lastDate === yesterdayStr) {
            setTimeout(() => {
              toast({
                title: `🔥 Streak de ${gamif.current_streak} dias em risco!`,
                description: "Complete uma atividade hoje para não perder sua sequência.",
                duration: 10000,
              });
            }, 3000); // delay to not overlap with revision toast
          }
        }
      }
    };

    // Small delay to avoid blocking initial render
    const timer = setTimeout(check, 2000);
    return () => clearTimeout(timer);
  }, [user, toast]);
}
