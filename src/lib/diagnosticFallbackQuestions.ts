import type { DiagQuestion } from "@/components/diagnostic/DiagnosticExam";

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FALLBACK_BANK: Record<string, DiagQuestion[]> = {
  "Clínica Médica": [
    {
      statement: "Mulher, 62 anos, hipertensa e diabética, chega ao PS com dispneia súbita, taquipneia (FR 28 irpm), SpO2 88%, estertores crepitantes bilaterais até terço médio e edema de membros inferiores ++/4+. PA 180x110 mmHg. BNP: 1200 pg/mL. Radiografia de tórax mostra cefalização de fluxo e linhas B de Kerley. Qual a conduta inicial prioritária?",
      options: ["A) Furosemida IV + nitroglicerina IV + oxigênio suplementar", "B) Dobutamina IV em bomba de infusão contínua", "C) Intubação orotraqueal imediata e ventilação mecânica", "D) Enalapril VO e aguardar resposta em 2 horas", "E) Amiodarona IV pela taquicardia associada"],
      correct_index: 0, topic: "Clínica Médica", explanation: "ICC descompensada com edema agudo de pulmão hipertensivo: a prioridade é reduzir pré-carga (furosemida IV), pós-carga (nitroglicerina IV) e oferecer O2. Dobutamina é para choque cardiogênico com hipotensão.", difficulty: "intermediário"
    },
    {
      statement: "Homem, 28 anos, universitário, trazido ao PS com rebaixamento do nível de consciência (Glasgow 10). Hálito cetônico, desidratação +++/4+, respiração de Kussmaul. Glicemia capilar: 480 mg/dL. Gasometria: pH 7,12, HCO3 8 mEq/L, pCO2 18 mmHg. Na+ 132, K+ 5,8 mEq/L. Qual a sequência correta de tratamento?",
      options: ["A) Hidratação com SF 0,9% → Insulina regular IV → Reposição de K+ quando < 5,0", "B) Insulina NPH SC imediata + soro glicosado 5%", "C) Bicarbonato de sódio IV imediato pelo pH < 7,15", "D) Hidratação com Ringer Lactato + insulina glargina SC", "E) Reposição de potássio imediata antes de qualquer outra medida"],
      correct_index: 0, topic: "Clínica Médica", explanation: "Cetoacidose diabética: prioridade é volume (SF 0,9%), depois insulina regular IV em BIC. K+ está alto por acidose — repor apenas quando cair < 5,0. Bicarbonato só se pH < 6,9.", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 55 anos, tabagista (40 maços-ano), apresenta tosse produtiva há 3 dias, febre 38,8°C, calafrios, dor pleurítica à direita. Ausculta: murmúrio vesicular diminuído em base D com macicez à percussão. Radiografia: consolidação em lobo inferior direito com broncogramas aéreos. CURB-65 = 2. Qual a melhor conduta?",
      options: ["A) Internação hospitalar com ceftriaxona + azitromicina IV", "B) Tratamento ambulatorial com amoxicilina VO por 7 dias", "C) UTI com piperacilina-tazobactam + vancomicina", "D) Levofloxacino VO ambulatorial por 5 dias", "E) Aguardar cultura de escarro antes de iniciar antibiótico"],
      correct_index: 0, topic: "Clínica Médica", explanation: "PAC com CURB-65 = 2: indica internação em enfermaria. Esquema padrão é beta-lactâmico (ceftriaxona) + macrolídeo (azitromicina). CURB-65 ≥ 3 indica considerar UTI.", difficulty: "intermediário"
    },
    {
      statement: "Homem, 72 anos, com história de fibrilação atrial crônica sem uso de anticoagulante, é trazido ao PS com hemiplegia esquerda de início súbito há 2 horas, desvio de olhar conjugado para a direita, disartria e hemianopsia homônima esquerda. NIHSS: 18. PA: 170x95 mmHg. TC de crânio sem contraste: sem hemorragia. Qual a conduta?",
      options: ["A) Trombólise com alteplase IV (0,9 mg/kg) dentro da janela de 4,5 horas", "B) Anticoagulação plena com heparina não fracionada IV", "C) AAS 300 mg + clopidogrel 300 mg de ataque", "D) Observação clínica e controle pressórico com nitroprussiato", "E) Craniectomia descompressiva de emergência"],
      correct_index: 0, topic: "Clínica Médica", explanation: "AVC isquêmico com < 4,5h de evolução, sem contraindicações (TC sem hemorragia): indicação clássica de trombólise com alteplase. Anticoagulação plena é contraindicada na fase aguda.", difficulty: "avançado"
    },
    {
      statement: "Mulher, 34 anos, previamente hígida, apresenta dispneia progressiva há 5 dias, taquicardia (FC 120), dor em panturrilha direita e edema assimétrico em MID. Antecedente: uso de contraceptivo oral combinado. D-dímero: 3.200 ng/mL. Angiotomografia de tórax: falha de enchimento em artéria lobar inferior direita. Qual o tratamento inicial?",
      options: ["A) Heparina não fracionada IV em dose plena ou HBPM SC", "B) Varfarina VO isolada com INR alvo 2-3", "C) Filtro de veia cava inferior imediato", "D) Trombólise sistêmica com alteplase", "E) AAS 100 mg/dia e meias de compressão elástica"],
      correct_index: 0, topic: "Clínica Médica", explanation: "TEP confirmado sem instabilidade hemodinâmica: anticoagulação plena com heparina. Trombólise é reservada para TEP maciço com choque. Varfarina nunca é usada isoladamente na fase aguda.", difficulty: "intermediário"
    },
    {
      statement: "Homem, 68 anos, ex-tabagista, com DPOC Gold D, chega ao PS com piora da dispneia há 2 dias, aumento do volume e purulência do escarro, FR 30, SpO2 85% em ar ambiente, uso de musculatura acessória. Gasometria: pH 7,30, pCO2 60, pO2 52, HCO3 28. Qual a conduta prioritária?",
      options: ["A) VNI (BiPAP) + broncodilatador inalatório + corticoide sistêmico + ATB", "B) Intubação orotraqueal imediata sem tentativa de VNI", "C) Apenas nebulização com salbutamol e alta", "D) Oxigênio em alto fluxo (FiO2 100%) por máscara com reservatório", "E) Aminofilina IV em bolus como broncodilatador de resgate"],
      correct_index: 0, topic: "Clínica Médica", explanation: "Exacerbação de DPOC com acidose respiratória (pH 7,30, pCO2 60): indicação de VNI (BiPAP). Associar BD inalatório, corticoide sistêmico e ATB (escarro purulento). O2 em alto fluxo pode piorar retenção de CO2. Aminofilina IV não é mais recomendada.", difficulty: "avançado"
    },
    {
      statement: "Mulher, 42 anos, apresenta febre alta (39,5°C), disúria intensa, calafrios, dor lombar à direita com punho-percussão positiva (Giordano +). Hemograma: leucocitose 18.000 com desvio. Urina tipo I: piúria maciça, nitrito positivo. Urocultura pendente. Cr: 1,1. Qual o diagnóstico e conduta?",
      options: ["A) Pielonefrite aguda — internação com ciprofloxacino IV ou ceftriaxona IV", "B) Cistite simples — fosfomicina trometamol dose única VO", "C) Nefrolitíase — analgesia com AINE e filtrar urina", "D) Abscesso renal — nefrectomia de urgência", "E) Glomerulonefrite aguda — restrição de sal e furosemida"],
      correct_index: 0, topic: "Clínica Médica", explanation: "Febre + Giordano + + leucocitose + piúria: pielonefrite aguda. Paciente com sinais sistêmicos (febre alta, calafrios): internar e ATB IV (fluoroquinolona ou cefalosporina 3ª geração).", difficulty: "intermediário"
    },
    {
      statement: "Homem, 50 anos, etilista pesado, apresenta hematêmese volumosa, PA 85x55, FC 125, extremidades frias. Exame: ascite moderada, esplenomegalia, circulação colateral visível. Hb 7,2. Qual a conduta inicial?",
      options: ["A) Reposição volêmica + terlipressina IV + EDA de urgência em até 12 horas", "B) Sengstaken-Blakemore imediato sem EDA", "C) Laparotomia exploradora de urgência", "D) Transfusão maciça visando Hb > 12 g/dL", "E) Inibidor de bomba de prótons IV isolado e observação"],
      correct_index: 0, topic: "Clínica Médica", explanation: "Cirrótico com HDA varicosa: estabilizar hemodinamicamente, iniciar vasoconstritor esplâncnico (terlipressina ou octreotide), ATB profilático (ceftriaxona) e EDA em até 12h para ligadura elástica. Alvo transfusional: Hb 7-8.", difficulty: "avançado"
    },
    {
      statement: "Mulher, 35 anos, apresenta palpitações, tremor fino de extremidades, perda de peso (8 kg em 2 meses), sudorese excessiva e exoftalmia bilateral. FC 110 bpm em repouso, PA 150x60 mmHg. Tireoide difusamente aumentada, indolor. TSH < 0,01 mUI/L, T4L 5,8 ng/dL. TRAb positivo. Qual o diagnóstico e tratamento inicial?",
      options: ["A) Doença de Graves — metimazol + betabloqueador (propranolol)", "B) Bócio multinodular tóxico — iodo radioativo imediato", "C) Tireoidite subaguda de De Quervain — AINEs e observação", "D) Tireotoxicose factícia — suspender levotiroxina exógena", "E) Crise tireotóxica — PTU + iodo de Lugol + dexametasona + propranolol"],
      correct_index: 0, topic: "Clínica Médica", explanation: "Hipertireoidismo + bócio difuso + exoftalmia + TRAb positivo: Doença de Graves. Tratamento inicial: tionamida (metimazol preferido) + betabloqueador para controle de sintomas adrenérgicos.", difficulty: "intermediário"
    },
    {
      statement: "Homem, 60 anos, hipertenso e dislipidêmico, é internado com quadro de oligúria progressiva, edema generalizado e creatinina de 6,5 mg/dL (basal 1,2 há 3 meses). K+ 6,8 mEq/L com ondas T apiculadas no ECG. Ureia 180 mg/dL. Diurese < 200 mL/24h. Qual a conduta prioritária?",
      options: ["A) Gluconato de cálcio IV + medidas para reduzir K+ + indicar hemodiálise de urgência", "B) Furosemida 200 mg IV em bolus e aguardar diurese", "C) Apenas restrição de potássio na dieta e reavaliar em 48h", "D) IECA em dose alta para nefroproteção imediata", "E) Poliestirenossulfonato de cálcio VO isolado"],
      correct_index: 0, topic: "Clínica Médica", explanation: "Lesão renal aguda oligúrica com hipercalemia grave (K+ 6,8 + alteração ECG): emergência. Gluconato de cálcio IV para estabilizar membrana cardíaca, depois insulina+glicose e hemodiálise de urgência. IECA é contraindicado na fase aguda pela hipercalemia.", difficulty: "avançado"
    },
  ],
  "Cirurgia": [
    {
      statement: "Homem, 45 anos, chega ao PS com dor abdominal intensa em fossa ilíaca direita há 12 horas, febre 38,5°C, sinal de Blumberg positivo, defesa involuntária localizada. Leucócitos: 16.000 com desvio à esquerda. TC de abdome: apêndice com 12 mm, borramento da gordura periapendicular e líquido livre em pelve. Qual a conduta?",
      options: ["A) Apendicectomia (laparoscópica ou aberta) com antibioticoterapia perioperatória", "B) Antibioticoterapia isolada com metronidazol + ciprofloxacino e reavaliação em 48h", "C) Colonoscopia de urgência para excluir neoplasia", "D) Drenagem percutânea guiada por TC", "E) Lavagem peritoneal diagnóstica antes de decidir cirurgia"],
      correct_index: 0, topic: "Cirurgia", explanation: "Apendicite aguda com sinais de irritação peritoneal e confirmação tomográfica: tratamento é cirúrgico (apendicectomia). Antibioticoterapia isolada pode ser considerada em apendicite não complicada sem peritonite.", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 38 anos, vítima de acidente automobilístico, chega ao PS com PA 80x50, FC 130, abdome distendido e doloroso, FAST positivo com líquido livre em espaço hepatorrenal (Morrison). Após 2L de cristaloide, mantém PA 85x55. Glasgow 14. Qual o próximo passo?",
      options: ["A) Laparotomia exploradora de urgência", "B) TC de abdome com contraste para estadiar lesão", "C) Novo bolus de 2L de cristaloide e reavaliar", "D) Arteriografia com embolização seletiva", "E) Paracentese diagnóstica e lavagem peritoneal"],
      correct_index: 0, topic: "Cirurgia", explanation: "Paciente hemodinamicamente instável com FAST positivo e não responsiva a reposição volêmica: indicação absoluta de laparotomia exploradora. TC só em pacientes estáveis.", difficulty: "intermediário"
    },
    {
      statement: "Homem, 65 anos, com hérnia inguinal direita volumosa há 3 anos, chega ao PS com dor intensa no local há 6 horas, náuseas e vômitos. Exame: massa inguinal direita tensa, dolorosa, irredutível. Sem sinais de isquemia cutânea. Peristalse presente. Qual a conduta?",
      options: ["A) Tentativa de redução manual (taxis) e, se falhar, cirurgia de urgência", "B) Cirurgia eletiva agendada para próxima semana", "C) Observação por 24 horas com analgesia", "D) TC de abdome antes de qualquer decisão", "E) Antibioticoterapia empírica e internação clínica"],
      correct_index: 0, topic: "Cirurgia", explanation: "Hérnia inguinal encarcerada sem sinais de estrangulamento: pode-se tentar redução manual (taxis) com sedação leve. Se não reduzir ou houver sinais de estrangulamento, cirurgia de urgência.", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 52 anos, com colelitíase conhecida, apresenta dor em hipocôndrio direito há 48h, febre 39°C, icterícia e calafrios. PA 95x60. Leucócitos: 22.000. Bilirrubina total: 6,8 mg/dL. USG: coledocolitíase com dilatação de vias biliares (colédoco 14 mm). Qual o diagnóstico e conduta prioritária?",
      options: ["A) Colangite aguda — antibioticoterapia + descompressão biliar por CPRE", "B) Colecistite aguda — colecistectomia videolaparoscópica imediata", "C) Pancreatite biliar — jejum e hidratação venosa", "D) Hepatite aguda — suspender medicações hepatotóxicas", "E) Abscesso hepático — drenagem percutânea guiada por USG"],
      correct_index: 0, topic: "Cirurgia", explanation: "Tríade de Charcot (dor em HCD + febre + icterícia) com coledocolitíase: colangite aguda. Conduta: ATB + descompressão biliar de urgência (CPRE com papilotomia).", difficulty: "avançado"
    },
    {
      statement: "Homem, 30 anos, esfaqueado em flanco esquerdo, hemodinamicamente estável (PA 120x80, FC 88). Exame: orifício de entrada em flanco E sem evisceração, dor leve à palpação. TC com contraste: laceração esplênica grau II (AAST) com pequeno hematoma subcapsular sem extravasamento ativo de contraste. Qual a conduta?",
      options: ["A) Tratamento não operatório com observação em UTI, repouso e controle seriado", "B) Esplenectomia total de urgência", "C) Esplenectomia parcial videolaparoscópica", "D) Arteriografia com embolização esplênica profilática", "E) Laparotomia exploradora mandatória por ser ferimento penetrante"],
      correct_index: 0, topic: "Cirurgia", explanation: "Trauma esplênico grau II em paciente estável, sem extravasamento ativo: tratamento não operatório (TNO) é seguro com monitorização rigorosa.", difficulty: "avançado"
    },
    {
      statement: "Homem, 58 anos, com dor epigástrica intensa de início súbito há 4 horas, defesa abdominal em tábua difusa, abdome rígido. Radiografia de tórax AP: pneumoperitônio (ar subdiafragmático bilateral). Histórico de úlcera péptica e uso crônico de AINEs. Qual o diagnóstico e conduta?",
      options: ["A) Úlcera péptica perfurada — laparotomia exploradora com ulcerorrafia (cirurgia de Taylor)", "B) Pancreatite aguda grave — jejum, hidratação e analgesia", "C) Perfuração de divertículo — colostomia à Hartmann", "D) Isquemia mesentérica — arteriografia e papaverina", "E) Apendicite aguda perfurada — apendicectomia e drenagem"],
      correct_index: 0, topic: "Cirurgia", explanation: "Dor epigástrica súbita + abdome em tábua + pneumoperitônio + história de AINEs: úlcera perfurada. Tratamento: laparotomia de urgência com rafia da perfuração (cirurgia de Taylor) e lavagem da cavidade.", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 70 anos, com dor abdominal difusa há 24h, distensão progressiva, parada de eliminação de fezes e gases há 48h. Radiografia de abdome: distensão de cólon com sinal do grão de café (coffee bean sign) em projeção de sigmoide. Sem sinais de peritonite. Qual o diagnóstico e conduta inicial?",
      options: ["A) Volvo de sigmoide — descompressão por colonoscopia/retossigmoidoscopia", "B) Obstrução por tumor colorretal — colostomia de emergência", "C) Megacólon tóxico — colectomia total de urgência", "D) Íleo paralítico — sonda nasogástrica e correção eletrolítica", "E) Síndrome de Ogilvie — neostigmina IV"],
      correct_index: 0, topic: "Cirurgia", explanation: "Idoso + obstrução colônica + sinal do grão de café: volvo de sigmoide. Sem peritonite: descompressão endoscópica é a primeira medida. Se falhar ou se sinais de sofrimento: sigmoidectomia.", difficulty: "intermediário"
    },
    {
      statement: "Homem, 42 anos, vítima de queimadura por chama em ambiente fechado, com queimaduras de 2º grau profundo em tórax anterior, abdome e face (aproximadamente 36% SCQ pela regra de 9). Rouquidão, estridência e pelos nasais chamuscados. PA 110x70, FC 100. Qual a primeira prioridade?",
      options: ["A) Via aérea definitiva (intubação orotraqueal) pela lesão inalatória iminente", "B) Desbridamento das lesões e curativo com sulfadiazina de prata", "C) Reposição volêmica pela fórmula de Parkland como prioridade absoluta", "D) Escarotomia de tórax para melhorar ventilação", "E) Transferência imediata para centro de queimados sem estabilização"],
      correct_index: 0, topic: "Cirurgia", explanation: "Queimadura em ambiente fechado + rouquidão + estridor + pelos nasais chamuscados: alto risco de lesão inalatória. Prioridade absoluta = via aérea (A do ABCDE). IOT precoce antes do edema evoluir e impossibilitar o procedimento.", difficulty: "avançado"
    },
    {
      statement: "Mulher, 45 anos, com nódulo tireoidiano de 3 cm, endurecido, fixo, indolor, com linfonodomegalia cervical ipsilateral. USG: nódulo sólido hipoecogênico, microcalcificações, margens irregulares, TI-RADS 5. PAAF: carcinoma papilífero. TSH normal. Qual a conduta?",
      options: ["A) Tireoidectomia total com esvaziamento cervical do compartimento central", "B) Lobectomia (tireoidectomia parcial) sem esvaziamento", "C) Observação com USG semestral e nova PAAF em 1 ano", "D) Radioiodoterapia ablativa como tratamento primário", "E) Quimioterapia com sorafenib como primeira linha"],
      correct_index: 0, topic: "Cirurgia", explanation: "Carcinoma papilífero com nódulo > 1 cm, linfonodomegalia e características agressivas: tireoidectomia total + esvaziamento cervical central. Lobectomia é opção para microcarcinomas sem metástase linfonodal.", difficulty: "avançado"
    },
    {
      statement: "Homem, 55 anos, com doença hemorroidária grau IV (prolapso irredutível), sangramento retal intermitente e dor intensa. Já realizou tratamento clínico e ligadura elástica sem sucesso. Exame: mamilos hemorroidários prolapsados, irredutíveis, trombosados. Qual a conduta cirúrgica indicada?",
      options: ["A) Hemorroidectomia excisional (Milligan-Morgan ou Ferguson)", "B) Nova tentativa de ligadura elástica ambulatorial", "C) Escleroterapia com etanolamina", "D) Hemorroidopexia por grampeador (PPH) — indicação formal em grau IV", "E) Colonoscopia para afastar neoplasia antes de qualquer intervenção"],
      correct_index: 0, topic: "Cirurgia", explanation: "Hemorroida grau IV (prolapso irredutível) com trombose e falha de tratamento conservador: hemorroidectomia excisional é o padrão-ouro. PPH (procedimento para prolapso e hemorroida) tem maior recidiva no grau IV.", difficulty: "intermediário"
    },
  ],
  "Pediatria": [
    {
      statement: "Lactente de 4 meses, previamente hígido, apresenta tosse seca há 3 dias evoluindo para taquipneia (FR 62), tiragem subcostal, sibilos expiratórios difusos e crépitos finos bilaterais. Temperatura: 37,8°C. SpO2: 90%. Mãe refere que irmão mais velho de 5 anos teve resfriado há 1 semana. Qual o diagnóstico e conduta prioritária?",
      options: ["A) Bronquiolite viral aguda — oxigenoterapia, hidratação e monitorização", "B) Crise de asma — salbutamol inalatório de resgate e corticoide IV", "C) Pneumonia bacteriana — amoxicilina VO por 10 dias", "D) Coqueluche — azitromicina VO por 5 dias", "E) Aspiração de corpo estranho — broncoscopia rígida de urgência"],
      correct_index: 0, topic: "Pediatria", explanation: "Lactente < 6 meses com pródromos virais, sibilos + crépitos e hipoxemia: bronquiolite viral aguda (principal agente: VSR). Tratamento é suporte: O2 se SpO2 < 92%, hidratação.", difficulty: "intermediário"
    },
    {
      statement: "Criança de 2 anos, trazida ao PS com febre alta (39,5°C) há 3 dias, irritabilidade, fontanela anterior abaulada, rigidez de nuca e sinal de Brudzinski positivo. Petéquias em tronco e membros inferiores. Hb 12, leucócitos 24.000 (80% neutrófilos). Qual a conduta imediata?",
      options: ["A) Ceftriaxona IV empírica + dexametasona IV antes do antibiótico + coleta de LCR", "B) Aguardar resultado do LCR para definir antibioticoterapia", "C) Amoxicilina VO em dose alta por 14 dias", "D) Aciclovir IV isolado por suspeita de encefalite herpética", "E) Observação com antitérmico e retorno em 24 horas"],
      correct_index: 0, topic: "Pediatria", explanation: "Sinais meníngeos + petéquias + febre alta em criança: meningite bacteriana. Iniciar ATB empírico (ceftriaxona) e dexametasona ANTES da punção lombar.", difficulty: "intermediário"
    },
    {
      statement: "Neonato de 12 horas de vida, nascido a termo (39 semanas), parto vaginal sem intercorrências, apresenta icterícia em zona de Kramer III (até umbigo). Mãe: O Rh negativo, não realizou anti-D. RN: A Rh positivo. Bilirrubina total: 14 mg/dL (BI 13,2). Coombs direto positivo. Qual a conduta?",
      options: ["A) Fototerapia intensiva imediata + monitorar bilirrubina a cada 4-6 horas", "B) Observação clínica pois icterícia é fisiológica nas primeiras 24h", "C) Alta hospitalar com retorno em 48h para dosagem de bilirrubina", "D) Exsanguineotransfusão imediata sem fototerapia prévia", "E) Fenobarbital VO para induzir conjugação hepática"],
      correct_index: 0, topic: "Pediatria", explanation: "Icterícia nas primeiras 24h é sempre patológica. Incompatibilidade Rh com Coombs direto positivo: doença hemolítica do RN. Fototerapia intensiva imediata.", difficulty: "avançado"
    },
    {
      statement: "Pré-escolar de 4 anos com história de 3 episódios de convulsão tônico-clônica generalizada associada a febre (>38,5°C) em contexto de IVAS nos últimos 2 anos. Cada episódio durou < 5 minutos, com recuperação completa. Desenvolvimento neuropsicomotor normal. EEG interictal normal. Qual a conduta?",
      options: ["A) Orientação aos pais sobre manejo da febre e convulsões — sem profilaxia anticonvulsivante", "B) Iniciar valproato de sódio profilático contínuo", "C) Solicitar RM de crânio e manter internação para investigação", "D) Fenobarbital contínuo até os 6 anos de idade", "E) Encaminhar para neurocirurgia pela recorrência das crises"],
      correct_index: 0, topic: "Pediatria", explanation: "Convulsão febril simples recorrente: não requer profilaxia anticonvulsivante. Orientar manejo de febre e quando procurar emergência.", difficulty: "intermediário"
    },
    {
      statement: "Adolescente de 13 anos, sexo feminino, apresenta poliúria, polidipsia e perda de 5 kg em 3 semanas. Glicemia capilar no PS: 380 mg/dL. Gasometria: pH 7,25, HCO3 12 mEq/L. Cetonúria +++. FC 110, FR 30 (Kussmaul), desidratação ++. K+ 5,2 mEq/L. Qual o diagnóstico e a primeira medida terapêutica?",
      options: ["A) Cetoacidose diabética tipo 1 — hidratação IV com SF 0,9% (20 mL/kg na 1ª hora)", "B) Diabetes tipo 2 — metformina VO e orientação dietética", "C) Insulina regular IV em bolus de 10 UI imediatamente", "D) Reposição de potássio IV antes de qualquer outra medida", "E) Bicarbonato de sódio IV pelo pH < 7,3"],
      correct_index: 0, topic: "Pediatria", explanation: "CAD em adolescente com DM1: prioridade é HIDRATAÇÃO (SF 0,9% 20 mL/kg na 1ª hora). Insulina após início da hidratação.", difficulty: "intermediário"
    },
    {
      statement: "Lactente de 8 meses, previamente saudável, apresenta diarreia aquosa (8 episódios/dia) há 2 dias, vômitos e febre 38,2°C. Exame: olhos fundos, sinal da prega presente (> 2 seg), fontanela deprimida, irritabilidade, mucosas secas. Peso habitual: 8 kg. Qual o grau de desidratação e conduta?",
      options: ["A) Desidratação grave — hidratação venosa com SF 0,9% 100 mL/kg (plano C da OMS)", "B) Desidratação leve — soro de reidratação oral domiciliar (plano A)", "C) Sem desidratação — apenas manter aleitamento e retorno se piora", "D) Desidratação moderada — TRO supervisionada no PS (plano B)", "E) Antibioticoterapia empírica com ciprofloxacino pela febre"],
      correct_index: 0, topic: "Pediatria", explanation: "Sinais de desidratação grave: sinal da prega > 2 seg, olhos fundos, fontanela deprimida, irritabilidade. Plano C (OMS): hidratação IV 100 mL/kg em fases. Antibiótico NÃO é indicado em diarreia viral.", difficulty: "intermediário"
    },
    {
      statement: "Criança de 6 anos, com faringoamigdalite bacteriana tratada há 2 semanas, apresenta edema periorbitário matinal que progrediu para anasarca, urina escurecida ('cor de Coca-Cola'), PA 130x85 mmHg e oligúria. Urina tipo I: hematúria dismórfica, proteinúria +. C3 consumido, C4 normal. ASLO elevada. Qual o diagnóstico?",
      options: ["A) Glomerulonefrite difusa aguda pós-estreptocócica — tratamento de suporte", "B) Síndrome nefrótica por lesão mínima — corticoterapia com prednisona", "C) Nefrite lúpica — pulsoterapia com ciclofosfamida", "D) Púrpura de Henoch-Schönlein com nefrite — expectante", "E) Infecção urinária complicada — ceftriaxona IV"],
      correct_index: 0, topic: "Pediatria", explanation: "Síndrome nefrítica (hematúria + HAS + edema + oligúria) pós-faringoamigdalite + ASLO elevada + C3 baixo: GNDA pós-estreptocócica. Tratamento: suporte (restrição hídrica, diuréticos, anti-hipertensivos). Autolimitada.", difficulty: "intermediário"
    },
    {
      statement: "Recém-nascido prematuro de 30 semanas, peso 1.200g, apresenta nas primeiras 6 horas de vida: gemência, batimento de asa nasal, retração intercostal e subcostal, taquipneia (FR 72) e cianose central. Radiografia de tórax: padrão reticulogranular difuso ('vidro moído') com broncogramas aéreos bilaterais. Qual o diagnóstico e tratamento?",
      options: ["A) Síndrome do desconforto respiratório (doença da membrana hialina) — surfactante exógeno + CPAP/VM", "B) Taquipneia transitória do RN — apenas suporte com O2 e observação", "C) Pneumonia neonatal — ampicilina + gentamicina IV", "D) Pneumotórax hipertensivo — drenagem torácica de urgência", "E) Hérnia diafragmática congênita — cirurgia corretiva imediata"],
      correct_index: 0, topic: "Pediatria", explanation: "Prematuro extremo com SDR nas primeiras horas + radiografia com vidro moído e broncogramas aéreos: Doença da Membrana Hialina (deficiência de surfactante). Tratamento: surfactante exógeno traqueal + suporte ventilatório (CPAP ou VM).", difficulty: "avançado"
    },
    {
      statement: "Criança de 3 anos, previamente saudável, é levada ao PS após episódio súbito de engasgo enquanto brincava com amendoins, seguido de tosse paroxística e sibilância localizada em hemitórax direito. Radiografia de tórax: hiperinsuflação do pulmão direito com desvio do mediastino para a esquerda na expiração. Qual o diagnóstico e conduta?",
      options: ["A) Aspiração de corpo estranho — broncoscopia rígida para remoção", "B) Crise de asma aguda — nebulização com salbutamol e corticoide", "C) Pneumonia em lobo inferior direito — amoxicilina VO", "D) Pneumotórax espontâneo — drenagem torácica em selo d'água", "E) Manobra de Heimlich repetida e observação domiciliar"],
      correct_index: 0, topic: "Pediatria", explanation: "Engasgo súbito + sibilância localizada + hiperinsuflação unilateral com air trapping: corpo estranho em via aérea (provavelmente brônquio direito). Tratamento definitivo: broncoscopia rígida para remoção.", difficulty: "intermediário"
    },
    {
      statement: "Menino de 5 anos apresenta palidez progressiva, equimoses espontâneas, petéquias difusas e hepatoesplenomegalia. Hemograma: Hb 5,8 g/dL, leucócitos 68.000/mm³ com 85% de blastos, plaquetas 18.000/mm³. Qual o diagnóstico mais provável e o próximo passo?",
      options: ["A) Leucemia linfoblástica aguda — imunofenotipagem e mielograma para confirmação e classificação", "B) Púrpura trombocitopênica imunológica — corticoterapia com prednisona", "C) Anemia aplásica — transplante de medula óssea imediato", "D) Mononucleose infecciosa — tratamento de suporte", "E) Leucemia mieloide crônica — imatinib como primeira linha"],
      correct_index: 0, topic: "Pediatria", explanation: "Pancitopenia com hiperleucocitose e blastos em sangue periférico + hepatoesplenomegalia em criança: LLA é a leucemia mais comum na infância (pico 2-5 anos). Confirmar com mielograma e imunofenotipagem para definir protocolo.", difficulty: "avançado"
    },
  ],
  "Ginecologia e Obstetrícia": [
    {
      statement: "Gestante de 32 semanas, G2P1, apresenta PA 160x110 mmHg, cefaleia frontal intensa, escotomas visuais e epigastralgia em barra. Proteinúria: 3+ na fita. Plaquetas: 85.000/mm³. TGO: 280 U/L. LDH: 850 U/L. Qual o diagnóstico e a conduta?",
      options: ["A) Pré-eclâmpsia grave com síndrome HELLP — estabilizar e indicar parto", "B) Eclâmpsia — sulfato de magnésio isolado e manter gestação até 37 semanas", "C) Hipertensão gestacional benigna — anti-hipertensivo VO e pré-natal semanal", "D) Esteatose hepática aguda da gravidez — transplante hepático de urgência", "E) Coagulação intravascular disseminada primária — heparinização plena"],
      correct_index: 0, topic: "Ginecologia e Obstetrícia", explanation: "PE grave com HELLP: estabilização com MgSO4 + anti-hipertensivo + resolução da gestação independente da IG.", difficulty: "avançado"
    },
    {
      statement: "Mulher, 25 anos, G1P0, IG 8 semanas por DUM, apresenta sangramento vaginal moderado, dor em cólica em hipogástrio e colo uterino pérvio ao toque com presença de material no canal cervical. β-hCG: 12.000 mUI/mL. USG TV: útero com conteúdo heterogêneo sem BCF. Qual o diagnóstico?",
      options: ["A) Abortamento incompleto — esvaziamento uterino (AMIU ou curetagem)", "B) Ameaça de abortamento — repouso e progesterona vaginal", "C) Gravidez ectópica — metotrexato IM", "D) Mola hidatiforme completa — aspiração a vácuo", "E) Abortamento retido — conduta expectante por 4 semanas"],
      correct_index: 0, topic: "Ginecologia e Obstetrícia", explanation: "Sangramento + colo pérvio com material + USG sem BCF: abortamento incompleto. Conduta: esvaziamento uterino.", difficulty: "intermediário"
    },
    {
      statement: "Gestante de 36 semanas, G3P2, apresenta sangramento vaginal vermelho vivo, indolor, de início súbito, em grande quantidade. Útero relaxado, tônus normal. BCF: 140 bpm, sem desacelerações. PA 110x70. Sem história de trauma. Qual a hipótese diagnóstica principal?",
      options: ["A) Placenta prévia — não realizar toque vaginal, USG e avaliar via de parto", "B) Descolamento prematuro de placenta — amniotomia e ocitocina", "C) Rotura uterina — laparotomia de emergência", "D) Rotura de vasa prévia — cesárea imediata", "E) Cervicite — tratamento com antibiótico tópico"],
      correct_index: 0, topic: "Ginecologia e Obstetrícia", explanation: "Sangramento indolor, vermelho vivo, útero relaxado: placenta prévia. NUNCA toque vaginal.", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 48 anos, G0P0, pós-menopausa há 2 anos, apresenta sangramento vaginal de pequena quantidade há 1 mês. IMC 35. DM2 e HAS. USG TV: espessamento endometrial de 12 mm. Qual a conduta?",
      options: ["A) Histeroscopia diagnóstica com biópsia endometrial", "B) Papanicolaou e retorno em 6 meses", "C) Terapia de reposição hormonal com estrogênio + progesterona", "D) USG TV de controle em 3 meses", "E) Histerectomia total imediata sem investigação histológica"],
      correct_index: 0, topic: "Ginecologia e Obstetrícia", explanation: "Sangramento pós-menopausa + endométrio > 4-5 mm: investigar câncer endometrial. Histeroscopia com biópsia é padrão-ouro.", difficulty: "intermediário"
    },
    {
      statement: "Gestante de 28 semanas, G1P0, com DM gestacional diagnosticado na 24ª semana, em uso de dieta e exercícios. Glicemias: jejum 105-115, pós-prandial (1h) 155-170 mg/dL nas últimas 2 semanas. Feto com circunferência abdominal no percentil 90. Qual a conduta?",
      options: ["A) Iniciar insulinoterapia (NPH ± regular) por falha das medidas não farmacológicas", "B) Manter apenas dieta e reavaliar com 32 semanas", "C) Iniciar metformina como primeira escolha", "D) Indicar parto imediato por macrossomia fetal", "E) Solicitar teste oral de tolerância à glicose de controle"],
      correct_index: 0, topic: "Ginecologia e Obstetrícia", explanation: "DMG com glicemias acima das metas após 2 semanas de dieta + exercício: insulinoterapia. Insulina é primeira escolha quando há macrossomia.", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 30 anos, G2P1, IG 7 semanas, com dor em fossa ilíaca esquerda e sangramento vaginal escasso. β-hCG: 4.500 mUI/mL. USG TV: útero vazio, massa anexial esquerda de 3 cm com anel tubário e líquido livre em fundo de saco. Hemodinamicamente estável. Qual o diagnóstico e conduta?",
      options: ["A) Gravidez ectópica tubária íntegra — salpingectomia videolaparoscópica ou metotrexato", "B) Cisto de corpo lúteo hemorrágico — observação e analgesia", "C) Abortamento tubário completo — conduta expectante", "D) Torção de ovário — ooforectomia de urgência", "E) Mola hidatiforme parcial — aspiração uterina a vácuo"],
      correct_index: 0, topic: "Ginecologia e Obstetrícia", explanation: "Útero vazio + β-hCG > 1.500 + massa anexial com anel tubário: gravidez ectópica. Estável com massa < 3,5 cm e β-hCG < 5.000: metotrexato é opção. Com líquido livre e dor: salpingectomia laparoscópica é mais segura.", difficulty: "avançado"
    },
    {
      statement: "Gestante de 34 semanas, G1P0, apresenta prurido intenso generalizado, predominantemente palmo-plantar, pior à noite, sem lesões cutâneas primárias. Exames: TGO 95 U/L, TGP 102 U/L, ácidos biliares totais 45 µmol/L (ref < 10), bilirrubinas normais. Qual o diagnóstico e conduta?",
      options: ["A) Colestase intra-hepática da gestação — ácido ursodesoxicólico + monitorar vitalidade fetal", "B) Dermatite atópica gestacional — creme hidratante e anti-histamínico", "C) Hepatite viral aguda — sorologias e isolamento", "D) Pré-eclâmpsia atípica — sulfato de magnésio e parto", "E) Escabiose — permetrina tópica para gestante e contactantes"],
      correct_index: 0, topic: "Ginecologia e Obstetrícia", explanation: "Prurido palmo-plantar + ácidos biliares elevados + transaminases elevadas sem outras lesões: colestase intra-hepática da gestação. Tratamento: ácido ursodesoxicólico. Risco fetal aumentado — avaliar parto entre 36-37 semanas.", difficulty: "avançado"
    },
    {
      statement: "Mulher, 22 anos, G1P0, em trabalho de parto com 40 semanas. Dilatação cervical completa (10 cm), apresentação cefálica, plano +3 de De Lee, variedade de posição occipitopúbica. Cardiotocografia: padrão categoria I. Após 1 hora de período expulsivo, feto não progrediu. Dinâmica uterina adequada. Qual a conduta?",
      options: ["A) Aplicação de fórcipe de alívio (Simpson) ou vácuo-extrator", "B) Cesárea de urgência por parada de progressão", "C) Aumentar ocitocina para melhorar dinâmica uterina", "D) Esperar mais 2 horas antes de qualquer intervenção", "E) Episiotomia ampla e manobra de Kristeller"],
      correct_index: 0, topic: "Ginecologia e Obstetrícia", explanation: "Período expulsivo prolongado com apresentação em +3 (baixa) e OP: condições ideais para fórcipe de alívio ou vácuo-extrator. Cesárea com cabeça baixa tem maior risco. Kristeller é proscrita.", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 55 anos, multípara, queixa de perda involuntária de urina aos esforços (tosse, espirro, risada) há 2 anos, sem urgência miccional. Exame: cistocele grau I, teste do cotonete positivo (hipermobilidade uretral). Estudo urodinâmico: incontinência urinária de esforço sem hiperatividade detrusora. Qual o tratamento indicado?",
      options: ["A) Fisioterapia pélvica + considerar cirurgia de sling suburetral se falha conservadora", "B) Oxibutinina VO para hiperatividade vesical", "C) Histerectomia vaginal com correção de cistocele", "D) Auto-sondagem vesical intermitente limpa", "E) Toxina botulínica intravesical"],
      correct_index: 0, topic: "Ginecologia e Obstetrícia", explanation: "IUE pura (sem urgência, urodinâmica confirmando) com hipermobilidade uretral: primeira linha é fisioterapia do assoalho pélvico. Se falha: sling de uretra média (TVT ou TOT) é o padrão-ouro cirúrgico. Anticolinérgicos são para bexiga hiperativa.", difficulty: "intermediário"
    },
    {
      statement: "Puérpera de 5 dias pós-parto vaginal, apresenta febre 39°C, calafrios, útero doloroso e amolecido à palpação, loquiação fétida e purulenta. Leucócitos 19.000 com desvio. PA 100x65. FC 110. Qual o diagnóstico e conduta?",
      options: ["A) Endometrite puerperal — internação com clindamicina + gentamicina IV", "B) Infecção urinária pós-parto — ciprofloxacino VO", "C) Mastite puerperal — cefalexina VO e manter amamentação", "D) Trombose venosa profunda puerperal — heparina plena", "E) Atonia uterina tardia — ocitocina IV e massagem uterina"],
      correct_index: 0, topic: "Ginecologia e Obstetrícia", explanation: "Febre puerperal + útero doloroso + loquiação fétida: endometrite puerperal (infecção polimicrobiana). Esquema clássico: clindamicina + gentamicina IV até 48h afebril.", difficulty: "intermediário"
    },
  ],
  "Medicina Preventiva": [
    {
      statement: "Em um município com 50.000 habitantes, foram diagnosticados 200 novos casos de dengue em janeiro de 2024. A população suscetível estimada era de 45.000. Considerando que em 31/12/2023 havia 150 casos em tratamento, qual é a taxa de incidência de dengue em janeiro/2024?",
      options: ["A) 200/45.000 × 1.000 = 4,4 por mil habitantes suscetíveis", "B) 350/50.000 × 1.000 = 7,0 por mil habitantes", "C) 200/50.000 × 1.000 = 4,0 por mil habitantes", "D) 150/50.000 × 1.000 = 3,0 por mil habitantes", "E) 200/200 × 100 = 100%"],
      correct_index: 0, topic: "Medicina Preventiva", explanation: "Incidência = casos NOVOS / população em risco (suscetível) no período.", difficulty: "intermediário"
    },
    {
      statement: "Um estudo avaliou um novo teste rápido para tuberculose pulmonar em 1.000 pacientes sintomáticos respiratórios. Resultados: 180 verdadeiros positivos, 20 falsos negativos, 50 falsos positivos, 750 verdadeiros negativos. Qual a sensibilidade e a especificidade do teste?",
      options: ["A) Sensibilidade 90% e Especificidade 93,75%", "B) Sensibilidade 93,75% e Especificidade 90%", "C) Sensibilidade 78% e Especificidade 97%", "D) Sensibilidade 80% e Especificidade 90%", "E) Sensibilidade 90% e Especificidade 80%"],
      correct_index: 0, topic: "Medicina Preventiva", explanation: "Sensibilidade = VP/(VP+FN) = 180/200 = 90%. Especificidade = VN/(VN+FP) = 750/800 = 93,75%.", difficulty: "intermediário"
    },
    {
      statement: "Na Atenção Primária à Saúde (APS), uma equipe de Saúde da Família é responsável por uma área com 3.500 pessoas cadastradas. O atributo da APS que se refere ao acompanhamento longitudinal dos pacientes ao longo do tempo, com vínculo e responsabilização, é denominado:",
      options: ["A) Longitudinalidade", "B) Integralidade", "C) Coordenação do cuidado", "D) Primeiro contato (acessibilidade)", "E) Orientação comunitária"],
      correct_index: 0, topic: "Medicina Preventiva", explanation: "Longitudinalidade (Starfield): relação pessoal de longa duração entre equipe e população.", difficulty: "intermediário"
    },
    {
      statement: "Um pesquisador deseja avaliar se o tabagismo é fator de risco para câncer de pulmão. Ele seleciona 500 pacientes com câncer de pulmão (casos) e 500 pacientes sem câncer (controles), investigando a exposição pregressa ao tabaco. Qual o tipo de estudo e a medida de associação adequada?",
      options: ["A) Estudo caso-controle — Odds Ratio (razão de chances)", "B) Estudo de coorte prospectivo — Risco Relativo", "C) Ensaio clínico randomizado — NNT", "D) Estudo transversal — Razão de Prevalência", "E) Estudo ecológico — Coeficiente de correlação"],
      correct_index: 0, topic: "Medicina Preventiva", explanation: "Seleção a partir do desfecho com investigação retrospectiva da exposição: caso-controle. Medida = Odds Ratio.", difficulty: "intermediário"
    },
    {
      statement: "No calendário vacinal do Programa Nacional de Imunizações (PNI) 2024, um lactente de 2 meses deve receber obrigatoriamente quais vacinas nesta idade?",
      options: ["A) Pentavalente + VIP (polio inativada) + Pneumocócica 10-valente + Rotavírus", "B) BCG + Hepatite B + Pentavalente", "C) Tríplice viral + Febre amarela + Varicela", "D) Apenas Hepatite B (dose de reforço)", "E) DTPa + Meningocócica ACWY + HPV"],
      correct_index: 0, topic: "Medicina Preventiva", explanation: "Aos 2 meses: Pentavalente, VIP (1ª dose), Pneumo 10 (1ª dose) e Rotavírus (1ª dose).", difficulty: "intermediário"
    },
    {
      statement: "Um ensaio clínico randomizado duplo-cego avaliou uma nova droga anti-hipertensiva vs placebo em 2.000 pacientes durante 5 anos. O grupo tratamento teve 40 eventos cardiovasculares (n=1.000) e o placebo 80 eventos (n=1.000). Calcule a Redução Absoluta de Risco (RAR) e o Número Necessário para Tratar (NNT).",
      options: ["A) RAR = 4% e NNT = 25", "B) RAR = 8% e NNT = 12,5", "C) RAR = 50% e NNT = 2", "D) RAR = 2% e NNT = 50", "E) RAR = 4% e NNT = 100"],
      correct_index: 0, topic: "Medicina Preventiva", explanation: "Risco placebo = 80/1000 = 8%. Risco tratamento = 40/1000 = 4%. RAR = 8% - 4% = 4%. NNT = 1/RAR = 1/0,04 = 25. Precisamos tratar 25 pacientes para prevenir 1 evento.", difficulty: "intermediário"
    },
    {
      statement: "Em relação aos princípios do SUS previstos na Lei 8.080/1990, a diretriz que determina a organização dos serviços de saúde em níveis de complexidade crescente (UBS → UPA → Hospital), com fluxo assistencial definido por região, é denominada:",
      options: ["A) Regionalização e Hierarquização", "B) Universalidade", "C) Equidade", "D) Descentralização com direção única", "E) Participação da comunidade"],
      correct_index: 0, topic: "Medicina Preventiva", explanation: "Regionalização e Hierarquização: organização dos serviços em níveis crescentes de complexidade em uma região definida. Universalidade = acesso a todos. Equidade = tratar desiguais de forma desigual.", difficulty: "intermediário"
    },
    {
      statement: "Uma doença tem prevalência de 1% em determinada população. Um teste diagnóstico tem sensibilidade de 95% e especificidade de 90%. Qual o valor preditivo positivo (VPP) aproximado quando aplicado em rastreamento populacional?",
      options: ["A) Aproximadamente 8,8% — a maioria dos positivos será falso-positivo", "B) Aproximadamente 95% — igual à sensibilidade", "C) Aproximadamente 90% — igual à especificidade", "D) Aproximadamente 50% — depende apenas da prevalência", "E) Aproximadamente 1% — igual à prevalência"],
      correct_index: 0, topic: "Medicina Preventiva", explanation: "VPP com prevalência baixa (1%): pela fórmula de Bayes ou tabela 2x2 para 10.000 pessoas: 95 VP, 990 FP → VPP = 95/(95+990) ≈ 8,8%. Prevalência baixa reduz drasticamente o VPP mesmo com bom teste.", difficulty: "avançado"
    },
    {
      statement: "Uma UBS identifica alta incidência de sífilis congênita em sua área de abrangência. Segundo a vigilância epidemiológica, qual a estratégia MAIS EFETIVA para reduzir novos casos de sífilis congênita na atenção primária?",
      options: ["A) Testagem rápida universal de gestantes no 1º e 3º trimestre + tratamento da parceria sexual", "B) Rastreamento de sífilis apenas no parto (triagem na maternidade)", "C) Notificação compulsória sem tratamento imediato", "D) Campanha educativa escolar sobre ISTs", "E) Testagem rápida apenas em gestantes de alto risco"],
      correct_index: 0, topic: "Medicina Preventiva", explanation: "Prevenção de sífilis congênita: testagem rápida no 1º trimestre, 3º trimestre e parto + tratamento adequado da gestante E do parceiro com penicilina benzatina. Tratar parceria é essencial para evitar reinfecção.", difficulty: "intermediário"
    },
    {
      statement: "Um estudo de coorte prospectivo acompanhou 5.000 trabalhadores de mineração por 20 anos para avaliar o risco de silicose. Ao final, 200 expostos ao sílica desenvolveram a doença (n=2.000 expostos), enquanto 30 não expostos (n=3.000) também desenvolveram. Qual o Risco Relativo (RR) e a interpretação?",
      options: ["A) RR = 10 — expostos ao sílica têm 10 vezes mais risco de silicose", "B) RR = 6,67 — expostos têm 6,67 vezes mais risco", "C) RR = 2,0 — risco dobrado nos expostos", "D) RR = 0,1 — sílica é fator protetor", "E) RR = 1,5 — associação fraca sem significância"],
      correct_index: 0, topic: "Medicina Preventiva", explanation: "Risco expostos = 200/2000 = 10%. Risco não expostos = 30/3000 = 1%. RR = 10%/1% = 10. Expostos têm 10x mais risco. RR > 1 = fator de risco.", difficulty: "intermediário"
    },
  ],
  "Oncologia": [
    {
      statement: "Mulher, 58 anos, tabagista (45 maços-ano), apresenta tosse persistente há 3 meses, hemoptise e emagrecimento de 8 kg. Radiografia de tórax: massa de 5 cm em hilo pulmonar direito. TC confirma lesão com linfonodomegalia mediastinal ipsilateral (N2). PET-CT: sem metástases a distância. Qual o estadiamento e a conduta?",
      options: ["A) Estágio IIIA (T2N2M0) — quimioterapia + radioterapia concomitante (±imunoterapia)", "B) Estágio IA — lobectomia com linfadenectomia mediastinal isolada", "C) Estágio IV — cuidados paliativos exclusivos", "D) Estágio IIB — cirurgia seguida de quimioterapia adjuvante", "E) Estágio IIIA — radioterapia isolada sem quimioterapia"],
      correct_index: 0, topic: "Oncologia", explanation: "Massa 5 cm com N2 sem metástase: IIIA. QT+RT concomitante. Imunoterapia de consolidação (durvalumabe) melhora sobrevida.", difficulty: "avançado"
    },
    {
      statement: "Homem, 62 anos, assintomático, PSA total: 8,5 ng/mL (livre/total 12%). Toque retal: nódulo endurecido em lobo direito. Biópsia: adenocarcinoma de próstata Gleason 7 (4+3) em 4/12 fragmentos. RM: T2c. Cintilografia óssea normal. Qual a conduta?",
      options: ["A) Prostatectomia radical ou radioterapia com hormonioterapia — risco intermediário desfavorável", "B) Vigilância ativa com PSA a cada 6 meses", "C) Orquiectomia bilateral isolada", "D) Quimioterapia com docetaxel como primeira linha", "E) Braquiterapia isolada sem terapia hormonal"],
      correct_index: 0, topic: "Oncologia", explanation: "Gleason 7 (4+3) é risco intermediário desfavorável. Tratamento curativo: prostatectomia radical ou RT com deprivação androgênica.", difficulty: "avançado"
    },
    {
      statement: "Mulher, 45 anos, nódulo mamário de 2,5 cm em QSE. Core biopsy: carcinoma ductal invasivo, RE+, RP+, HER2 negativo, Ki67 15%. Linfonodo axilar clinicamente negativo. Qual o tratamento?",
      options: ["A) T2N0M0 (IIA) — cirurgia conservadora + radioterapia + hormonioterapia adjuvante", "B) Mastectomia radical de Halsted", "C) Quimioterapia neoadjuvante mandatória", "D) Apenas tamoxifeno por 5 anos sem cirurgia", "E) Radioterapia exclusiva"],
      correct_index: 0, topic: "Oncologia", explanation: "Luminal A (RE+, HER2-, Ki67 < 20%): cirurgia conservadora + RT + hormonioterapia. QT neoadjuvante não é mandatória em luminal A sem N+.", difficulty: "intermediário"
    },
    {
      statement: "Homem, 70 anos, com sangramento retal intermitente há 4 meses. Colonoscopia: lesão vegetante de 4 cm em sigmoide, biópsia: adenocarcinoma. TC: sem metástases hepáticas. CEA: 12 ng/mL. Qual a conduta?",
      options: ["A) Sigmoidectomia com linfadenectomia + QT adjuvante se N+", "B) Polipectomia endoscópica", "C) Quimioterapia paliativa FOLFOX isolado", "D) Radioterapia neoadjuvante longa", "E) Colostomia definitiva sem ressecção"],
      correct_index: 0, topic: "Oncologia", explanation: "Adenocarcinoma de sigmoide sem metástases: cirurgia com intenção curativa. Se N+ na peça: QT adjuvante. RT neoadjuvante é para reto, não sigmoide.", difficulty: "intermediário"
    },
    {
      statement: "Paciente de 25 anos, sexo masculino, linfonodomegalia cervical indolor progressiva há 2 meses, sudorese noturna e perda de 7% do peso. Biópsia: células de Reed-Sternberg. PET-CT: captação cervical e mediastinal bilateral. Qual o diagnóstico e estadiamento?",
      options: ["A) Linfoma de Hodgkin clássico, estágio IIB", "B) Linfoma não-Hodgkin difuso de grandes células B, estágio IV", "C) Tuberculose ganglionar disseminada", "D) Sarcoidose com acometimento mediastinal", "E) Timoma invasivo"],
      correct_index: 0, topic: "Oncologia", explanation: "Células de Reed-Sternberg = Hodgkin. 2 regiões supradiafragmáticas (II) + sintomas B (sudorese + perda ponderal): IIB. Tratamento: ABVD ± RT.", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 60 anos, apresenta massa pélvica palpável, ascite volumosa e CA-125: 580 U/mL (ref < 35). TC de abdome/pelve: massa ovariana sólido-cística bilateral de 10 cm, implantes peritoneais difusos e derrame pleural à direita. Citologia do líquido ascítico: células epiteliais malignas. Qual a hipótese e conduta?",
      options: ["A) Carcinoma epitelial de ovário avançado — cirurgia citorredutora + QT com carboplatina e paclitaxel", "B) Cisto ovariano benigno — ooforectomia unilateral por laparoscopia", "C) Tuberculose peritoneal — esquema RIPE por 6 meses", "D) Síndrome de Meigs — ressecção do fibroma ovariano", "E) Pseudomixoma peritoneal — apenas drenagem da ascite"],
      correct_index: 0, topic: "Oncologia", explanation: "Massa ovariana bilateral + implantes peritoneais + CA-125 elevado + citologia maligna: carcinoma epitelial de ovário avançado (estágio III/IV). Tratamento: citorredução máxima + QT adjuvante com platina.", difficulty: "avançado"
    },
    {
      statement: "Homem, 35 anos, apresenta massa testicular endurecida indolor em testículo esquerdo, detectada ao autoexame. USG testicular: lesão sólida hipoecogênica de 3 cm. AFP: 450 ng/mL (ref < 10), β-hCG: 5.200 mUI/mL, LDH: 380. TC de tórax e abdome: sem metástases. Qual a conduta inicial?",
      options: ["A) Orquiectomia radical inguinal + estadiamento com marcadores pós-operatórios", "B) Biópsia testicular transescrotal para confirmação histológica", "C) Quimioterapia neoadjuvante antes da cirurgia", "D) Orquiectomia parcial (enucleação da lesão)", "E) Observação com USG e marcadores em 3 meses"],
      correct_index: 0, topic: "Oncologia", explanation: "Massa testicular sólida com marcadores elevados (AFP + β-hCG): tumor germinativo testicular não-seminomatoso. Conduta: orquiectomia radical por via INGUINAL (nunca escrotal para evitar disseminação). Após, reestadiamento com marcadores e imagem.", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 42 anos, com lesão pigmentada em dorso que mudou de cor (marrom → preta com área azulada), aumentou de tamanho (agora 8 mm), bordas irregulares e assimétrica. Dermatoscopia: rede atípica, glóbulos irregulares, véu azul-esbranquiçado. Qual o diagnóstico provável e conduta?",
      options: ["A) Melanoma cutâneo — biópsia excisional com margem de 1-2 mm para diagnóstico", "B) Nevo displásico — observação com dermatoscopia semestral", "C) Ceratose seborreica — crioterapia ambulatorial", "D) Carcinoma basocelular pigmentado — curetagem e eletrocoagulação", "E) Lentigo solar — protetor solar e acompanhamento anual"],
      correct_index: 0, topic: "Oncologia", explanation: "ABCDE do melanoma: Assimetria, Bordas irregulares, Cores variadas (incluindo azul), Diâmetro > 6mm, Evolução. Biópsia excisional com margem estreita (1-2mm) para diagnóstico histopatológico. Nunca biópsia incisional parcial em lesão suspeita de melanoma.", difficulty: "avançado"
    },
    {
      statement: "Homem, 55 anos, etilista e tabagista pesado, apresenta disfagia progressiva (sólidos → líquidos) há 4 meses, emagrecimento de 12 kg, odinofagia e rouquidão. EDA: lesão vegetante e ulcerada no terço médio do esôfago com 5 cm. Biópsia: carcinoma epidermóide. TC: sem metástases a distância, linfonodos mediastinais aumentados. Qual o tratamento?",
      options: ["A) Quimiorradioterapia neoadjuvante seguida de esofagectomia (se ressecável)", "B) Esofagectomia imediata sem tratamento neoadjuvante", "C) Apenas radioterapia paliativa local", "D) Dilatação endoscópica seriada + nutrição enteral exclusiva", "E) Stent esofágico metálico autoexpansível como tratamento definitivo"],
      correct_index: 0, topic: "Oncologia", explanation: "CEC de esôfago localmente avançado (com linfonodomegalia) sem metástase à distância: QT+RT neoadjuvante (protocolo CROSS) seguida de esofagectomia. QT neoadjuvante melhora sobrevida global comparada à cirurgia isolada.", difficulty: "avançado"
    },
    {
      statement: "Mulher, 68 anos, procura emergência com dor lombar intensa refratária há 2 semanas, anemia (Hb 8,2), creatinina 3,5, cálcio 13,2 mg/dL. Eletroforese de proteínas: pico monoclonal em região gama. Radiografias do esqueleto: múltiplas lesões líticas em crânio e coluna. Qual o diagnóstico?",
      options: ["A) Mieloma múltiplo — quimioterapia com bortezomibe + dexametasona + considerar transplante autólogo", "B) Metástases ósseas de câncer de mama oculto — pesquisar tumor primário", "C) Hiperparatireoidismo primário — paratireoidectomia", "D) Doença de Paget óssea — ácido zoledrônico", "E) Linfoma ósseo primário — R-CHOP"],
      correct_index: 0, topic: "Oncologia", explanation: "CRAB (Cálcio elevado, Renal insuficiência, Anemia, Bone lesions líticas) + pico monoclonal: Mieloma Múltiplo. Tratamento inicial: esquema com bortezomibe + corticoide ± alquilante. Avaliar elegibilidade para transplante autólogo de medula.", difficulty: "avançado"
    },
  ],
  "Neurologia": [
    {
      statement: "Homem, 68 anos, hipertenso e diabético, é trazido ao PS com hemiplegia direita e afasia global de início súbito há 1 hora. NIHSS: 22. PA: 185x100. TC de crânio sem contraste: sem hemorragia. Qual a conduta?",
      options: ["A) Trombólise IV com alteplase 0,9 mg/kg em até 4,5 horas do ictus", "B) Anticoagulação plena com heparina IV", "C) Reduzir PA para < 120x80 antes de qualquer intervenção", "D) RM de crânio com difusão antes de decidir trombólise", "E) AAS 300 mg + clopidogrel 300 mg VO"],
      correct_index: 0, topic: "Neurologia", explanation: "AVC isquêmico com < 4,5h, NIHSS alto, TC sem hemorragia: trombólise IV com alteplase.", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 30 anos, apresenta cefaleia intensa holocraniana de início súbito ('a pior da vida'), náuseas, vômitos e rigidez de nuca. Glasgow 15. TC: hiperdensidade em cisterna silviana e inter-hemisférica. Qual o diagnóstico e próximo passo?",
      options: ["A) Hemorragia subaracnoide — angiotomografia ou arteriografia cerebral para identificar aneurisma", "B) Meningite bacteriana — punção lombar e ATB empírico", "C) Cefaleia tensional grave — analgesia e alta", "D) Trombose venosa cerebral — anticoagulação", "E) Enxaqueca com aura — sumatriptano SC"],
      correct_index: 0, topic: "Neurologia", explanation: "Cefaleia thunderclap + rigidez de nuca + hiperdensidade cisternal: HSA. Angiotomografia para localizar aneurisma.", difficulty: "intermediário"
    },
    {
      statement: "Adolescente de 16 anos, primeiro episódio convulsivo TCG com 2 min, pós-ictal confusional. EEG: ponta-onda 3 Hz generalizada. RM normal. Qual o diagnóstico?",
      options: ["A) Epilepsia generalizada idiopática — iniciar valproato ou lamotrigina", "B) Epilepsia do lobo temporal — carbamazepina", "C) Crise provocada — não tratar", "D) Síndrome de West — ACTH ou vigabatrina", "E) Status epilepticus — diazepam IV"],
      correct_index: 0, topic: "Neurologia", explanation: "Adolescente com TCG + ponta-onda 3 Hz + RM normal: epilepsia generalizada idiopática. Valproato é primeira escolha.", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 28 anos, neurite óptica retrobulbar há 6 meses, agora parestesias em MMII, fraqueza e Lhermitte positivo. RM crânio: lesões desmielinizantes periventriculares. RM medula: lesão C3-C4. LCR: bandas oligoclonais positivas. Qual o diagnóstico?",
      options: ["A) Esclerose múltipla remitente-recorrente — terapia modificadora de doença", "B) Neuromielite óptica (Devic) — rituximabe", "C) ADEM — corticoide em pulso", "D) ELA — riluzol", "E) Neurossífilis — penicilina G cristalina"],
      correct_index: 0, topic: "Neurologia", explanation: "Disseminação no tempo e espaço + bandas oligoclonais: EM remitente-recorrente (critérios de McDonald).", difficulty: "avançado"
    },
    {
      statement: "Homem, 75 anos, tremor em repouso em mão direita há 1 ano, rigidez, bradicinesia e instabilidade postural. Marcha em pequenos passos. Sem déficits cognitivos. Qual o diagnóstico e tratamento?",
      options: ["A) Doença de Parkinson — levodopa/carbidopa como primeira linha pela idade", "B) Tremor essencial — propranolol", "C) Parkinsonismo vascular — antiagregante", "D) Atrofia de múltiplos sistemas — sem tratamento", "E) Doença de Wilson — penicilamina"],
      correct_index: 0, topic: "Neurologia", explanation: "Tétrade parkinsoniana em idoso: Doença de Parkinson. Em > 70 anos, levodopa/carbidopa é primeira escolha.", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 45 anos, apresenta cefaleia pulsátil unilateral (hemicraniana direita) de forte intensidade, 2-3 episódios/mês, duração de 4-72 horas, com náuseas, fotofobia e fonofobia. Piora com atividade física. Exame neurológico normal entre crises. Qual o diagnóstico e tratamento profilático indicado?",
      options: ["A) Enxaqueca sem aura — profilaxia com propranolol ou amitriptilina ou topiramato", "B) Cefaleia tensional crônica — amitriptilina isolada", "C) Cefaleia em salvas — verapamil como profilaxia", "D) Arterite temporal — corticoterapia com prednisona 1 mg/kg", "E) Neuralgia do trigêmeo — carbamazepina"],
      correct_index: 0, topic: "Neurologia", explanation: "Cefaleia pulsátil hemicraniana 4-72h + náusea + foto/fonofobia + piora com atividade: enxaqueca sem aura (critérios ICHD-3). Com ≥ 2 crises/mês: iniciar profilaxia (betabloqueador, tricíclico ou anticonvulsivante).", difficulty: "intermediário"
    },
    {
      statement: "Homem, 62 anos, hipertenso, apresenta vertigem intensa rotatória de início súbito, nistagmo horizontal com componente vertical (direction-changing), disartria, disfagia e ataxia de marcha. PA 200x110. Não consegue deambular sem apoio. Qual o diagnóstico e conduta?",
      options: ["A) AVC de fossa posterior (tronco/cerebelo) — TC/RM de urgência + controle pressórico", "B) VPPB — manobra de Epley e alta", "C) Neurite vestibular — metoclopramida e corticoide", "D) Doença de Ménière — betaistina e dieta hipossódica", "E) Labirintite aguda — ATB oral e meclizina"],
      correct_index: 0, topic: "Neurologia", explanation: "Vertigem + sinais centrais (nistagmo vertical/direction-changing, disartria, disfagia, ataxia): AVC de fossa posterior até prova em contrário. HINTS exam diferencia central de periférico.", difficulty: "avançado"
    },
    {
      statement: "Mulher, 55 anos, apresenta fraqueza muscular proximal progressiva há 3 meses, dificuldade para subir escadas e levantar da cadeira. Rash heliotrópico periorbitário violáceo. CK: 3.500 U/L (ref < 200). FAN positivo. ENMG: padrão miopático. Qual o diagnóstico?",
      options: ["A) Dermatomiosite — investigar neoplasia oculta + iniciar imunossupressão com corticoide", "B) Polimiosite — corticoide isolado sem rastreio oncológico", "C) Miastenia gravis — piridostigmina e anti-AChR", "D) Distrofia muscular de Duchenne — suporte apenas", "E) Fibromialgia — exercício aeróbico e duloxetina"],
      correct_index: 0, topic: "Neurologia", explanation: "Fraqueza proximal + rash heliotrópico + CK muito elevada + padrão miopático: dermatomiosite. Associação com neoplasia em adultos (mama, ovário, pulmão) exige rastreio oncológico.", difficulty: "avançado"
    },
    {
      statement: "Homem, 58 anos, apresenta fraqueza ascendente simétrica de início em MMII há 5 dias, progredindo para MMSS, arreflexia global, parestesias em luva e bota. Antecedente de diarreia por Campylobacter há 3 semanas. FR 24, capacidade vital forçada: 1,5 L (predito 4,0 L). LCR: dissociação albumino-citológica. Qual o diagnóstico e conduta urgente?",
      options: ["A) Síndrome de Guillain-Barré — monitorar função respiratória + plasmaférese ou imunoglobulina IV", "B) Mielite transversa — corticoide em pulsoterapia", "C) Polineuropatia diabética aguda — controle glicêmico rigoroso", "D) Compressão medular — RM de coluna e cirurgia descompressiva", "E) Botulismo — antitoxina botulínica IV"],
      correct_index: 0, topic: "Neurologia", explanation: "Fraqueza ascendente simétrica + arreflexia + dissociação albumino-citológica + antecedente infeccioso: SGB. CV < 50% do predito indica risco de insuficiência respiratória — considerar IOT profilática.", difficulty: "avançado"
    },
    {
      statement: "Mulher, 32 anos, apresenta episódios de diplopia flutuante, ptose palpebral bilateral pior ao final do dia, fraqueza para mastigar e disfagia intermitente. Melhora com repouso. Teste do gelo positivo (melhora da ptose). Anti-AChR positivo. TC de tórax: massa em mediastino anterior. Qual o diagnóstico e conduta?",
      options: ["A) Miastenia gravis com timoma — piridostigmina + timectomia + considerar imunossupressão", "B) Síndrome de Lambert-Eaton — tratar neoplasia de base", "C) Oftalmoplegia externa progressiva — sem tratamento específico", "D) Esclerose lateral amiotrófica bulbar — riluzol", "E) Distrofia miotônica — fenitoína para miotonia"],
      correct_index: 0, topic: "Neurologia", explanation: "Fraqueza flutuante fatigável + ptose pior vespertina + anti-AChR positivo: Miastenia Gravis. Massa em mediastino anterior = timoma. Indicação absoluta de timectomia + anticolinesterásico.", difficulty: "intermediário"
    },
  ],
  "Cardiologia": [
    {
      statement: "Homem, 55 anos, tabagista, chega ao PS com dor precordial em aperto há 40 minutos, sudorese e náuseas. ECG: supradesnível de ST ≥ 2 mm em V1-V4 com imagem especular em D2, D3, aVF. Troponina I: 0,8 ng/mL. Qual o diagnóstico e conduta?",
      options: ["A) IAM com supra de ST anterior — angioplastia primária (ICP) em até 90 minutos", "B) Angina instável — AAS + enoxaparina e cateterismo eletivo", "C) Pericardite aguda — AINEs + colchicina", "D) Dissecção aórtica — cirurgia de emergência", "E) TEP maciço — trombólise sistêmica"],
      correct_index: 0, topic: "Cardiologia", explanation: "Supra de ST em V1-V4 + troponina elevada: IAMCSST anterior. Reperfusão: ICP primária em < 90 min.", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 72 anos, hipertensa e diabética, CF III NYHA, ortopneia e edema. ECG: FA com FC 110. Eco: FE 30%, VE dilatado. BNP: 1.500. Qual o tratamento otimizado para ICFEr?",
      options: ["A) IECA/BRA + betabloqueador + espironolactona + inibidor de SGLT2 (dapagliflozina)", "B) Digoxina + furosemida como pilares", "C) Apenas diurético de alça em dose alta", "D) Verapamil para controle de FC", "E) AINEs para alívio do edema"],
      correct_index: 0, topic: "Cardiologia", explanation: "ICFEr: 'Fantastic Four' — IECA/sacubitril-valsartana + BB + espironolactona + iSGLT2. Verapamil é contraindicado na ICFEr.", difficulty: "avançado"
    },
    {
      statement: "Homem, 22 anos, atleta, síncope durante treino. ECG: ondas Q em laterais, inversão de T em V1-V4. Eco: septo 22 mm, SAM. Qual o diagnóstico?",
      options: ["A) Cardiomiopatia hipertrófica — principal causa de morte súbita em jovens atletas", "B) CIV congênita", "C) Estenose aórtica reumática", "D) Coração de atleta fisiológico", "E) Miocardite viral aguda"],
      correct_index: 0, topic: "Cardiologia", explanation: "Atleta jovem + síncope + septo > 15 mm + SAM: CMH. Principal causa de morte súbita em atletas jovens.", difficulty: "avançado"
    },
    {
      statement: "Mulher, 40 anos, com febre reumática na infância, dispneia, hemoptise e palpitações. Ruflar diastólico mitral, estalido de abertura. Eco: área valvar mitral 0,9 cm², PSAP 65 mmHg. Qual o diagnóstico e tratamento?",
      options: ["A) Estenose mitral grave reumática — valvoplastia mitral por cateter-balão ou cirurgia valvar", "B) Insuficiência mitral grave — plastia mitral", "C) Prolapso de valva mitral — betabloqueador", "D) Endocardite infecciosa — ATB 6 semanas", "E) Estenose aórtica grave — TAVI"],
      correct_index: 0, topic: "Cardiologia", explanation: "Ruflar diastólico + estalido + área < 1,0 cm²: estenose mitral grave reumática. Se anatomia favorável: valvoplastia por balão.", difficulty: "intermediário"
    },
    {
      statement: "Homem, 50 anos, hipertenso, palpitação súbita há 2 horas. ECG: taquicardia QRS estreito, irregular, sem ondas P, FC 150. Estável hemodinamicamente. Qual a conduta?",
      options: ["A) Controle de frequência com betabloqueador IV + anticoagulação + avaliar cardioversão", "B) Cardioversão elétrica sincronizada imediata", "C) Adenosina 6 mg IV em bolus", "D) Amiodarona IV em bolus", "E) Desfibrilação 200J bifásico"],
      correct_index: 0, topic: "Cardiologia", explanation: "FA de início recente, estável: controle de FC (BB ou BCC). Anticoagulação pelo CHA2DS2-VASc. Adenosina é para TSVP, não FA.", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 65 anos, com síncope de repetição. ECG: bloqueio atrioventricular de 3º grau (BAVT) com FC ventricular de escape de 35 bpm. PA 100x60 em repouso, tontura ortostática frequente. Ecocardiograma: FE 55%, sem valvopatias. Qual a conduta definitiva?",
      options: ["A) Implante de marca-passo cardíaco definitivo (MP-DDD)", "B) Atropina IV contínua como tratamento definitivo", "C) Isoproterenol IV crônico", "D) Apenas observação com Holter semestral", "E) Ablação do nó AV por radiofrequência"],
      correct_index: 0, topic: "Cardiologia", explanation: "BAVT sintomático (síncope + bradicardia): indicação absoluta de marca-passo definitivo. Atropina e isoproterenol são medidas temporárias apenas enquanto aguarda o implante.", difficulty: "intermediário"
    },
    {
      statement: "Homem, 60 anos, hipertenso e diabético, com dor retroesternal intensa, de caráter 'rasgante', irradiação para dorso, de início súbito. PA: MSD 190x110, MSE 140x80 (diferença > 20 mmHg). Radiografia: alargamento de mediastino. Qual o diagnóstico e conduta?",
      options: ["A) Dissecção aguda de aorta tipo A (Stanford) — cirurgia cardíaca de emergência", "B) IAM com supra de ST — angioplastia primária", "C) TEP maciço — trombólise com alteplase", "D) Pericardite constritiva — pericardiectomia eletiva", "E) Pneumotórax hipertensivo — drenagem torácica"],
      correct_index: 0, topic: "Cardiologia", explanation: "Dor torácica 'rasgante' + diferença de PA entre membros + alargamento mediastinal: dissecção aórtica. Tipo A (aorta ascendente): cirurgia de emergência. Tipo B (descendente): tratamento clínico + controle pressórico.", difficulty: "avançado"
    },
    {
      statement: "Mulher, 28 anos, com febre há 3 semanas, sopro cardíaco novo (regurgitação mitral), petéquias subungueais (splinter hemorrhages), nódulos de Osler em polpas digitais e hematúria microscópica. Hemoculturas (3 amostras): Streptococcus viridans. Eco TE: vegetação de 12 mm no folheto mitral anterior. Qual o diagnóstico e tratamento?",
      options: ["A) Endocardite infecciosa em valva nativa — penicilina G cristalina + gentamicina IV por 4 semanas", "B) Febre reumática aguda — penicilina benzatina + AAS", "C) Lúpus com endocardite de Libman-Sacks — corticoide", "D) Mixoma atrial — ressecção cirúrgica eletiva", "E) Trombose intracardíaca — anticoagulação plena com heparina"],
      correct_index: 0, topic: "Cardiologia", explanation: "Febre prolongada + sopro novo + fenômenos vasculares/imunológicos + hemocultura positiva para S. viridans + vegetação: endocardite infecciosa (critérios de Duke). S. viridans em valva nativa: penicilina + gentamicina.", difficulty: "intermediário"
    },
    {
      statement: "Homem, 70 anos, com síncope ao esforço, angina e dispneia progressiva (CF II→III em 6 meses). Exame: sopro sistólico ejetivo em foco aórtico 4+/6+ com irradiação para carótidas, B4 presente, ictus sustentado. Eco: estenose aórtica com área valvar 0,7 cm², gradiente médio 55 mmHg, FE 50%. Qual a conduta?",
      options: ["A) Troca valvar aórtica cirúrgica (TVAo) ou TAVI conforme risco cirúrgico", "B) Valvoplastia aórtica por balão como tratamento definitivo", "C) Apenas betabloqueador e acompanhamento semestral", "D) Vasodilatadores (nitrato + hidralazina) para alívio sintomático", "E) Eco de controle anual sem intervenção por enquanto"],
      correct_index: 0, topic: "Cardiologia", explanation: "EAo grave (área < 1,0 cm², gradiente médio > 40 mmHg) + sintomas (síncope, angina, dispneia): indicação cirúrgica. TVAo convencional ou TAVI conforme risco cirúrgico (STS score). Valvoplastia por balão é apenas ponte para cirurgia.", difficulty: "avançado"
    },
    {
      statement: "Paciente de 48 anos, sem comorbidades, apresenta dor precordial aguda em pontada que piora com inspiração profunda e decúbito dorsal, melhora sentado inclinado para frente. ECG: supradesnível difuso de ST côncavo com infradesnivelamento de PR. Troponina: 0,08 (ref < 0,04). Eco: derrame pericárdico leve. Qual o diagnóstico e tratamento?",
      options: ["A) Pericardite aguda viral — AINEs (ibuprofeno) + colchicina + restrição de atividade física", "B) IAM inferior — angioplastia primária de urgência", "C) Angina instável — AAS + heparina + cateterismo", "D) Miocardite fulminante — suporte com inotrópicos em UTI", "E) TEP submaciço — enoxaparina em dose plena"],
      correct_index: 0, topic: "Cardiologia", explanation: "Dor pleurítica com melhora postural + supra de ST difuso côncavo + infra de PR: pericardite aguda. Tratamento: AINE (ibuprofeno 600mg 8/8h) + colchicina (reduz recorrência). Troponina pode elevar discretamente por miopericardite.", difficulty: "intermediário"
    },
  ],
  // Ciclo Básico areas
  "Anatomia": [
    {
      statement: "Paciente de 45 anos, vítima de trauma penetrante em região cervical lateral esquerda (triângulo posterior), apresenta impossibilidade de elevar o ombro esquerdo acima de 90° e dificuldade para girar a cabeça para o lado contralateral contra resistência. Qual nervo foi provavelmente lesado?",
      options: ["A) Nervo acessório (XI par craniano) — ramo espinal", "B) Nervo frênico (C3-C5)", "C) Nervo supraescapular", "D) Nervo torácico longo", "E) Nervo axilar"],
      correct_index: 0, topic: "Anatomia", explanation: "O nervo acessório (XI PC) é superficial no triângulo posterior do pescoço e inerva o trapézio e esternocleidomastoideo. Sua lesão causa queda do ombro (trapézio) e dificuldade de rotação cervical contralateral.", difficulty: "intermediário"
    },
    {
      statement: "Durante uma apendicectomia aberta por incisão de McBurney, o cirurgião incisa sequencialmente as camadas da parede abdominal anterolateral. Qual a sequência correta das camadas encontradas da superfície para a profundidade no ponto de McBurney?",
      options: ["A) Pele → subcutâneo → aponeurose do oblíquo externo → oblíquo interno → transverso do abdome → fáscia transversalis → peritônio", "B) Pele → subcutâneo → reto abdominal → peritônio", "C) Pele → fáscia de Camper → músculo reto → fáscia transversalis", "D) Pele → subcutâneo → oblíquo externo → transverso → oblíquo interno → peritônio", "E) Pele → aponeurose → músculo único da parede → peritônio visceral"],
      correct_index: 0, topic: "Anatomia", explanation: "Na região do ponto de McBurney (flanco/FID): após pele e subcutâneo, encontra-se aponeurose do oblíquo externo, fibras do oblíquo interno, transverso do abdome, fáscia transversalis e peritônio parietal.", difficulty: "intermediário"
    },
    {
      statement: "Paciente de 52 anos, submetido a tireoidectomia total, apresenta no pós-operatório rouquidão e voz bitonal. A laringoscopia mostra paralisia de prega vocal esquerda em posição paramediana. Qual nervo foi lesado durante o procedimento?",
      options: ["A) Nervo laríngeo recorrente esquerdo", "B) Nervo laríngeo superior — ramo externo", "C) Nervo vago (X) — tronco principal", "D) Nervo hipoglosso (XII)", "E) Nervo glossofaríngeo (IX)"],
      correct_index: 0, topic: "Anatomia", explanation: "O nervo laríngeo recorrente inerva todos os músculos intrínsecos da laringe exceto o cricotireoideo. Corre no sulco traqueoesofágico, intimamente relacionado à tireoide. Sua lesão unilateral causa rouquidão e voz bitonal.", difficulty: "intermediário"
    },
    {
      statement: "Mulher de 35 anos, fratura diafisária de úmero no terço médio após queda. Exame: mão caída (wrist drop), impossibilidade de extensão do punho e dos dedos, perda de sensibilidade no dorso da mão entre o 1º e 2º metacarpos. Qual nervo foi lesado e onde passa em relação ao úmero?",
      options: ["A) Nervo radial — percorre o sulco do nervo radial (canal de torção) no terço médio do úmero", "B) Nervo mediano — passa no canal do carpo", "C) Nervo ulnar — passa pelo epicôndilo medial do úmero", "D) Nervo musculocutâneo — perfura o músculo coracobraquial", "E) Nervo axilar — contorna o colo cirúrgico do úmero"],
      correct_index: 0, topic: "Anatomia", explanation: "Fratura diafisária de úmero no terço médio: o nervo radial é o mais vulnerável por percorrer o sulco radial posterolateral. Sua lesão causa wrist drop (perda da extensão do punho) e hipoestesia no 1º espaço interósseo dorsal.", difficulty: "intermediário"
    },
    {
      statement: "Homem de 68 anos, com carcinoma de cabeça de pâncreas, apresenta icterícia obstrutiva progressiva, vesícula biliar palpável e indolor (sinal de Courvoisier-Terrier), e perda ponderal. A TC mostra massa de 3 cm na cabeça pancreática comprimindo o colédoco intrapancreático. Qual estrutura anatômica marca o limite entre a cabeça e o corpo do pâncreas?",
      options: ["A) Vasos mesentéricos superiores (artéria e veia mesentérica superior)", "B) Tronco celíaco (tripé de Haller)", "C) Ligamento de Treitz", "D) Flexura duodenojejunal", "E) Veia esplênica isoladamente"],
      correct_index: 0, topic: "Anatomia", explanation: "A passagem dos vasos mesentéricos superiores (AMS e VMS) por trás do pâncreas marca a transição entre cabeça (à direita) e corpo (à esquerda). O processo uncinado se projeta posteriormente à VMS.", difficulty: "avançado"
    },
  ],
  "Fisiologia": [
    {
      statement: "Paciente de 55 anos, com insuficiência renal crônica estágio 4 (TFG 20 mL/min), apresenta paratormônio (PTH) de 450 pg/mL (ref 10-65), cálcio total 7,8 mg/dL, fósforo 7,5 mg/dL e vitamina D 25-OH de 12 ng/mL. Qual é o mecanismo fisiopatológico principal do hiperparatireoidismo secundário neste contexto?",
      options: ["A) Redução da produção renal de 1,25-diidroxivitamina D (calcitriol) → hipocalcemia → estímulo crônico das paratireoides", "B) Adenoma primário de paratireoide com produção autônoma de PTH", "C) Hipercalcemia por metástases ósseas estimulando PTH", "D) Excesso de vitamina D exógena causando hipercalcemia", "E) Deficiência de magnésio bloqueando a secreção de PTH"],
      correct_index: 0, topic: "Fisiologia", explanation: "Na DRC, o rim perde a capacidade de converter 25-OH vit D em calcitriol (1,25(OH)2D) pela 1-alfa-hidroxilase. Isso reduz absorção intestinal de cálcio → hipocalcemia crônica → estímulo contínuo das paratireoides → hiperparatireoidismo secundário.", difficulty: "avançado"
    },
    {
      statement: "Homem de 30 anos, maratonista, durante prova em clima quente (38°C), apresenta sudorese profusa, taquicardia compensatória e vasodilatação cutânea. Qual o principal mecanismo fisiológico de perda de calor utilizado nesta situação?",
      options: ["A) Evaporação do suor na superfície cutânea — principal mecanismo quando a temperatura ambiente se aproxima da corporal", "B) Radiação — emissão de ondas infravermelhas para o ambiente", "C) Convecção — perda de calor pelo movimento do ar sobre a pele", "D) Condução — transferência direta de calor para superfícies frias", "E) Vasoconstrição periférica com redistribuição para o core"],
      correct_index: 0, topic: "Fisiologia", explanation: "Quando a temperatura ambiente se aproxima da corporal, radiação, convecção e condução perdem eficácia. A evaporação do suor torna-se o mecanismo predominante de dissipação de calor (cada grama de suor evaporado dissipa ~0,58 kcal).", difficulty: "intermediário"
    },
    {
      statement: "Paciente de 42 anos, com estenose aórtica grave, apresenta sopro sistólico ejetivo crescendo-decrescendo, pulso parvus et tardus e B4 palpável. A curva de pressão do ventrículo esquerdo mostra pressão sistólica de 240 mmHg com pressão aórtica de 140 mmHg. Qual alteração fisiológica ocorre cronicamente no VE em resposta à sobrecarga de pressão?",
      options: ["A) Hipertrofia concêntrica — adição de sarcômeros em paralelo para normalizar o estresse de parede (lei de Laplace)", "B) Hipertrofia excêntrica — adição de sarcômeros em série com dilatação cavitária", "C) Dilatação pura sem hipertrofia — mecanismo de Frank-Starling", "D) Fibrose difusa sem hipertrofia — remodelamento apenas por colágeno", "E) Atrofia ventricular — redução do trabalho cardíaco"],
      correct_index: 0, topic: "Fisiologia", explanation: "Sobrecarga de pressão (estenose aórtica, HAS): o VE desenvolve hipertrofia concêntrica, com adição de sarcômeros em PARALELO, aumentando a espessura da parede para normalizar o estresse parietal (Lei de Laplace: σ = Pr/2h). Diferente da hipertrofia excêntrica (sobrecarga de volume).", difficulty: "avançado"
    },
    {
      statement: "Recém-nascido prematuro de 28 semanas apresenta desconforto respiratório grave nas primeiras horas. Qual o papel fisiológico do surfactante pulmonar e por que sua deficiência causa a síndrome do desconforto respiratório?",
      options: ["A) Reduz a tensão superficial alveolar, prevenindo o colapso alveolar na expiração (atelectasia) — produzido pelos pneumócitos tipo II a partir de ~34 semanas", "B) Aumenta a tensão superficial para manter os alvéolos abertos durante a inspiração", "C) Funciona como bactericida alveolar, prevenindo pneumonias", "D) Aumenta a complacência da caixa torácica, não dos alvéolos", "E) Atua como broncodilatador endógeno no epitélio brônquico"],
      correct_index: 0, topic: "Fisiologia", explanation: "Surfactante (dipalmitoilfosfatidilcolina) é produzido pelos pneumócitos tipo II e reduz a tensão superficial alveolar conforme a Lei de Laplace (P=2T/r). Sem surfactante, alvéolos menores colapsam (atelectasia). Produção adequada a partir de ~34 semanas.", difficulty: "intermediário"
    },
    {
      statement: "Paciente diabético tipo 1 em cetoacidose apresenta respiração de Kussmaul (taquipneia profunda e regular). Qual o mecanismo fisiológico que explica esse padrão respiratório e sua função compensatória?",
      options: ["A) Compensação respiratória da acidose metabólica — quimiorreceptores centrais e periféricos estimulam hiperventilação para reduzir pCO2", "B) Obstrução brônquica por broncoespasmo reflexo", "C) Estimulação vagal direta pelo excesso de corpos cetônicos", "D) Fadiga diafragmática com padrão paradoxal", "E) Alcalose respiratória primária que precede a acidose metabólica"],
      correct_index: 0, topic: "Fisiologia", explanation: "Na acidose metabólica (CAD), quimiorreceptores periféricos (corpos carotídeos/aórticos) e centrais detectam a queda do pH e estimulam o centro respiratório bulbar. A hiperventilação (Kussmaul) reduz pCO2, tentando normalizar o pH pela equação de Henderson-Hasselbalch.", difficulty: "intermediário"
    },
  ],
  "Bioquímica": [
    {
      statement: "Recém-nascido de 5 dias, em aleitamento materno exclusivo, apresenta letargia progressiva, recusa alimentar, vômitos e odor adocicado na urina ('xarope de bordo'). Aminoácidos séricos: leucina, isoleucina e valina muito elevados. Qual a deficiência enzimática responsável?",
      options: ["A) Deficiência do complexo desidrogenase de alfa-cetoácidos de cadeia ramificada (BCKD)", "B) Deficiência de fenilalanina hidroxilase", "C) Deficiência de homogentisato oxidase", "D) Deficiência de cistationina beta-sintase", "E) Deficiência de ornitina transcarbamoilase"],
      correct_index: 0, topic: "Bioquímica", explanation: "Doença do xarope de bordo (Maple Syrup Urine Disease): acúmulo de aminoácidos de cadeia ramificada (Leu, Ile, Val) por deficiência do complexo BCKD, que catalisa a descarboxilação oxidativa dos alfa-cetoácidos.", difficulty: "avançado"
    },
    {
      statement: "Paciente de 45 anos, etilista pesado, apresenta anemia megaloblástica com macrocitose (VCM 115 fL) e hipersegmentação de neutrófilos. Folato sérico normal, vitamina B12 baixa. Qual a etapa do metabolismo que é comprometida pela deficiência de B12 e causa acúmulo de ácido metilmalônico?",
      options: ["A) Conversão de metilmalonil-CoA em succinil-CoA — pela enzima metilmalonil-CoA mutase (que requer B12 como coenzima)", "B) Conversão de homocisteína em metionina pela metionina sintase", "C) Síntese de timidilato pela timidilato sintase", "D) Conversão de piruvato em acetil-CoA pela piruvato desidrogenase", "E) Beta-oxidação de ácidos graxos na mitocôndria"],
      correct_index: 0, topic: "Bioquímica", explanation: "B12 é cofator de duas enzimas: metionina sintase (conversão homocisteína → metionina) e metilmalonil-CoA mutase (conversão metilmalonil-CoA → succinil-CoA). A deficiência de B12 causa acúmulo de ácido metilmalônico (específico de B12, diferencia de deficiência de folato).", difficulty: "avançado"
    },
    {
      statement: "Paciente com intoxicação por monóxido de carbono (CO) apresenta SpO2 normal na oximetria de pulso, mas gasometria arterial mostra PaO2 normal e saturação de O2 (SaO2) reduzida. Qual o mecanismo bioquímico que explica a toxicidade do CO?",
      options: ["A) CO liga-se à hemoglobina com afinidade 200-250x maior que O2, formando carboxiemoglobina e desviando a curva de dissociação para a esquerda", "B) CO inibe a citocromo c oxidase (complexo IV) sem afetar a hemoglobina", "C) CO oxida o ferro da hemoglobina de Fe²⁺ para Fe³⁺ formando metaemoglobina", "D) CO bloqueia a anidrase carbônica impedindo transporte de CO2", "E) CO causa hemólise intravascular maciça por estresse oxidativo"],
      correct_index: 0, topic: "Bioquímica", explanation: "CO tem afinidade 200-250x maior pela Hb que O2, formando HbCO estável. Além disso, desloca a curva de dissociação do O2 para a ESQUERDA (efeito Haldane), dificultando a liberação de O2 nos tecidos. A oximetria de pulso não diferencia HbO2 de HbCO, por isso SpO2 parece normal.", difficulty: "intermediário"
    },
    {
      statement: "Homem de 20 anos apresenta episódios recorrentes de rabdomiólise após exercício intenso, com mioglobinúria e CK > 20.000. Biópsia muscular: acúmulo de glicogênio. Teste de isquemia do antebraço: ausência de aumento de lactato com aumento exagerado de amônia. Qual a deficiência enzimática?",
      options: ["A) Miofosforilase (doença de McArdle — glicogenose tipo V)", "B) Glicose-6-fosfatase (doença de Von Gierke — tipo I)", "C) Alfa-1,4-glicosidase ácida (doença de Pompe — tipo II)", "D) Enzima desramificadora (doença de Cori — tipo III)", "E) Fosfofrutocinase-1 (doença de Tarui — tipo VII)"],
      correct_index: 0, topic: "Bioquímica", explanation: "Doença de McArdle: deficiência de miofosforilase impede a glicogenólise muscular. Teste isquêmico do antebraço: sem produção de lactato (não quebra glicogênio), mas amônia aumenta (degradação de nucleotídeos purícos). Causa intolerância ao exercício e rabdomiólise.", difficulty: "avançado"
    },
    {
      statement: "Paciente com fenilcetonúria (PKU) clássica apresenta atraso no desenvolvimento neuropsicomotor, hipopigmentação de pele e cabelos, e odor de mofo na urina. Qual a base bioquímica da doença e o princípio do tratamento?",
      options: ["A) Deficiência de fenilalanina hidroxilase — acúmulo de fenilalanina e metabólitos tóxicos — tratamento com dieta restrita em fenilalanina", "B) Deficiência de tirosina hidroxilase — bloqueio na síntese de dopamina", "C) Excesso de melanina por hiperfunção da tirosinase", "D) Deficiência de triptofano hidroxilase — redução de serotonina", "E) Acúmulo de homocisteína por deficiência de CBS"],
      correct_index: 0, topic: "Bioquímica", explanation: "PKU: deficiência de fenilalanina hidroxilase (converte Phe → Tyr). Acúmulo de Phe e seus metabólitos (fenilpiruvato, fenilacetato) é neurotóxico. Hipopigmentação por redução de tirosina (precursor de melanina). Tratamento: dieta com restrição rigorosa de Phe.", difficulty: "intermediário"
    },
  ],
  "Histologia": [
    {
      statement: "Biópsia renal de paciente de 8 anos com síndrome nefrótica (proteinúria maciça, hipoalbuminemia, edema e hiperlipidemia). Microscopia óptica: glomérulos normais. Imunofluorescência: negativa. Microscopia eletrônica: apagamento (fusão) difuso dos processos podocitários. Qual o diagnóstico histopatológico?",
      options: ["A) Doença de lesão mínima (DLM) — nefropatia por alteração dos podócitos visível apenas à microscopia eletrônica", "B) Glomeruloesclerose segmentar e focal (GESF)", "C) Nefropatia membranosa", "D) Glomerulonefrite membranoproliferativa", "E) Nefropatia por IgA (Berger)"],
      correct_index: 0, topic: "Histologia", explanation: "Criança com síndrome nefrótica + MO normal + IF negativa + apagamento de processos podocitários na ME: Doença de Lesão Mínima. É a causa mais comum de síndrome nefrótica na infância (>80%). Excelente resposta a corticóide.", difficulty: "avançado"
    },
    {
      statement: "Em uma biópsia de intestino delgado de paciente com diarreia crônica e má absorção, observa-se atrofia vilositária total (grau Marsh IIIc), hiperplasia de criptas e aumento de linfócitos intraepiteliais (>40/100 enterócitos). Anticorpo anti-transglutaminase tecidual IgA: muito positivo. Qual o diagnóstico?",
      options: ["A) Doença celíaca — enteropatia glúten-induzida com destruição autoimune da mucosa intestinal", "B) Doença de Crohn ileal — inflamação transmural granulomatosa", "C) Doença de Whipple — macrófagos PAS-positivos na lâmina própria", "D) Linfoma intestinal de células T — enterite associada", "E) Tuberculose intestinal — granulomas caseosos na submucosa"],
      correct_index: 0, topic: "Histologia", explanation: "Atrofia vilositária + hiperplasia de criptas + linfocitose intraepitelial (classificação de Marsh III) + anti-tTG positivo: doença celíaca. A biópsia duodenal/jejunal com esses achados é o padrão-ouro diagnóstico.", difficulty: "intermediário"
    },
    {
      statement: "Biópsia hepática de paciente etilista crônico mostra hepatócitos balonizados, corpúsculos hialinos eosinofílicos intracitoplasmáticos (corpos de Mallory-Denk), infiltrado neutrofílico perivenular e esteatose macrovesicular. Qual o padrão histopatológico?",
      options: ["A) Esteato-hepatite alcoólica — inflamação com corpos de Mallory e infiltrado neutrofílico é característico", "B) Hepatite viral crônica — infiltrado linfocitário portal", "C) Hepatite autoimune — plasmócitos e hepatite de interface", "D) Cirrose biliar primária — destruição de ductos biliares interlobulares", "E) Doença de Wilson — grânulos de cobre em hepatócitos periportais"],
      correct_index: 0, topic: "Histologia", explanation: "Esteatose + hepatócitos balonizados + corpos de Mallory-Denk + infiltrado neutrofílico: esteato-hepatite alcoólica. Os corpos de Mallory são agregados de citoqueratinas intermediárias danificadas. Diferente da hepatite viral (linfócitos) e autoimune (plasmócitos).", difficulty: "intermediário"
    },
    {
      statement: "Em uma biópsia de linfonodo cervical, observa-se perda da arquitetura linfonodal normal com apagamento dos centros germinativos e presença de células grandes binucleadas com nucléolos proeminentes tipo 'olho de coruja' (células de Reed-Sternberg) em fundo inflamatório polimórfico (linfócitos, eosinófilos, plasmócitos, histiócitos). Qual o diagnóstico histopatológico?",
      options: ["A) Linfoma de Hodgkin clássico — tipo celularidade mista ou esclerose nodular", "B) Linfoma não-Hodgkin difuso de grandes células B", "C) Linfadenite reacional inespecífica", "D) Metástase linfonodal de carcinoma epidermoide", "E) Tuberculose ganglionar com granulomas caseosos"],
      correct_index: 0, topic: "Histologia", explanation: "Células de Reed-Sternberg (grandes, binucleadas, com nucléolos 'em olho de coruja') em fundo inflamatório polimórfico: Linfoma de Hodgkin clássico. As células RS são CD15+ e CD30+, geralmente CD20-. O fundo reacional rico é característico.", difficulty: "intermediário"
    },
    {
      statement: "Lâmina histológica mostra epitélio pseudoestratificado colunar ciliado com células caliciformes (goblet cells), lâmina própria com glândulas seromucosas e um esqueleto de cartilagem hialina em C na submucosa. De qual órgão foi obtido este fragmento?",
      options: ["A) Traqueia — epitélio respiratório típico com anéis cartilaginosos incompletos", "B) Esôfago — epitélio pavimentoso estratificado não queratinizado", "C) Brônquio principal — cartilagem em placas irregulares", "D) Bronquíolo terminal — epitélio cúbico ciliado sem cartilagem", "E) Laringe — epitélio variável com cartilagem elástica"],
      correct_index: 0, topic: "Histologia", explanation: "Epitélio pseudoestratificado colunar ciliado com caliciformes + glândulas seromucosas + anéis de cartilagem hialina em C: traqueia. Os anéis cartilaginosos em C (abertos posteriormente) são a marca histológica da traqueia.", difficulty: "intermediário"
    },
  ],
  "Farmacologia": [
    {
      statement: "Paciente de 55 anos, com ICC classe funcional III (FE 28%), em uso de carvedilol, enalapril, espironolactona e furosemida. Exames: K+ 6,2 mEq/L, Cr 2,3 mg/dL, ureia 85. ECG: ondas T apiculadas. Qual medicamento é o provável causador da hipercalemia e qual a conduta?",
      options: ["A) Espironolactona — suspender e tratar hipercalemia agudamente (gluconato de cálcio + insulina + glicose)", "B) Carvedilol — suspender betabloqueador imediatamente", "C) Enalapril — trocar por hidralazina + nitrato", "D) Furosemida — aumentar dose para potencializar excreção de K+", "E) Associar amilorida para sinergismo diurético"],
      correct_index: 0, topic: "Farmacologia", explanation: "Espironolactona (antagonista da aldosterona) poupa potássio. Com IRC (Cr 2,3), o risco de hipercalemia é potencializado. Enalapril também contribui. Com K+ 6,2 + ECG alterado: emergência. Gluconato de cálcio estabiliza membrana, insulina + glicose redistribuem K+.", difficulty: "avançado"
    },
    {
      statement: "Mulher de 30 anos, com epilepsia generalizada, em uso de valproato de sódio, descobre gravidez de 6 semanas. O neurologista decide trocar a medicação pelo risco teratogênico. Qual o principal risco teratogênico do valproato e qual a alternativa mais segura na gestação?",
      options: ["A) Defeitos do tubo neural (espinha bífida) — substituir por lamotrigina com suplementação de ácido fólico", "B) Cardiopatia congênita — substituir por carbamazepina", "C) Fenda palatina — substituir por fenitoína", "D) Microcefalia — substituir por fenobarbital", "E) Agenesia renal — manter valproato com dose reduzida"],
      correct_index: 0, topic: "Farmacologia", explanation: "Valproato é o anticonvulsivante mais teratogênico: risco 1-2% de defeitos do tubo neural (espinha bífida), além de dismorfismo facial e déficit cognitivo. Lamotrigina é considerada a alternativa mais segura na gestação. Ácido fólico 5mg/dia deve ser suplementado.", difficulty: "intermediário"
    },
    {
      statement: "Paciente de 62 anos, com fibrilação atrial e prótese valvar metálica mitral, em uso de varfarina com INR alvo 2,5-3,5. Inicia amiodarona para controle de ritmo. Após 1 semana, INR sobe para 5,8 sem sangramento. Qual o mecanismo da interação e conduta?",
      options: ["A) Amiodarona inibe CYP2C9 e CYP3A4, reduzindo metabolismo da varfarina → reduzir dose da varfarina em 30-50%", "B) Amiodarona induz CYP2C9, aumentando metabolismo da varfarina", "C) Amiodarona compete pela ligação à albumina com a varfarina", "D) Amiodarona inibe absorção intestinal da varfarina", "E) Amiodarona aumenta produção hepática de fatores de coagulação"],
      correct_index: 0, topic: "Farmacologia", explanation: "Amiodarona é potente inibidor de CYP2C9 (principal via de metabolismo do enantiômero S-varfarina) e CYP3A4. Isso reduz a metabolização da varfarina, prolongando seu efeito e elevando INR. Conduta: reduzir dose de varfarina em 30-50% e monitorar INR frequentemente.", difficulty: "avançado"
    },
    {
      statement: "Homem de 48 anos, internado em UTI com sepse por Staphylococcus aureus resistente à meticilina (MRSA), em uso de vancomicina IV. Após 5 dias, apresenta elevação de creatinina (1,1 → 2,8), oligúria e cilindros granulosos no EAS. Nível sérico de vancomicina: 35 µg/mL (alvo 15-20). Qual o efeito adverso e conduta?",
      options: ["A) Nefrotoxicidade dose-dependente da vancomicina — ajustar dose pelo nível sérico e hidratar", "B) Síndrome do homem vermelho — reduzir velocidade de infusão", "C) Ototoxicidade irreversível — suspender vancomicina definitivamente", "D) Neutropenia por vancomicina — trocar por linezolida", "E) Reação de hipersensibilidade tipo III — corticoide IV"],
      correct_index: 0, topic: "Farmacologia", explanation: "Vancomicina causa nefrotoxicidade dose-dependente, especialmente com níveis séricos > 20 µg/mL. Com nível de 35, deve-se ajustar dose (reduzir) e hidratar. Monitorar creatinina e nível sérico. Síndrome do homem vermelho é reação à infusão rápida (histamina), não nefrotoxicidade.", difficulty: "intermediário"
    },
    {
      statement: "Paciente de 70 anos, com doença de Parkinson em uso de levodopa/carbidopa há 5 anos, apresenta flutuações motoras (wearing-off com períodos 'on-off') e discinesias coreiformes no pico de dose. Qual o mecanismo fisiopatológico das complicações motoras tardias e a estratégia farmacológica?",
      options: ["A) Estimulação dopaminérgica pulsátil por meia-vida curta da levodopa — fracionar doses + adicionar inibidor de COMT (entacapone) ou agonista dopaminérgico", "B) Toxicidade direta da levodopa sobre neurônios dopaminérgicos — suspender levodopa", "C) Resistência periférica à carbidopa — aumentar dose de carbidopa", "D) Conversão excessiva de levodopa em noradrenalina — adicionar beta-bloqueador", "E) Anticorpos anti-receptor dopaminérgico — plasmaférese"],
      correct_index: 0, topic: "Farmacologia", explanation: "Complicações motoras tardias da levodopa: a estimulação pulsátil (meia-vida curta 1-2h) dos receptores dopaminérgicos causa sensibilização e respostas aberrantes. Estratégias: fracionar doses, adicionar entacapone (inibidor de COMT — prolonga ação), agonistas dopaminérgicos (meia-vida longa), ou inibidores de MAO-B.", difficulty: "avançado"
    },
  ],
  "Patologia": [
    {
      statement: "Mulher de 45 anos, com nódulo tireoidiano de 2 cm, PAAF mostra células foliculares com núcleos aumentados, cromatina dispersa ('vidro fosco'), fendas/sulcos nucleares (nuclear grooves) e inclusões intranucleares (pseudoinclusões). Qual o diagnóstico citológico?",
      options: ["A) Carcinoma papilífero de tireoide — diagnóstico baseado nas características nucleares, não na arquitetura", "B) Adenoma folicular benigno", "C) Carcinoma folicular — invasão capsular/vascular", "D) Carcinoma medular — células fusiformes com amiloide", "E) Tireoidite de Hashimoto — células de Hürthle"],
      correct_index: 0, topic: "Patologia", explanation: "As características nucleares patognomônicas do carcinoma papilífero são: núcleos com cromatina dispersa ('vidro fosco' ou 'Orphan Annie eyes'), sulcos nucleares (grooves) e pseudoinclusões intranucleares. O diagnóstico é citológico, baseado no núcleo.", difficulty: "intermediário"
    },
    {
      statement: "Homem de 60 anos, tabagista, com massa pulmonar central de 4 cm em brônquio principal. Biópsia brônquica: neoplasia maligna com células grandes poligonais, pontes intercelulares, pérolas de queratina e queratinização individual. Qual o tipo histológico?",
      options: ["A) Carcinoma epidermoide (escamoso) — queratinização e pontes intercelulares são marcadores", "B) Adenocarcinoma — formação glandular com mucina", "C) Carcinoma de pequenas células (oat cell) — células em grãos de aveia", "D) Carcinoma de grandes células indiferenciado", "E) Tumor carcinoide típico — padrão neuroendócrino"],
      correct_index: 0, topic: "Patologia", explanation: "Localização central + pontes intercelulares + pérolas de queratina + queratinização individual: carcinoma epidermoide (escamoso). É o tipo mais associado ao tabagismo e tende a ser central/hiliar. O adenocarcinoma é mais periférico.", difficulty: "intermediário"
    },
    {
      statement: "Criança de 4 anos apresenta massa abdominal palpável em flanco direito. TC: massa renal sólida de 8 cm, heterogênea. Nefrectomia realizada. Histopatologia: tumor trifásico com componente blastematoso (células pequenas indiferenciadas), mesenquimal (estroma) e epitelial (túbulos e glomérulos primitivos). Qual o diagnóstico?",
      options: ["A) Tumor de Wilms (nefroblastoma) — neoplasia renal embrionária trifásica mais comum na infância", "B) Carcinoma de células renais (tipo células claras)", "C) Neuroblastoma adrenal com invasão renal", "D) Nefroma mesoblástico congênito", "E) Rabdomiossarcoma retroperitoneal"],
      correct_index: 0, topic: "Patologia", explanation: "Tumor renal trifásico em criança (pico 3-4 anos): Tumor de Wilms (nefroblastoma). Os 3 componentes (blastema + epitélio + estroma) refletem a origem embrionária do rim. Pode associar-se a síndromes (WAGR, Denys-Drash, Beckwith-Wiedemann).", difficulty: "intermediário"
    },
    {
      statement: "Biópsia de pele de paciente com lesão eritematosa facial em asa de borboleta mostra: degeneração liquefativa da camada basal (dermatite de interface), espessamento da membrana basal, infiltrado linfocitário perivascular e perianexial, depósitos de mucina na derme. Imunofluorescência direta: depósitos granulares de IgG, IgM, IgA, C3 e C1q na junção dermoepidérmica ('banda lúpica positiva'). Qual o diagnóstico?",
      options: ["A) Lúpus eritematoso sistêmico — dermatite lúpica com banda lúpica positiva (full-house pattern)", "B) Dermatomiosite — rash heliotrópico", "C) Psoríase — acantose com microabscessos de Munro", "D) Esclerodermia localizada — fibrose dérmica e atrofia epidérmica", "E) Eritema multiforme — necrose de queratinócitos"],
      correct_index: 0, topic: "Patologia", explanation: "Dermatite de interface + espessamento da membrana basal + IF com depósito 'full-house' (IgG, IgM, IgA, C3, C1q) na junção dermoepidérmica: LES. A banda lúpica em pele lesionada é altamente sugestiva.", difficulty: "avançado"
    },
    {
      statement: "Homem de 50 anos com dor epigástrica crônica. EDA: úlcera gástrica em antro. Biópsia: gastrite crônica ativa com folículos linfoides (MALT), metaplasia intestinal e bactérias curvas na superfície do epitélio gástrico foveolar. Qual o agente etiológico e a complicação neoplásica mais temida?",
      options: ["A) Helicobacter pylori — risco de adenocarcinoma gástrico e linfoma MALT", "B) Campylobacter jejuni — risco de síndrome de Guillain-Barré", "C) Escherichia coli — risco de carcinoma colorretal", "D) Clostridium difficile — risco de megacólon tóxico", "E) Salmonella typhi — risco de perfuração intestinal"],
      correct_index: 0, topic: "Patologia", explanation: "Gastrite crônica ativa + folículos linfoides (MALT) + metaplasia intestinal + bactérias curvas na superfície foveolar: H. pylori (classificado como carcinógeno classe I pela IARC). Pode evoluir para adenocarcinoma (sequência de Correa) ou linfoma MALT gástrico.", difficulty: "intermediário"
    },
  ],
  "Semiologia": [
    {
      statement: "Paciente de 58 anos, etilista e hepatopata, apresenta ascite volumosa e edema de MMII. Ao exame, observa-se circulação colateral periumbilical ('cabeça de medusa'), esplenomegalia, eritema palmar e ginecomastia. Qual sinal semiológico diferencia ascite por hipertensão portal de ascite por carcinomatose peritoneal?",
      options: ["A) Gradiente de albumina soro-ascite (GASA) ≥ 1,1 g/dL indica hipertensão portal", "B) Sinal de Blumberg positivo indica carcinomatose", "C) Macicez fixa em flancos indica sempre hipertensão portal", "D) Sinal da onda líquida (piparote) é exclusivo de carcinomatose", "E) Presença de circulação colateral exclui carcinomatose"],
      correct_index: 0, topic: "Semiologia", explanation: "O GASA (Gradiente de Albumina Soro-Ascite) é o método mais acurado para diferenciar transudato (HP) de exsudato (carcinomatose). GASA ≥ 1,1 = hipertensão portal. GASA < 1,1 = causa não-portal (carcinomatose, TB peritoneal, síndrome nefrótica).", difficulty: "avançado"
    },
    {
      statement: "Mulher de 35 anos, previamente hígida, procura consultório por palpitações e tremores. Ao exame: FC 110 bpm regular, PA 150x60 mmHg (pressão de pulso alargada), pele quente e úmida, tremor fino de extremidades. Tireoide: bócio difuso, indolor. Olhos: retração palpebral e lid lag. Qual o sinal semiológico mais específico de Doença de Graves e não apenas de tireotoxicose?",
      options: ["A) Exoftalmia (proptose verdadeira) com oftalmopatia infiltrativa — exclusiva de Graves", "B) Taquicardia sinusal em repouso", "C) Bócio difuso palpável", "D) Tremor fino de extremidades", "E) Pressão de pulso alargada"],
      correct_index: 0, topic: "Semiologia", explanation: "Exoftalmia verdadeira (proptose bilateral) com oftalmopatia infiltrativa é exclusiva de Doença de Graves (anticorpos anti-receptor TSH ativam fibroblastos retro-orbitários). Lid lag e retração palpebral podem ocorrer em qualquer tireotoxicose por hiperatividade simpática.", difficulty: "intermediário"
    },
    {
      statement: "Homem de 70 anos, com dispneia aos esforços. Ausculta cardíaca: sopro sistólico ejetivo (em diamante) 4+/6+ em foco aórtico com irradiação para carótidas, B2 hipofonética, B4 presente, ictus sustentado. Pulso carotídeo: parvus et tardus. Qual é o achado semiológico que indica gravidade hemodinâmica da estenose aórtica?",
      options: ["A) B2 hipofonética (desaparecimento do componente aórtico) + pulso parvus et tardus", "B) Sopro 4+/6+ é o principal indicador de gravidade", "C) B4 presente indica apenas disfunção diastólica", "D) Irradiação para carótidas indica aneurisma de aorta associado", "E) Ictus sustentado é exclusivo de cardiomiopatia dilatada"],
      correct_index: 0, topic: "Semiologia", explanation: "Na EAo grave, a válvula calcificada praticamente não se move → A2 fica hipofonética ou ausente. O pulso parvus (amplitude reduzida) et tardus (ascensão lenta) reflete a obstrução fixa. Paradoxalmente, o sopro pode diminuir de intensidade quando o VE falha (EAo grave com baixo débito).", difficulty: "avançado"
    },
    {
      statement: "Criança de 7 anos, com febre há 5 dias, apresenta ao exame: língua em framboesa (papilas fungiformes hipertrofiadas e vermelhas), rash escarlatiniforme descamativo em tronco, linfonodomegalia cervical dolorosa > 1,5 cm, conjuntivite bilateral não-exsudativa e edema duro de mãos e pés. Qual o diagnóstico clínico baseado nos achados semiológicos?",
      options: ["A) Doença de Kawasaki — vasculite febril com risco de aneurisma coronariano", "B) Escarlatina estreptocócica — penicilina V oral por 10 dias", "C) Sarampo — manchas de Koplik e rash craniocaudal", "D) Eritema infeccioso (parvovírus B19) — rash em face esbofeteada", "E) Mononucleose infecciosa — rash após amoxicilina"],
      correct_index: 0, topic: "Semiologia", explanation: "Febre ≥ 5 dias + 4 dos 5 critérios (conjuntivite, alteração de lábios/boca, rash, alteração de extremidades, linfonodomegalia cervical): Doença de Kawasaki. Principal risco: aneurisma coronariano. Tratamento: imunoglobulina IV + AAS.", difficulty: "intermediário"
    },
    {
      statement: "Paciente de 45 anos, com dor lombar baixa irradiada para membro inferior esquerdo (ciatalgia), piora ao sentar e ao manobra de Valsalva. Exame: sinal de Lasègue positivo a 30° à esquerda, sinal de Lasègue cruzado positivo (elevação da perna direita reproduz dor na esquerda), hiporreflexia aquiliana esquerda e hipoestesia no dorso do pé esquerdo (dermátomo L5). Qual o nível provável da hérnia discal?",
      options: ["A) Hérnia discal L4-L5 com compressão da raiz L5", "B) Hérnia discal L5-S1 com compressão da raiz S1", "C) Hérnia discal L3-L4 com compressão da raiz L4", "D) Estenose do canal lombar em múltiplos níveis", "E) Síndrome do piriforme sem hérnia discal"],
      correct_index: 0, topic: "Semiologia", explanation: "Hipoestesia em dorso do pé = dermátomo L5. Hérnia posterolateral em L4-L5 comprime a raiz L5 (que sai abaixo do disco). O Lasègue cruzado positivo sugere hérnia grande com compressão medial. Reflexo aquileo é S1, mas pode estar comprometido por extensão.", difficulty: "intermediário"
    },
  ],
  "Microbiologia": [
    {
      statement: "Paciente de 30 anos, HIV positivo com CD4 de 50 células/µL, apresenta febre, tosse seca progressiva, dispneia aos mínimos esforços e hipoxemia (PaO2 55 mmHg). Radiografia: infiltrado intersticial bilateral difuso. LDH sérico elevado (620 U/L). Escarro induzido com coloração pela prata (Grocott): cistos arredondados em forma de disco. Qual o agente etiológico?",
      options: ["A) Pneumocystis jirovecii — pneumonia oportunista em AIDS com CD4 < 200", "B) Mycobacterium tuberculosis — pneumonia cavitária", "C) Cryptococcus neoformans — meningite fúngica", "D) Toxoplasma gondii — encefalite com lesões em anel", "E) Citomegalovírus — retinite com lesões em chama de vela"],
      correct_index: 0, topic: "Microbiologia", explanation: "HIV com CD4 < 200 + dispneia + infiltrado intersticial bilateral + LDH elevado + cistos na coloração de Grocott: Pneumocystis jirovecii (PCP). Tratamento: sulfametoxazol-trimetoprima em dose alta + corticoide se PaO2 < 70.", difficulty: "intermediário"
    },
    {
      statement: "Paciente de 65 anos, internado em UTI há 15 dias com pneumonia nosocomial, em uso de meropenem. Cultura de secreção traqueal: Klebsiella pneumoniae produtora de KPC (Klebsiella pneumoniae carbapenemase). Qual o mecanismo de resistência e a opção terapêutica?",
      options: ["A) Produção de carbapenemase (enzima que hidrolisa carbapenêmicos) — ceftazidima-avibactam ou polimixina", "B) Alteração de PBPs (proteínas ligadoras de penicilina) — vancomicina", "C) Efluxo ativo de antibióticos — ciprofloxacino em dose alta", "D) Produção de ESBL apenas — cefepime como alternativa", "E) Modificação ribossomal — linezolida como tratamento"],
      correct_index: 0, topic: "Microbiologia", explanation: "KPC é uma serina carbapenemase (classe A de Ambler) que hidrolisa todos os beta-lactâmicos incluindo carbapenêmicos. Ceftazidima-avibactam (avibactam inibe KPC) é o tratamento de primeira linha atual. Polimixina B é alternativa, porém mais tóxica.", difficulty: "avançado"
    },
    {
      statement: "Criança de 5 anos, com diarreia sanguinolenta (disenteria) há 3 dias, febre baixa e cólicas abdominais. Coprocultura: bastonetes gram-negativos não fermentadores de lactose, imóveis, que produzem toxina Shiga (Stx). Qual o agente etiológico e a complicação mais temida?",
      options: ["A) Shigella dysenteriae — risco de Síndrome Hemolítico-Urêmica (SHU)", "B) Salmonella enteritidis — bacteremia com focos metastáticos", "C) Vibrio cholerae — desidratação grave tipo água de arroz", "D) Campylobacter jejuni — síndrome de Guillain-Barré", "E) Clostridium difficile — megacólon tóxico"],
      correct_index: 0, topic: "Microbiologia", explanation: "Disenteria em criança + gram-negativo não-fermentador de lactose + imóvel + toxina Shiga: Shigella. A SHU (anemia hemolítica microangiopática + plaquetopenia + IRA) é a complicação mais grave, especialmente em crianças. Antibiótico pode aumentar risco de SHU.", difficulty: "intermediário"
    },
    {
      statement: "Mulher de 28 anos, com corrimento vaginal fétido ('odor de peixe'), cinzento, homogêneo, sem prurido importante. pH vaginal: 5,5. Teste das aminas (KOH 10%) positivo. Bacterioscopia: células-guia (clue cells — células epiteliais recobertas por bactérias). Qual o diagnóstico e tratamento?",
      options: ["A) Vaginose bacteriana (Gardnerella vaginalis + anaeróbios) — metronidazol oral ou vaginal", "B) Candidíase vulvovaginal — fluconazol oral dose única", "C) Tricomoníase — metronidazol dose única para casal", "D) Cervicite por Chlamydia — azitromicina 1g dose única", "E) Vaginite atrófica — estrogênio vaginal tópico"],
      correct_index: 0, topic: "Microbiologia", explanation: "Critérios de Amsel (3 de 4): corrimento homogêneo cinzento, pH > 4,5, teste das aminas positivo, clue cells. Vaginose bacteriana é uma disbiose (não infecção): redução de Lactobacillus + proliferação de Gardnerella e anaeróbios. Tratamento: metronidazol.", difficulty: "intermediário"
    },
    {
      statement: "Paciente de 40 anos, agricultor no sul do Brasil, com lesão ulcerada na perna de evolução crônica (meses), bordas elevadas, fundo granuloso. Biópsia: granuloma com células gigantes tipo Langhans e corpos asteroides. Cultura em ágar Sabouraud a 25°C: colônia filamentosa. À microscopia: hifas septadas com conídios em forma de 'roda de leme' (margarida). Qual o agente?",
      options: ["A) Sporothrix schenckii — esporotricose (micose subcutânea implantada por trauma)", "B) Paracoccidioides brasiliensis — paracoccidioidomicose", "C) Leishmania braziliensis — leishmaniose tegumentar", "D) Mycobacterium marinum — micobacteriose atípica", "E) Chromoblastomycosis — corpos muriformes"],
      correct_index: 0, topic: "Microbiologia", explanation: "Lesão ulcerada crônica em trabalhador rural + dimorfismo (fungo filamentoso a 25°C e levedura a 37°C) + conídios em 'roda de leme': Sporothrix schenckii. A forma linfocutânea (nódulos em trajeto linfático) é a mais comum. Tratamento: itraconazol.", difficulty: "avançado"
    },
  ],
  "Imunologia": [
    {
      statement: "Menino de 8 meses, com infecções bacterianas recorrentes (otites, pneumonias, sinusites) desde os 6 meses de vida. Dosagem de imunoglobulinas: IgG, IgA e IgM muito baixas. Linfócitos B (CD19+) ausentes na citometria de fluxo. Linfócitos T normais. Qual o diagnóstico e o defeito imunológico?",
      options: ["A) Agamaglobulinemia ligada ao X (Bruton) — mutação em BTK com ausência de células B maduras", "B) Imunodeficiência comum variável (IDCV) — defeito na diferenciação terminal de células B", "C) Deficiência seletiva de IgA — isoforma mais comum de imunodeficiência", "D) Síndrome de DiGeorge — aplasia tímica com deficiência de células T", "E) Imunodeficiência combinada grave (SCID) — ausência de T e B"],
      correct_index: 0, topic: "Imunologia", explanation: "Menino + infecções bacterianas recorrentes após 6 meses (perda de IgG materna) + pan-hipogamaglobulinemia + ausência de células B: Agamaglobulinemia de Bruton (ligada ao X). Mutação na tirosina quinase de Bruton (BTK) impede maturação de pré-B para B. Tratamento: reposição de imunoglobulina IV.", difficulty: "avançado"
    },
    {
      statement: "Paciente de 30 anos, após receber penicilina IV, apresenta em 5 minutos: urticária generalizada, angioedema, broncoespasmo, hipotensão (PA 70x40) e taquicardia. Qual o mecanismo imunológico e o tratamento de primeira linha?",
      options: ["A) Hipersensibilidade tipo I (IgE-mediada) — anafilaxia — adrenalina IM (0,3-0,5 mg) é a primeira medida", "B) Hipersensibilidade tipo II (citotóxica) — plasmaférese", "C) Hipersensibilidade tipo III (imunocomplexos) — corticoide IV", "D) Hipersensibilidade tipo IV (celular tardia) — anti-histamínico oral", "E) Reação pseudoalérgica não imunológica — apenas observação"],
      correct_index: 0, topic: "Imunologia", explanation: "Anafilaxia = hipersensibilidade tipo I: IgE pré-formada na superfície de mastócitos reconhece penicilina → degranulação maciça → histamina, leucotrienos, prostaglandinas → vasodilatação, broncoespasmo, edema. ADRENALINA IM é PRIMEIRA LINHA (não IV inicialmente, não anti-histamínico).", difficulty: "intermediário"
    },
    {
      statement: "Mulher de 25 anos com artralgia, rash malar em asa de borboleta, fotossensibilidade, alopecia e nefrite classe IV. Exames: FAN positivo (1:1280, padrão homogêneo), anti-dsDNA positivo em alto título, complemento C3 e C4 consumidos. Qual o principal mecanismo imunológico da nefrite lúpica?",
      options: ["A) Hipersensibilidade tipo III — depósito de imunocomplexos (DNA-anti-DNA) no glomérulo com ativação do complemento", "B) Hipersensibilidade tipo I — IgE contra antígenos renais", "C) Hipersensibilidade tipo II — anticorpos contra membrana basal glomerular (anti-GBM)", "D) Hipersensibilidade tipo IV — infiltração de linfócitos T CD8+ no interstício renal", "E) Autoimunidade exclusivamente mediada por células NK"],
      correct_index: 0, topic: "Imunologia", explanation: "Nefrite lúpica: formação de imunocomplexos circulantes (anti-dsDNA + DNA) que se depositam no mesângio e subendotélio glomerular → ativam complemento clássico (C3/C4 consumidos) → inflamação e dano tecidual. É o protótipo de hipersensibilidade tipo III.", difficulty: "avançado"
    },
    {
      statement: "Paciente de 45 anos, submetido a transplante renal há 10 dias, apresenta febre, oligúria, elevação de creatinina (1,5 → 4,2) e dor no enxerto. Biópsia do enxerto: infiltrado linfocitário intersticial intenso com tubulite (linfócitos invadindo células tubulares). Sem depósitos de C4d. Qual o tipo de rejeição e tratamento?",
      options: ["A) Rejeição aguda celular (mediada por linfócitos T) — pulsoterapia com metilprednisolona + considerar anti-timocitária", "B) Rejeição hiperaguda (mediada por anticorpos pré-formados) — transplantectomia", "C) Rejeição crônica — não há tratamento eficaz", "D) Nefrotoxicidade por tacrolimus — reduzir dose do imunossupressor", "E) Infecção por CMV — ganciclovir IV"],
      correct_index: 0, topic: "Imunologia", explanation: "Rejeição aguda celular (Banff): dias a semanas pós-transplante, mediada por linfócitos T CD4+ e CD8+ que infiltram o interstício e invadem túbulos (tubulite). Sem C4d (que indica rejeição humoral). Tratamento: pulso de corticoide IV. Se refratária: anticorpo anti-linfócito T.", difficulty: "avançado"
    },
    {
      statement: "Criança de 2 anos, com candidíase mucocutânea recorrente, BCGite disseminada após vacinação e pneumonia por Pneumocystis jirovecii. Hemograma: linfopenia grave (< 300/µL). Citometria de fluxo: ausência de linfócitos T (CD3+) e células NK, com presença de linfócitos B. Qual o diagnóstico e tratamento definitivo?",
      options: ["A) Imunodeficiência combinada grave (SCID) T-B+NK- — transplante de células-tronco hematopoiéticas", "B) Agamaglobulinemia de Bruton — reposição de imunoglobulina IV", "C) Deficiência de C3 do complemento — sem tratamento disponível", "D) Doença granulomatosa crônica — interferon-gama profilático", "E) Síndrome de Wiskott-Aldrich — esplenectomia"],
      correct_index: 0, topic: "Imunologia", explanation: "Infecções oportunistas graves precoces + linfopenia profunda + ausência de T e NK com B presente: SCID T-B+NK- (provável mutação na cadeia γ comum dos receptores de IL-2/IL-7/IL-15). É a imunodeficiência mais grave. Tratamento definitivo: transplante de medula óssea. Sem tratamento, é fatal no 1º ano.", difficulty: "avançado"
    },
  ],
};

