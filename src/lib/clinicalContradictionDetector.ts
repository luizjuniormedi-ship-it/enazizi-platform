/**
 * Detector de contradições clínicas em questões médicas.
 * Bloqueia questões com incoerências graves entre caso clínico e diagnóstico.
 */

export interface ContradictionResult {
  has_contradiction: boolean;
  severity: "none" | "leve" | "moderado" | "grave";
  issues: string[];
}

interface ClinicalRule {
  diagnosis_pattern: RegExp;
  required_patterns: RegExp[];
  forbidden_patterns?: RegExp[];
  label: string;
  severity: "leve" | "moderado" | "grave";
}

/**
 * Regras clínicas validadas por especialidade.
 * Cada regra verifica se o enunciado é coerente com o diagnóstico.
 */
const CLINICAL_RULES: ClinicalRule[] = [
  // ── Pneumologia ──
  {
    diagnosis_pattern: /\b(dpoc|doença pulmonar obstrutiva crônica|enfisema pulmonar)\b/i,
    required_patterns: [
      /\b(tabag|fumo|fumante|ex-fumante|ex-tabagista|tabagista|cigarros?|maços?[- ]?ano|carga tabág)/i,
    ],
    label: "DPOC sem história de tabagismo",
    severity: "grave",
  },
  {
    diagnosis_pattern: /\b(pneumonia|broncopneumonia|pnm)\b/i,
    required_patterns: [
      /\b(tosse|dispneia|febre|taqui[pn]|estertores?|crepitações?|expectoração|escarro)\b/i,
    ],
    label: "Pneumonia sem sintomas respiratórios",
    severity: "grave",
  },
  {
    diagnosis_pattern: /\b(asma|broncoespasmo|crise asmática)\b/i,
    required_patterns: [
      /\b(sibil|dispneia|tosse|broncoespasmo|chiado|falta de ar)\b/i,
    ],
    label: "Asma sem sintomas respiratórios",
    severity: "grave",
  },
  {
    diagnosis_pattern: /\b(tep|tromboembolismo pulmonar|embolia pulmonar)\b/i,
    required_patterns: [
      /\b(dispneia|taquicardia|dor torác|taqui[pn]|hemoptise|hipoxemia|d-?dímero|TVP)\b/i,
    ],
    label: "TEP sem dispneia/taquicardia/dor torácica",
    severity: "grave",
  },

  // ── Cardiologia ──
  {
    diagnosis_pattern: /\b(iam|infarto agudo|infarto do miocárdio|síndrome coronariana aguda|sca)\b/i,
    required_patterns: [
      /\b(dor|precordial|retroesternal|opressão|angina|desconforto torác|mal-estar|sudorese|troponina|supra|infra|ECG|eletrocardiograma)\b/i,
    ],
    label: "IAM sem dor/alteração eletrocardiográfica/marcadores",
    severity: "grave",
  },
  {
    diagnosis_pattern: /\b(insuficiência cardíaca|ic descompensada|icc)\b/i,
    required_patterns: [
      /\b(dispneia|edema|jugular|ortopneia|B3|crepitações?|congestão|BNP)\b/i,
    ],
    label: "IC sem sinais de congestão ou dispneia",
    severity: "grave",
  },
  {
    diagnosis_pattern: /\b(fibrilação atrial|fa)\b/i,
    required_patterns: [
      /\b(irregular|palpitaç|arritmia|ritmo irregular|ECG|eletrocardiograma|frequência|taquicardia)\b/i,
    ],
    label: "FA sem irregularidade do ritmo ou palpitação",
    severity: "moderado",
  },
  {
    diagnosis_pattern: /\b(endocardite)\b/i,
    required_patterns: [
      /\b(febre|sopro|hemocult|emboli|vegetação|janeway|osler|petéquias?)\b/i,
    ],
    label: "Endocardite sem febre ou sopro cardíaco",
    severity: "grave",
  },

  // ── Neurologia ──
  {
    diagnosis_pattern: /\b(avc|acidente vascular cerebral|avc isquêmico|avc hemorrágico)\b/i,
    required_patterns: [
      /\b(déficit|paresia|plégia|afasia|disartria|hemipar|hemipleg|desvio|anisocoria|rebaixamento|glasgow|facial|força)\b/i,
    ],
    label: "AVC com exame neurológico normal",
    severity: "grave",
  },
  {
    diagnosis_pattern: /\b(meningite)\b/i,
    required_patterns: [
      /\b(febre|rigidez de nuca|cefaleia|kernig|brudzinski|fotofobia|líquor|LCR)\b/i,
    ],
    label: "Meningite sem febre ou sinais meníngeos",
    severity: "grave",
  },

  // ── Gastroenterologia ──
  {
    diagnosis_pattern: /\b(cirrose|hepatopatia crônica|insuficiência hepática)\b/i,
    required_patterns: [
      /\b(ascite|icterícia|hepatomegalia|esplenomegalia|varizes|albumina|encefalopatia|spider|telangiectasia|palmar|etilis)\b/i,
    ],
    label: "Cirrose sem estigmas hepáticos",
    severity: "moderado",
  },
  {
    diagnosis_pattern: /\b(apendicite)\b/i,
    required_patterns: [
      /\b(dor abdominal|FID|fossa ilíaca|blumberg|rovsing|descompressão|mcburney)\b/i,
    ],
    label: "Apendicite sem dor em FID",
    severity: "grave",
  },
  {
    diagnosis_pattern: /\b(pancreatite aguda)\b/i,
    required_patterns: [
      /\b(dor abdominal|epigástr|amilase|lipase|irradiação para dorso|faixa)\b/i,
    ],
    label: "Pancreatite sem dor abdominal ou marcadores",
    severity: "grave",
  },

  // ── Endocrinologia ──
  {
    diagnosis_pattern: /\b(cetoacidose diabética|cad)\b/i,
    required_patterns: [
      /\b(glicemia|glicose|acidose|pH|bicarbonato|kussmaul|desidratação|poliúria|polidipsia|cetonúria|cetona)\b/i,
    ],
    label: "CAD sem hiperglicemia ou acidose",
    severity: "grave",
  },
  {
    diagnosis_pattern: /\b(hipotireoidismo)\b/i,
    required_patterns: [
      /\b(TSH|T4|fadiga|ganho de peso|mixedema|bradicardia|constipação|intolerância ao frio|pele seca)\b/i,
    ],
    label: "Hipotireoidismo sem sintomas ou alteração laboratorial",
    severity: "moderado",
  },

  // ── Infectologia ──
  {
    diagnosis_pattern: /\b(dengue)\b/i,
    required_patterns: [
      /\b(febre|mialgia|cefaleia|retro-?orbit|plaquetopenia|hematócrito|prova do laço|petéquias?|artralgias?)\b/i,
    ],
    label: "Dengue sem febre ou mialgia",
    severity: "grave",
  },
  {
    diagnosis_pattern: /\b(tuberculose|tb pulmonar)\b/i,
    required_patterns: [
      /\b(tosse|febre|sudorese noturna|emagrecimento|hemoptise|BAAR|escarro|baciloscopia|PPD)\b/i,
    ],
    label: "Tuberculose sem tosse crônica ou sintomas constitucionais",
    severity: "grave",
  },

  // ── Nefrologia ──
  {
    diagnosis_pattern: /\b(insuficiência renal aguda|ira|lesão renal aguda|lra)\b/i,
    required_patterns: [
      /\b(creatinina|ureia|oligúria|anúria|diurese|potássio|hipercalemia|edema)\b/i,
    ],
    label: "IRA sem alteração de função renal",
    severity: "grave",
  },

  // ── Pediatria ──
  {
    diagnosis_pattern: /\b(bronquiolite)\b/i,
    required_patterns: [
      /\b(lactente|meses|sibil|taqui[pn]|dispneia|tiragem|VSR|coriza|crépitos)\b/i,
    ],
    label: "Bronquiolite sem lactente ou sintomas respiratórios",
    severity: "grave",
  },

  // ── Dermatologia ──
  {
    diagnosis_pattern: /\b(melanoma)\b/i,
    required_patterns: [
      /\b(lesão|nevo|assimetria|borda|cor|diâmetro|ABCDE|pigmentad|crescimento)\b/i,
    ],
    label: "Melanoma sem descrição de lesão cutânea",
    severity: "grave",
  },

  // ── Oftalmologia ──
  {
    diagnosis_pattern: /\b(glaucoma)\b/i,
    required_patterns: [
      /\b(pressão intraocular|PIO|campo visual|escavação|disco óptico|tonometria|nervo óptico)\b/i,
    ],
    label: "Glaucoma sem PIO elevada ou alteração de disco óptico",
    severity: "moderado",
  },
  {
    diagnosis_pattern: /\b(retinopatia diabética)\b/i,
    required_patterns: [
      /\b(diabetes|diabétic|microaneurisma|exsudato|hemorragia|neovas|fundo de olho|fundoscopia)\b/i,
    ],
    label: "Retinopatia diabética sem menção a diabetes",
    severity: "grave",
  },

  // ── Ortopedia ──
  {
    diagnosis_pattern: /\b(fratura de [cf]êmur|fratura do colo femoral)\b/i,
    required_patterns: [
      /\b(dor|impotência funcional|encurtamento|rotação externa|queda|trauma|deambul)\b/i,
    ],
    label: "Fratura de fêmur sem trauma ou impotência funcional",
    severity: "grave",
  },

  // ── Ginecologia/Obstetrícia ──
  {
    diagnosis_pattern: /\b(eclâmpsia|pré-eclâmpsia)\b/i,
    required_patterns: [
      /\b(hipertensão|PA |pressão arterial|proteinúria|gestante|grávida|semanas|IG)\b/i,
    ],
    label: "Pré-eclâmpsia sem hipertensão em gestante",
    severity: "grave",
  },

  // ── Hematologia ──
  {
    diagnosis_pattern: /\b(anemia falciforme|doença falciforme)\b/i,
    required_patterns: [
      /\b(hemoglobina|drepanócit|crise vaso-?oclusiva|dor óssea|falciz|HbS|eletroforese)\b/i,
    ],
    label: "Anemia falciforme sem dados hematológicos",
    severity: "grave",
  },
];

