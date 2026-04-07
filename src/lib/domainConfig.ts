/**
 * Configuração central multi-domínio do sistema de estudos.
 * Cada domínio define áreas, exames-alvo, bibliografias, validações e prompts.
 * 
 * Para adicionar um novo domínio:
 * 1. Adicionar entrada em DOMAIN_CONFIGS
 * 2. Inserir no banco (tabela domains + domain_areas + domain_topics)
 * 3. Criar arquivo de termos em src/lib/domainTerms/ (opcional)
 */

export interface DomainExamProfile {
  name: string;
  slug: string;
  totalQuestions?: number;
  timeLimitMinutes?: number;
}

export interface DomainConfig {
  slug: string;
  name: string;
  icon: string;
  description: string;
  /** Áreas de estudo (substitui "especialidades") */
  areas: string[];
  /** Área padrão para fallbacks */
  defaultArea: string;
  /** Exames-alvo do domínio */
  examTargets: DomainExamProfile[];
  /** Bibliografias de referência */
  bibliography: string[];
  /** Features exclusivas habilitadas */
  features: {
    clinicalCases: boolean;
    anamnesis: boolean;
    osce: boolean;
    practicalExam: boolean;
    medicalChronicles: boolean;
    imageQuiz: boolean;
    interviewSimulator: boolean;
  };
  /** Regex para validação de conteúdo do domínio */
  contentRegex: RegExp;
  /** Regex para conteúdo fora do escopo (rejeitar) */
  offTopicRegex: RegExp | null;
  /** Termos-chave para highlight */
  highlightTerms: string[];
  /** Prompt base do tutor para este domínio */
  tutorIdentity: string;
  /** Fontes de referência para citações */
  referenceSources: string;
}

// ── Configurações por Domínio ──────────────────────────────────────

const MEDICINA_CONFIG: DomainConfig = {
  slug: "medicina",
  name: "Medicina",
  icon: "🩺",
  description: "Preparação para residência médica, Revalida e ENARE",
  areas: [
    "Clínica Médica", "Cirurgia", "Pediatria",
    "Ginecologia e Obstetrícia", "Medicina Preventiva",
    "Cardiologia", "Pneumologia", "Neurologia",
    "Ortopedia", "Oftalmologia", "Dermatologia",
    "Psiquiatria", "Infectologia", "Nefrologia",
    "Endocrinologia", "Hematologia", "Reumatologia",
    "Gastroenterologia", "Urologia", "Oncologia",
  ],
  defaultArea: "Clínica Médica",
  examTargets: [
    { name: "ENARE", slug: "enare", totalQuestions: 120, timeLimitMinutes: 300 },
    { name: "USP", slug: "usp", totalQuestions: 100, timeLimitMinutes: 300 },
    { name: "UNIFESP", slug: "unifesp", totalQuestions: 100, timeLimitMinutes: 300 },
    { name: "SUS-SP", slug: "sus-sp", totalQuestions: 100, timeLimitMinutes: 300 },
    { name: "Revalida", slug: "revalida", totalQuestions: 100, timeLimitMinutes: 300 },
  ],
  bibliography: ["Harrison", "Sabiston", "Nelson", "Williams", "Robbins", "Guyton", "Porto", "UpToDate"],
  features: {
    clinicalCases: true,
    anamnesis: true,
    osce: true,
    practicalExam: true,
    medicalChronicles: true,
    imageQuiz: true,
    interviewSimulator: true,
  },
  contentRegex: /(medicin|sa[uú]de|paciente|diagn[oó]st|tratament|sintom|doen[cç]|fisiopat|farmac|anatom|cl[íi]nic|cirurg|pediatr|ginec|obstetr|preventiva|resid[eê]ncia|enare|revalida|cardio|pneumo|neuro|sus|protocolo|diretriz)/i,
  offTopicRegex: /(direito|jur[ií]d|penal|constitucional|processo penal|stf|stj|delegad|advogad|pol[ií]cia federal|c[oó]digo penal|inform[aá]tica|tecnologia da informa[cç][aã]o|engenharia|contabil|economia)/i,
  highlightTerms: [], // carregado de medicalTerms.ts
  tutorIdentity: `Você é um tutor médico experiente focado em provas de residência médica e Revalida.
Objetivo: construir conhecimento médico progressivamente. Nunca apenas responda — sempre ensine.
Sequência: ENSINAR → TESTAR → CORRIGIR → REFORÇAR → AVANÇAR.
IDIOMA: TUDO em PORTUGUÊS BRASILEIRO (pt-BR). Inglês só em nomes de artigos/guidelines.`,
  referenceSources: `📚 REFERÊNCIAS: Harrison, Sabiston, Nelson, Williams, Robbins, Guyton, Porto, UpToDate, diretrizes SBC/AHA/ESC/MS.
🔬 ARTIGOS: PubMed reais. Formato: **Título** — Autores, *Journal, Ano*, [link PubMed](url).`,
};

