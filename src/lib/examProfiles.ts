/**
 * Perfis de bancas médicas brasileiras.
 * Cada perfil ajusta o comportamento do Study Engine, Tutor IA e geração de conteúdo.
 */

/** Pesos do cálculo de readiness por banca (devem somar ~1.0 antes do penalty) */
export interface ReadinessWeights {
  specAccuracy: number;
  approvalScore: number;
  simulado: number;
  coverage: number;
  practical: number;
  consistency: number;
  reviewPenalty: number;
}

const DEFAULT_READINESS: ReadinessWeights = {
  specAccuracy: 0.30, approvalScore: 0.20, simulado: 0.15,
  coverage: 0.10, practical: 0.10, consistency: 0.10, reviewPenalty: 0.05,
};

export interface ExamProfile {
  key: string;
  label: string;
  difficulty: number;
  practicalFocus: number;
  osceEmphasis: boolean;
  specialtyWeights: Record<string, number>;
  style: string;
  engineModifiers: {
    reviewWeightMod: number;
    questionsWeightMod: number;
    practicalWeightMod: number;
    theoryWeightMod: number;
  };
  tutorGuidance: string;
  readinessWeights: ReadinessWeights;
}

export const EXAM_PROFILES: Record<string, ExamProfile> = {
  enare: {
    key: "enare", label: "ENARE", difficulty: 4, practicalFocus: 0.3, osceEmphasis: false,
    specialtyWeights: { "Clínica Médica": 20, "Cirurgia": 15, "Pediatria": 12, "Ginecologia e Obstetrícia": 12, "Medicina Preventiva": 10, "Medicina de Emergência": 8, "Terapia Intensiva": 5, "Ortopedia": 4, "Oncologia": 4, "Angiologia": 3, "Urologia": 3, "Oftalmologia": 2, "Otorrinolaringologia": 2 },
    style: "Questões longas com caso clínico detalhado, 5 alternativas, foco em raciocínio clínico e conduta. Pegadinhas sutis baseadas em detalhes do caso.",
    engineModifiers: { reviewWeightMod: 0, questionsWeightMod: 0.05, practicalWeightMod: 0, theoryWeightMod: -0.05 },
    tutorGuidance: "Explique com profundidade clínica, sempre incluindo diagnósticos diferenciais e critérios diagnósticos. Nível de residência médica.",
    readinessWeights: { specAccuracy: 0.30, approvalScore: 0.20, simulado: 0.15, coverage: 0.15, practical: 0.05, consistency: 0.10, reviewPenalty: 0.05 },
  },
  enamed: {
    key: "enamed", label: "ENAMED", difficulty: 3, practicalFocus: 0.25, osceEmphasis: false,
    specialtyWeights: { "Clínica Médica": 20, "Cirurgia": 15, "Pediatria": 12, "Ginecologia e Obstetrícia": 12, "Medicina Preventiva": 12, "Medicina de Emergência": 8, "Terapia Intensiva": 4, "Ortopedia": 4, "Oncologia": 4, "Angiologia": 3, "Urologia": 3, "Oftalmologia": 2, "Otorrinolaringologia": 1 },
    style: "Questões objetivas com caso clínico padrão. Cobertura ampla das grandes áreas. Foco em conduta e diagnóstico.",
    engineModifiers: { reviewWeightMod: 0.05, questionsWeightMod: 0, practicalWeightMod: 0, theoryWeightMod: -0.05 },
    tutorGuidance: "Explicações objetivas e completas. O ENAMED cobra base ampla com foco em diagnóstico e conduta prática.",
    readinessWeights: { specAccuracy: 0.25, approvalScore: 0.20, simulado: 0.15, coverage: 0.15, practical: 0.05, consistency: 0.15, reviewPenalty: 0.05 },
  },
  revalida: {
    key: "revalida", label: "Revalida (INEP)", difficulty: 3, practicalFocus: 0.5, osceEmphasis: true,
    specialtyWeights: { "Clínica Médica": 20, "Cirurgia": 15, "Pediatria": 12, "Ginecologia e Obstetrícia": 12, "Medicina Preventiva": 12, "Medicina de Emergência": 8, "Terapia Intensiva": 4, "Ortopedia": 4, "Oncologia": 4, "Angiologia": 3, "Urologia": 3, "Oftalmologia": 2, "Otorrinolaringologia": 1 },
    style: "Duas etapas: teórica (MCQ com caso clínico) e prática (OSCE com estações). Foco em protocolos do SUS e Atenção Primária.",
    engineModifiers: { reviewWeightMod: -0.05, questionsWeightMod: 0, practicalWeightMod: 0.10, theoryWeightMod: -0.05 },
    tutorGuidance: "Sempre contextualizar com protocolos do SUS e Ministério da Saúde. Incluir manejo em UBS quando aplicável. Preparar para estações OSCE.",
    readinessWeights: { specAccuracy: 0.25, approvalScore: 0.15, simulado: 0.10, coverage: 0.10, practical: 0.20, consistency: 0.10, reviewPenalty: 0.10 },
  },
  usp: {
    key: "usp", label: "USP", difficulty: 5, practicalFocus: 0.35, osceEmphasis: true,
    specialtyWeights: { "Clínica Médica": 22, "Cirurgia": 18, "Pediatria": 12, "Ginecologia e Obstetrícia": 12, "Medicina de Emergência": 8, "Medicina Preventiva": 5, "Terapia Intensiva": 5, "Ortopedia": 5, "Oncologia": 4, "Oftalmologia": 3, "Angiologia": 2, "Urologia": 2, "Otorrinolaringologia": 2 },
    style: "Questões de alta complexidade com casos clínicos elaborados. Pegadinhas baseadas em exceções clínicas e detalhes fisiopatológicos. Valoriza raciocínio sobre memorização.",
    engineModifiers: { reviewWeightMod: -0.05, questionsWeightMod: 0.10, practicalWeightMod: 0.05, theoryWeightMod: -0.10 },
    tutorGuidance: "Aprofundar fisiopatologia e mecanismos. A USP cobra exceções e situações atípicas. Incluir discussão de evidências científicas recentes.",
    readinessWeights: { specAccuracy: 0.35, approvalScore: 0.15, simulado: 0.20, coverage: 0.05, practical: 0.15, consistency: 0.05, reviewPenalty: 0.05 },
  },
  unicamp: {
    key: "unicamp", label: "UNICAMP", difficulty: 5, practicalFocus: 0.4, osceEmphasis: true,
    specialtyWeights: { "Clínica Médica": 20, "Cirurgia": 15, "Pediatria": 15, "Ginecologia e Obstetrícia": 12, "Medicina de Emergência": 8, "Medicina Preventiva": 8, "Terapia Intensiva": 5, "Ortopedia": 4, "Oncologia": 4, "Angiologia": 3, "Urologia": 2, "Oftalmologia": 2, "Otorrinolaringologia": 2 },
    style: "Questões discursivas e de múltipla escolha. Casos clínicos complexos com múltiplas comorbidades. Valoriza abordagem integral do paciente.",
    engineModifiers: { reviewWeightMod: 0, questionsWeightMod: 0.05, practicalWeightMod: 0.05, theoryWeightMod: -0.10 },
    tutorGuidance: "A UNICAMP valoriza a abordagem integral. Incluir aspectos biopsicossociais e manejo multidisciplinar quando relevante.",
    readinessWeights: { specAccuracy: 0.30, approvalScore: 0.15, simulado: 0.15, coverage: 0.10, practical: 0.15, consistency: 0.10, reviewPenalty: 0.05 },
  },
  unifesp: {
    key: "unifesp", label: "UNIFESP", difficulty: 4, practicalFocus: 0.35, osceEmphasis: true,
    specialtyWeights: { "Clínica Médica": 20, "Cirurgia": 18, "Pediatria": 12, "Ginecologia e Obstetrícia": 12, "Medicina de Emergência": 8, "Medicina Preventiva": 8, "Terapia Intensiva": 5, "Ortopedia": 4, "Oncologia": 4, "Angiologia": 3, "Urologia": 2, "Oftalmologia": 2, "Otorrinolaringologia": 2 },
    style: "Questões objetivas com caso clínico. Boa distribuição entre grandes áreas. Foco em condutas baseadas em evidências.",
    engineModifiers: { reviewWeightMod: 0, questionsWeightMod: 0.05, practicalWeightMod: 0.05, theoryWeightMod: -0.10 },
    tutorGuidance: "Foco em medicina baseada em evidências. A UNIFESP cobra condutas atualizadas e protocolos internacionais.",
    readinessWeights: { specAccuracy: 0.30, approvalScore: 0.15, simulado: 0.20, coverage: 0.10, practical: 0.15, consistency: 0.05, reviewPenalty: 0.05 },
  },
  "sus-sp": {
    key: "sus-sp", label: "SUS-SP", difficulty: 3, practicalFocus: 0.25, osceEmphasis: false,
    specialtyWeights: { "Clínica Médica": 22, "Cirurgia": 12, "Pediatria": 12, "Ginecologia e Obstetrícia": 12, "Medicina Preventiva": 12, "Medicina de Emergência": 8, "Terapia Intensiva": 4, "Ortopedia": 4, "Oncologia": 4, "Angiologia": 3, "Urologia": 3, "Oftalmologia": 2, "Otorrinolaringologia": 2 },
    style: "Questões objetivas com casos curtos. Foco em Atenção Primária e protocolos do SUS. Cobrança de saúde coletiva e vigilância epidemiológica.",
    engineModifiers: { reviewWeightMod: 0.05, questionsWeightMod: 0, practicalWeightMod: -0.05, theoryWeightMod: 0 },
    tutorGuidance: "Sempre contextualizar com protocolos do SUS-SP. Incluir manejo na Atenção Primária e referências do Ministério da Saúde.",
    readinessWeights: { specAccuracy: 0.25, approvalScore: 0.20, simulado: 0.15, coverage: 0.15, practical: 0.05, consistency: 0.15, reviewPenalty: 0.05 },
  },
  "sus-rj": {
    key: "sus-rj", label: "SUS-RJ", difficulty: 3, practicalFocus: 0.25, osceEmphasis: false,
    specialtyWeights: { "Clínica Médica": 22, "Cirurgia": 12, "Pediatria": 12, "Ginecologia e Obstetrícia": 12, "Medicina Preventiva": 12, "Medicina de Emergência": 8, "Terapia Intensiva": 4, "Ortopedia": 4, "Oncologia": 4, "Angiologia": 3, "Urologia": 3, "Oftalmologia": 2, "Otorrinolaringologia": 2 },
    style: "Questões objetivas focadas em protocolos do SUS. Casos clínicos curtos a moderados.",
    engineModifiers: { reviewWeightMod: 0.05, questionsWeightMod: 0, practicalWeightMod: -0.05, theoryWeightMod: 0 },
    tutorGuidance: "Contextualizar com protocolos do SUS. Foco em Atenção Primária e manejo ambulatorial.",
    readinessWeights: { specAccuracy: 0.25, approvalScore: 0.20, simulado: 0.15, coverage: 0.15, practical: 0.05, consistency: 0.15, reviewPenalty: 0.05 },
  },
  amrigs: {
    key: "amrigs", label: "AMRIGS", difficulty: 3, practicalFocus: 0.3, osceEmphasis: false,
    specialtyWeights: { "Clínica Médica": 20, "Cirurgia": 15, "Pediatria": 12, "Ginecologia e Obstetrícia": 12, "Medicina Preventiva": 12, "Medicina de Emergência": 8, "Terapia Intensiva": 4, "Ortopedia": 4, "Oncologia": 4, "Angiologia": 3, "Urologia": 3, "Oftalmologia": 2, "Otorrinolaringologia": 1 },
    style: "Questões de múltipla escolha com casos clínicos. Padrão consolidado e previsível. Boa distribuição entre especialidades.",
    engineModifiers: { reviewWeightMod: 0, questionsWeightMod: 0, practicalWeightMod: 0, theoryWeightMod: 0 },
    tutorGuidance: "Explicações objetivas e diretas. A AMRIGS cobra conteúdo clássico com boa distribuição.",
    readinessWeights: { ...DEFAULT_READINESS },
  },
  "ses-df": {
    key: "ses-df", label: "SES-DF", difficulty: 4, practicalFocus: 0.3, osceEmphasis: false,
    specialtyWeights: { "Clínica Médica": 20, "Cirurgia": 15, "Pediatria": 12, "Ginecologia e Obstetrícia": 12, "Medicina Preventiva": 12, "Medicina de Emergência": 8, "Terapia Intensiva": 4, "Ortopedia": 4, "Oncologia": 4, "Angiologia": 3, "Urologia": 3, "Oftalmologia": 2, "Otorrinolaringologia": 1 },
    style: "Questões elaboradas com casos clínicos detalhados. Nível elevado de dificuldade. Cobra detalhes de conduta e diagnóstico.",
    engineModifiers: { reviewWeightMod: 0, questionsWeightMod: 0.05, practicalWeightMod: 0, theoryWeightMod: -0.05 },
    tutorGuidance: "Aprofundar condutas e critérios diagnósticos. A SES-DF cobra detalhes que diferenciam alternativas próximas.",
    readinessWeights: { specAccuracy: 0.30, approvalScore: 0.20, simulado: 0.20, coverage: 0.10, practical: 0.05, consistency: 0.10, reviewPenalty: 0.05 },
  },
  "psu-mg": {
    key: "psu-mg", label: "PSU-MG", difficulty: 3, practicalFocus: 0.25, osceEmphasis: false,
    specialtyWeights: { "Clínica Médica": 20, "Cirurgia": 15, "Pediatria": 12, "Ginecologia e Obstetrícia": 12, "Medicina Preventiva": 12, "Medicina de Emergência": 8, "Terapia Intensiva": 4, "Ortopedia": 4, "Oncologia": 4, "Angiologia": 3, "Urologia": 3, "Oftalmologia": 2, "Otorrinolaringologia": 1 },
    style: "Questões de múltipla escolha com casos clínicos. Foco em protocolos e diretrizes nacionais.",
    engineModifiers: { reviewWeightMod: 0, questionsWeightMod: 0, practicalWeightMod: 0, theoryWeightMod: 0 },
    tutorGuidance: "Explicações claras com foco em diretrizes nacionais e protocolos atualizados.",
    readinessWeights: { ...DEFAULT_READINESS },
  },
  hcpa: {
    key: "hcpa", label: "HCPA", difficulty: 4, practicalFocus: 0.35, osceEmphasis: true,
    specialtyWeights: { "Clínica Médica": 20, "Cirurgia": 15, "Pediatria": 15, "Ginecologia e Obstetrícia": 12, "Medicina de Emergência": 8, "Medicina Preventiva": 8, "Terapia Intensiva": 5, "Ortopedia": 4, "Oncologia": 4, "Angiologia": 3, "Urologia": 2, "Oftalmologia": 2, "Otorrinolaringologia": 2 },
    style: "Questões de alto nível com casos complexos. Prova prática com estações OSCE. Foco em raciocínio clínico.",
    engineModifiers: { reviewWeightMod: -0.05, questionsWeightMod: 0.05, practicalWeightMod: 0.05, theoryWeightMod: -0.05 },
    tutorGuidance: "Aprofundar raciocínio clínico e preparar para estações OSCE. O HCPA cobra excelência em abordagem clínica.",
    readinessWeights: { specAccuracy: 0.30, approvalScore: 0.15, simulado: 0.15, coverage: 0.10, practical: 0.15, consistency: 0.10, reviewPenalty: 0.05 },
  },
  "santa-casa-sp": {
    key: "santa-casa-sp", label: "Santa Casa SP", difficulty: 4, practicalFocus: 0.3, osceEmphasis: false,
    specialtyWeights: { "Clínica Médica": 20, "Cirurgia": 20, "Pediatria": 12, "Ginecologia e Obstetrícia": 12, "Medicina de Emergência": 8, "Medicina Preventiva": 8, "Terapia Intensiva": 4, "Ortopedia": 4, "Oncologia": 4, "Angiologia": 3, "Urologia": 2, "Oftalmologia": 2, "Otorrinolaringologia": 1 },
    style: "Questões com casos clínicos detalhados. Forte ênfase em Cirurgia. Pegadinhas baseadas em detalhes anatômicos e técnicos.",
    engineModifiers: { reviewWeightMod: 0, questionsWeightMod: 0.05, practicalWeightMod: 0, theoryWeightMod: -0.05 },
    tutorGuidance: "A Santa Casa SP tem forte ênfase cirúrgica. Incluir detalhes técnicos e anatômicos nas explicações.",
    readinessWeights: { specAccuracy: 0.35, approvalScore: 0.20, simulado: 0.20, coverage: 0.10, practical: 0.05, consistency: 0.05, reviewPenalty: 0.05 },
  },
  einstein: {
    key: "einstein", label: "Einstein", difficulty: 5, practicalFocus: 0.4, osceEmphasis: true,
    specialtyWeights: { "Clínica Médica": 22, "Cirurgia": 15, "Pediatria": 12, "Ginecologia e Obstetrícia": 12, "Medicina de Emergência": 8, "Medicina Preventiva": 8, "Terapia Intensiva": 5, "Ortopedia": 4, "Oncologia": 4, "Angiologia": 3, "Urologia": 3, "Oftalmologia": 2, "Otorrinolaringologia": 2 },
    style: "Questões de altíssima complexidade. Casos com múltiplas comorbidades e decisões em cenário complexo. Prova prática OSCE sofisticada.",
    engineModifiers: { reviewWeightMod: -0.05, questionsWeightMod: 0.10, practicalWeightMod: 0.05, theoryWeightMod: -0.10 },
    tutorGuidance: "O Einstein cobra excelência. Incluir evidências de alto nível, guidelines internacionais e abordagem de casos complexos com comorbidades.",
    readinessWeights: { specAccuracy: 0.35, approvalScore: 0.10, simulado: 0.20, coverage: 0.05, practical: 0.20, consistency: 0.05, reviewPenalty: 0.05 },
  },
  "sirio-libanes": {
    key: "sirio-libanes", label: "Sírio-Libanês", difficulty: 5, practicalFocus: 0.4, osceEmphasis: true,
    specialtyWeights: { "Clínica Médica": 22, "Cirurgia": 15, "Pediatria": 12, "Ginecologia e Obstetrícia": 12, "Medicina de Emergência": 8, "Medicina Preventiva": 8, "Terapia Intensiva": 5, "Ortopedia": 4, "Oncologia": 4, "Angiologia": 3, "Urologia": 3, "Oftalmologia": 2, "Otorrinolaringologia": 2 },
    style: "Questões de altíssima complexidade, similar ao Einstein. Forte componente prático. Casos raros e atípicos.",
    engineModifiers: { reviewWeightMod: -0.05, questionsWeightMod: 0.10, practicalWeightMod: 0.05, theoryWeightMod: -0.10 },
    tutorGuidance: "O Sírio-Libanês cobra casos atípicos e raros. Incluir apresentações incomuns e diagnósticos diferenciais amplos.",
    readinessWeights: { specAccuracy: 0.35, approvalScore: 0.10, simulado: 0.20, coverage: 0.05, practical: 0.20, consistency: 0.05, reviewPenalty: 0.05 },
  },
  outra: {
    key: "outra", label: "Outra prova de residência", difficulty: 3, practicalFocus: 0.3, osceEmphasis: false,
    specialtyWeights: { "Clínica Médica": 20, "Cirurgia": 15, "Pediatria": 12, "Ginecologia e Obstetrícia": 12, "Medicina Preventiva": 12, "Medicina de Emergência": 8, "Terapia Intensiva": 4, "Ortopedia": 4, "Oncologia": 4, "Angiologia": 3, "Urologia": 3, "Oftalmologia": 2, "Otorrinolaringologia": 1 },
    style: "Questões de múltipla escolha com caso clínico padrão residência médica.",
    engineModifiers: { reviewWeightMod: 0, questionsWeightMod: 0, practicalWeightMod: 0, theoryWeightMod: 0 },
    tutorGuidance: "Explicações completas no padrão de residência médica brasileira.",
    readinessWeights: { ...DEFAULT_READINESS },
  },
};

