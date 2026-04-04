/**
 * Fire-and-forget FSRS card creation utility.
 * Ensures a card exists for a given user/type/ref without duplicates.
 * Uses the unique constraint (user_id, card_type, card_ref_id).
 */
import { supabase } from "@/integrations/supabase/client";

export function ensureFsrsCard(
  userId: string,
  cardType: string,
  cardRefId: string
): void {
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
