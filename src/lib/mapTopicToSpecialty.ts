/** Maps a topic string to the closest medical specialty */
export function mapTopicToSpecialty(topic: string): string | null {
  if (!topic) return null;
  const t = topic.toLowerCase();
  const map: [string[], string][] = [
    [["angiolog", "vascular", "varizes", "trombose venosa", "insuficiência venosa", "aneurisma de aorta", "doença arterial periférica", "claudicação", "isquemia de membro", "pé diabético", "linfedema", "fístula arteriovenosa", "endarterectomia", "safena", "doppler vascular", "linfangite", "erisipela"], "Angiologia"],
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
    [["dermato", "pele", "dermat", "psoríase", "melanoma", "piodermite", "dermatozoonose", "dermatovirose", "lesão elementar", "lesões elementares"], "Dermatologia"],
    [["oftalmo", "olho", "glaucoma", "catarata", "retina"], "Oftalmologia"],
    [["otorrino", "ouvido", "nariz", "garganta", "sinusite", "otite"], "Otorrinolaringologia"],
    [["preventiva", "epidemio", "saúde pública", "sus", "atenção primária", "vacina"], "Medicina Preventiva"],
    [["semiologia", "anamnese", "exame físico", "ausculta", "palpação", "percussão", "propedêutica", "sinal de", "inspeção"], "Semiologia"],
    [["anatomia", "anatômic", "muscul", "nervo", "artéria", "veia", "osso", "ligamento", "fáscia", "pelve", "mediastino", "neuroanatomia"], "Anatomia"],
    [["emergência", "urgência", "pcr", "choque", "politrauma", "reanimação"], "Medicina de Emergência"],
    [["uti", "intensiva", "ventilação mecânica", "sedação", "choque séptico"], "Terapia Intensiva"],
    [["farmacolog", "farmacocinética", "farmacodinâmica", "posologia", "mecanismo de ação", "receptor", "agonista", "antagonista", "inibidor", "interação medicamentosa", "efeito adverso", "meia-vida", "dose-resposta"], "Farmacologia"],
    [["oncolog", "câncer", "tumor", "neoplasia", "metástase", "quimioterapia", "radioterapia", "imunoterapia", "estadiamento", "tnm", "carcinoma", "sarcoma", "rastreamento oncológico", "cuidados paliativos", "marcador tumoral"], "Oncologia"],
    [["fisiologi", "guyton", "ganong", "costanzo", "potencial de ação", "hemodinâmica", "termorregulação", "débito cardíaco", "volume sistólico", "filtração glomerular", "equilíbrio ácido-base", "pressão oncótica", "difusão alveolar", "contração muscular", "sinapse"], "Fisiologia"],
    [["bioquímic", "lehninger", "lippincott", "marks", "metabolismo", "glicólise", "krebs", "enzima", "fosforilação oxidativa", "beta-oxidação", "gliconeogênese", "cetogênese", "ciclo da ureia", "ácido graxo", "coenzima", "vitamina b", "bioenergética", "erro inato"], "Bioquímica"],
    [["histolog", "tecido", "lâmina", "corte histológico", "epitélio", "conjuntivo", "muscular", "nervoso", "coloração", "hematoxilina", "eosina"], "Histologia"],
    [["embriolog", "embrião", "organogênese", "gastrulação", "neurulação", "blastocisto", "somito", "tubo neural", "placenta", "teratogênese", "malformação congênita"], "Embriologia"],
    [["microbiolog", "bactéria", "fungo", "vírus", "gram positivo", "gram negativo", "cultura", "antibiograma", "biofilme", "virulência", "bacteremia"], "Microbiologia"],
    [["imunolog", "anticorpo", "linfócito", "citocina", "complemento", "imunoglobulina", "hipersensibilidade", "autoimunidade", "imunodeficiência", "mhc", "hla", "resposta imune"], "Imunologia"],
    [["parasitolog", "helminto", "protozoário", "vetor", "ciclo biológico", "esquistossomose", "giárdia", "amebíase", "toxoplasmose", "leishmaniose", "malária", "ancilostomíase"], "Parasitologia"],
    [["genétic", "cromossomo", "mutação", "cariótipo", "herança", "autossômico", "ligado ao x", "pcr", "sequenciamento", "epigenética", "aconselhamento genético", "trissomia", "síndrome de down", "síndrome de turner"], "Genética Médica"],
    [["patologi", "necrose", "inflamação aguda", "inflamação crônica", "displasia", "metaplasia", "hiperplasia", "atrofia", "apoptose", "granuloma", "amiloidose", "trombo", "êmbolo", "infarto"], "Patologia"],
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
