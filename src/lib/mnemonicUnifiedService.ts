/**
 * Unified Mnemonic Service — Single entry point for both manual and adaptive flows.
 * Both modes use the same edge function pipeline (eligibility + dual auditor + fail-closed).
 */
import { supabase } from "@/integrations/supabase/client";

// ══════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════

export interface MnemonicResult {
  topic: string;
  mnemonic: string;
  phrase: string;
  items_map: Array<{
    letter: string;
    word: string;
    original_item: string;
    symbol: string | null;
    symbol_reason: string | null;
  }>;
  scene_description: string;
  image_url: string | null;
  quality_score: number;
  warning: string | null;
  review_question: string;
  audit?: {
    medical_score: number;
    pedagogical_score: number;
    medical_summary: string;
    pedagogical_summary: string;
    verdict: string;
  };
  assetId: string | null;
  cached: boolean;
}

export interface GenerateMnemonicParams {
  userId: string;
  topic: string;
  contentType: string;
  items: string[];
  source: "adaptive" | "manual";
  sourceContext?: {
    topicId?: string;
    questionId?: string;
    attemptId?: string;
  };
}

// ══════════════════════════════════════════════════
// HASH (mirrors edge function)
// ══════════════════════════════════════════════════

function generateMnemonicHash(topic: string, items: string[]): string {
  const normalized = [topic.toLowerCase().trim(), ...items.map(i => i.toLowerCase().trim()).sort()].join("|");
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const chr = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return `mn_${Math.abs(hash).toString(36)}`;
}

// ══════════════════════════════════════════════════
// CENTRAL FUNCTION — generateOrReuseMnemonicForUser
// Used by: manual button, adaptive trigger, MnemonicGenerator page
// ══════════════════════════════════════════════════

export async function generateOrReuseMnemonicForUser(
  params: GenerateMnemonicParams
): Promise<{ success: boolean; result?: MnemonicResult; error?: string }> {
  const { userId, topic, contentType, items, source, sourceContext } = params;

  if (items.length < 3 || items.length > 7) {
    return { success: false, error: "Informe entre 3 e 7 itens." };
  }
  if (!topic.trim()) {
    return { success: false, error: "Informe o tema." };
  }

  const hash = generateMnemonicHash(topic, items);

  // Call unified edge function
  const { data, error } = await supabase.functions.invoke("generate-mnemonic", {
    body: { topic: topic.trim(), items, contentType, userId, hash, source, sourceContext },
  });

  if (error) {
    console.error("[MnemonicUnified] Edge function error:", error.message);
    return { success: false, error: error.message };
  }

  if (data?.rejected) {
    return { success: false, error: data.error || "Rejeitado pelos auditores." };
  }

  const result = data as MnemonicResult;

  // Link to user if we have an assetId
  if (result.assetId && userId) {
    await linkMnemonicToUser(userId, result.assetId, topic, source);
  }

  return { success: true, result };
}

// ══════════════════════════════════════════════════
// LINK MANAGEMENT
// ══════════════════════════════════════════════════

async function linkMnemonicToUser(
  userId: string, assetId: string, topic: string, source: string
) {
  const { error } = await supabase
    .from("user_mnemonic_links")
    .upsert({
      user_id: userId,
      mnemonic_asset_id: assetId,
      topic,
      trigger_source: source === "adaptive" ? "error_bank" : "manual",
      next_review_at: new Date(Date.now() + 86400000).toISOString(),
    }, { onConflict: "user_id,mnemonic_asset_id" });

  if (error) console.error("[MnemonicUnified] Link failed:", error.message);
}