/** Get profile for an exam key; falls back to 'outra' */
export function getExamProfile(examKey: string | null | undefined): ExamProfile {
  if (!examKey) return EXAM_PROFILES.outra;
  return EXAM_PROFILES[examKey] || EXAM_PROFILES.outra;
}

/** Apply exam profile modifiers to base PlanWeights */
export function applyExamModifiers(
  baseWeights: { reviewWeight: number; theoryWeight: number; questionsWeight: number; practicalWeight: number; maxNewTopics: number; phase: string },
  profile: ExamProfile,
): typeof baseWeights {
  const m = profile.engineModifiers;
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  return {
    ...baseWeights,
    reviewWeight: clamp(baseWeights.reviewWeight + m.reviewWeightMod),
    theoryWeight: clamp(baseWeights.theoryWeight + m.theoryWeightMod),
    questionsWeight: clamp(baseWeights.questionsWeight + m.questionsWeightMod),
    practicalWeight: clamp(baseWeights.practicalWeight + m.practicalWeightMod),
  };
}

/** Build banca style instruction for AI prompts */
export function buildBancaPromptBlock(profile: ExamProfile): string {
  return `\n\n## ESTILO DA BANCA: ${profile.label}\nDificuldade: ${profile.difficulty}/5\nEstilo: ${profile.style}\n${profile.tutorGuidance}\n`;
}