export function getFallbackQuestionsForArea(area: string, count = 5): DiagQuestion[] {
  const bank = FALLBACK_BANK[area];
  if (bank && bank.length > 0) {
    return shuffle(bank).slice(0, count);
  }
  // Ultimate fallback for unknown areas
  return Array.from({ length: count }, (_, idx) => ({
    statement: `Questão de ${area} (${idx + 1}/${count}): Paciente de ${30 + idx * 10} anos procura atendimento com queixa principal relacionada a ${area}. Apresenta sinais e sintomas compatíveis com patologia frequente na área. Qual a melhor conduta?`,
    options: [
      "A) Investigação complementar com exames direcionados",
      "B) Tratamento empírico imediato sem investigação",
      "C) Encaminhamento para especialista sem avaliação inicial",
      "D) Alta com orientações gerais e retorno em 30 dias",
      "E) Internação hospitalar independente da gravidade"
    ],
    correct_index: 0,
    topic: area,
    explanation: "A investigação complementar direcionada é fundamental para confirmar a hipótese diagnóstica antes de definir a conduta terapêutica.",
    difficulty: "intermediário",
  }));
}

export function getAllFallbackQuestions(): DiagQuestion[] {
  return Object.keys(FALLBACK_BANK).flatMap(area => getFallbackQuestionsForArea(area, 5));
}
