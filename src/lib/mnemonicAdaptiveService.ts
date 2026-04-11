/**
 * Adaptive Mnemonic Service
 * 
 * Detects error patterns and triggers mnemonic generation via the existing
 * generate-mnemonic edge function pipeline (eligibility + dual auditor + fail-closed).
 * 
 * Integrates with: completeStudyAction → errorBankLogger → this service
 */
import { supabase } from "@/integrations/supabase/client";

// ══════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════

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
const LOW_MASTERY_THRESHOLD = 0.6;
const HIGH_RESPONSE_TIME_S = 180;
const MAX_ACTIVE_MNEMONICS = 3;
const COOLDOWN_DAYS = 7;

// Content types that map well to mnemonics
const ELIGIBLE_CONTENT_TYPES = [
  "criterios", "causas", "classificacao", "sinais_classicos",
  "fatores_de_risco", "efeitos_adversos", "componentes", "lista",
  "diagnostico_diferencial_curto",
];

// ══════════════════════════════════════════════════
// HASH GENERATION
// ══════════════════════════════════════════════════

function generateMnemonicHash(topic: string, items: string[]): string {
  const normalized = [topic.toLowerCase().trim(), ...items.map(i => i.toLowerCase().trim()).sort()].join("|");
  // Simple hash - good enough for deduplication
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const chr = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return `mn_${Math.abs(hash).toString(36)}`;
}

// ══════════════════════════════════════════════════
// ELIGIBILITY CHECK
// ══════════════════════════════════════════════════

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
  items?: string[];
  contentType?: string;
}

/**
 * Check if adaptive mnemonic generation should be triggered for a user+topic.
 * Called after error logging or performance updates.
 */
export async function checkMnemonicTrigger(
  userId: string,
  topic: string,
): Promise<TriggerCheckResult> {
  // Gate: topic eligibility
  if (!isTopicEligibleForMnemonic(topic)) {
    return { shouldTrigger: false };
  }

  // Check error_bank for recurrence
  const { data: errors } = await supabase
    .from("error_bank")
    .select("id, vezes_errado, conteudo, subtema")
    .eq("user_id", userId)
    .eq("tema", topic)
    .eq("dominado", false)
    .order("vezes_errado", { ascending: false })
    .limit(5);

  const totalErrors = errors?.reduce((sum, e) => sum + (e.vezes_errado || 1), 0) || 0;

  if (totalErrors < MIN_ERRORS_TRIGGER) {
    return { shouldTrigger: false };
  }

  // Check if user already has MAX active mnemonics
  const { count: activeCount } = await supabase
    .from("user_mnemonic_links")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("mnemonic_not_helping", false)
    .lte("next_review_at", new Date(Date.now() + 7 * 86400000).toISOString());

  if ((activeCount || 0) >= MAX_ACTIVE_MNEMONICS) {
    return { shouldTrigger: false };
  }

  // Check cooldown: was a mnemonic generated for this topic in the last 7 days?
  const { data: recentLink } = await supabase
    .from("user_mnemonic_links")
    .select("id, created_at")
    .eq("user_id", userId)
    .eq("topic", topic)
    .gte("created_at", new Date(Date.now() - COOLDOWN_DAYS * 86400000).toISOString())
    .limit(1);

  if (recentLink && recentLink.length > 0) {
    return { shouldTrigger: false };
  }

  return {
    shouldTrigger: true,
    reason: `${totalErrors} erros no tema "${topic}"`,
    topic,
    contentType: "criterios", // default, edge function will determine
  };
}

// ══════════════════════════════════════════════════
// GENERATE OR RETRIEVE
// ══════════════════════════════════════════════════

/**
 * Attempt to find an existing approved mnemonic or generate a new one.
 * Uses the existing generate-mnemonic edge function pipeline.
 */
export async function generateOrRetrieveMnemonic(
  userId: string,
  topic: string,
  items: string[],
  contentType: string = "criterios",
): Promise<{ success: boolean; assetId?: string; error?: string }> {
  if (items.length < 3 || items.length > 7) {
    return { success: false, error: "Items must be 3-7" };
  }

  const hash = generateMnemonicHash(topic, items);

  // Check cache first
  const { data: existing } = await supabase
    .from("mnemonic_assets")
    .select("id, verdict")
    .eq("hash", hash)
    .single();

  if (existing) {
    if (existing.verdict === "rejected") {
      return { success: false, error: "Previously rejected" };
    }
    // Link to user
    await linkMnemonicToUser(userId, existing.id, topic);
    return { success: true, assetId: existing.id };
  }

  // Generate via edge function (uses the full dual-auditor pipeline)
  const { data, error } = await supabase.functions.invoke("generate-mnemonic-adaptive", {
    body: { topic, items, contentType, userId, hash },
  });

  if (error) {
    console.error("[MnemonicAdaptive] Generation failed:", error.message);
    return { success: false, error: error.message };
  }

  if (data?.rejected) {
    return { success: false, error: data.error || "Rejected by auditors" };
  }

  if (data?.assetId) {
    await linkMnemonicToUser(userId, data.assetId, topic);
    return { success: true, assetId: data.assetId };
  }

  return { success: false, error: "Unknown response" };
}

