/**
 * Adaptive Mnemonic Service — Error-based trigger layer.
 * Delegates ALL generation to the unified service (generateOrReuseMnemonicForUser).
 */
import { supabase } from "@/integrations/supabase/client";
import { generateOrReuseMnemonicForUser } from "./mnemonicUnifiedService";

// ══════════════════════════════════════════════════
// TYPES (re-exported for consumers)
// ══════════════════════════════════════════════════

export type { MnemonicResult } from "./mnemonicUnifiedService";

type MnemonicStatus = "approved_visual" | "approved_text_map_only" | "rejected";

interface MnemonicAsset {
  id: string;
  hash: string;
  topic: string;
  mnemonic: string;
  phrase: string;
  items_map_json: any;
  scene_description: string | null;
  image_url: string | null;
  quality_score: number;
  verdict: MnemonicStatus;
  review_question: string | null;
}

interface UserMnemonicLink {
  id: string;
  mnemonic_asset_id: string;
  topic: string;
  next_review_at: string;
  times_shown: number;
  helped_after_error: boolean | null;
  improvement_delta: number | null;
  mnemonic_not_helping: boolean;
  mnemonic_assets?: MnemonicAsset;
}

export interface PendingMnemonic {
  asset: MnemonicAsset;
  link: UserMnemonicLink;
  reason: "post_error" | "pre_session" | "spaced_review";
}

// ══════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════

const MIN_ERRORS_TRIGGER = 2;
const MAX_ACTIVE_MNEMONICS = 3;
const COOLDOWN_DAYS = 7;

const BLOCKED_KEYWORDS = [
  "dosagem", "posologia", "dose", "mg/kg", "mg/dl",
  "protocolo de emergência", "reanimação", "pcr",
  "timing", "intervalo de tempo", "contraindicação absoluta",
];

function isTopicEligibleForMnemonic(topic: string, content?: string): boolean {
  const combined = `${topic} ${content || ""}`.toLowerCase();
  return !BLOCKED_KEYWORDS.some(kw => combined.includes(kw));
}

// ══════════════════════════════════════════════════
// TRIGGER DETECTION
// ══════════════════════════════════════════════════

interface TriggerCheckResult {
  shouldTrigger: boolean;
  reason?: string;
  topic?: string;
}

export async function checkMnemonicTrigger(
  userId: string, topic: string
): Promise<TriggerCheckResult> {
  if (!isTopicEligibleForMnemonic(topic)) return { shouldTrigger: false };

  const { data: errors } = await supabase
    .from("error_bank")
    .select("id, vezes_errado, conteudo, subtema")
    .eq("user_id", userId)
    .eq("tema", topic)
    .eq("dominado", false)
    .order("vezes_errado", { ascending: false })
    .limit(5);

  const totalErrors = errors?.reduce((sum, e) => sum + (e.vezes_errado || 1), 0) || 0;
  if (totalErrors < MIN_ERRORS_TRIGGER) return { shouldTrigger: false };

  const { count: activeCount } = await supabase
    .from("user_mnemonic_links")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("mnemonic_not_helping", false)
    .lte("next_review_at", new Date(Date.now() + 7 * 86400000).toISOString());

  if ((activeCount || 0) >= MAX_ACTIVE_MNEMONICS) return { shouldTrigger: false };

  const { data: recentLink } = await supabase
    .from("user_mnemonic_links")
    .select("id, created_at")
    .eq("user_id", userId)
    .eq("topic", topic)
    .gte("created_at", new Date(Date.now() - COOLDOWN_DAYS * 86400000).toISOString())
    .limit(1);

  if (recentLink && recentLink.length > 0) return { shouldTrigger: false };

  return { shouldTrigger: true, reason: `${totalErrors} erros no tema "${topic}"`, topic };
}

// ══════════════════════════════════════════════════
// SERVING: Get pending mnemonics
// ══════════════════════════════════════════════════

