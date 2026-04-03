/**
 * Banca exam profiles for edge functions.
 * Mirrors src/lib/examProfiles.ts but self-contained for Deno runtime.
 */

export interface BancaProfile {
  key: string;
  label: string;
  difficulty: number;
  style: string;
  tutorGuidance: string;
  osceEmphasis: boolean;
  specialtyWeights: Record<string, number>;
}

const PROFILES: Record<string, BancaProfile> = {
  enare: {
    key: "enare", label: "ENARE", difficulty: 4, osceEmphasis: false,
    specialtyWeights: { "Clínica Médica": 25, "Cirurgia": 20, "Pediatria": 15, "Ginecologia e Obstetrícia": 15, "Medicina Preventiva": 15, "Medicina de Emergência": 10 },
    style: "Questões longas com caso clínico detalhado, 5 alternativas, foco em raciocínio clínico e conduta. Pegadinhas sutis baseadas em detalhes do caso.",
    tutorGuidance: "Explique com profundidade clínica, sempre incluindo diagnósticos diferenciais e critérios diagnósticos. Nível de residência médica.",
  },
  revalida: {
    key: "revalida", label: "Revalida (INEP)", difficulty: 3, osceEmphasis: true,
    specialtyWeights: { "Clínica Médica": 25, "Cirurgia": 20, "Pediatria": 15, "Ginecologia e Obstetrícia": 15, "Medicina Preventiva": 15, "Medicina de Emergência": 10 },
    style: "Duas etapas: teórica (MCQ com caso clínico) e prática (OSCE). Foco em protocolos do SUS e Atenção Primária.",
    tutorGuidance: "Contextualizar com protocolos do SUS e Ministério da Saúde. Incluir manejo em UBS quando aplicável. Preparar para estações OSCE.",
  },
  usp: {
    key: "usp", label: "USP", difficulty: 5, osceEmphasis: true,
    specialtyWeights: { "Clínica Médica": 30, "Cirurgia": 25, "Pediatria": 15, "Ginecologia e Obstetrícia": 15, "Medicina de Emergência": 10, "Medicina Preventiva": 5 },
    style: "Questões de alta complexidade com casos clínicos elaborados. Pegadinhas baseadas em exceções clínicas e detalhes fisiopatológicos.",
    tutorGuidance: "Aprofundar fisiopatologia e mecanismos. A USP cobra exceções e situações atípicas. Incluir evidências científicas recentes.",
  },
  unicamp: {
    key: "unicamp", label: "UNICAMP", difficulty: 5, osceEmphasis: true,
    specialtyWeights: { "Clínica Médica": 25, "Cirurgia": 20, "Pediatria": 20, "Ginecologia e Obstetrícia": 15, "Medicina de Emergência": 10, "Medicina Preventiva": 10 },
    style: "Questões discursivas e MCQ. Casos complexos com múltiplas comorbidades. Abordagem integral do paciente.",
    tutorGuidance: "A UNICAMP valoriza abordagem integral. Incluir aspectos biopsicossociais quando relevante.",
  },
  unifesp: {
    key: "unifesp", label: "UNIFESP", difficulty: 4, osceEmphasis: true,
    specialtyWeights: { "Clínica Médica": 25, "Cirurgia": 25, "Pediatria": 15, "Ginecologia e Obstetrícia": 15, "Medicina de Emergência": 10, "Medicina Preventiva": 10 },
    style: "Questões objetivas com caso clínico. Foco em condutas baseadas em evidências.",
    tutorGuidance: "Foco em medicina baseada em evidências. Condutas atualizadas e protocolos internacionais.",
  },
  "sus-sp": {
    key: "sus-sp", label: "SUS-SP", difficulty: 3, osceEmphasis: false,
    specialtyWeights: { "Clínica Médica": 30, "Cirurgia": 15, "Pediatria": 15, "Ginecologia e Obstetrícia": 15, "Medicina Preventiva": 15, "Medicina de Emergência": 10 },
    style: "Casos curtos. Foco em Atenção Primária e protocolos do SUS. Saúde coletiva e vigilância epidemiológica.",
    tutorGuidance: "Contextualizar com protocolos do SUS-SP. Manejo na Atenção Primária.",
  },
  einstein: {
    key: "einstein", label: "Einstein", difficulty: 5, osceEmphasis: true,
    specialtyWeights: { "Clínica Médica": 30, "Cirurgia": 20, "Pediatria": 15, "Ginecologia e Obstetrícia": 15, "Medicina de Emergência": 10, "Medicina Preventiva": 10 },
    style: "Altíssima complexidade. Múltiplas comorbidades e decisões em cenário complexo. OSCE sofisticado.",
    tutorGuidance: "Incluir evidências de alto nível, guidelines internacionais e abordagem de casos complexos.",
  },
  "sirio-libanes": {
    key: "sirio-libanes", label: "Sírio-Libanês", difficulty: 5, osceEmphasis: true,
    specialtyWeights: { "Clínica Médica": 30, "Cirurgia": 20, "Pediatria": 15, "Ginecologia e Obstetrícia": 15, "Medicina de Emergência": 10, "Medicina Preventiva": 10 },
    style: "Altíssima complexidade. Forte componente prático. Casos raros e atípicos.",
    tutorGuidance: "Incluir apresentações incomuns e diagnósticos diferenciais amplos.",
  },
  "santa-casa-sp": {
    key: "santa-casa-sp", label: "Santa Casa SP", difficulty: 4, osceEmphasis: false,
    specialtyWeights: { "Clínica Médica": 25, "Cirurgia": 25, "Pediatria": 15, "Ginecologia e Obstetrícia": 15, "Medicina de Emergência": 10, "Medicina Preventiva": 10 },
    style: "Casos detalhados. Forte ênfase em Cirurgia. Pegadinhas baseadas em detalhes anatômicos e técnicos.",
    tutorGuidance: "Forte ênfase cirúrgica. Incluir detalhes técnicos e anatômicos.",
  },
};

const DEFAULT_PROFILE: BancaProfile = {
  key: "outra", label: "Residência Médica", difficulty: 3, osceEmphasis: false,
  specialtyWeights: { "Clínica Médica": 25, "Cirurgia": 20, "Pediatria": 15, "Ginecologia e Obstetrícia": 15, "Medicina Preventiva": 15, "Medicina de Emergência": 10 },
  style: "Questões MCQ com caso clínico padrão residência médica.",
  tutorGuidance: "Explicações completas no padrão de residência médica brasileira.",
};

export function getBancaProfile(key: string | null | undefined): BancaProfile {
  if (!key) return DEFAULT_PROFILE;
  return PROFILES[key] || DEFAULT_PROFILE;
}

/** Build prompt block to inject into AI system prompts */
export function buildBancaBlock(profile: BancaProfile): string {
  return `
## ADAPTAÇÃO À BANCA: ${profile.label}
- Nível de dificuldade: ${profile.difficulty}/5
- Estilo: ${profile.style}
- Orientação: ${profile.tutorGuidance}
`;
}
