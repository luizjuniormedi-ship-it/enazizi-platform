/**
 * Mnemonic Auto-Repair — retries generation after audit rejection.
 * Analyzes audit error, adjusts items, and calls generate again.
 * Max 2 repair attempts. Fail-closed: if repair fails, returns rejection.
 */

import { supabase } from "@/integrations/supabase/client";
import { optimizeMnemonicItems } from "./mnemonicOptimizer";
import type { MnemonicResponse, GenerateMnemonicParams } from "./mnemonicUnifiedService";

// ══════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════

export interface AutoRepairParams {
  topic: string;
  items: string[];
  contentType: string;
  auditError: string;
  audit?: { medical_score: number; pedagogical_score: number };
  userId: string;
  source: "adaptive" | "manual";
  sourceContext?: GenerateMnemonicParams["sourceContext"];
}

export interface AutoRepairResult {
  repaired: boolean;
  response: MnemonicResponse;
  repairAttempts: number;
  repairActions: string[];
}

// ══════════════════════════════════════════════════
// ERROR PATTERN → REPAIR ACTION MAP
// ══════════════════════════════════════════════════

interface RepairAction {
  pattern: RegExp;
  action: "add_item" | "remove_item" | "reorder" | "shorten" | "regenerate";
  itemToAdd?: string;
  description: string;
}

const REPAIR_RULES: RepairAction[] = [
  // Missing specific items
  { pattern: /onda q|q patolog/i, action: "add_item", itemToAdd: "Onda Q", description: "Adicionado Onda Q faltante" },
  { pattern: /supra.*st|supradesnivelamento/i, action: "add_item", itemToAdd: "Supra ST", description: "Adicionado Supra ST faltante" },
  { pattern: /inversao.*t|onda t/i, action: "add_item", itemToAdd: "Inversão T", description: "Adicionado Inversão T faltante" },
  { pattern: /lactato/i, action: "add_item", itemToAdd: "Lactato elevado", description: "Adicionado Lactato faltante" },
  { pattern: /hipotensao|choque/i, action: "add_item", itemToAdd: "Hipotensão", description: "Adicionado Hipotensão faltante" },
  { pattern: /disfuncao.*organ/i, action: "add_item", itemToAdd: "Disfunção orgânica", description: "Adicionado Disfunção orgânica faltante" },
  { pattern: /deficit.*neurolog|focal/i, action: "add_item", itemToAdd: "Déficit focal", description: "Adicionado Déficit focal faltante" },
  { pattern: /tempo.*inicio|janela/i, action: "add_item", itemToAdd: "Tempo de início", description: "Adicionado Tempo de início faltante" },
  { pattern: /imagem|tc|tomografia/i, action: "add_item", itemToAdd: "TC de crânio", description: "Adicionado TC de crânio faltante" },

  // Structural issues → regenerate with optimization
  { pattern: /incompleto|cobertura|nao cobre/i, action: "regenerate", description: "Regeneração por cobertura incompleta" },
  { pattern: /redundan|duplica/i, action: "regenerate", description: "Regeneração por redundância" },
  { pattern: /generi|vago|fraco/i, action: "regenerate", description: "Regeneração por itens genéricos" },
  { pattern: /conflito|inconsisten/i, action: "regenerate", description: "Regeneração por conflito conceitual" },
];

// ══════════════════════════════════════════════════
// DANGEROUS TERMS — never auto-add
// ══════════════════════════════════════════════════

const DANGEROUS_PATTERNS = [
  /\bdose\b/i, /\bmg\b/i, /\bml\b/i, /\bposologia\b/i,
  /\bcontraindicac/i, /\bemergencia\b/i,
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ══════════════════════════════════════════════════
// REPAIR LOGIC
// ══════════════════════════════════════════════════

function analyzeAndRepairItems(
  items: string[],
  auditError: string,
  topic: string
): { repairedItems: string[]; actions: string[] } {
  const actions: string[] = [];
  let working = [...items];
  const normalizedItems = working.map(normalize);

  for (const rule of REPAIR_RULES) {
    if (!rule.pattern.test(normalize(auditError))) continue;

    if (rule.action === "add_item" && rule.itemToAdd) {
      // Check if item already exists
      const normNew = normalize(rule.itemToAdd);
      if (normalizedItems.some((ni) => ni.includes(normNew) || normNew.includes(ni))) continue;
      // Check dangerous
      if (DANGEROUS_PATTERNS.some((p) => p.test(rule.itemToAdd!))) continue;
      // Check limit
      if (working.length >= 7) continue;

      working.push(rule.itemToAdd);
      normalizedItems.push(normNew);
      actions.push(rule.description);
    }

    if (rule.action === "regenerate") {
      actions.push(rule.description);
    }
  }

  // Always re-optimize after repair
  const optimized = optimizeMnemonicItems({ topic, items: working });
  if (optimized.changes.length > 0) {
    actions.push("Re-otimização aplicada");
  }

  return { repairedItems: optimized.optimizedItems, actions };
}

// ══════════════════════════════════════════════════
// MAIN FUNCTION
// ══════════════════════════════════════════════════

const MAX_REPAIR_ATTEMPTS = 2;

export async function autoRepairMnemonic(
  params: AutoRepairParams
): Promise<AutoRepairResult> {
  const { topic, contentType, auditError, userId, source, sourceContext } = params;
  let currentItems = [...params.items];
  const allActions: string[] = [];

  for (let attempt = 1; attempt <= MAX_REPAIR_ATTEMPTS; attempt++) {
    // Analyze error and repair items
    const { repairedItems, actions } = analyzeAndRepairItems(currentItems, auditError, topic);
    allActions.push(...actions.map((a) => `[Tentativa ${attempt}] ${a}`));

    // If no actions were taken and items didn't change, skip retry
    if (actions.length === 0 && repairedItems.length === currentItems.length &&
        repairedItems.every((item, i) => item === currentItems[i])) {
      break;
    }

    currentItems = repairedItems;

    // Guard: must still be 3-7 items
    if (currentItems.length < 3 || currentItems.length > 7) {
      break;
    }

    // Retry generation
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("generate-mnemonic", {
        body: {
          topic: topic.trim(),
          items: currentItems,
          contentType,
          userId,
          source,
          sourceContext,
          forceRegenerate: true,
        },
      });

      if (invokeError) {
        // Check if it's another rejection — continue loop
        const errText = typeof invokeError === "string" ? invokeError :
          (invokeError as any)?.message || JSON.stringify(invokeError);
        allActions.push(`[Tentativa ${attempt}] Rejeitado novamente: ${errText.slice(0, 100)}`);
        continue;
      }

      const payload = data as any;
      if (payload?.rejected) {
        allActions.push(`[Tentativa ${attempt}] Rejeitado: ${payload.error?.slice(0, 100)}`);
        continue;
      }

      if (payload) {
        // Success!
        return {
          repaired: true,
          response: { success: true, result: payload },
          repairAttempts: attempt,
          repairActions: allActions,
        };
      }
    } catch (e) {
      allActions.push(`[Tentativa ${attempt}] Erro: ${(e as Error).message?.slice(0, 100)}`);
    }
  }

  // All attempts failed — return original rejection
  return {
    repaired: false,
    response: {
      success: false,
      rejected: true,
      error: auditError,
      audit: params.audit,
    },
    repairAttempts: MAX_REPAIR_ATTEMPTS,
    repairActions: allActions,
  };
}
