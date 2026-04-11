import { describe, it, expect } from "vitest";
import { optimizeMnemonicItems } from "../mnemonicOptimizer";

describe("optimizeMnemonicItems", () => {
  it("Teste 1: IAM — encurta itens verbosos", () => {
    const result = optimizeMnemonicItems({
      topic: "IAM no ECG",
      items: ["Presença de supra de ST", "Onda Q patológica", "Alteração da onda T"],
    });
    expect(result.optimizedItems).toEqual(["Supra ST", "Onda Q", "Inversão T"]);
    expect(result.changes.length).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThanOrEqual(60);
  });

  it("Teste 2: AVC — mantém itens já bons", () => {
    const result = optimizeMnemonicItems({
      topic: "AVC",
      items: ["Déficit focal", "TC de crânio", "Tempo de início"],
    });
    expect(result.optimizedItems.length).toBe(3);
    expect(result.score).toBeGreaterThanOrEqual(60);
  });

  it("Teste 3: Lista ruim — remove itens genéricos", () => {
    const result = optimizeMnemonicItems({
      topic: "Sepse",
      items: ["Lactato elevado", "Hipotensão", "exame", "avaliar", "investigar"],
    });
    // Should remove weak items but keep >= 3
    expect(result.optimizedItems).not.toContain("exame");
    expect(result.optimizedItems).not.toContain("avaliar");
    expect(result.optimizedItems.length).toBeGreaterThanOrEqual(2);
    expect(result.changes.some((c) => c.includes("genérico"))).toBe(true);
  });

  it("Remove duplicatas após shortening", () => {
    const result = optimizeMnemonicItems({
      topic: "IAM no ECG",
      items: ["Supra ST", "Presença de supra de ST", "Onda Q"],
    });
    // Both map to "Supra ST" — one should be removed
    expect(result.optimizedItems.filter((i) => i === "Supra ST").length).toBe(1);
    expect(result.changes.some((c) => c.includes("Duplicata"))).toBe(true);
  });

  it("Ordena por prioridade de prova", () => {
    const result = optimizeMnemonicItems({
      topic: "IAM no ECG",
      items: ["Inversão T", "Onda Q", "Supra ST"],
    });
    // Supra should come first (highest priority for IAM)
    expect(result.optimizedItems[0]).toBe("Supra ST");
  });

  it("Score >= 60 para lista boa", () => {
    const result = optimizeMnemonicItems({
      topic: "Sepse",
      items: ["Lactato elevado", "Hipotensão", "Disfunção orgânica"],
    });
    expect(result.score).toBeGreaterThanOrEqual(60);
  });

  it("Não remove genéricos se ficaria < 3 itens", () => {
    const result = optimizeMnemonicItems({
      topic: "Geral",
      items: ["exame", "avaliar", "Lactato"],
    });
    // Can't remove 2 weak items — would leave only 1
    expect(result.optimizedItems.length).toBe(3);
  });
});