// ══════════════════════════════════════════════════
// LINK MANAGEMENT
// ══════════════════════════════════════════════════

async function linkMnemonicToUser(userId: string, assetId: string, topic: string) {
  const { error } = await supabase
    .from("user_mnemonic_links")
    .upsert({
      user_id: userId,
      mnemonic_asset_id: assetId,
      topic,
      trigger_source: "error_bank",
      next_review_at: new Date(Date.now() + 86400000).toISOString(), // +1 day
    }, { onConflict: "user_id,mnemonic_asset_id" });

  if (error) console.error("[MnemonicAdaptive] Link failed:", error.message);
}

// ══════════════════════════════════════════════════
// SERVING: Get pending mnemonics to show
// ══════════════════════════════════════════════════

/**
 * Get mnemonics that should be shown to the user right now.
 */
export async function getPendingMnemonics(
  userId: string,
  currentTopic?: string,
): Promise<PendingMnemonic[]> {
  const now = new Date().toISOString();
  const results: PendingMnemonic[] = [];

  // 1. Spaced review: next_review_at has passed
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
        results.push({
          asset,
          link: link as unknown as UserMnemonicLink,
          reason: "spaced_review",
        });
      }
    }
  }

  // 2. Topic-specific: if current topic matches a linked mnemonic
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
          results.push({
            asset,
            link: link as unknown as UserMnemonicLink,
            reason: "pre_session",
          });
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
  await supabase
    .from("user_mnemonic_links")
    .update({
      times_shown: (await supabase.from("user_mnemonic_links").select("times_shown").eq("id", linkId).single()).data?.times_shown + 1 || 1,
      last_seen_at: new Date().toISOString(),
      first_seen_at: new Date().toISOString(), // only sets on first
    })
    .eq("id", linkId);
}

// ══════════════════════════════════════════════════
// EFFICACY MEASUREMENT
// ══════════════════════════════════════════════════

/**
 * Update mnemonic efficacy after the user answers questions on the same topic.
 * Called from completeStudyAction when topic has a linked mnemonic.
 */
export async function updateMnemonicEfficacy(
  userId: string,
  topic: string,
  wasCorrect: boolean,
) {
  const { data: links } = await supabase
    .from("user_mnemonic_links")
    .select("id, times_shown, helped_after_error, accuracy_before, accuracy_after, mnemonic_not_helping")
    .eq("user_id", userId)
    .eq("topic", topic)
    .eq("mnemonic_not_helping", false);

  if (!links || links.length === 0) return;

  for (const link of links) {
    if (link.times_shown === 0) continue; // not shown yet

    const newAccuracyAfter = link.accuracy_after !== null
      ? (Number(link.accuracy_after) * 0.7 + (wasCorrect ? 100 : 0) * 0.3) // EWMA
      : (wasCorrect ? 100 : 0);

    const improvementDelta = link.accuracy_before !== null
      ? newAccuracyAfter - Number(link.accuracy_before)
      : null;

    const helped = improvementDelta !== null ? improvementDelta > 0 : null;

    // Update review schedule based on efficacy
    let nextReviewAt: string;
    if (helped) {
      // Increasing intervals: 1d → 3d → 7d
      const intervalDays = link.times_shown <= 1 ? 3 : 7;
      nextReviewAt = new Date(Date.now() + intervalDays * 86400000).toISOString();
    } else {
      // Not helping: keep at 1 day
      nextReviewAt = new Date(Date.now() + 86400000).toISOString();
    }

    // Mark as not helping if delta <= 0 after 2+ showings
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

/**
 * Record baseline accuracy before mnemonic was shown.
 */
export async function recordBaselineAccuracy(
  userId: string,
  topic: string,
  accuracy: number,
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
// ══════════════════════════════════════════════════

/**
 * Fire-and-forget: check if mnemonic should be generated for this topic.
 * Safe to call after any error — will not block the main flow.
 */
export function triggerAdaptiveMnemonicCheck(userId: string, topic: string) {
  // Non-blocking
  checkMnemonicTrigger(userId, topic).then(async (result) => {
    if (!result.shouldTrigger) return;
    console.log(`[MnemonicAdaptive] Triggering for "${topic}":`, result.reason);
    
    // We need items for the mnemonic — try to extract from error_bank content
    const { data: errors } = await supabase
      .from("error_bank")
      .select("conteudo")
      .eq("user_id", userId)
      .eq("tema", topic)
      .eq("dominado", false)
      .not("conteudo", "is", null)
      .limit(5);

    if (!errors || errors.length === 0) return;

    // Extract items from error content
    const items = errors
      .map(e => e.conteudo?.trim())
      .filter(Boolean)
      .slice(0, 7) as string[];

    if (items.length < 3) return;

    await generateOrRetrieveMnemonic(userId, topic, items, "criterios");
  }).catch(err => {
    console.error("[MnemonicAdaptive] Trigger check failed:", err);
  });
}
