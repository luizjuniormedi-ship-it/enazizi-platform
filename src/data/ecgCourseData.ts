export interface CourseLesson {
  id: string;
  title: string;
  subtitle: string;
  theory: string;
  keyPoints: string[];
  clinicalTip?: string;
  quizImageIds?: string[]; // IDs from medical_images table
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  lessons: CourseLesson[];
}

export interface CourseData {
  id: string;
  title: string;
  description: string;
  category: "ecg" | "rx_torax";
  modules: CourseModule[];
}

export const ecgCourse: CourseData = {
  id: "ecg-interpretation",
  title: "Curso de Eletrocardiograma",
  description: "Domine a interpretação do ECG de 12 derivações — do traçado normal às emergências cardiológicas.",
  category: "ecg",
  modules: [
    {
      id: "ecg-basics",
      title: "Fundamentos do ECG",
      description: "Bases eletrofisiológicas e registro do ECG de 12 derivações.",
      icon: "⚡",
      lessons: [
        {
          id: "ecg-1-1",
          title: "O Sistema de Condução Cardíaco",
          subtitle: "Nó sinusal → Nó AV → Feixe de His → Fibras de Purkinje",
          theory: `## O Coração como Gerador Elétrico

O coração possui um sistema elétrico autônomo que gera e conduz impulsos de forma organizada:

### 1. Nó Sinusal (Sinoatrial — SA)
- **Localização**: junção da veia cava superior com o átrio direito
- **Frequência intrínseca**: 60-100 bpm
- **Função**: marca-passo fisiológico do coração — inicia cada batimento

### 2. Nó Atrioventricular (AV)
- **Localização**: triângulo de Koch, septo interatrial
- **Função**: retarda o impulso (~120-200 ms) → permite enchimento ventricular antes da contração
- **Frequência de escape**: 40-60 bpm

### 3. Feixe de His
- Atravessa o esqueleto fibroso → divide-se em:
  - **Ramo direito**: fino, superficial (vulnerável)
  - **Ramo esquerdo**: espesso, divide-se em fascículo anterior e posterior

### 4. Fibras de Purkinje
- Rede subendocárdica que despolariza os ventrículos de dentro para fora
- Velocidade de condução: ~4 m/s (a mais rápida do coração)

### Hierarquia de Marca-passos
| Estrutura | Frequência | Quando assume? |
|-----------|-----------|----------------|
| Nó SA | 60-100 bpm | Normal (fisiológico) |
| Nó AV | 40-60 bpm | Falha do nó SA |
| His-Purkinje | 20-40 bpm | Bloqueio AV completo |

> **Conceito-chave**: Se o marca-passo superior falha, o inferior assume — mas com frequência menor e QRS mais largo.`,
          keyPoints: [
            "Nó SA é o marca-passo natural (60-100 bpm)",
            "Nó AV retarda o impulso (intervalo PR) para permitir enchimento ventricular",
            "Ramo direito é mais vulnerável a bloqueios por ser fino e superficial",
            "Fibras de Purkinje garantem despolarização ventricular rápida e sincronizada",
          ],
          clinicalTip: "Em um BAVT (bloqueio AV total), o ritmo de escape será tanto mais lento e instável quanto mais distal for a sede do bloqueio. BAV com escape juncional (QRS estreito) é mais estável que escape ventricular (QRS largo).",
        },
        {
          id: "ecg-1-2",
          title: "As Derivações do ECG",
          subtitle: "Plano frontal (DI, DII, DIII, aVR, aVL, aVF) e horizontal (V1-V6)",
          theory: `## As 12 Derivações: Janelas para o Coração

O ECG de 12 derivações registra a atividade elétrica cardíaca de 12 ângulos diferentes.

### Derivações do Plano Frontal (Membros)
Avaliam o coração no plano coronal:

**Bipolares (Einthoven)**:
- **DI**: braço direito → braço esquerdo (0°)
- **DII**: braço direito → perna esquerda (+60°)
- **DIII**: braço esquerdo → perna esquerda (+120°)

**Unipolares aumentadas (Goldberger)**:
- **aVR**: olha o coração "de dentro" (-150°) — normalmente negativa
- **aVL**: parede lateral alta (-30°)
- **aVF**: parede inferior (+90°)

### Derivações Precordiais (Plano Horizontal)
Avaliam o coração no plano transversal:

| Derivação | Posição | Parede |
|-----------|---------|--------|
| **V1** | 4° EIC, borda esternal D | Septo (direito) |
| **V2** | 4° EIC, borda esternal E | Septo |
| **V3** | Entre V2 e V4 | Anterior |
| **V4** | 5° EIC, linha hemiclavicular E | Anterior |
| **V5** | 5° EIC, linha axilar anterior | Lateral |
| **V6** | 5° EIC, linha axilar média | Lateral |

### Territórios Coronarianos
| Parede | Derivações | Artéria |
|--------|-----------|---------|
| Inferior | DII, DIII, aVF | Coronária Direita (CD) |
| Anterior | V1-V4 | Descendente Anterior (DA) |
| Lateral | DI, aVL, V5, V6 | Circunflexa (Cx) |
| Posterior | V7, V8 (espelho V1-V2) | CD ou Cx |
| VD | V3R, V4R | CD proximal |`,
          keyPoints: [
            "DII, DIII, aVF = parede inferior (coronária direita)",
            "V1-V4 = parede anterior (descendente anterior)",
            "DI, aVL, V5-V6 = parede lateral (circunflexa)",
            "aVR é a derivação 'esquecida' mas útil para oclusão de tronco e intoxicações",
          ],
          clinicalTip: "No IAM inferior (supra em DII, DIII, aVF), SEMPRE faça V3R e V4R para avaliar envolvimento de VD — contraindica nitratos e diuréticos!",
        },
        {
          id: "ecg-1-3",
          title: "Ondas, Intervalos e Segmentos",
          subtitle: "P, QRS, T, PR, QT, ST — nomenclatura e valores normais",
          theory: `## Anatomia do Traçado Normal

### Onda P
- **O que representa**: despolarização atrial (AD → AE)
- **Duração normal**: < 120 ms (3 quadradinhos)
- **Amplitude**: < 2,5 mm em DII
- **Morfologia**: arredondada, positiva em DII, negativa em aVR
- **Onda P ausente** → fibrilação atrial, flutter, ritmo juncional

### Intervalo PR
- **O que representa**: tempo do nó SA ao início da despolarização ventricular
- **Normal**: 120-200 ms (3-5 quadradinhos)
- **PR curto (< 120ms)**: pré-excitação (Wolff-Parkinson-White)
- **PR longo (> 200ms)**: BAV 1° grau

### Complexo QRS
- **O que representa**: despolarização ventricular
- **Duração normal**: < 120 ms
- **QRS largo (≥ 120ms)**: bloqueio de ramo, pré-excitação, marca-passo, TV
- Nomenclatura:
  - **Q**: primeira deflexão negativa antes de R
  - **R**: primeira deflexão positiva
  - **S**: deflexão negativa após R

### Segmento ST
- **O que representa**: período entre despolarização e repolarização ventricular
- **Normal**: isoelétrico (no mesmo nível da linha de base)
- **Supradesnivelamento**: IAM com supra (IAMCSST), pericardite, Brugada
- **Infradesnivelamento**: isquemia subendocárdica, efeito digitálico

### Onda T
- **O que representa**: repolarização ventricular
- **Normal**: positiva onde QRS é positivo (concordante)
- **T invertida**: isquemia, sobrecarga, TEP, SCA
- **T apiculada**: hipercalemia (emergência!)

### Intervalo QT
- **Normal**: QTc < 450ms (homens), < 470ms (mulheres)
- **QT longo**: risco de Torsades de Pointes → antiarrítmicos, congênito
- **Fórmula de Bazett**: QTc = QT / √RR`,
          keyPoints: [
            "PR normal: 120-200ms — curto sugere WPW, longo sugere BAV",
            "QRS normal: < 120ms — alargado sugere bloqueio de ramo ou pré-excitação",
            "ST deve ser isoelétrico — supra = IAM/pericardite, infra = isquemia",
            "QTc prolongado = risco de Torsades de Pointes (morte súbita)",
          ],
          clinicalTip: "A hipercalemia é a causa mais importante de T apiculada. Se K+ > 6.5 com alteração de ECG, é EMERGÊNCIA: gluconato de cálcio IV imediatamente, antes de corrigir o potássio.",
        },
      ],
    },
    {
      id: "ecg-rhythm",
      title: "Análise do Ritmo",
      description: "Ritmo sinusal, arritmias atriais, bloqueios AV e taquiarritmias.",
      icon: "💓",
      lessons: [
        {
          id: "ecg-2-1",
          title: "Ritmo Sinusal e Bradicardias",
          subtitle: "Critérios de ritmo sinusal, bradicardia sinusal, parada sinusal",
          theory: `## Ritmo Sinusal Normal — Critérios

Para ser ritmo sinusal, o ECG deve apresentar TODOS os critérios:

1. **Onda P presente** antes de cada QRS
2. **P positiva em DII** e negativa em aVR
3. **Intervalo PR constante** (120-200 ms)
4. **Frequência**: 60-100 bpm
5. **Intervalo RR regular** (variação < 10%)

### Cálculo da Frequência Cardíaca
- **Ritmo regular**: 300 ÷ nº de quadradões entre dois R-R
  - 1 quadradão = 300 bpm
  - 2 = 150 bpm
  - 3 = 100 bpm
  - 4 = 75 bpm
  - 5 = 60 bpm
- **Ritmo irregular**: contar QRS em 6 segundos (30 quadradões) × 10

### Bradicardia Sinusal
- FC < 60 bpm com ritmo sinusal normal
- **Fisiológica**: atletas, sono, vagotonia
- **Patológica**: hipotireoidismo, hipertensão intracraniana, IAM inferior
- **Tratamento**: atropina 0,5mg IV (se sintomática)

### Parada Sinusal
- Pausa > 2x o intervalo PP normal
- Diferente do BAV: não há onda P durante a pausa

### Doença do Nó Sinusal (Síndrome Taqui-Bradi)
- Alternância entre bradicardia sinusal e taquiarritmias atriais
- Frequentemente necessita marca-passo + antiarrítmico`,
          keyPoints: [
            "Ritmo sinusal: P+ em DII, PR constante, FC 60-100",
            "300/nº quadradões = FC no ritmo regular",
            "Bradicardia sinusal em atletas é fisiológica",
            "Atropina é a droga de primeira linha na bradicardia sintomática",
          ],
          clinicalTip: "No IAM inferior, a bradicardia é frequente por reflexo de Bezold-Jarisch (vagal). Geralmente é transitória e responde bem à atropina. Evite marca-passo provisório nas primeiras horas.",
        },
        {
          id: "ecg-2-2",
          title: "Fibrilação e Flutter Atrial",
          subtitle: "As arritmias supraventriculares mais comuns na prática",
          theory: `## Fibrilação Atrial (FA)

A arritmia sustentada mais comum na prática clínica.

### Diagnóstico no ECG
- **Ausência de onda P** → substituída por ondas "f" (fibrilatórias)
- **Intervalo RR irregularmente irregular** (marca registrada!)
- **Frequência atrial**: 350-600/min
- **Resposta ventricular**: variável

### Classificação
| Tipo | Duração | Conduta |
|------|---------|---------|
| Paroxística | < 7 dias | Controle de FC ± cardioversão |
| Persistente | > 7 dias | Cardioversão eletiva |
| Permanente | Aceita pelo médico | Controle de FC apenas |

### Risco Tromboembólico — CHA₂DS₂-VASc
| Fator | Pontos |
|-------|--------|
| **C** — ICC/FE < 40% | 1 |
| **H** — Hipertensão | 1 |
| **A₂** — Age ≥ 75 | 2 |
| **D** — Diabetes | 1 |
| **S₂** — Stroke/AIT prévio | 2 |
| **V** — Doença vascular | 1 |
| **A** — Age 65-74 | 1 |
| **Sc** — Sexo feminino | 1 |

- **≥ 2 (homens) ou ≥ 3 (mulheres)**: anticoagulação plena
- **DOAC** preferido sobre varfarina (exceto valva mecânica/estenose mitral moderada-grave)

---

## Flutter Atrial

### Diagnóstico no ECG
- **Ondas F** (flutter) em "dente de serra" — melhor vistas em DII, DIII, aVF e V1
- **Frequência atrial**: ~300/min
- **Condução AV** geralmente 2:1 → FC ~150 bpm
- RR regular (diferente da FA)

### Pérola de Prova
> Toda taquicardia com FC ~150 bpm é flutter atrial até que se prove o contrário!

### Tratamento
- **Instável**: cardioversão elétrica sincronizada (50-100J)
- **Estável**: ablação por radiofrequência (tratamento definitivo, alta taxa de sucesso)`,
          keyPoints: [
            "FA = RR irregular + ausência de onda P",
            "Flutter = ondas F em dente de serra + FC ~150 bpm (condução 2:1)",
            "CHA₂DS₂-VASc define necessidade de anticoagulação na FA",
            "FC ~150 bpm = pensar em flutter atrial 2:1",
          ],
          clinicalTip: "Nunca cardioverta FA com > 48h sem anticoagulação prévia (3 semanas) ou eco transesofágico para excluir trombo atrial. O risco de AVC embólico é real!",
        },
        {
          id: "ecg-2-3",
          title: "Bloqueios Atrioventriculares",
          subtitle: "BAV 1°, 2° (Mobitz I e II) e 3° grau (BAVT)",
          theory: `## Bloqueios AV — Classificação

### BAV de 1° Grau
- **PR > 200 ms** (> 5 quadradinhos), constante
- Toda onda P conduz → nenhum QRS "cai"
- Geralmente benigno, não requer tratamento
- Causas: vagotonia, betabloqueadores, digitálicos

### BAV de 2° Grau — Mobitz I (Wenckebach)
- **PR progressivamente maior** até que um QRS "cai" (P bloqueada)
- Padrão cíclico: PR curto → PR médio → PR longo → QRS cai → recomeça
- **Sede**: nó AV (supra-hissiano)
- Geralmente **benigno** — comum no IAM inferior
- Raramente necessita marca-passo

### BAV de 2° Grau — Mobitz II
- **PR constante** com queda súbita e inesperada de QRS
- **Sede**: infra-hissiano (His-Purkinje)
- **GRAVE**: alto risco de progressão para BAVT
- **SEMPRE** indica marca-passo

> **Mnemônico**: Mobitz **I** = **I**nocente (geralmente). Mobitz **II** = marca-passo **II**mediatamente.

### BAV de 3° Grau (Total — BAVT)
- **Dissociação AV completa**: P e QRS "andam" independentes
- Frequência atrial > frequência ventricular
- **Escape juncional** (QRS estreito, FC 40-60) = mais estável
- **Escape ventricular** (QRS largo, FC 20-40) = instável, urgência!
- **Tratamento**: marca-passo definitivo

### Resumo Visual
| Tipo | PR | QRS cai? | Gravidade |
|------|-----|----------|-----------|
| BAV 1° | > 200ms, fixo | Nunca | Benigno |
| Mobitz I | Progressivo | Sim, cíclico | Geralmente benigno |
| Mobitz II | Fixo | Sim, súbito | Grave → MP |
| BAVT | Dissociado | Dissociação AV | Grave → MP |`,
          keyPoints: [
            "BAV 1° = PR longo mas constante, benigno",
            "Mobitz I = PR que alonga progressivamente até P bloqueada",
            "Mobitz II = PR fixo com bloqueio súbito — indica marca-passo",
            "BAVT = dissociação AV completa — sempre indica marca-passo",
          ],
          clinicalTip: "No PS, se você identificar Mobitz II ou BAVT, solicite marca-passo transcutâneo imediatamente enquanto aguarda o transvenoso. Atropina pode piorar o Mobitz II (aumenta frequência atrial sem melhorar a condução infra-hissiana).",
        },
      ],
    },
    {
      id: "ecg-ischemia",
      title: "Isquemia e Infarto",
      description: "Padrões de SCA, localização do IAM e critérios de reperfusão.",
      icon: "🫀",
      lessons: [
        {
          id: "ecg-3-1",
          title: "Síndromes Coronarianas Agudas no ECG",
          subtitle: "IAMCSST vs IAMSSST — quando ativar a hemodinâmica",
          theory: `## Espectro da SCA no ECG

### Evolução Temporal do IAM com Supra
1. **Hiperagudo** (minutos): T apiculadas e simétricas ("T hiperagudas")
2. **Agudo** (horas): supradesnivelamento de ST convexo
3. **Subagudo** (dias): aparecimento de onda Q patológica + inversão de T
4. **Crônico** (semanas): onda Q persiste, ST normaliza, T pode normalizar

### Critérios de Supra de ST (IAMCSST)
- **Supra ≥ 1mm** em ≥ 2 derivações contíguas
- **Exceções**:
  - V2-V3 homens < 40 anos: supra ≥ 2,5 mm
  - V2-V3 homens ≥ 40 anos: supra ≥ 2 mm
  - V2-V3 mulheres: supra ≥ 1,5 mm

### Localização do IAM
| Parede | Derivações | Artéria | Espelho |
|--------|-----------|---------|---------|
| Anterior extenso | V1-V6 + DI, aVL | DA proximal | Inferior |
| Anterosseptal | V1-V4 | DA | — |
| Lateral | DI, aVL, V5-V6 | Cx | — |
| Inferior | DII, DIII, aVF | CD (85%) | DI, aVL |
| VD | V3R, V4R | CD proximal | — |
| Posterior | V7-V9 | CD/Cx | V1-V2 (R alta) |

### IAMSSST / Angina Instável
- **Infra de ST** ≥ 0,5 mm em ≥ 2 derivações contíguas
- **Inversão de onda T** profunda e simétrica
- ECG pode ser **normal** em 30-50% dos casos!
- Diagnóstico = ECG + troponina + clínica

### Padrão de Wellens
- T bifásica (tipo A) ou profundamente invertida (tipo B) em V2-V3
- Sugere **estenose crítica da DA** (pré-infarto)
- Contraindicação a teste de esforço!

### Sinal de De Winter
- Infra de ST ascendente com T apiculada em precordiais
- Equivalente de IAMCSST → ativar hemodinâmica!`,
          keyPoints: [
            "Supra ≥ 1mm em 2 derivações contíguas = IAMCSST (critério geral)",
            "IAM inferior: sempre fazer V3R/V4R e V7-V9",
            "Wellens (T invertida em V2-V3) = estenose crítica de DA, contraindica teste de esforço",
            "De Winter = equivalente de IAMCSST, ativar hemodinâmica",
          ],
          clinicalTip: "O 'espelho' (imagem recíproca) ajuda a confirmar o IAM. No IAM inferior, procure infra em DI e aVL. Quanto mais derivações com alteração e maior o supra, maior a área de necrose e pior o prognóstico.",
        },
      ],
    },
    {
      id: "ecg-special",
      title: "Padrões Especiais",
      description: "Sobrecargas, bloqueios de ramo, WPW, Brugada e distúrbios eletrolíticos.",
      icon: "🔬",
      lessons: [
        {
          id: "ecg-4-1",
          title: "Bloqueios de Ramo",
          subtitle: "BRD e BRE — padrão rSR' e critérios diagnósticos",
          theory: `## Bloqueio de Ramo Direito (BRD)

### Critérios
1. **QRS ≥ 120 ms**
2. **rSR'** (ou rsR') em V1-V2 ("orelhas de coelho")
3. **S empastado** em DI, V5-V6
4. T inversão secundária em V1-V2

### Causas
- Cardiopatia isquêmica, TEP, CIA, cor pulmonale
- Pode ser **benigno** em jovens (BRD isolado)

---

## Bloqueio de Ramo Esquerdo (BRE)

### Critérios
1. **QRS ≥ 120 ms**
2. **R alargado** (ou RR') em DI, aVL, V5-V6
3. **Ausência de Q** em DI, V5-V6
4. **QS ou rS** em V1-V2
5. T inversão secundária em V5-V6

### Importância Clínica
- BRE **NOVO** em contexto de dor torácica = equivalente de IAMCSST → cateterismo!
- **Critérios de Sgarbossa** para diagnosticar IAM na presença de BRE:
  - Supra de ST ≥ 1mm concordante com QRS (5 pontos) ✓
  - Infra de ST ≥ 1mm em V1-V3 (3 pontos) ✓
  - Supra de ST ≥ 5mm discordante do QRS (2 pontos)
  - **≥ 3 pontos** = IAM provável

### Mnemônico — "WiLLiaM MaRRoW"
- **WiLLiaM** = W em V1 + M em V6 = **BRE**
- **MaRRoW** = M em V1 + W em V6 = **BRD**`,
          keyPoints: [
            "BRD: rSR' em V1 ('orelhas de coelho') + S largo em V6",
            "BRE: R largo em V6 + QS em V1",
            "BRE novo + dor torácica = equivalente IAMCSST",
            "WiLLiaM = BRE, MaRRoW = BRD",
          ],
          clinicalTip: "No BRE, a repolarização é discordante do QRS (esperado). Se a repolarização for concordante (supra na mesma direção do QRS), suspeite de IAM — aplique critérios de Sgarbossa modificados.",
        },
        {
          id: "ecg-4-2",
          title: "Sobrecargas Atriais e Ventriculares",
          subtitle: "Critérios de SAE, SAD, SVE e SVD",
          theory: `## Sobrecargas Atriais

### Sobrecarga Atrial Direita (SAD)
- **P apiculada ≥ 2,5 mm** em DII ("P pulmonale")
- P predominantemente positiva em V1
- Causas: DPOC, TEP, estenose tricúspide, hipertensão pulmonar

### Sobrecarga Atrial Esquerda (SAE)
- **P com duração > 120ms** em DII
- **P bifásica em V1** com componente negativo > 1mm de profundidade e > 40ms
- P entalhada em DII ("P mitrale")
- Causas: estenose mitral, HAS, miocardiopatia

---

## Sobrecargas Ventriculares

### Sobrecarga Ventricular Esquerda (SVE) — Critérios de Sokolow-Lyon
- **S em V1 + R em V5 ou V6 ≥ 35 mm**
- R em aVL ≥ 11 mm
- Strain: infra de ST + T invertida assimétrica em V5-V6

### Critério de Cornell
- **R em aVL + S em V3 > 28 mm (homens)** ou > 20 mm (mulheres)

### Sobrecarga Ventricular Direita (SVD)
- **R > S em V1** (relação R/S > 1)
- Desvio do eixo para a direita (> +90°)
- Strain de VD: infra de ST + T invertida em V1-V3
- P pulmonale associada
- Causas: TEP, estenose mitral, DPOC, hipertensão pulmonar`,
          keyPoints: [
            "SAD = P pulmonale (P > 2,5mm em DII)",
            "SAE = P mitrale (P > 120ms, bifásica em V1)",
            "SVE: Sokolow (S V1 + R V5/V6 ≥ 35mm) ou Cornell",
            "SVD: R > S em V1 + desvio de eixo para direita",
          ],
          clinicalTip: "SVE com 'strain' (infra de ST + T invertida em V5-V6) indica sobrecarga severa e é fator de risco cardiovascular independente. Não confundir com isquemia!",
        },
        {
          id: "ecg-4-3",
          title: "ECG nos Distúrbios Eletrolíticos",
          subtitle: "Hiper/hipocalemia, hiper/hipocalcemia — emergências no ECG",
          theory: `## Potássio — O Íon Mais Importante no ECG

### Hipercalemia (K+ > 5.5 mEq/L)
Progressão das alterações com o aumento do K+:
1. **K+ 5.5-6.5**: T apiculadas e simétricas (mais precoce)
2. **K+ 6.5-7.5**: achatamento de P + PR alargado
3. **K+ 7.5-8.0**: QRS alargado
4. **K+ > 8.0**: padrão sinusoidal → FV → assistolia

> **EMERGÊNCIA**: K+ > 6.5 com alterações de ECG → gluconato de cálcio 10% IV imediato!

### Hipocalemia (K+ < 3.5 mEq/L)
1. Achatamento/inversão de T
2. Aparecimento de **onda U** (após T)
3. Infra de ST
4. Prolongamento de QT
5. K+ < 2.5: risco de arritmias graves (Torsades)

---

## Cálcio

### Hipercalcemia (Ca > 10.5)
- **QT curto** (encurtamento de ST)
- Onda T pode ficar apiculada
- Bradicardia
- Causa: hiperparatireoidismo, neoplasias

### Hipocalcemia (Ca < 8.5)
- **QT longo** (prolongamento de ST)
- Risco de Torsades de Pointes
- Causa: hipoparatireoidismo, pancreatite, IRC

### Mnemônico dos Eletrólitos
> "**Hiper K = T de ponta** (apiculada), **Hipo K = U de sobra** (onda U)"
> "**Hiper Ca = QT curto**, **Hipo Ca = QT longo**"`,
          keyPoints: [
            "Hipercalemia: T apiculada → P achatada → QRS largo → sinusoidal",
            "Hipocalemia: T achatada + onda U proeminente + QT longo",
            "Hipercalcemia: QT curto",
            "Hipocalcemia: QT longo → risco de Torsades",
          ],
          clinicalTip: "Na emergência com ECG sinusoidal, trate como hipercalemia até prova em contrário: gluconato de cálcio 10mL a 10% IV em 2-3 min. Estabiliza a membrana em segundos enquanto você aguarda o resultado do potássio.",
        },
      ],
    },
  ],
};

