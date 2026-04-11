import { describe, it, expect, vi } from "vitest";

// Mock supabase before importing the module
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

import { autoCompleteMnemonicItems } from "../mnemonicAutoComplete";

describe("autoCompleteMnemonicItems", () => {
  it("Teste 1: AVC diferenciação — completa com itens faltantes", async () => {
    const result = await autoCompleteMnemonicItems({
      topic: "AVC",
      subtopic: "Diferenciação isquêmico vs hemorrágico",
      items: ["TC de crânio", "Sintomas focais agudos", "Nível de consciência"],
      contentType: "criterios",
    });
    expect(result.valid).toBe(true);
    // COMPARATIVO rule requires: imagem, deficit_neurologico, nivel_consciencia — all covered
    // But general AVC rule (fallback) requires tempo_inicio which is missing
  });

  it("Teste 1b: AVC geral — adiciona 'Tempo de início' quando faltante", async () => {
    const result = await autoCompleteMnemonicItems({
      topic: "AVC",
      items: ["Déficit neurológico focal", "TC de crânio", "Hemiparesia"],
      contentType: "criterios",
    });
    expect(result.valid).toBe(true);
    expect(result.autoCompleted).toBe(true);
    expect(result.addedItems).toContain("Tempo de início dos sintomas");
  });

  it("Teste 2: IAM no ECG — adiciona 'Onda Q patológica'", async () => {
    const result = await autoCompleteMnemonicItems({
      topic: "IAM no ECG",
      items: ["Supra ST", "Inversão de T"],
      contentType: "criterios",
    });
    // Only 2 items, but auto-complete should add Onda Q to make 3
    expect(result.valid).toBe(true);
    expect(result.autoCompleted).toBe(true);
    expect(result.addedItems).toContain("Onda Q patológica");
    expect(result.finalItems.length).toBe(3);
  });

  it("Teste 3: Lista completa — não auto-completa", async () => {
    const result = await autoCompleteMnemonicItems({
      topic: "Sepse",
      items: ["Lactato elevado", "Hipotensão", "Disfunção orgânica"],
      contentType: "criterios",
    });
    expect(result.valid).toBe(true);
    expect(result.autoCompleted).toBe(false);
    expect(result.addedItems).toHaveLength(0);
    expect(result.finalItems).toHaveLength(3);
  });

  it("Teste 4: Lista vazia — bloqueio seguro", async () => {
    const result = await autoCompleteMnemonicItems({
      topic: "",
      items: [],
      contentType: "criterios",
    });
    expect(result.valid).toBe(false);
    expect(result.autoCompleted).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("Não adiciona itens perigosos (doses)", async () => {
    // Ensure dangerous items are never added (even if rule hypothetically had them)
    const result = await autoCompleteMnemonicItems({
      topic: "IAM no ECG",
      items: ["Supra ST", "Inversão de T", "Onda Q patológica"],
      contentType: "criterios",
    });
    expect(result.valid).toBe(true);
    for (const item of result.finalItems) {
      expect(item.toLowerCase()).not.toMatch(/dose|mg\/kg|posologia/);
    }
  });

  it("Respeita limite de 7 itens", async () => {
    const result = await autoCompleteMnemonicItems({
      topic: "AVC",
      items: ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5", "Item 6", "Item 7"],
      contentType: "criterios",
    });
    expect(result.valid).toBe(true);
    expect(result.autoCompleted).toBe(false);
    expect(result.finalItems.length).toBe(7);
  });
});