const ENEM_CONFIG: DomainConfig = {
  slug: "enem",
  name: "ENEM",
  icon: "📝",
  description: "Preparação para o Exame Nacional do Ensino Médio",
  areas: [
    "Linguagens e Códigos", "Matemática e suas Tecnologias",
    "Ciências da Natureza", "Ciências Humanas", "Redação",
  ],
  defaultArea: "Linguagens e Códigos",
  examTargets: [
    { name: "ENEM", slug: "enem", totalQuestions: 180, timeLimitMinutes: 330 },
  ],
  bibliography: ["PCN", "BNCC", "Livros didáticos aprovados pelo PNLD"],
  features: {
    clinicalCases: false,
    anamnesis: false,
    osce: false,
    practicalExam: false,
    medicalChronicles: false,
    imageQuiz: false,
    interviewSimulator: false,
  },
  contentRegex: /(enem|vestibular|ensino m[ée]dio|linguagens|matem[aá]tica|ci[eê]ncias|humanas|reda[cç][aã]o|f[ií]sica|qu[ií]mica|biologia|hist[oó]ria|geografia|literatura|gram[aá]tica|sociologia|filosofia)/i,
  offTopicRegex: null,
  highlightTerms: [],
  tutorIdentity: `Você é um tutor experiente focado na preparação para o ENEM.
Objetivo: construir conhecimento interdisciplinar progressivamente.
Sequência: ENSINAR → TESTAR → CORRIGIR → REFORÇAR → AVANÇAR.
IDIOMA: TUDO em PORTUGUÊS BRASILEIRO (pt-BR).`,
  referenceSources: `📚 REFERÊNCIAS: BNCC, PCN, livros didáticos PNLD.`,
};

const CONCURSO_JURIDICO_CONFIG: DomainConfig = {
  slug: "juridico",
  name: "Concurso Jurídico",
  icon: "⚖️",
  description: "Preparação para OAB, magistratura, promotoria e carreiras jurídicas",
  areas: [
    "Direito Constitucional", "Direito Civil", "Direito Penal",
    "Direito Processual Civil", "Direito Processual Penal",
    "Direito Administrativo", "Direito Tributário",
    "Direito do Trabalho", "Direito Empresarial",
  ],
  defaultArea: "Direito Constitucional",
  examTargets: [
    { name: "OAB", slug: "oab", totalQuestions: 80, timeLimitMinutes: 300 },
    { name: "Magistratura", slug: "magistratura" },
    { name: "Promotoria", slug: "promotoria" },
  ],
  bibliography: ["Constituição Federal", "Código Civil", "Código Penal", "STF", "STJ"],
  features: {
    clinicalCases: false,
    anamnesis: false,
    osce: false,
    practicalExam: false,
    medicalChronicles: false,
    imageQuiz: false,
    interviewSimulator: false,
  },
  contentRegex: /(direito|jur[ií]d|constitucional|penal|civil|administrativo|tribut[aá]rio|trabalh|empresarial|processual|legisla[cç]|jurisprud[eê]ncia|oab|magistratura|promotoria|s[uú]mula|stf|stj)/i,
  offTopicRegex: null,
  highlightTerms: [],
  tutorIdentity: `Você é um tutor jurídico experiente focado em concursos e OAB.
Objetivo: construir conhecimento jurídico sólido com base em doutrina, legislação e jurisprudência.
Sequência: ENSINAR → TESTAR → CORRIGIR → REFORÇAR → AVANÇAR.
IDIOMA: TUDO em PORTUGUÊS BRASILEIRO (pt-BR).`,
  referenceSources: `📚 REFERÊNCIAS: CF/88, Códigos, doutrina majoritária, jurisprudência STF/STJ.`,
};

