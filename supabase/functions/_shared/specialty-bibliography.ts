/**
 * Mapa centralizado de bibliografia médica por especialidade.
 * Usado por todas as edge functions de geração de conteúdo.
 */

export const SPECIALTY_BIBLIOGRAPHY: Record<string, string> = {
  // Ciclo Clínico
  "Cardiologia": "Braunwald's Heart Disease / Manual de Cardiologia SOCESP",
  "Pneumologia": "Murray & Nadel Textbook of Respiratory Medicine / Tarantino Pneumologia",
  "Neurologia": "Adams and Victor's Principles of Neurology / DeJong's The Neurologic Examination",
  "Gastroenterologia": "Sleisenger and Fordtran Gastrointestinal Disease / Tratado de Gastroenterologia SBAD",
  "Endocrinologia": "Williams Textbook of Endocrinology / Endocrinologia Clínica Vilar",
  "Nefrologia": "Brenner and Rector The Kidney / Nefrologia Clínica Riella",
  "Hematologia": "Williams Hematology / Hoffbrand Essential Haematology",
  "Reumatologia": "Kelley and Firestein's Textbook of Rheumatology / Reumatologia SBR",
  "Infectologia": "Mandell Douglas and Bennett Infectious Diseases / Veronesi Tratado de Infectologia",
  "Dermatologia": "Fitzpatrick Dermatology / Sampaio Dermatologia",
  "Psiquiatria": "Kaplan & Sadock Synopsis of Psychiatry / DSM-5-TR",
  "Ortopedia": "Campbell's Operative Orthopaedics / Ortopedia SBOT",
  "Urologia": "Campbell-Walsh Urology / Urologia SBU",
  "Oftalmologia": "Kanski Clinical Ophthalmology / Yanoff & Duker Ophthalmology",
  "Otorrinolaringologia": "Cummings Otolaryngology / Tratado de Otorrinolaringologia ABORL",
  "Oncologia": "DeVita Cancer Principles & Practice of Oncology / Manual de Oncologia Clínica SBOC",
  // Internato
  "Pediatria": "Nelson Textbook of Pediatrics / Tratado de Pediatria SBP",
  "Ginecologia e Obstetrícia": "Williams Obstetrics / Ginecologia e Obstetrícia FEBRASGO",
  "Cirurgia": "Schwartz Principles of Surgery / Sabiston Textbook of Surgery",
  "Medicina de Emergência": "Tintinalli Emergency Medicine / ATLS Student Course Manual",
  "Medicina Preventiva": "Medicina Preventiva e Social Rouquayrol / Epidemiology Gordis",
  "Terapia Intensiva": "Irwin and Rippe's Intensive Care Medicine / Manual de Terapia Intensiva AMIB",
  // Ciclo Básico
  "Anatomia": "Gray's Anatomy for Students / Netter Atlas of Human Anatomy",
  "Fisiologia": "Guyton & Hall Textbook of Medical Physiology / Costanzo Physiology",
  "Bioquímica": "Lehninger Principles of Biochemistry / Lippincott Illustrated Reviews Biochemistry",
  "Histologia": "Junqueira's Basic Histology / Wheater's Functional Histology",
  "Embriologia": "Langman's Medical Embryology / Moore The Developing Human",
  "Microbiologia": "Murray Medical Microbiology / Jawetz Melnick & Adelberg's Medical Microbiology",
  "Imunologia": "Abbas Cellular and Molecular Immunology / Janeway's Immunobiology",
  "Parasitologia": "Neves Parasitologia Humana / Roberts Foundations of Parasitology",
  "Genética Médica": "Thompson & Thompson Genetics in Medicine / Jorde Medical Genetics",
  "Patologia": "Robbins & Cotran Pathologic Basis of Disease / Robbins Basic Pathology",
  "Farmacologia": "Goodman & Gilman's Pharmacological Basis of Therapeutics / Katzung Basic and Clinical Pharmacology",
  "Semiologia": "Bates Guide to Physical Examination / Porto Semiologia Médica",
  // Aliases
  "Angiologia": "Manual de Angiologia e Cirurgia Vascular SBACV",
};

/**
 * Retorna a referência bibliográfica para uma especialidade.
 * Faz match exato primeiro, depois busca parcial (case-insensitive).
 */
export function getBibliographyForSpecialty(specialty: string): string {
  if (SPECIALTY_BIBLIOGRAPHY[specialty]) return SPECIALTY_BIBLIOGRAPHY[specialty];
  const key = Object.keys(SPECIALTY_BIBLIOGRAPHY).find(
    k => k.toLowerCase() === specialty.toLowerCase() || specialty.toLowerCase().includes(k.toLowerCase())
  );
  return key ? SPECIALTY_BIBLIOGRAPHY[key] : "";
}

/**
 * Gera o bloco completo de bibliografia para injeção em prompts.
 */
export function getFullBibliographyBlock(): string {
  return `\n=== BIBLIOGRAFIA DE REFERÊNCIA POR ESPECIALIDADE (OBRIGATÓRIO) ===
Use os livros-texto específicos da especialidade como base para o conteúdo e cite-os nas explicações.

${Object.entries(SPECIALTY_BIBLIOGRAPHY).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

INSTRUÇÃO: Ao gerar conteúdo sobre uma especialidade, PRIORIZE as referências listadas acima para aquela área. Cite o livro relevante na explicação/referência de cada questão ou flashcard.`;
}
