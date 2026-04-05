/**
 * Fire-and-forget FSRS card creation utility.
 * Ensures a card exists for a given user/type/ref without duplicates.
 * Uses the unique constraint (user_id, card_type, card_ref_id).
 *
 * Controlled by feature flag `new_fsrs_flow_enabled`.
 * When disabled via setFsrsEnabled(false), all calls become no-ops.
 */
import { supabase } from "@/integrations/supabase/client";

/** Module-level toggle — set from useFeatureFlags at app init */
let _fsrsEnabled = true;
export function setFsrsEnabled(val: boolean) { _fsrsEnabled = val; }

export function ensureFsrsCard(
  userId: string,
  cardType: string,
  cardRefId: string,
  /** Override module-level flag for specific calls */
  enabled?: boolean
): void {
  if (!(enabled ?? _fsrsEnabled)) return;
  (async () => {
    try {
      await supabase.from("fsrs_cards").insert({
        user_id: userId,
        card_type: cardType,
        card_ref_id: cardRefId,
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: 0,
        lapses: 0,
        state: 0,
        due: new Date().toISOString(),
        last_review: null,
      });
      // ON CONFLICT will silently fail due to unique constraint — that's fine
    } catch {
      // Ignore — card already exists or transient error
    }
  })();
}