export async function getPendingMnemonics(
  userId: string, currentTopic?: string
): Promise<PendingMnemonic[]> {
  const now = new Date().toISOString();
  const results: PendingMnemonic[] = [];

  const { data: dueLinks } = await supabase
    .from("user_mnemonic_links")
    .select("*, mnemonic_assets(*)")
    .eq("user_id", userId)
    .eq("mnemonic_not_helping", false)
    .lte("next_review_at", now)
    .order("next_review_at", { ascending: true })
    .limit(3);

  if (dueLinks) {
    for (const link of dueLinks) {
      const asset = (link as any).mnemonic_assets as MnemonicAsset;
      if (asset && asset.verdict !== "rejected") {
        results.push({ asset, link: link as unknown as UserMnemonicLink, reason: "spaced_review" });
      }
    }
  }

  if (currentTopic && results.length < MAX_ACTIVE_MNEMONICS) {
    const { data: topicLinks } = await supabase
      .from("user_mnemonic_links")
      .select("*, mnemonic_assets(*)")
      .eq("user_id", userId)
      .eq("topic", currentTopic)
      .eq("mnemonic_not_helping", false)
      .limit(1);

    if (topicLinks) {
      for (const link of topicLinks) {
        const asset = (link as any).mnemonic_assets as MnemonicAsset;
        if (asset && asset.verdict !== "rejected" && !results.find(r => r.asset.id === asset.id)) {
          results.push({ asset, link: link as unknown as UserMnemonicLink, reason: "pre_session" });
        }
      }
    }
  }

  return results.slice(0, MAX_ACTIVE_MNEMONICS);
}

// ══════════════════════════════════════════════════
// MARK AS SHOWN
// ══════════════════════════════════════════════════

export async function markMnemonicShown(linkId: string) {
  const { data } = await supabase.from("user_mnemonic_links").select("times_shown").eq("id", linkId).single();
  await supabase
    .from("user_mnemonic_links")
    .update({
      times_shown: (data?.times_shown || 0) + 1,
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", linkId);
}

// ══════════════════════════════════════════════════
// EFFICACY MEASUREMENT
// ══════════════════════════════════════════════════

export async function updateMnemonicEfficacy(
  userId: string, topic: string, wasCorrect: boolean
) {
  const { data: links } = await supabase
    .from("user_mnemonic_links")
    .select("id, times_shown, helped_after_error, accuracy_before, accuracy_after, mnemonic_not_helping")
    .eq("user_id", userId)
    .eq("topic", topic)
    .eq("mnemonic_not_helping", false);

  if (!links || links.length === 0) return;

  for (const link of links) {
    if (link.times_shown === 0) continue;

    const newAccuracyAfter = link.accuracy_after !== null
      ? (Number(link.accuracy_after) * 0.7 + (wasCorrect ? 100 : 0) * 0.3)
      : (wasCorrect ? 100 : 0);

    const improvementDelta = link.accuracy_before !== null
      ? newAccuracyAfter - Number(link.accuracy_before)
      : null;

    const helped = improvementDelta !== null ? improvementDelta > 0 : null;

    let nextReviewAt: string;
    if (helped) {
      const intervalDays = link.times_shown <= 1 ? 3 : 7;
      nextReviewAt = new Date(Date.now() + intervalDays * 86400000).toISOString();
    } else {
      nextReviewAt = new Date(Date.now() + 86400000).toISOString();
    }

    const markNotHelping = link.times_shown >= 2 && improvementDelta !== null && improvementDelta <= 0;

    await supabase
      .from("user_mnemonic_links")
      .update({
        accuracy_after: newAccuracyAfter,
        improvement_delta: improvementDelta,
        helped_after_error: helped,
        next_review_at: nextReviewAt,
        mnemonic_not_helping: markNotHelping || link.mnemonic_not_helping,
      })
      .eq("id", link.id);
  }
}

export async function recordBaselineAccuracy(
  userId: string, topic: string, accuracy: number
) {
  await supabase
    .from("user_mnemonic_links")
    .update({ accuracy_before: accuracy })
    .eq("user_id", userId)
    .eq("topic", topic)
    .is("accuracy_before", null);
}

// ══════════════════════════════════════════════════
// FIRE-AND-FORGET TRIGGER (called from completeStudyAction)
// Uses unified pipeline via generateOrReuseMnemonicForUser
// ══════════════════════════════════════════════════

export function triggerAdaptiveMnemonicCheck(userId: string, topic: string) {
  checkMnemonicTrigger(userId, topic).then(async (result) => {
    if (!result.shouldTrigger) return;
    console.log(`[MnemonicAdaptive] Triggering for "${topic}":`, result.reason);

    const { data: errors } = await supabase
      .from("error_bank")
      .select("conteudo")
      .eq("user_id", userId)
      .eq("tema", topic)
      .eq("dominado", false)
      .not("conteudo", "is", null)
      .limit(5);

    if (!errors || errors.length === 0) return;

    const items = errors
      .map(e => e.conteudo?.trim())
      .filter(Boolean)
      .slice(0, 7) as string[];

    if (items.length < 3) return;

    // Uses the SAME unified pipeline as manual generation
    await generateOrReuseMnemonicForUser({
      userId,
      topic,
      contentType: "criterios",
      items,
      source: "adaptive",
    });
  }).catch(err => {
    console.error("[MnemonicAdaptive] Trigger check failed:", err);
  });
}
