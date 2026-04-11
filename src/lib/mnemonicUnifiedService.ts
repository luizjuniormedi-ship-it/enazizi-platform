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

async function extractFunctionErrorMessage(error: unknown): Promise<string> {
  const response =
    typeof error === "object" && error !== null && "context" in error
      ? (error as { context?: Response }).context
      : undefined;

  if (response) {
    try {
      const payload = await response.clone().json();
      if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
        return payload.error;
      }
      return JSON.stringify(payload);
    } catch {
      try {
        const text = await response.text();
        if (!text) return "Erro ao gerar mnemônico.";

        try {
          const payload = JSON.parse(text);
          if (payload && typeof payload.error === "string") {
            return payload.error;
          }
        } catch {
          // Keep raw text fallback below
        }

        return text;
      } catch {
        // Fall through to generic message
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Erro ao gerar mnemônico.";
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

  let data: unknown = null;
  let invokeError: unknown = null;

  try {
    const response = await supabase.functions.invoke("generate-mnemonic", {
      body: { topic: topic.trim(), items, contentType, userId, source, sourceContext },
    });

    data = response.data;
    invokeError = response.error;
  } catch (error) {
    const message = await extractFunctionErrorMessage(error);
    console.error("[MnemonicUnified] Edge function threw:", message);
    return { success: false, error: message };
  }

  if (invokeError) {
    const message = await extractFunctionErrorMessage(invokeError);
    console.error("[MnemonicUnified] Edge function error:", message);
    return { success: false, error: message };
  }

  const payload = data as (Partial<MnemonicResult> & { rejected?: boolean; error?: string }) | null;

  if (payload?.rejected) {
    return { success: false, error: payload.error || "Rejeitado pelos auditores." };
  }

  if (!payload) {
    return { success: false, error: "Resposta inválida ao gerar mnemônico." };
  }

  const result = payload as MnemonicResult;

  if (result.assetId && userId) {
    await linkMnemonicToUser(userId, result.assetId, topic, source);
  }

  return { success: true, result };
}

// ══════════════════════════════════════════════════
// LINK MANAGEMENT
// ══════════════════════════════════════════════════

async function linkMnemonicToUser(
  userId: string,
  assetId: string,
  topic: string,
  source: string
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

  if (error) {
    console.error("[MnemonicUnified] Link failed:", error.message);
  }
}