/** Merge multiple exam profiles into a balanced combined profile */
export function getMergedExamProfile(examKeys: string[]): ExamProfile {
  if (!examKeys || examKeys.length === 0) return EXAM_PROFILES.outra;
  if (examKeys.length === 1) return getExamProfile(examKeys[0]);

  const profiles = examKeys.map(k => getExamProfile(k)).filter(Boolean);
  if (profiles.length === 0) return EXAM_PROFILES.outra;

  const n = profiles.length;

  const difficulty = Math.round(profiles.reduce((s, p) => s + p.difficulty, 0) / n);
  const practicalFocus = profiles.reduce((s, p) => s + p.practicalFocus, 0) / n;
  const osceEmphasis = profiles.some(p => p.osceEmphasis);

  const allSpecialties = new Set(profiles.flatMap(p => Object.keys(p.specialtyWeights)));
  const specialtyWeights: Record<string, number> = {};
  for (const spec of allSpecialties) {
    const vals = profiles.map(p => p.specialtyWeights[spec]).filter(v => v != null);
    specialtyWeights[spec] = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  }

  const engineModifiers = {
    reviewWeightMod: profiles.reduce((s, p) => s + p.engineModifiers.reviewWeightMod, 0) / n,
    questionsWeightMod: profiles.reduce((s, p) => s + p.engineModifiers.questionsWeightMod, 0) / n,
    practicalWeightMod: profiles.reduce((s, p) => s + p.engineModifiers.practicalWeightMod, 0) / n,
    theoryWeightMod: profiles.reduce((s, p) => s + p.engineModifiers.theoryWeightMod, 0) / n,
  };

  // Average readiness weights
  const readinessWeights: ReadinessWeights = {
    specAccuracy: profiles.reduce((s, p) => s + p.readinessWeights.specAccuracy, 0) / n,
    approvalScore: profiles.reduce((s, p) => s + p.readinessWeights.approvalScore, 0) / n,
    simulado: profiles.reduce((s, p) => s + p.readinessWeights.simulado, 0) / n,
    coverage: profiles.reduce((s, p) => s + p.readinessWeights.coverage, 0) / n,
    practical: profiles.reduce((s, p) => s + p.readinessWeights.practical, 0) / n,
    consistency: profiles.reduce((s, p) => s + p.readinessWeights.consistency, 0) / n,
    reviewPenalty: profiles.reduce((s, p) => s + p.readinessWeights.reviewPenalty, 0) / n,
  };

  const labels = profiles.map(p => p.label);
  const style = profiles.map(p => `[${p.label}] ${p.style}`).join("\n");
  const tutorGuidance = `O aluno está se preparando para ${labels.length} provas simultaneamente: ${labels.join(", ")}.\n` +
    profiles.map(p => `- ${p.label}: ${p.tutorGuidance}`).join("\n");

  return {
    key: examKeys.join("+"),
    label: labels.join(" + "),
    difficulty, practicalFocus, osceEmphasis, specialtyWeights,
    style, engineModifiers, tutorGuidance, readinessWeights,
  };
}

/** Build banca prompt block for multiple exams */
export function buildMultiBancaPromptBlock(examKeys: string[]): string {
  if (!examKeys || examKeys.length === 0) return "";
  const merged = getMergedExamProfile(examKeys);
  return buildBancaPromptBlock(merged);
}