/**
 * Detecta contradições clínicas em uma questão médica.
 */
export function detectClinicalContradictions(
  statement: string,
  diagnosis: string,
  explanation?: string
): ContradictionResult {
  const issues: string[] = [];
  let worstSeverity: "none" | "leve" | "moderado" | "grave" = "none";

  const textToCheck = `${statement} ${explanation || ""}`.toLowerCase();

  for (const rule of CLINICAL_RULES) {
    // Só aplica se o diagnóstico bater com o padrão
    if (!rule.diagnosis_pattern.test(diagnosis)) continue;

    // Verifica se PELO MENOS UM dos padrões obrigatórios está presente
    const hasRequired = rule.required_patterns.some(p => p.test(textToCheck));

    if (!hasRequired) {
      issues.push(rule.label);
      // Atualizar severidade para a pior encontrada
      const severityRank = { none: 0, leve: 1, moderado: 2, grave: 3 };
      if (severityRank[rule.severity] > severityRank[worstSeverity]) {
        worstSeverity = rule.severity;
      }
    }

    // Verifica padrões proibidos
    if (rule.forbidden_patterns) {
      for (const fp of rule.forbidden_patterns) {
        if (fp.test(textToCheck)) {
          issues.push(`${rule.label} — padrão proibido detectado`);
          worstSeverity = "grave";
        }
      }
    }
  }

  return {
    has_contradiction: issues.length > 0,
    severity: worstSeverity,
    issues,
  };
}

/**
 * Verifica se a questão deve ser bloqueada (contradição grave).
 */
export function shouldBlockQuestion(
  statement: string,
  diagnosis: string,
  explanation?: string
): boolean {
  const result = detectClinicalContradictions(statement, diagnosis, explanation);
  return result.severity === "grave";
}
