import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { autoRepairMnemonic } from "../mnemonicAutoRepair";
import { supabase } from "@/integrations/supabase/client";

const mockInvoke = vi.mocked(supabase.functions.invoke);

describe("autoRepairMnemonic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("repairs missing Onda Q and succeeds on retry", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        topic: "IAM no ECG",
        mnemonic: "SOI",
        phrase: "Supra, Onda Q, Inversão",
        items_map: [],
        quality_score: 85,
        assetId: "123",
        cached: false,
      },
      error: null,
    });

    const result = await autoRepairMnemonic({
      topic: "IAM no ECG",
      items: ["Supra ST", "Inversão T"],
      contentType: "criterios",
      auditError: "Faltou onda Q patológica no mnemônico",
      userId: "user-1",
      source: "manual",
    });

    expect(result.repaired).toBe(true);
    expect(result.repairAttempts).toBe(1);
    expect(result.repairActions.some((a) => a.includes("Onda Q"))).toBe(true);
  });

  it("returns rejection after max attempts", async () => {
    // Both attempts fail
    mockInvoke
      .mockResolvedValueOnce({ data: { rejected: true, error: "Still bad" }, error: null })
      .mockResolvedValueOnce({ data: { rejected: true, error: "Still bad" }, error: null });

    const result = await autoRepairMnemonic({
      topic: "IAM no ECG",
      items: ["Supra ST", "Inversão T"],
      contentType: "criterios",
      auditError: "Faltou onda Q patológica",
      userId: "user-1",
      source: "manual",
    });

    expect(result.repaired).toBe(false);
    expect(result.repairAttempts).toBe(2);
  });

  it("handles structural regeneration errors", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { topic: "Sepse", mnemonic: "LHD", items_map: [], quality_score: 80, assetId: "456", cached: false },
      error: null,
    });

    const result = await autoRepairMnemonic({
      topic: "Sepse",
      items: ["Lactato elevado", "Hipotensão", "Disfunção orgânica"],
      contentType: "criterios",
      auditError: "Mnemônico não cobre todos itens - cobertura incompleta",
      userId: "user-1",
      source: "manual",
    });

    expect(result.repaired).toBe(true);
    expect(result.repairActions.some((a) => a.includes("cobertura"))).toBe(true);
  });

  it("does not add dangerous items", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { topic: "IAM", mnemonic: "SI", items_map: [], quality_score: 70, assetId: "789", cached: false },
      error: null,
    });

    const result = await autoRepairMnemonic({
      topic: "IAM",
      items: ["Supra ST", "Inversão T", "Onda Q"],
      contentType: "criterios",
      auditError: "Faltou dose de alteplase",
      userId: "user-1",
      source: "manual",
    });

    // "dose" pattern won't match any repair rule that adds items
    // Should still attempt regeneration but items stay safe
    expect(result.repairActions.every((a) => !a.includes("dose"))).toBe(true);
  });
});
