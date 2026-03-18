/** Maps a topic string to the closest medical specialty */
export function mapTopicToSpecialty(topic: string): string | null {
  if (!topic) return null;
  const t = topic.toLowerCase();
  const map: [string[], string][] = [
    [["cardio", "coração", "iam", "arritmia", "hipertensão", "insuficiência cardíaca", "valv"], "Cardiologia"],
    [["pneumo", "pulmão", "asma", "dpoc", "pneumonia", "tuberculose", "respirat"], "Pneumologia"],
    [["neuro", "avc", "epilepsia", "cefaleia", "meningite", "parkinson", "alzheimer"], "Neurologia"],
    [["endocrino", "diabetes", "tireoide", "hipotireoid", "hipertireoid", "adrenal", "hipófise"], "Endocrinologia"],
    [["gastro", "fígado", "hepat", "intestin", "esôfago", "pancreat", "colite", "crohn"], "Gastroenterologia"],
    [["nefro", "rim", "renal", "diálise", "glomerul", "nefrit"], "Nefrologia"],
    [["infecto", "hiv", "aids", "sepse", "dengue", "malária", "antibiótico", "parasit"], "Infectologia"],
    [["hemato", "anemia", "leucemia", "linfoma", "coagul", "plaqueta"], "Hematologia"],
    [["reumato", "lúpus", "artrite", "vasculite", "fibromialgia"], "Reumatologia"],
    [["pediatr", "neonat", "criança", "lactente", "recém-nascido"], "Pediatria"],
    [["gineco", "obstet", "gravidez", "parto", "gestação", "pré-natal", "útero", "ovário"], "Ginecologia e Obstetrícia"],
    [["cirurg", "apendicite", "colecist", "hérnia", "abdome agudo", "trauma"], "Cirurgia"],
    [["psiqui", "depressão", "ansiedade", "esquizofrenia", "bipolar", "psicose"], "Psiquiatria"],
    [["dermato", "pele", "dermat", "psoríase", "melanoma"], "Dermatologia"],
    [["oftalmo", "olho", "glaucoma", "catarata", "retina"], "Oftalmologia"],
    [["otorrino", "ouvido", "nariz", "garganta", "sinusite", "otite"], "Otorrinolaringologia"],
    [["preventiva", "epidemio", "saúde pública", "sus", "atenção primária", "vacina"], "Medicina Preventiva"],
    [["semiologia", "anamnese", "exame físico", "ausculta", "palpação", "percussão", "propedêutica", "sinal de", "inspeção"], "Semiologia"],
    [["anatomia", "anatômic", "muscul", "nervo", "artéria", "veia", "osso", "ligamento", "fáscia", "pelve", "mediastino", "neuroanatomia"], "Anatomia"],
    [["emergência", "urgência", "pcr", "choque", "politrauma", "reanimação"], "Medicina de Emergência"],
    [["uti", "intensiva", "ventilação mecânica", "sedação", "choque séptico"], "Terapia Intensiva"],
    [["farmacolog", "farmacocinética", "farmacodinâmica", "posologia", "mecanismo de ação", "receptor", "agonista", "antagonista", "inibidor", "interação medicamentosa", "efeito adverso", "meia-vida", "dose-resposta"], "Farmacologia"],
    [["oncolog", "câncer", "tumor", "neoplasia", "metástase", "quimioterapia", "radioterapia", "imunoterapia", "estadiamento", "tnm", "carcinoma", "sarcoma", "rastreamento oncológico", "cuidados paliativos", "marcador tumoral"], "Oncologia"],
  ];
  for (const [keywords, specialty] of map) {
    if (keywords.some((k) => t.includes(k))) return specialty;
  }
  // Try matching directly against specialty names
  const specialties = map.map(([, s]) => s);
  for (const s of specialties) {
    if (t.includes(s.toLowerCase())) return s;
  }
  return null;
}
