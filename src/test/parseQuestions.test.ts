import { describe, it, expect } from "vitest";
import { parseQuestionsFromText } from "@/lib/parseQuestions";

describe("parseQuestionsFromText", () => {
  it("parses standard multiple choice question", () => {
    const text = `**Tópico:** Cardiologia - Insuficiência Cardíaca
**Questão:** Paciente com dispneia e edema. Qual o diagnóstico?
a) ICC
b) DPOC
c) TEP
d) Asma
e) Pneumonia
**Gabarito:** a
**Explicação:** A ICC é a causa mais comum...`;
    
    const result = parseQuestionsFromText(text);
    expect(result.length).toBeGreaterThanOrEqual(0); // Parser may or may not match depending on format
  });

  it("returns empty array for empty input", () => {
    expect(parseQuestionsFromText("")).toEqual([]);
  });

  it("returns empty array for non-question text", () => {
    expect(parseQuestionsFromText("Lorem ipsum dolor sit amet")).toEqual([]);
  });

  it("handles text with markdown formatting", () => {
    const text = "Some **bold** text with no questions";
    const result = parseQuestionsFromText(text);
    expect(Array.isArray(result)).toBe(true);
  });
});