const CONCURSO_PUBLICO_CONFIG: DomainConfig = {
  slug: "concurso-publico",
  name: "Concurso Público",
  icon: "🏛️",
  description: "Preparação para carreiras de nível médio e superior",
  areas: [
    "Português", "Raciocínio Lógico", "Informática",
    "Direito Constitucional", "Direito Administrativo",
    "Administração Pública", "Legislação Específica",
  ],
  defaultArea: "Português",
  examTargets: [
    { name: "CESPE/CEBRASPE", slug: "cespe" },
    { name: "FCC", slug: "fcc" },
    { name: "FGV", slug: "fgv" },
    { name: "VUNESP", slug: "vunesp" },
  ],
  bibliography: [],
  features: {
    clinicalCases: false,
    anamnesis: false,
    osce: false,
    practicalExam: false,
    medicalChronicles: false,
    imageQuiz: false,
    interviewSimulator: false,
  },
  contentRegex: /(concurso|portugu[eê]s|racioc[ií]nio|l[oó]gic|inform[aá]tica|administra[cç][aã]o|legisla[cç]|constitucional|administrativo|cespe|fcc|fgv|vunesp)/i,
  offTopicRegex: null,
  highlightTerms: [],
  tutorIdentity: `Você é um tutor experiente focado em concursos públicos.
Objetivo: construir conhecimento sólido para aprovação em concursos de nível médio e superior.
Sequência: ENSINAR → TESTAR → CORRIGIR → REFORÇAR → AVANÇAR.
IDIOMA: TUDO em PORTUGUÊS BRASILEIRO (pt-BR).`,
  referenceSources: `📚 REFERÊNCIAS: legislação atualizada, doutrina, questões de bancas anteriores.`,
};

// ── Registry ──────────────────────────────────────────────────────

export const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
  medicina: MEDICINA_CONFIG,
  enem: ENEM_CONFIG,
  juridico: CONCURSO_JURIDICO_CONFIG,
  "concurso-publico": CONCURSO_PUBLICO_CONFIG,
};

/** Retorna a config do domínio pelo slug. Fallback: medicina */
export function getDomainConfig(slug?: string | null): DomainConfig {
  if (!slug) return MEDICINA_CONFIG;
  return DOMAIN_CONFIGS[slug] || MEDICINA_CONFIG;
}

/** Lista todos os domínios disponíveis */
export function listDomains(): Array<{ slug: string; name: string; icon: string; description: string }> {
  return Object.values(DOMAIN_CONFIGS).map(d => ({
    slug: d.slug,
    name: d.name,
    icon: d.icon,
    description: d.description,
  }));
}

/** Retorna as áreas do domínio (substitui CORE_SPECIALTIES) */
export function getDomainAreas(slug?: string | null): string[] {
  return getDomainConfig(slug).areas;
}

/** Retorna a área padrão para fallback */
export function getDefaultArea(slug?: string | null): string {
  return getDomainConfig(slug).defaultArea;
}

/** Verifica se uma feature está habilitada no domínio */
export function isFeatureEnabled(slug: string | null | undefined, feature: keyof DomainConfig["features"]): boolean {
  return getDomainConfig(slug).features[feature];
}
