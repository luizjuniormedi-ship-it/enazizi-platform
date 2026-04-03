import { describe, it, expect } from "vitest";
import {
  buildGenerationContext,
  validateContextBeforeGeneration,
  validateQuestionContext,
  type QuestionGenerationContext,
} from "@/lib/questionGenerationContext";

describe("buildGenerationContext", () => {
  it("returns fallback when no params", () => {
    const ctx = buildGenerationContext();
    expect(ctx.specialty).toBe("Clínica Médica");
    expect(ctx.topic).toBe("Clínica Médica Geral");
    expect(ctx.language).toBe("pt-BR");
    expect(ctx.source).toBe("fallback");
  });

  it("uses explicit specialty/topic", () => {
    const ctx = buildGenerationContext({ specialty: "Cardiologia", topic: "Insuficiência Cardíaca" });
    expect(ctx.specialty).toBe("Cardiologia");
    expect(ctx.topic).toBe("Insuficiência Cardíaca");
    expect(ctx.source).toBe("explicit");
  });

  it("uses specialty as topic fallback", () => {
    const ctx = buildGenerationContext({ specialty: "Pediatria" });
    expect(ctx.topic).toBe("Pediatria");
  });

  it("preserves subtopic", () => {
    const ctx = buildGenerationContext({ specialty: "Cirurgia", topic: "Abdome Agudo", subtopic: "Apendicite" });
    expect(ctx.subtopic).toBe("Apendicite");
  });
});

describe("validateContextBeforeGeneration", () => {
  it("rejects empty specialty", () => {
    const ctx: QuestionGenerationContext = { specialty: "", topic: "Test", objective: "practice", difficulty: "medium", language: "pt-BR" };
    expect(validateContextBeforeGeneration(ctx)).toBe(false);
  });

  it("accepts valid context", () => {
    const ctx = buildGenerationContext({ specialty: "Cardiologia", topic: "IAM" });
    expect(validateContextBeforeGeneration(ctx)).toBe(true);
  });
});

describe("validateQuestionContext", () => {
  const cardioCtx: QuestionGenerationContext = {
    specialty: "Cardiologia",
    topic: "IAM",
    objective: "practice",
    difficulty: "medium",
    language: "pt-BR",
  };

  it("rejects English questions", () => {
    const result = validateQuestionContext(
      { statement: "A 45-year-old male presents with chest pain...", options: ["a", "b", "c", "d"], correct_index: 0, topic: "Cardiology" },
      cardioCtx
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("english_content");
  });

  it("rejects image references", () => {
    const result = validateQuestionContext(
      { statement: "Paciente de 50 anos, observe a imagem abaixo e determine o diagnóstico mais provável.", options: ["a", "b", "c", "d"], correct_index: 0, topic: "Cardiologia" },
      cardioCtx
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("image_reference");
  });

  it("rejects short statements", () => {
    const result = validateQuestionContext(
      { statement: "Qual o tratamento?", options: ["a", "b", "c", "d"], correct_index: 0, topic: "Cardiologia" },
      cardioCtx
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("statement_too_short");
  });

  it("rejects specialty mismatch", () => {
    const result = validateQuestionContext(
      { statement: "Paciente de 30 anos com dor abdominal intensa há 6 horas, febre e náuseas. Exame físico revela sinal de Blumberg positivo.", options: ["a", "b", "c", "d"], correct_index: 0, topic: "Cirurgia" },
      cardioCtx
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("specialty_mismatch");
  });

  it("accepts valid Portuguese question matching specialty", () => {
    const result = validateQuestionContext(
      { statement: "Paciente de 55 anos com dor precordial há 2 horas, sudorese e dispneia. ECG mostra supra de ST em parede anterior. Troponina elevada. Qual a conduta imediata para este caso de cardiologia?", options: ["a", "b", "c", "d"], correct_index: 0, topic: "Cardiologia - IAM" },
      cardioCtx
    );
    expect(result.valid).toBe(true);
  });

  it("accepts broad specialty (Clínica Médica) without strict matching", () => {
    const clinicaCtx: QuestionGenerationContext = {
      specialty: "Clínica Médica",
      topic: "Geral",
      objective: "practice",
      difficulty: "medium",
      language: "pt-BR",
    };
    const result = validateQuestionContext(
      { statement: "Paciente de 60 anos com diagnóstico recente de diabetes mellitus tipo 2. Glicemia de jejum 180mg/dL.", options: ["a", "b", "c", "d"], correct_index: 1, topic: "Endocrinologia" },
      clinicaCtx
    );
    expect(result.valid).toBe(true);
  });
});
