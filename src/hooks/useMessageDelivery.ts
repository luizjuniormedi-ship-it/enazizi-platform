import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getBestTemplate,
  interpolate,
  isOnCooldown,
  markDelivered,
  detectStudentProfile,
  type TriggerType,
  type MessageVariables,
  type MessageTemplate,
  type StudentProfile,
  type StudentState,
} from "@/lib/messageLibrary";

interface DeliveredMessage {
  template: MessageTemplate;
  interpolatedTitle: string;
  interpolatedBody: string;
}

/**
 * Hook that evaluates student context and delivers the right message
 * through in-app toasts. Respects cooldowns and profile-aware selection.
 */
export function useMessageDelivery() {
  const { user } = useAuth();
  const hasRunRef = useRef(false);

  const deliverMessage = useCallback((
    triggerType: TriggerType,
    vars: MessageVariables,
    profileOverride?: StudentProfile,
    stateOverride?: StudentState,
  ): DeliveredMessage | null => {
    const profile = profileOverride || "consistent";
    const state = stateOverride || "active";

    const template = getBestTemplate({ trigger_type: triggerType, profile, state });
    if (!template) return null;
    if (isOnCooldown(template)) return null;

    const title = interpolate(template.title, vars);
    const body = interpolate(template.body, vars);

    // Deliver via in-app toast
    if (template.channels.includes("in_app")) {
      const toastFn = template.severity === "critical" ? toast.error
        : template.severity === "warning" ? toast.warning
        : toast.success;

      toastFn(title, {
        description: body,
        duration: 6000,
        action: template.cta_path ? {
          label: template.cta_label,
          onClick: () => { window.location.href = template.cta_path!; },
        } : undefined,
      });
    }

    markDelivered(template.message_key);

    return {
      template,
      interpolatedTitle: title,
      interpolatedBody: body,
    };
  }, []);

  /**
   * Auto-evaluate context and trigger relevant messages on mount.
   * Runs once per session.
   */
  const evaluateAndDeliver = useCallback(async () => {
    if (!user || hasRunRef.current) return;
    hasRunRef.current = true;

    try {
      const todayStr = new Date().toISOString().split("T")[0];

      const [gamifRes, overdueRes, profileRes, approvalRes] = await Promise.all([
        supabase.from("user_gamification")
          .select("current_streak, last_activity_date, weekly_xp")
          .eq("user_id", user.id).maybeSingle(),
        supabase.from("revisoes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id).eq("status", "pendente").lt("data_revisao", todayStr),
        supabase.from("profiles")
          .select("display_name, has_completed_diagnostic")
          .eq("user_id", user.id).maybeSingle(),
        supabase.from("approval_scores")
          .select("score").eq("user_id", user.id)
          .order("created_at", { ascending: false }).limit(2),
      ]);

      const streak = gamifRes.data?.current_streak || 0;
      const lastActivity = gamifRes.data?.last_activity_date;
      const overdueCount = overdueRes.count || 0;
      const studentName = profileRes.data?.display_name || "";
      const hasDiagnostic = profileRes.data?.has_completed_diagnostic || false;
      const scores = (approvalRes.data || []) as any[];
      const currentScore = scores[0]?.score || 0;
      const prevScore = scores[1]?.score || currentScore;
      const scoreTrend = currentScore > prevScore ? "up" : currentScore < prevScore ? "down" : "stable";

      // Calculate days inactive
      let daysInactive = 0;
      if (lastActivity) {
        daysInactive = Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000);
      }

      const { profile, state } = detectStudentProfile({
        streak,
        daysInactive,
        recentAccuracy: 60, // simplified - would need practice_attempts query
        overdueReviews: overdueCount,
        questionsThisWeek: 0,
        approvalScoreTrend: scoreTrend as any,
        errorRate: 0,
      });

      const vars: MessageVariables = {
        student_name: studentName,
        streak_days: streak,
        overdue_reviews_count: overdueCount,
        approval_score: currentScore,
        days_inactive: daysInactive,
      };

      // Trigger contextual messages based on state
      if (daysInactive >= 7) {
        deliverMessage("inactivity", vars, profile, state);
      } else if (daysInactive >= 3) {
        deliverMessage("inactivity", vars, profile, state);
      } else if (daysInactive >= 1 && daysInactive < 3) {
        deliverMessage("return_after_absence", vars, profile, state);
      }

      if (overdueCount > 10) {
        deliverMessage("overdue_reviews", vars, profile, "risk");
      } else if (overdueCount > 5) {
        deliverMessage("overdue_reviews", vars, profile, "attention");
      }

      if (scoreTrend === "down" && currentScore < 60) {
        deliverMessage("approval_score_drop", vars, profile, state);
      }

      if (!hasDiagnostic) {
        deliverMessage("nivelamento_reminder", vars, profile, state);
      }

      if (profile === "consistent" && streak >= 5) {
        deliverMessage("positive_reinforcement", vars, profile, state);
      }

      if (profile === "studying_the_wrong_way") {
        deliverMessage("tutor_recommendation", vars, profile, state);
      }

    } catch (err) {
      console.error("[MessageDelivery] Error evaluating context:", err);
    }
  }, [user, deliverMessage]);

  return { deliverMessage, evaluateAndDeliver };
}