export const rxCourse: CourseData = {
  id: "rx-torax-interpretation",
  title: "Curso de Raio-X de Tórax",
  description: "Domine a interpretação sistemática do RX de tórax — da técnica às patologias mais cobradas em prova.",
  category: "rx_torax",
  modules: [
    {
      id: "rx-basics",
      title: "Fundamentos do RX de Tórax",
      description: "Técnica, incidências e anatomia radiológica normal.",
      icon: "📷",
      lessons: [
        {
          id: "rx-1-1",
          title: "Técnica e Qualidade do RX",
          subtitle: "PA vs AP, critérios de qualidade ABCDE",
          theory: `## Incidências do RX de Tórax

### PA (Póstero-Anterior) — Padrão
- Raios entram pelas **costas**, saem pelo peito → filme anterior
- **Vantagem**: silhueta cardíaca em tamanho real (sem magnificação)
- Paciente em **ortostase**, inspiração profunda
- É o RX "ideal" — solicite sempre que possível

### AP (Ântero-Posterior) — Leito
- Raios entram pelo peito → película posterior
- **Problema**: coração parece MAIOR (magnificação ~20%)
- Usado em pacientes acamados/UTI
- Não avalie cardiomegalia em AP!

### Perfil (Lateral)
- Complementar ao PA para avaliar:
  - Lesões retrocardíacas
  - Derrames loculados
  - Linfonodos hilares

---

## Critérios de Qualidade — Mnemônico "ABCDE"

### A — Adequação (Alinhamento)
- Processos espinhosos entre as clavículas (sem rotação)
- Se clavícula D mais próxima da linha média → rotado para E

### B — Brilho (Exposição/Penetração)
- Ideal: ver corpos vertebrais atrás do coração
- Muito claro (hiperpenetrado) → perde detalhes pulmonares
- Muito escuro (hipopenetrado) → falsa opacidade

### C — Cobertura
- Incluir ápices pulmonares até seios costofrênicos
- Incluir partes moles laterais

### D — Dispositivos
- Identificar: TOT, cateter venoso central, dreno, marca-passo, sonda

### E — Expansão (Inspiração)
- Ideal: contar **6 arcos costais anteriores** ou 9-10 posteriores acima do diafragma
- < 6 arcos = hiperinsuflação ou inspiração inadequada`,
          keyPoints: [
            "PA é o padrão — AP magnifica o coração (não avalie ICT em AP)",
            "Sem rotação: espinhosos centrados entre as clavículas",
            "Boa inspiração: 6 arcos costais anteriores visíveis",
            "Sempre procure dispositivos médicos antes de interpretar",
          ],
          clinicalTip: "Antes de laudar 'cardiomegalia', confirme que o RX é PA. No AP de leito, o coração pode parecer aumentado mesmo sendo normal. Correlacione com ecocardiograma quando em dúvida.",
        },
        {
          id: "rx-1-2",
          title: "Anatomia Radiológica Normal",
          subtitle: "Silhueta cardíaca, mediastino, hilos, parênquima, pleura",
          theory: `## Roteiro Sistemático de Leitura

### 1. Partes Moles e Ossos
- Enfisema subcutâneo (ar nos tecidos moles)
- Fraturas costais (trauma)
- Lesões líticas/blásticas (metástases)
- Mastectomia (assimetria de partes moles)

### 2. Mediastino
**Superior**: traqueia (centralizada), grandes vasos
**Anterior**: timo (crianças), tireoide retroesternal, linfoma, teratoma ("4 T's")
**Médio**: coração, grandes vasos, linfonodos hilares
**Posterior**: esôfago, aorta descendente, coluna

### 3. Silhueta Cardíaca
- **Borda direita**: AD (átrio direito) + VCS
- **Borda esquerda** (de cima para baixo):
  1. Botão aórtico
  2. Tronco da artéria pulmonar
  3. Aurícula do AE
  4. VE (ventrículo esquerdo)
- **ICT** (índice cardiotorácico): diâmetro cardíaco / diâmetro torácico
  - Normal: **< 0,50** (apenas em PA!)

### 4. Hilos Pulmonares
- Hilo E normalmente mais alto que o D (1-3cm)
- Compostos por artérias e veias pulmonares + brônquios + linfonodos
- Hilo aumentado: hipertensão pulmonar, linfadenopatia, massa

### 5. Parênquima Pulmonar
- Compare os dois lados sistematicamente
- Ápices, terço médio, bases
- Padrão alveolar (opacidade com broncograma aéreo)
- Padrão intersticial (reticular, nodular, reticulonodular)

### 6. Pleura e Diafragma
- Seios costofrênicos devem ser **agudos** (livres)
- Velamento = derrame pleural (> 200mL para ser visível em PA)
- Hemidiafragma D normalmente mais alto que E (fígado)
- Retificação: hiperinsuflação (DPOC, asma)`,
          keyPoints: [
            "ICT < 0.50 é normal (apenas em PA!)",
            "Borda E: botão aórtico → AP → aurícula AE → VE",
            "Hilo E mais alto que D é normal",
            "Seios costofrênicos agudos = normais; velados = derrame",
          ],
          clinicalTip: "O 'sinal da silhueta' é um dos mais úteis: se uma opacidade apaga a borda do coração, ela está no mesmo plano (anterior/língula). Se apaga o diafragma, está na base posterior. Use para localizar lesões!",
        },
      ],
    },
    {
      id: "rx-pathology",
      title: "Patologias Essenciais",
      description: "Pneumonia, derrame, pneumotórax, IC, DPOC, TB e mais.",
      icon: "🫁",
      lessons: [
        {
          id: "rx-2-1",
          title: "Pneumonia e Consolidação",
          subtitle: "Padrão alveolar, broncograma aéreo, tipos de pneumonia",
          theory: `## Consolidação Pulmonar

### Padrão Alveolar — Características
- **Opacidade homogênea** (branca) com limites mal definidos
- **Broncograma aéreo**: ar nos brônquios visível dentro da opacidade
- **Sinal da silhueta**: apagamento da estrutura adjacente (coração, diafragma)
- **Tendência a confluência**: coalescência de opacidades

### Pneumonia Lobar (Típica)
- **Agente**: Streptococcus pneumoniae (mais comum)
- **RX**: consolidação homogênea respeitando cisuras
- **Sinal**: broncograma aéreo positivo
- Exemplo: opacidade densa no lobo inferior direito com limite na cisura horizontal

### Broncopneumonia (Atípica)
- **Agentes**: Mycoplasma, vírus, Legionella
- **RX**: infiltrado intersticial difuso ou opacidades multifocais
- **Padrão**: reticular ou reticulonodular, bilateral
- Pode ter derrame pleural associado

### Pneumonia Redonda
- Opacidade esférica bem definida — DD com nódulo/massa
- Mais comum em crianças
- Geralmente pneumocócica

### Complicações
- **Derrame parapneumônico**: velamento costofrênico → Laurell > 1cm → punção
- **Empiema**: derrame septado, espessamento pleural
- **Abscesso**: cavitação com nível hidroaéreo
- **Pneumatocele**: cavidade de paredes finas (pós-estafilocócica)`,
          keyPoints: [
            "Consolidação = opacidade + broncograma aéreo + sinal da silhueta",
            "Pneumonia lobar (S. pneumoniae): consolidação homogênea com cisuras preservadas",
            "Broncopneumonia: infiltrado difuso, bilateral, padrão intersticial",
            "Derrame parapneumônico com Laurell > 1cm → puncionar",
          ],
          clinicalTip: "Pneumonia de lobo superior direito com abaulamento da cisura horizontal ('sinal do lobo pesado') sugere Klebsiella pneumoniae — comum em etilistas e diabéticos. Alta mortalidade, iniciar ATB agressivo!",
        },
        {
          id: "rx-2-2",
          title: "Derrame Pleural",
          subtitle: "Sinais radiológicos, classificação, incidência de Laurell",
          theory: `## Derrame Pleural no RX

### Quantidade Mínima para Detecção
- **PA em ortostase**: > 200-300 mL
- **Perfil**: > 50 mL (mais sensível)
- **Laurell (decúbito lateral)**: > 10 mL
- **USG**: > 5 mL (mais sensível de todos)

### Sinais Radiológicos
1. **Velamento do seio costofrênico** (sinal mais precoce em PA)
2. **Menisco** (curva de Damoiseau): concavidade superior, mais alta lateralmente
3. **Opacificação homogênea** da base com desvio do mediastino para o lado oposto (se volumoso)
4. **Hemitórax opaco**: derrame maciço → desvio contralateral

### Classificação pela Incidência de Laurell
| Espessura em Laurell | Classificação | Conduta |
|---------------------|---------------|---------|
| < 1 cm | Pequeno | Observar |
| 1-5 cm | Moderado | Considerar punção |
| > 5 cm | Grande | Punção + drenagem |

### Transudato vs Exsudato (Critérios de Light)
É **exsudato** se qualquer UM dos critérios:
- Proteína líquido/sérica > 0,5
- LDH líquido/sérica > 0,6
- LDH líquido > 2/3 do limite superior sérico

### Causas Principais
| Transudato | Exsudato |
|-----------|----------|
| ICC (mais comum!) | Pneumonia/parapneumônico |
| Cirrose/ascite | TB pleural |
| Síndrome nefrótica | Neoplasia |
| Diálise peritoneal | TEP |`,
          keyPoints: [
            "PA detecta derrame > 200mL; perfil > 50mL; USG > 5mL",
            "Curva de Damoiseau: concavidade superior, maior lateralmente",
            "Laurell > 1cm → puncionar para análise",
            "Critérios de Light: qualquer 1 positivo = exsudato",
          ],
          clinicalTip: "Derrame pleural unilateral ESQUERDO em paciente com dor torácica — pense em dissecção de aorta (hemotórax) ou perfuração esofágica (mediastinite). Não é 'só um derrame' — pode ser emergência cirúrgica!",
        },
        {
          id: "rx-2-3",
          title: "Pneumotórax",
          subtitle: "Simples, hipertensivo, tipos e conduta",
          theory: `## Pneumotórax no RX

### Diagnóstico Radiológico
- **Linha pleural visceral** visível: fina linha branca separada da parede
- **Ausência de trama vascular** além da linha pleural
- Melhor visualizado em **expiração** (pulmão menor, pneumotórax mais evidente)
- Pode ser sutil — procure no ápice!

### Classificação por Tamanho
| Tamanho | Critério (BTS) | Conduta |
|---------|---------------|---------|
| Pequeno | < 2 cm do ápice à cúpula | Observação + O₂ |
| Grande | ≥ 2 cm | Drenagem torácica |

### Pneumotórax Hipertensivo — EMERGÊNCIA
- **Diagnóstico CLÍNICO** (não espere RX!)
- Sinais: hipotensão + dispneia + desvio de traqueia contralateral + turgência jugular + MV abolido
- RX (se feito): desvio mediastinal contralateral + rebaixamento do diafragma ipsilateral
- **Tratamento IMEDIATO**: punção descompressiva no 2° EIC na linha hemiclavicular → depois drenagem

### Tipos de Pneumotórax
| Tipo | Causa | Perfil |
|------|-------|--------|
| Primário espontâneo | Ruptura de bolha subpleural | Homem jovem, longilíneo, tabagista |
| Secundário | DPOC, TB, fibrose cística | Pneumopatia prévia |
| Traumático | Trauma torácico | Fratura de costela |
| Iatrogênico | Punção venosa central, biópsia | Procedimento médico |
| Catamenial | Endometriose torácica | Mulher, relacionado à menstruação |

### Hidropneumotórax
- Ar + líquido no espaço pleural
- **Nível hidroaéreo** retilíneo no RX (patognomônico)
- Causas: trauma, fístula broncopleural, empiema com fístula`,
          keyPoints: [
            "Linha pleural visceral + ausência de trama = pneumotórax",
            "Pneumotórax hipertensivo: diagnóstico CLÍNICO, não radiológico",
            "Punção descompressiva: 2° EIC, linha hemiclavicular",
            "Pneumotórax primário: homem jovem, magro, alto, tabagista",
          ],
          clinicalTip: "No pneumotórax hipertensivo, NÃO espere o RX! Se o paciente está instável com MV abolido unilateral e turgência jugular, puncione imediatamente com jelco 14G no 2° EIC. O RX é para depois da estabilização.",
        },
        {
          id: "rx-2-4",
          title: "Insuficiência Cardíaca no RX",
          subtitle: "Congestão pulmonar, edema, redistribuição de fluxo",
          theory: `## Sinais de IC no RX de Tórax

### Progressão dos Sinais (conforme PVC aumenta)

#### Estágio 1 — Redistribuição de Fluxo (PCP 12-18 mmHg)
- **Cefalização vascular**: vasos dos ápices calibrosos (normalmente finos)
- Inversão do padrão vascular: ápices > bases

#### Estágio 2 — Edema Intersticial (PCP 18-25 mmHg)
- **Linhas B de Kerley**: linhas horizontais finas (1-2 cm) nas bases
- **Borramento peribroncovascular**: espessamento de paredes brônquicas
- **Espessamento de cisuras**: líquido nas cisuras interlobares
- **Cuffing peribronquial**: halo ao redor dos brônquios

#### Estágio 3 — Edema Alveolar (PCP > 25 mmHg)
- **Opacidade bilateral em "asa de borboleta"** (perihilar)
- **Consolidação alveolar difusa**: broncograma aéreo pode estar presente
- **Derrame pleural bilateral** (mais à direita — anatomia do ducto torácico)

### Outros Sinais de IC
- **Cardiomegalia**: ICT > 0,50 em PA
- **Derrame pleural**: bilateral (75%), isolado à D (15%), isolado à E (10%)
- **Aumento do pedículo vascular**: > 70 mm sugere hipervolemia

### Mnemônico — "ABCDE" da IC no RX
- **A** — Alveolar edema (asa de borboleta)
- **B** — B-lines de Kerley
- **C** — Cardiomegalia
- **D** — Derrame pleural
- **E** — Equalização (cefalização) dos vasos`,
          keyPoints: [
            "Cefalização vascular é o sinal mais precoce de congestão",
            "Linhas B de Kerley = edema intersticial",
            "Asa de borboleta = edema alveolar (PCP > 25 mmHg)",
            "Derrame na IC: bilateral (75%), mais à direita",
          ],
          clinicalTip: "Derrame pleural isolado à ESQUERDA em suposta IC é atípico — pense em outras causas (TB, neoplasia, TEP). O derrame da IC é geralmente bilateral ou isolado à direita pelo trajeto anatômico do ducto torácico.",
        },
      ],
    },
    {
      id: "rx-advanced",
      title: "Diagnósticos Avançados",
      description: "TB, nódulos, TEP, mediastino e armadilhas de prova.",
      icon: "🎯",
      lessons: [
        {
          id: "rx-3-1",
          title: "Tuberculose Pulmonar",
          subtitle: "Padrões radiológicos da TB primária, pós-primária e miliar",
          theory: `## TB no RX de Tórax

### TB Primária (Primo-infecção)
- **Complexo de Ranke**: nódulo parenquimatoso + linfadenopatia hilar
- Mais comum em **crianças**
- Opacidade em qualquer lobo (não tem predileção)
- Linfadenopatia hilar **unilateral** é a apresentação mais frequente
- Geralmente autolimitada

### TB Pós-Primária (Reativação)
- **Localização clássica**: segmentos apicais e posteriores dos lobos superiores
- **Padrões**:
  - Infiltrado fibronodular em ápices
  - **Cavitação** (paredes espessas, irregulares) — forma mais bacilífera!
  - Consolidação com broncograma aéreo
  - Disseminação broncogênica: nódulos acinares ("árvore em brotamento" na TC)
- **Sequelas**: fibrose, retração, bronquiectasias, calcificações

### TB Miliar
- **Micronódulos difusos** (1-3 mm), uniformes, bilaterais
- Padrão "grãos de areia" distribuídos uniformemente
- Disseminação hematogênica
- Mais comum em imunossuprimidos (HIV, corticoterapia)
- Pode ter RX normal inicialmente!

### TB Pleural
- Derrame pleural unilateral (geralmente)
- Exsudato com **predomínio linfocítico**
- ADA > 40 U/L = fortemente sugestivo
- Mais comum em adultos jovens

### Diagnósticos Diferenciais
- Cavitação apical: TB, abscesso, Wegener, carcinoma escamoso, aspergiloma
- TB miliar: histoplasmose, sarcoidose, metástases (tireoide, melanoma)`,
          keyPoints: [
            "TB primária: complexo de Ranke (nódulo + linfonodomegalia hilar)",
            "TB pós-primária: cavitação em ápices dos lobos superiores",
            "TB miliar: micronódulos difusos bilaterais ('grãos de areia')",
            "ADA > 40 U/L no líquido pleural = fortemente sugestivo de TB",
          ],
          clinicalTip: "Paciente com HIV e CD4 > 350 tem TB com apresentação radiológica 'clássica' (cavitação apical). Com CD4 < 200, a TB é 'atípica' — infiltrados difusos, adenopatia hilar, padrão miliar, ou até RX normal com baciloscopia positiva.",
        },
      ],
    },
  ],
};
