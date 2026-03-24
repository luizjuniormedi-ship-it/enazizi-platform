import type { DiagQuestion } from "@/components/diagnostic/DiagnosticExam";

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
      correct_index: 0, topic: "Cirurgia", explanation: "Tríade de Charcot (dor em HCD + febre + icterícia) com coledocolitíase: colangite aguda. Conduta: ATB + descompressão biliar de urgência (CPRE com papilotomia). Se evoluir com hipotensão e rebaixamento (pêntade de Reynolds), UTI.", difficulty: "avançado"
    },
    {
      statement: "Homem, 30 anos, esfaqueado em flanco esquerdo, hemodinamicamente estável (PA 120x80, FC 88). Exame: orifício de entrada em flanco E sem evisceração, dor leve à palpação. TC com contraste: laceração esplênica grau II (AAST) com pequeno hematoma subcapsular sem extravasamento ativo de contraste. Qual a conduta?",
      options: ["A) Tratamento não operatório com observação em UTI, repouso e controle seriado", "B) Esplenectomia total de urgência", "C) Esplenectomia parcial videolaparoscópica", "D) Arteriografia com embolização esplênica profilática", "E) Laparotomia exploradora mandatória por ser ferimento penetrante"],
      correct_index: 0, topic: "Cirurgia", explanation: "Trauma esplênico grau II em paciente estável, sem extravasamento ativo: tratamento não operatório (TNO) é seguro com monitorização rigorosa. Laparotomia mandatória por FAB em flanco é conceito ultrapassado quando há TC disponível e paciente estável.", difficulty: "avançado"
    },
  ],
  "Pediatria": [
    {
      statement: "Lactente de 4 meses, previamente hígido, apresenta tosse seca há 3 dias evoluindo para taquipneia (FR 62), tiragem subcostal, sibilos expiratórios difusos e crépitos finos bilaterais. Temperatura: 37,8°C. SpO2: 90%. Mãe refere que irmão mais velho de 5 anos teve resfriado há 1 semana. Qual o diagnóstico e conduta prioritária?",
      options: ["A) Bronquiolite viral aguda — oxigenoterapia, hidratação e monitorização", "B) Crise de asma — salbutamol inalatório de resgate e corticoide IV", "C) Pneumonia bacteriana — amoxicilina VO por 10 dias", "D) Coqueluche — azitromicina VO por 5 dias", "E) Aspiração de corpo estranho — broncoscopia rígida de urgência"],
      correct_index: 0, topic: "Pediatria", explanation: "Lactente < 6 meses com pródromos virais, sibilos + crépitos e hipoxemia: bronquiolite viral aguda (principal agente: VSR). Tratamento é suporte: O2 se SpO2 < 92%, hidratação. Broncodilatadores não têm benefício comprovado.", difficulty: "intermediário"
    },
    {
      statement: "Criança de 2 anos, trazida ao PS com febre alta (39,5°C) há 3 dias, irritabilidade, fontanela anterior abaulada, rigidez de nuca e sinal de Brudzinski positivo. Petéquias em tronco e membros inferiores. Hb 12, leucócitos 24.000 (80% neutrófilos). Qual a conduta imediata?",
      options: ["A) Ceftriaxona IV empírica + dexametasona IV antes do antibiótico + coleta de LCR", "B) Aguardar resultado do LCR para definir antibioticoterapia", "C) Amoxicilina VO em dose alta por 14 dias", "D) Aciclovir IV isolado por suspeita de encefalite herpética", "E) Observação com antitérmico e retorno em 24 horas"],
      correct_index: 0, topic: "Pediatria", explanation: "Sinais meníngeos + petéquias + febre alta em criança: meningite bacteriana (provável meningococo). Iniciar ATB empírico (ceftriaxona) e dexametasona ANTES da punção lombar. Dexametasona reduz sequelas (surdez) se administrada antes ou junto com ATB.", difficulty: "intermediário"
    },
    {
      statement: "Neonato de 12 horas de vida, nascido a termo (39 semanas), parto vaginal sem intercorrências, apresenta icterícia em zona de Kramer III (até umbigo). Mãe: O Rh negativo, não realizou anti-D. RN: A Rh positivo. Bilirrubina total: 14 mg/dL (BI 13,2). Coombs direto positivo. Qual a conduta?",
      options: ["A) Fototerapia intensiva imediata + monitorar bilirrubina a cada 4-6 horas", "B) Observação clínica pois icterícia é fisiológica nas primeiras 24h", "C) Alta hospitalar com retorno em 48h para dosagem de bilirrubina", "D) Exsanguineotransfusão imediata sem fototerapia prévia", "E) Fenobarbital VO para induzir conjugação hepática"],
      correct_index: 0, topic: "Pediatria", explanation: "Icterícia nas primeiras 24h é sempre patológica. Incompatibilidade Rh (mãe O- / RN A+) com Coombs direto positivo: doença hemolítica do RN. Com BT 14 mg/dL em < 24h: fototerapia intensiva imediata. Exsanguíneo se não responder ou BT > 25.", difficulty: "avançado"
    },
    {
      statement: "Pré-escolar de 4 anos com história de 3 episódios de convulsão tônico-clônica generalizada associada a febre (>38,5°C) em contexto de IVAS nos últimos 2 anos. Cada episódio durou < 5 minutos, com recuperação completa. Desenvolvimento neuropsicomotor normal. EEG interictal normal. Qual a conduta?",
      options: ["A) Orientação aos pais sobre manejo da febre e convulsões — sem profilaxia anticonvulsivante", "B) Iniciar valproato de sódio profilático contínuo", "C) Solicitar RM de crânio e manter internação para investigação", "D) Fenobarbital contínuo até os 6 anos de idade", "E) Encaminhar para neurocirurgia pela recorrência das crises"],
      correct_index: 0, topic: "Pediatria", explanation: "Convulsão febril simples recorrente: < 15 min, generalizada, sem déficit pós-ictal, DNPM normal. Não requer profilaxia com anticonvulsivantes (risco-benefício desfavorável). Orientar manejo de febre e quando procurar emergência.", difficulty: "intermediário"
    },
    {
      statement: "Adolescente de 13 anos, sexo feminino, apresenta poliúria, polidipsia e perda de 5 kg em 3 semanas. Glicemia capilar no PS: 380 mg/dL. Gasometria: pH 7,25, HCO3 12 mEq/L. Cetonúria +++. FC 110, FR 30 (Kussmaul), desidratação ++. K+ 5,2 mEq/L. Qual o diagnóstico e a primeira medida terapêutica?",
      options: ["A) Cetoacidose diabética tipo 1 — hidratação IV com SF 0,9% (20 mL/kg na 1ª hora)", "B) Diabetes tipo 2 — metformina VO e orientação dietética", "C) Insulina regular IV em bolus de 10 UI imediatamente", "D) Reposição de potássio IV antes de qualquer outra medida", "E) Bicarbonato de sódio IV pelo pH < 7,3"],
      correct_index: 0, topic: "Pediatria", explanation: "CAD em adolescente com DM1: prioridade é HIDRATAÇÃO (SF 0,9% 20 mL/kg na 1ª hora). Insulina regular IV em BIC só após início da hidratação (nunca em bolus na pediatria). K+ está pseudoelevado pela acidose.", difficulty: "intermediário"
    },
  ],
  "Ginecologia e Obstetrícia": [
    {
      statement: "Gestante de 32 semanas, G2P1, apresenta PA 160x110 mmHg, cefaleia frontal intensa, escotomas visuais e epigastralgia em barra. Proteinúria: 3+ na fita. Plaquetas: 85.000/mm³. TGO: 280 U/L. LDH: 850 U/L. Qual o diagnóstico e a conduta?",
      options: ["A) Pré-eclâmpsia grave com síndrome HELLP — estabilizar e indicar parto", "B) Eclâmpsia — sulfato de magnésio isolado e manter gestação até 37 semanas", "C) Hipertensão gestacional benigna — anti-hipertensivo VO e pré-natal semanal", "D) Esteatose hepática aguda da gravidez — transplante hepático de urgência", "E) Coagulação intravascular disseminada primária — heparinização plena"],
      correct_index: 0, topic: "Ginecologia e Obstetrícia", explanation: "PE grave com HELLP (hemólise + ↑enzimas + ↓plaquetas): estabilização com MgSO4 + anti-hipertensivo + resolução da gestação independente da IG. HELLP é indicação de interrupção.", difficulty: "avançado"
    },
    {
      statement: "Mulher, 25 anos, G1P0, IG 8 semanas por DUM, apresenta sangramento vaginal moderado, dor em cólica em hipogástrio e colo uterino pérvio ao toque com presença de material no canal cervical. β-hCG: 12.000 mUI/mL. USG TV: útero com conteúdo heterogêneo sem BCF. Qual o diagnóstico?",
      options: ["A) Abortamento incompleto — esvaziamento uterino (AMIU ou curetagem)", "B) Ameaça de abortamento — repouso e progesterona vaginal", "C) Gravidez ectópica — metotrexato IM", "D) Mola hidatiforme completa — aspiração a vácuo", "E) Abortamento retido — conduta expectante por 4 semanas"],
      correct_index: 0, topic: "Ginecologia e Obstetrícia", explanation: "Sangramento + colo pérvio com material + USG sem BCF com conteúdo heterogêneo: abortamento incompleto. Conduta: esvaziamento uterino. Ameaça de aborto teria colo impérvio e BCF presente.", difficulty: "intermediário"
    },
    {
      statement: "Gestante de 36 semanas, G3P2, apresenta sangramento vaginal vermelho vivo, indolor, de início súbito, em grande quantidade. Útero relaxado, tônus normal. BCF: 140 bpm, sem desacelerações. PA 110x70. Sem história de trauma. Qual a hipótese diagnóstica principal e a conduta inicial?",
      options: ["A) Placenta prévia — não realizar toque vaginal, USG e avaliar via de parto", "B) Descolamento prematuro de placenta — amniotomia e ocitocina", "C) Rotura uterina — laparotomia de emergência", "D) Rotura de vasa prévia — cesárea imediata", "E) Cervicite — tratamento com antibiótico tópico"],
      correct_index: 0, topic: "Ginecologia e Obstetrícia", explanation: "Sangramento indolor, vermelho vivo, útero relaxado, sem sofrimento fetal: placenta prévia. NUNCA realizar toque vaginal (risco de hemorragia maciça). USG para confirmar e planejar via de parto (geralmente cesárea).", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 48 anos, G0P0, pós-menopausa há 2 anos, apresenta sangramento vaginal de pequena quantidade há 1 mês. IMC 35. DM2 e HAS. Exame especular: colo sem alterações, sangue proveniente do canal cervical. USG TV: espessamento endometrial de 12 mm. Qual a conduta?",
      options: ["A) Histeroscopia diagnóstica com biópsia endometrial", "B) Papanicolaou e retorno em 6 meses", "C) Terapia de reposição hormonal com estrogênio + progesterona", "D) USG TV de controle em 3 meses", "E) Histerectomia total imediata sem investigação histológica"],
      correct_index: 0, topic: "Ginecologia e Obstetrícia", explanation: "Sangramento pós-menopausa + espessamento endometrial (> 4-5 mm): investigar câncer de endométrio. Fatores de risco presentes: obesidade, DM, nuliparidade. Histeroscopia com biópsia é o padrão-ouro.", difficulty: "intermediário"
    },
    {
      statement: "Gestante de 28 semanas, G1P0, com DM gestacional diagnosticado na 24ª semana, em uso de dieta e exercícios. Glicemias capilares: jejum 105-115 mg/dL, pós-prandial (1h) 155-170 mg/dL nas últimas 2 semanas. Feto com circunferência abdominal no percentil 90. Qual a conduta?",
      options: ["A) Iniciar insulinoterapia (NPH ± regular) por falha das medidas não farmacológicas", "B) Manter apenas dieta e reavaliar com 32 semanas", "C) Iniciar metformina como primeira escolha", "D) Indicar parto imediato por macrossomia fetal", "E) Solicitar teste oral de tolerância à glicose de controle"],
      correct_index: 0, topic: "Ginecologia e Obstetrícia", explanation: "DMG com glicemias acima das metas (jejum > 95, 1h pós-prandial > 140) após 2 semanas de dieta + exercício: indicação de insulinoterapia. Metformina pode ser alternativa, mas insulina é primeira escolha quando há macrossomia.", difficulty: "intermediário"
    },
  ],
  "Medicina Preventiva": [
    {
      statement: "Em um município com 50.000 habitantes, foram diagnosticados 200 novos casos de dengue em janeiro de 2024. A população suscetível estimada era de 45.000. Considerando que em 31/12/2023 havia 150 casos em tratamento, qual é a taxa de incidência de dengue em janeiro/2024?",
      options: ["A) 200/45.000 × 1.000 = 4,4 por mil habitantes suscetíveis", "B) 350/50.000 × 1.000 = 7,0 por mil habitantes", "C) 200/50.000 × 1.000 = 4,0 por mil habitantes", "D) 150/50.000 × 1.000 = 3,0 por mil habitantes", "E) 200/200 × 100 = 100%"],
      correct_index: 0, topic: "Medicina Preventiva", explanation: "Incidência = casos NOVOS / população em risco (suscetível) no período. Os 150 casos prevalentes não entram no numerador da incidência. A população de referência para incidência é a suscetível.", difficulty: "intermediário"
    },
    {
      statement: "Um estudo avaliou um novo teste rápido para tuberculose pulmonar em 1.000 pacientes sintomáticos respiratórios. Resultados: 180 verdadeiros positivos, 20 falsos negativos, 50 falsos positivos, 750 verdadeiros negativos. Qual a sensibilidade e a especificidade do teste?",
      options: ["A) Sensibilidade 90% e Especificidade 93,75%", "B) Sensibilidade 93,75% e Especificidade 90%", "C) Sensibilidade 78% e Especificidade 97%", "D) Sensibilidade 80% e Especificidade 90%", "E) Sensibilidade 90% e Especificidade 80%"],
      correct_index: 0, topic: "Medicina Preventiva", explanation: "Sensibilidade = VP/(VP+FN) = 180/200 = 90%. Especificidade = VN/(VN+FP) = 750/800 = 93,75%. Sensibilidade mede a capacidade de detectar doentes; especificidade, de identificar sadios.", difficulty: "intermediário"
    },
    {
      statement: "Na Atenção Primária à Saúde (APS), uma equipe de Saúde da Família é responsável por uma área com 3.500 pessoas cadastradas. O atributo da APS que se refere ao acompanhamento longitudinal dos pacientes ao longo do tempo, com vínculo e responsabilização, é denominado:",
      options: ["A) Longitudinalidade", "B) Integralidade", "C) Coordenação do cuidado", "D) Primeiro contato (acessibilidade)", "E) Orientação comunitária"],
      correct_index: 0, topic: "Medicina Preventiva", explanation: "Longitudinalidade (Starfield): relação pessoal de longa duração entre equipe e população, com vínculo e acompanhamento contínuo independente da doença. Diferente de integralidade (reconhecer todas as necessidades) e coordenação (integrar informações entre níveis).", difficulty: "intermediário"
    },
    {
      statement: "Um pesquisador deseja avaliar se o tabagismo é fator de risco para câncer de pulmão. Ele seleciona 500 pacientes com câncer de pulmão (casos) e 500 pacientes sem câncer (controles), investigando a exposição pregressa ao tabaco. Qual o tipo de estudo e a medida de associação adequada?",
      options: ["A) Estudo caso-controle — Odds Ratio (razão de chances)", "B) Estudo de coorte prospectivo — Risco Relativo", "C) Ensaio clínico randomizado — NNT", "D) Estudo transversal — Razão de Prevalência", "E) Estudo ecológico — Coeficiente de correlação"],
      correct_index: 0, topic: "Medicina Preventiva", explanation: "Seleção a partir do desfecho (casos vs controles) com investigação retrospectiva da exposição: caso-controle. Medida de associação = Odds Ratio. Risco Relativo é para coorte.", difficulty: "intermediário"
    },
    {
      statement: "No calendário vacinal do Programa Nacional de Imunizações (PNI) 2024, um lactente de 2 meses deve receber obrigatoriamente quais vacinas nesta idade?",
      options: ["A) Pentavalente + VIP (polio inativada) + Pneumocócica 10-valente + Rotavírus", "B) BCG + Hepatite B + Pentavalente", "C) Tríplice viral + Febre amarela + Varicela", "D) Apenas Hepatite B (dose de reforço)", "E) DTPa + Meningocócica ACWY + HPV"],
      correct_index: 0, topic: "Medicina Preventiva", explanation: "Aos 2 meses: Pentavalente (DTP+Hib+HepB), VIP (1ª dose), Pneumo 10 (1ª dose) e Rotavírus (1ª dose). BCG e HepB são ao nascimento. Tríplice viral é aos 12 meses.", difficulty: "intermediário"
    },
  ],
  "Oncologia": [
    {
      statement: "Mulher, 58 anos, tabagista (45 maços-ano), apresenta tosse persistente há 3 meses, hemoptise e emagrecimento de 8 kg. Radiografia de tórax: massa de 5 cm em hilo pulmonar direito. TC de tórax confirma lesão com linfonodomegalia mediastinal ipsilateral (N2). PET-CT: captação na massa e linfonodos mediastinais, sem metástases a distância. Qual o estadiamento e a conduta?",
      options: ["A) Estágio IIIA (T2N2M0) — quimioterapia + radioterapia concomitante (±imunoterapia)", "B) Estágio IA — lobectomia com linfadenectomia mediastinal isolada", "C) Estágio IV — cuidados paliativos exclusivos", "D) Estágio IIB — cirurgia seguida de quimioterapia adjuvante", "E) Estágio IIIA — radioterapia isolada sem quimioterapia"],
      correct_index: 0, topic: "Oncologia", explanation: "Massa 5 cm com N2 (linfonodos mediastinais ipsilaterais) sem metástase: IIIA. Tratamento padrão: QT+RT concomitante. Com advento da imunoterapia (durvalumabe), consolidação pós-quimiorradioterapia melhora sobrevida.", difficulty: "avançado"
    },
    {
      statement: "Homem, 62 anos, assintomático, PSA total: 8,5 ng/mL (livre/total 12%). Toque retal: nódulo endurecido em lobo direito. Biópsia transretal guiada por USG: adenocarcinoma de próstata Gleason 7 (4+3) em 4/12 fragmentos. RM: lesão confinada à cápsula (T2c). Cintilografia óssea normal. Qual a conduta?",
      options: ["A) Prostatectomia radical ou radioterapia com hormonioterapia — risco intermediário desfavorável", "B) Vigilância ativa com PSA a cada 6 meses", "C) Orquiectomia bilateral isolada", "D) Quimioterapia com docetaxel como primeira linha", "E) Braquiterapia isolada sem terapia hormonal"],
      correct_index: 0, topic: "Oncologia", explanation: "Gleason 7 (4+3) é risco intermediário desfavorável (padrão primário 4). Tratamento curativo: prostatectomia radical ou RT com deprivação androgênica. Vigilância ativa é para risco muito baixo/baixo (Gleason ≤ 6).", difficulty: "avançado"
    },
    {
      statement: "Mulher, 45 anos, apresenta nódulo mamário palpável de 2,5 cm em QSE da mama esquerda, detectado há 2 meses. Mamografia: BI-RADS 5. Core biopsy: carcinoma ductal invasivo, RE+, RP+, HER2 negativo, Ki67 15%. Linfonodo axilar clinicamente negativo. USG axilar sem alterações. Qual o estadiamento e tratamento?",
      options: ["A) T2N0M0 (IIA) — cirurgia conservadora + radioterapia + hormonioterapia adjuvante", "B) T1N0M0 — mastectomia radical de Halsted", "C) T2N0M0 — quimioterapia neoadjuvante mandatória antes de qualquer cirurgia", "D) Apenas tamoxifeno por 5 anos sem cirurgia", "E) Radioterapia exclusiva sem abordagem cirúrgica"],
      correct_index: 0, topic: "Oncologia", explanation: "Tumor 2,5 cm (T2), N0 clinicamente: IIA. Luminal A (RE+, HER2-, Ki67 < 20%): cirurgia conservadora + RT adjuvante + hormonioterapia (tamoxifeno ou inibidor de aromatase). QT neoadjuvante não é mandatória em luminal A sem N+.", difficulty: "intermediário"
    },
    {
      statement: "Homem, 70 anos, com sangramento retal intermitente há 4 meses e alteração do hábito intestinal. Colonoscopia: lesão vegetante e ulcerada em sigmoide com 4 cm, biopsia confirma adenocarcinoma moderadamente diferenciado. TC de abdome: sem metástases hepáticas. CEA: 12 ng/mL. Qual a conduta?",
      options: ["A) Sigmoidectomia com ressecção de mesocólon e linfadenectomia + QT adjuvante se N+", "B) Polipectomia endoscópica da lesão", "C) Quimioterapia paliativa com FOLFOX isolado", "D) Radioterapia neoadjuvante longa antes de qualquer cirurgia", "E) Colostomia definitiva sem ressecção do tumor"],
      correct_index: 0, topic: "Oncologia", explanation: "Adenocarcinoma de sigmoide sem metástases: cirurgia com intenção curativa (sigmoidectomia + linfadenectomia). Se N+ na peça: QT adjuvante (FOLFOX ou CAPOX). RT neoadjuvante é para tumores de RETO, não sigmoide.", difficulty: "intermediário"
    },
    {
      statement: "Paciente de 25 anos, sexo masculino, apresenta linfonodomegalia cervical indolor e progressiva há 2 meses, sudorese noturna e perda de 7% do peso corporal. TC: linfonodomegalia mediastinal volumosa. Biópsia excisional de linfonodo: células de Reed-Sternberg em fundo inflamatório polimórfico. PET-CT: captação cervical e mediastinal bilateral. Qual o diagnóstico e estadiamento?",
      options: ["A) Linfoma de Hodgkin clássico, estágio IIB (2 cadeias supradiafragmáticas + sintomas B)", "B) Linfoma não-Hodgkin difuso de grandes células B, estágio IV", "C) Tuberculose ganglionar disseminada", "D) Sarcoidose com acometimento mediastinal", "E) Timoma invasivo com síndrome paraneoplásica"],
      correct_index: 0, topic: "Oncologia", explanation: "Células de Reed-Sternberg = Linfoma de Hodgkin. Linfonodos cervicais + mediastinais = 2 regiões supradiafragmáticas (estágio II). Sintomas B (sudorese + perda > 10% peso): sufixo B. Tratamento: ABVD ± RT.", difficulty: "intermediário"
    },
  ],
  "Neurologia": [
    {
      statement: "Homem, 68 anos, hipertenso e diabético, é trazido ao PS com hemiplegia direita e afasia global de início súbito há 1 hora. Glasgow 12 (O3V2M7 — não localiza dor no membro afetado). NIHSS: 22. PA: 185x100. TC de crânio sem contraste: sem hemorragia, sem sinais precoces de isquemia. Qual a conduta?",
      options: ["A) Trombólise IV com alteplase 0,9 mg/kg (máx 90 mg) em até 4,5 horas do ictus", "B) Anticoagulação plena com heparina não fracionada IV", "C) Reduzir PA para < 120x80 antes de qualquer intervenção", "D) RM de crânio com difusão antes de decidir trombólise", "E) AAS 300 mg via sonda + clopidogrel 300 mg VO"],
      correct_index: 0, topic: "Neurologia", explanation: "AVC isquêmico com < 4,5h, NIHSS alto, TC sem hemorragia: trombólise IV com alteplase. PA < 185x110 é o alvo pré-trombólise (185x100 já está no alvo). RM não é necessária se TC descarta hemorragia.", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 30 anos, apresenta cefaleia intensa holocraniana de início súbito ('a pior da vida'), náuseas, vômitos e rigidez de nuca. Glasgow 15, sem déficits focais. PA 140x90. TC de crânio sem contraste: hiperdensidade em cisterna silviana e inter-hemisférica. Qual o diagnóstico e próximo passo?",
      options: ["A) Hemorragia subaracnoide — angiotomografia ou arteriografia cerebral para identificar aneurisma", "B) Meningite bacteriana — punção lombar e ATB empírico", "C) Cefaleia tensional grave — analgesia com dipirona IV e alta", "D) Trombose venosa cerebral — anticoagulação imediata", "E) Enxaqueca com aura — sumatriptano SC e observação"],
      correct_index: 0, topic: "Neurologia", explanation: "Cefaleia thunderclap + rigidez de nuca + hiperdensidade cisternal na TC: HSA. Próximo passo: angioTC ou arteriografia para localizar aneurisma roto e planejar tratamento (clipagem ou embolização). Se TC negativa e alta suspeita: punção lombar.", difficulty: "intermediário"
    },
    {
      statement: "Adolescente de 16 anos, sem comorbidades, apresenta primeiro episódio de crise convulsiva tônico-clônica generalizada com duração de 2 minutos, seguida de período pós-ictal de 10 minutos com confusão mental. Sem febre, sem TCE, sem uso de drogas. EEG: complexos ponta-onda generalizados a 3 Hz. RM de crânio normal. Qual o diagnóstico provável?",
      options: ["A) Epilepsia generalizada idiopática (ausência juvenil ou EGI) — iniciar valproato ou lamotrigina", "B) Epilepsia do lobo temporal — carbamazepina como primeira escolha", "C) Crise epiléptica provocada — não tratar, apenas observar", "D) Síndrome de West — iniciar ACTH ou vigabatrina", "E) Status epilepticus — diazepam IV imediato"],
      correct_index: 0, topic: "Neurologia", explanation: "Adolescente com crise TCG + EEG com ponta-onda 3 Hz generalizada + RM normal: epilepsia generalizada idiopática. Valproato é primeira escolha (exceto mulheres em idade fértil — considerar lamotrigina). Carbamazepina pode piorar crises generalizadas.", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 28 anos, apresenta episódio de neurite óptica retrobulbar há 6 meses (com recuperação parcial) e agora desenvolve parestesias em membros inferiores, fraqueza para deambular e sinal de Lhermitte positivo. RM de crânio: múltiplas lesões desmielinizantes periventriculares. RM de medula: lesão em C3-C4. LCR: bandas oligoclonais positivas. Qual o diagnóstico?",
      options: ["A) Esclerose múltipla remitente-recorrente — iniciar terapia modificadora de doença", "B) Neuromielite óptica (Devic) — rituximabe como primeira linha", "C) Encefalomielite disseminada aguda (ADEM) — corticoide em pulso", "D) Esclerose lateral amiotrófica — riluzol", "E) Neurossífilis — penicilina G cristalina IV por 14 dias"],
      correct_index: 0, topic: "Neurologia", explanation: "Dois eventos desmielinizantes disseminados no tempo (neurite óptica → mielite) e espaço (lesões periventriculares + medula) + bandas oligoclonais: EM remitente-recorrente (critérios de McDonald). Tratamento: interferon, glatirâmer, fingolimod ou outro DMT.", difficulty: "avançado"
    },
    {
      statement: "Homem, 75 anos, trazido pela família com queixa de tremor em repouso em mão direita há 1 ano, progressivo, associado a rigidez, bradicinesia e instabilidade postural. Marcha em pequenos passos com redução do balanço do braço direito. Sem déficits cognitivos significativos. Qual o diagnóstico e tratamento inicial?",
      options: ["A) Doença de Parkinson — levodopa/carbidopa como primeira linha pela idade e gravidade", "B) Tremor essencial — propranolol 40 mg 2x/dia", "C) Parkinsonismo vascular — antiagregante plaquetário", "D) Atrofia de múltiplos sistemas — não há tratamento", "E) Doença de Wilson — penicilamina e dieta pobre em cobre"],
      correct_index: 0, topic: "Neurologia", explanation: "Tétrade: tremor de repouso + rigidez + bradicinesia + instabilidade postural: Doença de Parkinson. Em paciente > 70 anos, levodopa/carbidopa é primeira escolha (agonistas dopaminérgicos têm mais efeitos adversos em idosos).", difficulty: "intermediário"
    },
  ],
  "Cardiologia": [
    {
      statement: "Homem, 55 anos, tabagista, chega ao PS com dor precordial em aperto há 40 minutos, irradiação para MSE, sudorese e náuseas. ECG: supradesnível de ST ≥ 2 mm em V1-V4 com imagem especular (infradesnível) em D2, D3 e aVF. Troponina I: 0,8 ng/mL (ref < 0,04). Qual o diagnóstico e conduta imediata?",
      options: ["A) IAM com supra de ST anterior — angioplastia primária (ICP) em até 90 minutos", "B) Angina instável — AAS + clopidogrel + enoxaparina e cateterismo eletivo", "C) Pericardite aguda — AINEs + colchicina", "D) Dissecção aórtica aguda — controle pressórico e cirurgia de emergência", "E) TEP maciço — trombólise sistêmica com alteplase"],
      correct_index: 0, topic: "Cardiologia", explanation: "Supra de ST em V1-V4 + troponina elevada: IAMCSST de parede anterior (DA). Tratamento de reperfusão: ICP primária em < 90 min (ideal). Se não disponível em < 120 min: fibrinolítico. MONA (morfina, O2, nitrato, AAS) + clopidogrel/ticagrelor + heparina.", difficulty: "intermediário"
    },
    {
      statement: "Mulher, 72 anos, hipertensa e diabética, apresenta dispneia aos mínimos esforços (CF III NYHA), ortopneia e edema de MMII. ECG: fibrilação atrial com FC 110. Ecocardiograma: FE 30%, VE dilatado, insuficiência mitral moderada. BNP: 1.500. Cr: 1,8. Qual o tratamento farmacológico otimizado para IC com FE reduzida?",
      options: ["A) IECA/BRA + betabloqueador + espironolactona + inibidor de SGLT2 (dapagliflozina)", "B) Digoxina + furosemida como pilares do tratamento", "C) Apenas diurético de alça em dose alta e restrição hídrica", "D) Verapamil para controle de FC da fibrilação atrial", "E) AINEs para alívio da dispneia e edema"],
      correct_index: 0, topic: "Cardiologia", explanation: "ICFEr: pilares do tratamento (os 'Fantastic Four'): IECA ou sacubitril/valsartana + BB (carvedilol/bisoprolol) + antagonista mineralocorticoide (espironolactona) + iSGLT2. Verapamil é contraindicado na ICFEr. AINEs pioram IC.", difficulty: "avançado"
    },
    {
      statement: "Homem, 22 anos, atleta de futebol, apresenta síncope súbita durante treino. ECG pré-participação esportiva prévio mostrava: ondas Q anormais em derivações laterais (D1, aVL, V5-V6), inversão de onda T em V1-V4 e sinais de sobrecarga ventricular esquerda. Ecocardiograma: septo interventricular 22 mm, movimento sistólico anterior da valva mitral (SAM). Qual o diagnóstico?",
      options: ["A) Cardiomiopatia hipertrófica — principal causa de morte súbita em jovens atletas", "B) Comunicação interventricular congênita", "C) Estenose aórtica reumática grave", "D) Coração de atleta fisiológico — sem necessidade de investigação", "E) Miocardite viral aguda"],
      correct_index: 0, topic: "Cardiologia", explanation: "Atleta jovem + síncope + septo > 15 mm + SAM + ECG com ondas Q e inversão de T: CMH. É a principal causa de morte súbita em atletas jovens. Restrição esportiva e avaliar necessidade de CDI (desfibrilador implantável).", difficulty: "avançado"
    },
    {
      statement: "Mulher, 40 anos, procedente da Bahia, com história de febre reumática na infância, apresenta dispneia progressiva, hemoptise e palpitações. Exame: ruflar diastólico em foco mitral, estalido de abertura, P2 hiperfonética. ECG: fibrilação atrial. Ecocardiograma: área valvar mitral 0,9 cm², gradiente médio transmitral 15 mmHg, PSAP 65 mmHg. Qual o diagnóstico e tratamento?",
      options: ["A) Estenose mitral grave reumática — valvoplastia mitral por cateter-balão ou cirurgia valvar", "B) Insuficiência mitral grave — plastia mitral cirúrgica", "C) Prolapso de valva mitral — betabloqueador e observação", "D) Endocardite infecciosa — ATB empírico por 6 semanas", "E) Estenose aórtica grave — troca valvar aórtica (TAVI)"],
      correct_index: 0, topic: "Cardiologia", explanation: "Ruflar diastólico mitral + estalido + FA + área < 1,0 cm²: estenose mitral grave. Etiologia reumática (antecedente + região endêmica). Se anatomia favorável (Wilkins ≤ 8): valvoplastia por balão. Caso contrário: troca valvar cirúrgica.", difficulty: "intermediário"
    },
    {
      statement: "Homem, 50 anos, hipertenso mal controlado, chega ao PS com palpitação de início súbito há 2 horas. ECG: taquicardia com QRS estreito, irregular, sem ondas P definidas, FC 150 bpm. PA 130x85. Sem dispneia ou dor torácica. Sem uso prévio de anticoagulante. Qual a conduta?",
      options: ["A) Controle de frequência com betabloqueador IV + iniciar anticoagulação + avaliar cardioversão", "B) Cardioversão elétrica sincronizada imediata", "C) Adenosina 6 mg IV em bolus rápido", "D) Amiodarona IV em bolus seguida de cardioversão química", "E) Desfibrilação com 200J bifásico imediata"],
      correct_index: 0, topic: "Cardiologia", explanation: "FA de início recente (< 48h), hemodinamicamente estável: controle de FC (BB ou BCC não-diidropiridínico). Anticoagulação é fundamental (CHA2DS2-VASc ≥ 1 aqui: HAS). Se optar por cardioversão: necessário ECO TE se > 48h ou tempo indeterminado. Adenosina é para taquicardia supraventricular paroxística, não FA.", difficulty: "intermediário"
    },
  ],
};

export function getFallbackQuestionsForArea(area: string, count = 5): DiagQuestion[] {
  const bank = FALLBACK_BANK[area];
  if (bank && bank.length > 0) {
    return bank.slice(0, count);
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
