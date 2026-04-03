import { describe, it, expect } from "vitest";
import {
  validateAIContent,
  filterValidQuestions,
  type ClientValidationContext,
} from "@/lib/aiOutputValidation";

describe("validateAIContent", () => {
  describe("question type", () => {
    it("rejects English questions", () => {
      const result = validateAIContent(
        { statement: "A 45-year-old male presents with chest pain and dyspnea.", options: ["a", "b", "c", "d"], correct_index: 0 },
        {},
        "question"
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("english_content");
    });

    it("rejects non-medical content", () => {
      const result = validateAIContent(
        { statement: "O advogado impetrou habeas corpus no STF contra a decisão do juiz de direito penal.", options: ["a", "b", "c", "d"], correct_index: 0 },
        {},
        "question"
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("non_medical");
    });

    it("rejects image references", () => {
      const result = validateAIContent(
        { statement: "Observe a imagem abaixo e indique o diagnóstico mais provável para o paciente.", options: ["a", "b", "c", "d"], correct_index: 0 },
        {},
        "question"
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("image_reference");
    });

    it("rejects short statements", () => {
      const result = validateAIContent(
        { statement: "Qual o diagnóstico?", options: ["a", "b", "c", "d"], correct_index: 0 },
        {},
        "question"
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("too_short");
    });

    it("accepts valid Portuguese medical question", () => {
      const result = validateAIContent(
        { statement: "Paciente de 55 anos com dor precordial há 2 horas, sudorese e dispneia.", options: ["a", "b", "c", "d"], correct_index: 0 },
        {},
        "question"
      );
      expect(result.valid).toBe(true);
    });

    it("rejects questions with wrong option count", () => {
      const result = validateAIContent(
        { statement: "Paciente de 55 anos com dor precordial há 2 horas.", options: ["a", "b"], correct_index: 0 },
        {},
        "question"
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("invalid_options");
    });
  });

  describe("tutor type", () => {
    it("rejects predominantly English text", () => {
      const result = validateAIContent(
        "The patient has a history of hypertension and diabetes. He was admitted to the hospital for chest pain.",
        {},
        "tutor"
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("predominantly_english");
    });

    it("accepts Portuguese text", () => {
      const result = validateAIContent(
        "O paciente apresenta hipertensão arterial sistêmica e diabetes mellitus tipo 2.",
        {},
        "tutor"
      );
      expect(result.valid).toBe(true);
    });

    it("rejects empty content", () => {
      const result = validateAIContent("", {}, "tutor");
      expect(result.valid).toBe(false);
    });
  });

  describe("flashcard type", () => {
    it("rejects flashcard without question", () => {
      const result = validateAIContent({ question: "", answer: "Resposta" }, {}, "flashcard");
      expect(result.valid).toBe(false);
    });

    it("accepts valid flashcard", () => {
      const result = validateAIContent(
        { question: "Qual o mecanismo da metformina?", answer: "Inibe a gliconeogênese hepática" },
        {},
        "flashcard"
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("discursiva type", () => {
    it("rejects short case", () => {
      const result = validateAIContent({ case: "Caso curto", questions: ["Q1"] }, {}, "discursiva");
      expect(result.valid).toBe(false);
    });

    it("accepts valid discursive case", () => {
      const caseText = "Paciente de 45 anos, sexo masculino, hipertenso e diabético, dá entrada no PS com dor precordial intensa há 3 horas, irradiando para membro superior esquerdo. Apresenta sudorese profusa e dispneia.";
      const result = validateAIContent({ case: caseText, questions: ["Qual o diagnóstico?", "Qual a conduta?"] }, {}, "discursiva");
      expect(result.valid).toBe(true);
    });
  });
});

describe("filterValidQuestions", () => {
  it("filters out invalid questions from array", () => {
    const questions = [
      { statement: "Paciente de 55 anos com dor precordial há 2 horas, sudorese e dispneia.", options: ["a", "b", "c", "d"], correct_index: 0 },
      { statement: "The patient presents with chest pain", options: ["a", "b", "c", "d"], correct_index: 0 },
      { statement: "Paciente com hipertensão arterial em tratamento com enalapril 10mg/dia.", options: ["a", "b", "c", "d"], correct_index: 1 },
    ];
    const result = filterValidQuestions(questions);
    expect(result.length).toBe(2);
    expect(result[0].statement).toContain("Paciente de 55");
    expect(result[1].statement).toContain("Paciente com hipertensão");
  });

  it("returns empty array when all invalid", () => {
    const questions = [
      { statement: "Short", options: ["a"], correct_index: 0 },
      { statement: "The patient presents with symptoms", options: ["a", "b", "c", "d"], correct_index: 0 },
    ];
    const result = filterValidQuestions(questions);
    expect(result.length).toBe(0);
  });
});
