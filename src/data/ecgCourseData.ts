export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  subtitle: string;
  theory: string;
  keyPoints: string[];
  clinicalTip?: string;
  images?: { src: string; caption: string }[];
  quiz?: QuizQuestion[];
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
      description: "Bases eletrofisiológicas, sistema de condução e registro do ECG de 12 derivações.",
      icon: "⚡",
      lessons: [
        {
          id: "ecg-1-1",
          title: "O Sistema de Condução Cardíaco",
          subtitle: "Nó sinusal → Nó AV → Feixe de His → Fibras de Purkinje → Vias Acessórias",
          theory: `## O Coração como Gerador Elétrico

O coração não é um órgão que funciona de forma anárquica. Ele é estruturado de modo que a contração cardíaca aconteça direcionando o fluxo de sangue. Para isso, a corrente elétrica — a **onda de despolarização** — deve seguir uma sequência temporal e espacial adequada. O estímulo elétrico tem um local para ser gerado e um caminho a ser percorrido: é o **sistema de condução cardíaco**.

### 1. Nó Sinusal (Sinoatrial — NSA)
- **Localização**: região lateral da parede posterior do átrio direito, na junção com a veia cava superior
- **Frequência intrínseca**: 60-100 bpm
- **Função**: marca-passo fisiológico — suas células possuem a **maior frequência de despolarização** automática
- **Paradoxo importante**: apesar de maior automatismo, a velocidade de condução dentro do NSA é **relativamente lenta**
- **Conceito-chave**: células com maior automatismo conduzem mais lentamente, e vice-versa

### 2. Feixes Atriais Internodais
- Três feixes responsáveis pela condução nos átrios: **anterior, médio e posterior**
- O feixe internodal anterior possui o **feixe de Bachmann**, que conduz o impulso ao átrio esquerdo
- A condução sinoventricular é quase independente da ativação dos miócitos atriais, graças a estes feixes

### 3. Nó Atrioventricular (NAV)
- **Localização**: próximo ao óstio do seio coronariano (triângulo de Koch)
- **Frequência de escape**: 40-60 bpm
- **Função dupla**:
  1. **Retardar a condução** AV (~120-200 ms) → permite que a contração atrial preceda a ventricular
  2. **Filtrar taquiarritmias atriais** → protege os ventrículos (condução decremental)
- **Condução decremental**: à medida que o estímulo alcança o NAV, a eficácia da propagação cai progressivamente

### 4. Sistema His-Purkinje (SHP)
- Origina-se do NAV com células orientadas longitudinalmente e bainha de colágeno
- **Feixe de His**: divide-se em dois ramos:
  - **Ramo direito**: fino, superficial, segue sem bifurcação até o músculo papilar anterior direito (mais vulnerável a bloqueios)
  - **Ramo esquerdo**: espesso, divide-se em **hemifascículo anterossuperior** e **posteroinferior**
- **Fibras de Purkinje**: rede subendocárdica, velocidade de condução ~4 m/s (a mais rápida do coração)
- Despolarizam os ventrículos **de dentro para fora** (endocárdio → epicárdio)

### Hierarquia de Marca-passos e Inibição por Supraestimulação
| Estrutura | Frequência | Quando assume? |
|-----------|-----------|----------------|
| Nó SA | 60-100 bpm | Normal (fisiológico) |
| Nó AV (juncional) | 40-60 bpm | Falha do nó SA |
| His-Purkinje (ventricular) | 20-40 bpm | Bloqueio AV completo |

O mecanismo pelo qual o marca-passo mais rápido suprime os inferiores é chamado **inibição automática por supraestimulação** (*overdrive suppression*): o NSA despolariza sistematicamente as demais células automáticas antes que elas atinjam seu próprio limiar.

---

### Vias Acessórias (Pré-excitação)
O sistema de condução pode apresentar variações patológicas — **atalhos** que comunicam diretamente átrios e ventrículos, evitando o NAV:

| Via | Comunicação | Consequência |
|-----|------------|--------------|
| **Feixe de Kent** | Átrio → Ventrículo (direta) | Síndrome de **Wolff-Parkinson-White** |
| **Feixe de James** | Internodal posterior → His (desvia NAV) | Síndrome de **Lown-Ganong-Levine** |
| **Fibras de Mahaim** | NAV/His → septo ventricular | Pré-excitação atípica |

> O feixe de Kent pode estar presente fisiologicamente em RN até 6 meses de idade. É mais comum no átrio esquerdo.`,
          keyPoints: [
            "NSA: maior automatismo, mas condução lenta — é o marca-passo natural (60-100 bpm)",
            "NAV: retarda impulso (intervalo PR) + filtra taquiarritmias (condução decremental)",
            "Ramo direito é fino e superficial — mais vulnerável a bloqueios",
            "Overdrive suppression: o marca-passo mais rápido suprime os inferiores",
            "Feixe de Kent (WPW), James (LGL) e Mahaim são vias acessórias patológicas",
          ],
          clinicalTip: "Em um BAVT, o ritmo de escape será tanto mais lento e instável quanto mais distal for a sede do bloqueio. Escape juncional (QRS estreito) é mais estável que ventricular (QRS largo). Se o NSA falha, o NAV assume a 40-60 bpm; se ambos falham, sobra Purkinje a 20-40 bpm — situação de emergência!",
          images: [
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/ConductionsystemoftheheartwithouttheHeart.png/800px-ConductionsystemoftheheartwithouttheHeart.png", caption: "Figura 1: Sistema de Condução Cardíaco — do nó sinusal às fibras de Purkinje." },
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Reizleitungssystem_1.png/800px-Reizleitungssystem_1.png", caption: "Figura 2: Sistema de condução cardíaco com nó sinusal, nó AV, feixe de His e fibras de Purkinje." },
          ],
          quiz: [
            {
              question: "Qual estrutura do sistema de condução cardíaco apresenta maior frequência de despolarização automática?",
              options: ["Nó atrioventricular", "Nó sinusal (sinoatrial)", "Fibras de Purkinje", "Feixe de His"],
              correctIndex: 1,
              explanation: "O NSA é o marca-passo natural do coração, com frequência intrínseca de 60-100 bpm — a maior do sistema de condução. Por isso, suprime os demais focos pelo mecanismo de overdrive suppression."
            },
            {
              question: "A condução decremental do nó AV tem como principal função:",
              options: ["Aumentar a velocidade de condução ventricular", "Filtrar taquiarritmias atriais e proteger os ventrículos", "Gerar estímulos de alta frequência", "Conduzir o impulso diretamente ao ventrículo esquerdo"],
              correctIndex: 1,
              explanation: "O NAV retarda a condução AV e filtra frequências atriais elevadas, protegendo os ventrículos de arritmias potencialmente fatais. Esta é a condução decremental."
            },
            {
              question: "Qual via acessória está associada à Síndrome de Wolff-Parkinson-White?",
              options: ["Feixe de James", "Feixe de Kent", "Fibras de Mahaim", "Feixe de Bachmann"],
              correctIndex: 1,
              explanation: "O feixe de Kent comunica diretamente o átrio com o ventrículo, causando pré-excitação ventricular — a base da Síndrome de WPW."
            },
          ],
        },
        {
          id: "ecg-1-1b",
          title: "Eletrofisiologia Celular",
          subtitle: "Potencial de repouso, células de resposta lenta vs rápida, fases do potencial de ação",
          theory: `## De Onde Vem a Corrente Elétrica do Coração?

O coração consegue continuar batendo mesmo quando removido do corpo (transplante cardíaco!). Isso é possível porque possui um sistema elétrico independente com capacidade de **automatismo** — geração espontânea de impulso elétrico.

### Potencial de Repouso Transmembrana

A célula miocárdica em repouso mantém um potencial transmembrana entre **-65 e -90 mV** (meio intracelular negativo). Os principais responsáveis:

1. **Bomba Na⁺/K⁺ ATPase**: expulsa 3 Na⁺ e internaliza 2 K⁺ → o interior fica mais negativo ("o começo de tudo!")
2. **Gradiente de concentração do K⁺**: como há mais K⁺ intracelular, ele tende a sair da célula
3. **Equilíbrio eletroquímico**: a saída de K⁺ (gradiente de concentração) é equilibrada pela atração eletrostática (gradiente elétrico que puxa K⁺ de volta) → nasce o potencial de repouso

> **O potássio é o "maestro" do potencial de repouso** — é a saída deste íon que deixa a célula polarizada!

### Dois Tipos de Células Cardíacas

#### 1. Células de Resposta Lenta (Automáticas)
Encontradas nos **nodos SA e AV**. Formam o impulso elétrico.

| Fase | Evento | Íon |
|------|--------|-----|
| **Fase 0** | Despolarização lenta | Entrada de Ca²⁺ |
| **Fase 2** | Repolarização lenta | Saída de K⁺ |
| **Fase 3** | Repolarização final | Saída de K⁺ |
| **Fase 4** | "Repouso" instável | Entrada lenta de Ca²⁺ e Na⁺ |

- **Não possuem fase 1!**
- Na fase 4, não há repouso verdadeiro — logo emendam nova despolarização espontânea
- O potencial de repouso é menos negativo (~-65 mV)

#### 2. Células de Resposta Rápida (Condutoras)
Encontradas nos **átrios, His-Purkinje e ventrículos**. Conduzem o impulso.

| Fase | Evento | Íon |
|------|--------|-----|
| **Fase 0** | Despolarização rápida | Entrada intensa de Na⁺ |
| **Fase 1** | Repolarização transitória | Saída de K⁺ |
| **Fase 2** | Platô (repolarização lenta) | Entrada de Ca²⁺ + saída de K⁺ |
| **Fase 3** | Repolarização final | Saída de K⁺ |
| **Fase 4** | Repouso elétrico | Bomba Na⁺/K⁺ ATPase |

- Possuem todas as 5 fases
- Potencial de repouso mais negativo (~-90 mV)
- A fase 2 (platô) é onde entra o Ca²⁺ responsável pelo **acoplamento excitação-contração**

### Acoplamento Excitação-Contração
O Ca²⁺ que entra na fase 2 ativa o **complexo actina-miosina** → contração muscular. Além disso, este Ca²⁺ estimula o **retículo sarcoplasmático** a liberar mais Ca²⁺ → intensifica a contração.

### Aplicação Clínica Direta

| Droga | Mecanismo | Efeito |
|-------|-----------|--------|
| **Diltiazem/Verapamil** | Bloqueiam canais de Ca²⁺ | Bradicardia (↓automatismo) + inotropismo negativo |
| **Propafenona** | Bloqueia canais de Na⁺ | ↓ condução → antiarrítmico |
| **Digital** | Bloqueia bomba Na⁺/K⁺ ATPase | ↑ Ca²⁺ intracelular → inotropismo positivo |`,
          keyPoints: [
            "Bomba Na⁺/K⁺ ATPase é o 'começo de tudo' — mantém o potencial de repouso",
            "K⁺ é o maestro do potencial de repouso; Na⁺ é o íon da despolarização rápida",
            "Células de resposta lenta (nodos): Ca²⁺-dependentes, automáticas, sem fase 1",
            "Células de resposta rápida (ventrículos): Na⁺-dependentes, com platô (fase 2 = Ca²⁺)",
            "A fase 2 (platô) é responsável pelo segmento ST no ECG",
          ],
          clinicalTip: "Bloqueadores de canal de cálcio (diltiazem, verapamil) agem nas células de resposta lenta reduzindo automatismo (bradicardia) e nas rápidas reduzindo Ca²⁺ para contração (inotropismo negativo). Por isso são contraindicados na IC com FE reduzida!",
          images: [
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Action_potential_ventr_myocyte.gif/800px-Action_potential_ventr_myocyte.gif", caption: "Potencial de ação do miócito ventricular — fases 0 a 4 com os canais iônicos correspondentes." },
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Cardiac_action_potential.svg/800px-Cardiac_action_potential.svg.png", caption: "Comparação dos potenciais de ação: células automáticas (nodos) vs não-automáticas (ventrículos)." },
          ],
          quiz: [
            {
              question: "Qual é o íon considerado o 'maestro' do potencial de repouso transmembrana?",
              options: ["Sódio (Na⁺)", "Cálcio (Ca²⁺)", "Potássio (K⁺)", "Cloro (Cl⁻)"],
              correctIndex: 2,
              explanation: "O potássio é o principal determinante do potencial de repouso. A membrana é mais permeável ao K⁺, que sai da célula a favor do gradiente de concentração, deixando o interior negativo (-65 a -90 mV)."
            },
            {
              question: "Qual canal é o principal responsável pela despolarização (fase 0) das células de resposta lenta?",
              options: ["Canal de sódio (INa)", "Canal de potássio (IK)", "Canal de cálcio tipo L (ICa-L)", "Bomba Na⁺/K⁺ ATPase"],
              correctIndex: 2,
              explanation: "Nas células de resposta lenta (nodos SA e AV), a despolarização é cálcio-dependente (canais ICa-L), diferente das células de resposta rápida que dependem do Na⁺."
            },
            {
              question: "Qual é a consequência clínica principal do bloqueio dos canais de cálcio nas células de resposta lenta?",
              options: ["Taquicardia sinusal", "Bradicardia (redução do automatismo)", "Aumento da contratilidade", "Alargamento do QRS"],
              correctIndex: 1,
              explanation: "Como a despolarização das células automáticas depende do Ca²⁺, bloqueá-lo reduz o automatismo cardíaco → bradicardia. É por isso que diltiazem e verapamil são usados para controlar a FC."
            },
          ],
        },
        {
          id: "ecg-1-1c",
          title: "Teoria do Dipolo e Vetores Cardíacos",
          subtitle: "Como a atividade elétrica celular se transforma no traçado do ECG",
          theory: `## Do Íon ao Traçado: A Teoria do Dipolo

### O Que é um Dipolo?
Um sistema formado por duas cargas de mesmo valor, polaridades opostas, separadas por uma distância. Na célula cardíaca, o dipolo surge quando a despolarização altera a polaridade da membrana:

- Célula em repouso: superfície positiva → sem dipolo entre células vizinhas (todas iguais)
- Célula despolarizada: superfície torna-se negativa → cria diferença com as vizinhas → **dipolo formado!**

### Vetores de Despolarização e Repolarização

**Despolarização**: o vetor aponta **no mesmo sentido** da onda despolarizante (em direção às células positivas, ainda em repouso)

**Repolarização**: o vetor aponta em **sentido oposto** ao da onda repolarizante (a célula repolarizada volta a ser positiva → vetor aponta para ela)

> É por isso que, em situações normais, a repolarização ventricular (onda T) é concordante com a despolarização (QRS) — porque a repolarização começa pelo epicárdio (de fora para dentro), invertendo o sentido do processo e mantendo o vetor na mesma direção!

### As Derivações como "Olhos Elétricos"

Uma **derivação** é um eixo formado por dois eletrodos (positivo e negativo) que mede diferenças de potencial:

| Relação vetor × derivação | Registro no ECG |
|--------------------------|-----------------|
| Vetor aponta para o eletrodo positivo | **Onda positiva** (sobe) |
| Vetor aponta para o eletrodo negativo | **Onda negativa** (desce) |
| Vetor perpendicular à derivação | **Onda bifásica/isoelétrica** |
| Todas as células em repouso ou despolarizadas | **Linha isoelétrica** |

O eletrodo positivo é o verdadeiro **"eletrodo explorador"** — ele registra o que "enxerga" se aproximando ou se afastando.

### Sequência de Ativação Cardíaca

#### 1. Ativação Atrial (Onda P)
- O NSA dispara, mas tem massa desprezível → não gera registro
- AD despolariza primeiro → vetor para baixo, frente e esquerda
- AE despolariza depois → vetor para trás e esquerda
- **Onda P**: AD = porção inicial; sobreposição AD+AE = meio; AE = porção final
- Positiva em DII (vetor aponta para o eletrodo positivo de DII)

#### 2. Condução pelo NAV (Segmento PR)
- Poucas células + condução lenta → **vetores insignificantes**
- Registro: **linha isoelétrica** (o segmento PR)
- ⚠️ Não significa ausência de atividade elétrica — apenas não detectável!

#### 3. Ativação Ventricular (Complexo QRS)
Três vetores principais em sequência:

| Vetor | Tempo | Direção | Estrutura |
|-------|-------|---------|-----------|
| **1° (septal)** | ~20ms | Direita e frente | Septo interventricular (E→D) |
| **2° (principal)** | ~40ms | Esquerda e baixo | Parede livre do VE (maior amplitude!) |
| **3° (basal)** | ~60ms | Trás e cima | Parede basal dos ventrículos |

#### 4. Repolarização Ventricular (Onda T)
- O vetor de repolarização aponta no sentido contrário ao processo repolarizante
- Como a repolarização vai do epicárdio para o endocárdio (inverso da despolarização), o vetor acaba tendo a **mesma orientação** do vetor de despolarização
- Resultado: **onda T concordante com QRS** (ambas positivas em DII, por exemplo)`,
          keyPoints: [
            "Dipolo = duas cargas opostas — surge quando a célula despolariza",
            "Vetor de despolarização: mesmo sentido da onda; vetor de repolarização: sentido oposto",
            "Derivação = 'olho elétrico'; registro positivo quando vetor vai para eletrodo positivo",
            "Segmento PR isoelétrico = condução pelo NAV (poucas células, não detectável)",
            "O 2° vetor ventricular (parede livre do VE) é o de maior amplitude — determina o eixo do QRS",
          ],
          clinicalTip: "Se a onda T está discordante do QRS (apontam em direções opostas), há alteração da repolarização: isquemia, sobrecarga ventricular, bloqueio de ramo ou efeito de drogas. A discordância esperada no BRE é 'secundária' — se concordar, é sinal de IAM (critério de Sgarbossa)!",
          images: [
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/ECG_principle_slow.gif/800px-ECG_principle_slow.gif", caption: "Princípio do ECG — vetores cardíacos e sua projeção nas derivações." },
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/SinusRhythmLabels.svg/800px-SinusRhythmLabels.svg.png", caption: "ECG normal com ondas P, QRS, T e segmentos ST e PR identificados." },
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Limb_leads.svg/800px-Limb_leads.svg.png", caption: "Derivações dos membros — posicionamento e triângulo de Einthoven." },
          ],
          quiz: [
            {
              question: "Por que o registro eletrocardiográfico é isoelétrico (linha reta) durante o segmento PR?",
              options: ["Não há atividade elétrica alguma", "A onda P está sendo formada nesse momento", "As poucas células do NAV/His-Purkinje geram vetores imperceptíveis", "O coração está em assistolia transitória"],
              correctIndex: 2,
              explanation: "O segmento PR corresponde à condução pelo NAV e sistema His-Purkinje. Como são poucas células, os vetores formados são insignificantes e não produzem deflexão no ECG — mas HÁ atividade elétrica acontecendo."
            },
            {
              question: "Nos ventrículos, a repolarização e a despolarização geram vetores de mesmo sentido porque:",
              options: ["A repolarização e despolarização seguem o mesmo caminho", "As últimas áreas despolarizadas são as primeiras a repolarizar", "O NSA controla ambos os processos de forma idêntica", "O Ca²⁺ impede a inversão vetorial"],
              correctIndex: 1,
              explanation: "Nos ventrículos, a repolarização começa pelo epicárdio (última região despolarizada) — o sentido do processo é inverso, mas os vetores resultantes apontam na mesma direção, gerando QRS e onda T de mesma polaridade."
            },
            {
              question: "A origem do nome 'PQRST' para as ondas do ECG é:",
              options: ["Referência aos íons (P=potássio, Q=quinase...)", "Convenção matemática usando a 2ª metade do alfabeto, a partir de P", "Homenagem a 5 cardiologistas pioneiros", "Abreviação de termos em alemão"],
              correctIndex: 1,
              explanation: "Einthoven usou a convenção matemática de nomear com letras da 2ª metade do alfabeto. N e O já eram usadas para outros fins matemáticos, então começou pela letra P."
            },
          ],
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
- **Corresponde no ECG**: condução pelo NAV e His-Purkinje (pouquíssimas células → linha isoelétrica)
- **PR curto (< 120ms)**: pré-excitação (Wolff-Parkinson-White)
- **PR longo (> 200ms)**: BAV 1° grau

### Complexo QRS
- **O que representa**: despolarização ventricular (3 vetores sequenciais)
- **Duração normal**: < 120 ms
- **QRS largo (≥ 120ms)**: bloqueio de ramo, pré-excitação, marca-passo, TV
- Nomenclatura:
  - **Q**: primeira deflexão negativa antes de R (vetor septal)
  - **R**: primeira deflexão positiva (vetor principal — parede livre do VE)
  - **S**: deflexão negativa após R (vetor basal)

### Segmento ST
- **O que representa**: fase de platô (fase 2) do potencial de ação — Ca²⁺ entrando e K⁺ saindo
- **Normal**: isoelétrico (no mesmo nível da linha de base)
- **Supradesnivelamento**: IAM com supra (IAMCSST), pericardite, Brugada
- **Infradesnivelamento**: isquemia subendocárdica, efeito digitálico

### Onda T
- **O que representa**: repolarização ventricular (fase 3 — saída de K⁺)
- **Normal**: positiva onde QRS é positivo (concordante) — porque a repolarização vai do epicárdio ao endocárdio
- **T invertida**: isquemia, sobrecarga, TEP, SCA
- **T apiculada**: hipercalemia (emergência!)

### Intervalo QT
- **Normal**: QTc < 450ms (homens), < 470ms (mulheres)
- **QT longo**: risco de Torsades de Pointes → antiarrítmicos, congênito, hipocalemia, hipocalcemia
- **QT curto**: hipercalemia, hipercalcemia, efeito digitálico
- **Fórmula de Bazett**: QTc = QT / √RR`,
          keyPoints: [
            "PR normal: 120-200ms — curto sugere WPW, longo sugere BAV",
            "QRS normal: < 120ms — alargado sugere bloqueio de ramo ou pré-excitação",
            "ST = fase de platô (fase 2); supra = IAM/pericardite, infra = isquemia",
            "QTc prolongado = risco de Torsades de Pointes (morte súbita)",
            "QT curto: pensar em hipercalemia, hipercalcemia ou digital",
          ],
          clinicalTip: "A hipercalemia é a causa mais importante de T apiculada. Se K⁺ > 6.5 com alteração de ECG, é EMERGÊNCIA: gluconato de cálcio IV imediatamente, antes de corrigir o potássio.",
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
          title: "ECG nos Distúrbios do Potássio",
          subtitle: "Hipercalemia e hipocalemia — do mecanismo iônico ao ECG de emergência",
          theory: `## O Potássio e a Eletrofisiologia Cardíaca

Apenas 2% do K⁺ corporal está no meio extracelular (3,5-5,5 mEq/L). Ele influencia dois processos cruciais:
1. **Repolarização** (fase 3) de todas as células — abertura de canais de K⁺
2. **Potencial de repouso** (fase 4) das células de resposta rápida — determinado pelo gradiente de K⁺

---

## HIPERCALEMIA (K⁺ > 5,5 mEq/L)

### Mecanismo Eletrofisiológico
O excesso de K⁺ extracelular reduz o gradiente de concentração → a célula atinge o equilíbrio com **menor saída de K⁺** → potencial de repouso **menos negativo** (ex: de -90 para -80 mV).

**Duas consequências:**
1. **Repolarização encurtada**: fica mais fácil retornar ao novo potencial de repouso → onda T mais alta, apiculada e estreita ("em tenda") + QT encurtado
2. **Despolarização lentificada**: potencial de repouso próximo de 0 → menos canais de Na⁺ disponíveis → QRS alargado + P achatada

### Progressão das Alterações no ECG

#### Hipercalemia Leve (5,5-7,0 mEq/L)
- **T apiculada e simétrica** ("em tenda") — primeiro sinal!
- Base estreita, amplitude aumentada
- QT pode estar encurtado

#### Hipercalemia Moderada (7,0-9,0 mEq/L)
- **P achatada** → pode desaparecer (ritmo sinoventricular)
- **PR alargado** (BAV 1° grau funcional)
- **QRS progressivamente alargado**
- O estímulo sinusal continua, mas depende dos feixes internodais para alcançar os ventrículos

> **Ritmo sinoventricular**: ritmo sinusal SEM onda P visível — praticamente indistinguível de ritmo juncional ou ventricular no ECG!

#### Hipercalemia Grave (> 9,0 mEq/L)
- **Supra de ST** (pseudoinfarto / "corrente de lesão dialisável") — reverte com diálise
- **QRS funde-se com onda T** → **"onda em sino"** (parada iminente!)
- Padrão sinusoidal → FV → assistolia

### Mnemônico de Progressão
> T em Tenda → P desaparece → QRS alarga → Sino → Parada

### ⚠️ A Hipercalemia na Pena de Morte
O protocolo de injeção letal usa cloreto de potássio como agente final — a hipercalemia severa causa parada cardíaca por interferência direta nas propriedades elétricas do miocárdio.

---

## HIPOCALEMIA (K⁺ < 3,5 mEq/L)

### Mecanismo Eletrofisiológico
Com menos K⁺ extracelular, aumenta o gradiente de concentração → mais K⁺ sai da célula → potencial de repouso **mais negativo** (ex: de -90 para -95 mV).

**Duas consequências:**
1. **Repolarização prolongada**: mais difícil retornar ao potencial de repouso mais negativo → onda T achatada + QT prolongado + aparecimento da onda U
2. **Despolarização mais intensa**: mais canais de Na⁺ disponíveis → pode aumentar amplitude da onda P e predispor a ectopias

### Progressão das Alterações (geralmente < 2,8-3,0 mEq/L)
1. **Onda T achatada** e com base alargada — primeiro sinal
2. **Onda U proeminente** — achado mais típico! (pode ultrapassar a onda T)
3. **"QT prolongado"** — na verdade, mede-se o intervalo **QU** (T + U fundidas)
4. **Infra de ST**
5. K⁺ < 2,5: risco de **Torsades de Pointes** e arritmias graves

> **Teoria da onda U patológica**: repolarização tardia das fibras de Purkinje que separa a onda T em dois componentes — o 2° é a onda U.

### Hipocalemia Grave
- QRS pode alargar (paradoxal: retenção de Ca²⁺ intracelular altera novamente o potencial de repouso)
- A onda U pode mascarar a onda P do ciclo seguinte

### Resumo Comparativo K⁺
| Parâmetro | Hipercalemia | Hipocalemia |
|-----------|-------------|-------------|
| Onda T | Alta, apiculada ("tenda") | Achatada, alargada |
| Onda U | Ausente | Proeminente (patognomônica) |
| QRS | Alargado | Normal (alargado se grave) |
| QT | Encurtado | Prolongado (QU) |
| Onda P | Achatada → ausente | Amplitude aumentada |
| Risco | Parada cardíaca | Torsades de Pointes |

> **Mnemônico**: "Hiper K = T de ponta (apiculada), Hipo K = U de sobra (onda U)"`,
          keyPoints: [
            "K⁺ alto → potencial de repouso menos negativo → repolarização rápida (T apiculada) + despolarização lenta (QRS largo)",
            "K⁺ baixo → potencial de repouso mais negativo → repolarização lenta (T achatada + onda U) + QT longo",
            "Progressão da hipercalemia: T tenda → P some → QRS alarga → sino → parada",
            "Onda U proeminente é o achado mais típico da hipocalemia",
            "Ritmo sinoventricular: ritmo sinusal sem onda P — confunde com juncional",
          ],
          clinicalTip: "Na emergência com ECG sinusoidal ou 'onda em sino', trate como hipercalemia até prova em contrário: gluconato de cálcio 10mL a 10% IV em 2-3 min. Ele não reduz o K⁺, mas estabiliza a membrana ao alterar o potencial limiar (de -70 para -60 mV), restaurando a função dos canais de Na⁺.",
          images: [
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/ECG_in_hyperkalemia.svg/800px-ECG_in_hyperkalemia.svg.png", caption: "Progressão do ECG na hipercalemia: T em tenda → P achatada → QRS alargado → onda sinusoidal." },
          ],
          quiz: [
            {
              question: "Qual é o primeiro achado eletrocardiográfico da hipercalemia?",
              options: ["Alargamento do QRS", "Desaparecimento da onda P", "Onda T apiculada (em tenda)", "Ritmo sinoventricular"],
              correctIndex: 2,
              explanation: "A onda T apiculada (em tenda) é o primeiro sinal, surgindo com K⁺ a partir de 5,5 mEq/L. Ela reflete o encurtamento da repolarização causado pelo potencial de repouso menos negativo."
            },
            {
              question: "O ritmo sinoventricular na hipercalemia moderada ocorre porque:",
              options: ["O nó sinusal para de funcionar", "A onda P desaparece por comprometimento da condução intra-atrial", "O feixe de His assume o comando", "Os ventrículos geram ritmo próprio"],
              correctIndex: 1,
              explanation: "Com K⁺ > 8 mEq/L, a condução intra-atrial está tão comprometida que a onda P some, mas o NSA continua funcionando — o estímulo chega aos ventrículos pelos feixes internodais. É um ritmo sinusal sem onda P!"
            },
            {
              question: "Na hipocalemia, o intervalo QT parece alargado. Na verdade, o que está sendo medido é:",
              options: ["O intervalo QT verdadeiro", "O intervalo QU (fusão da onda U com T)", "O segmento ST prolongado", "A onda P alargada"],
              correctIndex: 1,
              explanation: "Na hipocalemia, surge uma onda U proeminente que se funde à onda T, criando a impressão de QT longo. Na verdade, é o intervalo QU que está sendo medido. Este achado predispõe a Torsades de Pointes."
            },
            {
              question: "Qual a diferença entre o encurtamento do QT na hipercalemia vs hipercalcemia?",
              options: [
                "Ambos apresentam onda T em tenda",
                "A hipercalemia tem T em tenda + QRS largo; a hipercalcemia tem apenas ST curto/ausente",
                "A hipercalcemia apresenta onda U proeminente",
                "Não há diferença — os achados são idênticos"
              ],
              correctIndex: 1,
              explanation: "Na hipercalemia, o QT curto vem acompanhado de onda T em tenda, QRS alargado e P achatada. Na hipercalcemia, o encurtamento é isolado — o segmento ST fica muito curto ou ausente, sem outras alterações."
            },
          ],
        },
        {
          id: "ecg-4-4",
          title: "ECG nos Distúrbios do Cálcio e Efeito Digitálico",
          subtitle: "Hipercalcemia, hipocalcemia, onda J de Osborn e 'pá de pedreiro'",
          theory: `## O Cálcio e a Eletrofisiologia

99% do Ca²⁺ corporal está nos ossos; apenas 1% no sangue (metade ligada à albumina). O Ca²⁺ ionizado é o que interage com o coração.

### Onde o Cálcio Atua no Potencial de Ação
- **Células de resposta rápida**: participa da **fase 2 (platô)** → inscrita como **segmento ST** no ECG
- **Células de resposta lenta**: participa das fases 0 (despolarização) e 4 (repouso)
- É o responsável pelo **acoplamento excitação-contração** (ativa complexo actina-miosina)

> As alterações do Ca²⁺ afetam principalmente o **segmento ST** e, por consequência, o **intervalo QT**.

⚠️ Diferente do K⁺, não há boa correlação progressiva entre nível sérico e alterações no ECG — as mudanças só ocorrem em variações extremas.

---

## HIPERCALCEMIA (Ca > 10,5 mg/dL)

### Mecanismo
Mais Ca²⁺ extracelular → maior influxo na fase 2 → **platô mais curto** → encurtamento do segmento ST e do QT.

### Alterações no ECG
| Achado | Descrição |
|--------|-----------|
| **QT curto** | Principal achado — por redução/ausência do segmento ST |
| **Supra de ST** | Pode simular IAM ("pseudoinfarto") |
| **Onda J de Osborn** | Entalhe positivo no final do QRS (não é exclusiva de hipotermia!) |
| PR alargado | Menos comum |
| Bradicardia | Em casos severos |

### Onda J de Osborn — Não é Só Hipotermia!
Descrita por John J. Osborn (1953), surge por acentuação do entalhe no potencial de ação epicárdico. Causas:
- **Hipotermia** (< 30°C) — acompanha a gravidade
- **Hipercalcemia**
- Hemorragia subaracnoide
- Traumatismo craniano
- Angina de Prinzmetal

### Tratamento da Hipercalcemia
1. **Hidratação** com SF 0,9% (200-300 mL/h)
2. **Calcitonina** 4 U/kg IM 12/12h (efeito em 48h)
3. **Bifosfonados** (ácido zoledrônico 4mg IV ou pamidronato 60-90mg IV) — efeito por até 2 semanas

---

## HIPOCALCEMIA (Ca < 8,5 mg/dL)

### Mecanismo
Menos Ca²⁺ → fase 2 (platô) **prolongada** → segmento ST e QT se alongam.

### Alterações no ECG
- **QT longo** (às custas de **alargamento do segmento ST**) — principal achado
- Risco de **Torsades de Pointes**
- Causas: hipoparatireoidismo, pancreatite, IRC, deficiência de vitamina D

### Como Diferenciar QT Longo: Hipocalemia vs Hipocalcemia?
| | Hipocalemia | Hipocalcemia |
|---|-----------|-------------|
| QT longo por | Onda U proeminente (intervalo QU) | Alargamento do segmento ST |
| Onda T | Achatada | Relativamente preservada |
| Onda U | Presente e aumentada | Ausente ou discreta |

### Tratamento da Hipocalcemia
- Com alteração no ECG ou sintomas (tetania, Chvostek, Trousseau):
- **Gluconato de cálcio** 1-2g IV em 10-20 min (1-2 ampolas a 10%)

---

## EFEITO DIGITÁLICO (Bônus!)

### Mecanismo
O digital **bloqueia a bomba Na⁺/K⁺ ATPase** → acúmulo de Na⁺ intracelular → trocador Na⁺/Ca²⁺ retém mais Ca²⁺ → mimetiza hipercalemia (K⁺ extracelular ↑) + hipercalcemia (Ca²⁺ intracelular ↑).

### Alterações no ECG
- **Infra de ST** com aspecto de **"pá de pedreiro"** (ou "Bigode de Salvador Dalí")
- **QT encurtado**
- Pode causar bradiarritmias e taquiarritmias

### As 3 Grandes Causas de QT Curto
| Causa | Pista associada |
|-------|----------------|
| **Hipercalemia** | T em tenda + QRS alargado |
| **Hipercalcemia** | Ausência isolada do segmento ST |
| **Digital** | Infra de ST em "pá de pedreiro" |

> ⚠️ Na hipercalemia por intoxicação digitálica, o uso de gluconato de cálcio é **controverso** — o digital já acumula Ca²⁺ intracelular, e mais Ca²⁺ pode agravar arritmias!`,
          keyPoints: [
            "Ca²⁺ afeta principalmente o segmento ST (fase 2 do potencial de ação)",
            "Hipercalcemia: QT curto + pode ter supra de ST (pseudoinfarto) + onda J de Osborn",
            "Hipocalcemia: QT longo às custas de alargamento do ST (não da onda U!)",
            "Onda J de Osborn: não é exclusiva de hipotermia — aparece também na hipercalcemia",
            "Digital: bloqueia bomba Na⁺/K⁺ ATPase → infra ST em 'pá de pedreiro' + QT curto",
            "3 causas de QT curto: hipercalemia, hipercalcemia, digital",
          ],
          clinicalTip: "Quando encontrar QT prolongado no ECG, diferencie: se tem onda U proeminente e T achatada → hipocalemia; se o ST está alargado com T preservada → hipocalcemia. O tratamento é completamente diferente! Reponha K⁺ ou Ca²⁺ conforme o caso.",
          images: [
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Osborn_wave.svg/800px-Osborn_wave.svg.png", caption: "Onda J de Osborn — achado clássico na hipotermia, também presente na hipercalcemia." },
          ],
          quiz: [
            {
              question: "A principal alteração eletrocardiográfica da hipercalcemia é:",
              options: ["Prolongamento do intervalo QT", "Encurtamento do segmento ST (intervalo QT curto)", "Onda T apiculada em tenda", "Aparecimento de onda U proeminente"],
              correctIndex: 1,
              explanation: "Na hipercalcemia, a fase 2 (platô) é encurtada → o segmento ST fica muito curto ou até ausente → QT curto. Diferente da hipercalemia, onde há T em tenda e QRS largo."
            },
            {
              question: "A onda J de Osborn NÃO é patognomônica de hipotermia. Ela também pode ser encontrada em:",
              options: ["Hipocalemia grave", "Hipercalcemia e hemorragia subaracnoide", "Infarto inferior isolado", "Bloqueio de ramo direito"],
              correctIndex: 1,
              explanation: "A onda J de Osborn pode ser vista na hipercalcemia, insultos neurológicos (HSA, HIC, TCE) e angina de Prinzmetal — não é exclusiva da hipotermia."
            },
            {
              question: "O 'efeito digitálico' no ECG produz um aspecto de ST em 'pá de pedreiro' porque o digital:",
              options: ["Bloqueia canais de sódio", "Bloqueia a bomba Na⁺/K⁺ ATPase, acumulando Ca²⁺ intracelular (mimetiza hipercalcemia)", "Aumenta os canais de potássio", "Prolonga a fase 4 do potencial de ação"],
              correctIndex: 1,
              explanation: "O digital bloqueia a bomba Na⁺/K⁺ ATPase → acúmulo de Na⁺ intracelular → menor troca pelo trocador Na⁺/Ca²⁺ → acúmulo de Ca²⁺ → mimetiza hipercalcemia (ST encurtado) com aspecto em 'pá de pedreiro'."
            },
            {
              question: "Mulher de 63 anos com câncer de mama metastático apresenta fraqueza e constipação. O ECG mostra segmento ST praticamente ausente com QT curto, sem onda T em tenda nem QRS alargado. O distúrbio mais provável é:",
              options: ["Hipocalemia", "Hipercalemia", "Hipocalcemia", "Hipercalcemia"],
              correctIndex: 3,
              explanation: "O encurtamento isolado do ST (sem T em tenda ou QRS largo) aponta para hipercalcemia. A metástase óssea do câncer de mama explica a hipercalcemia, e fraqueza + constipação são sintomas compatíveis."
            },
          ],
        },
      ],
    },
  ],
};

export const rxCourse: CourseData = {
  id: "rx-torax-interpretation",
  title: "Curso de Raio-X de Tórax",
  description: "Domine a interpretação sistemática do RX de tórax — da técnica radiológica às patologias mais cobradas em provas de residência.",
  category: "rx_torax",
  modules: [
    {
      id: "rx-basics",
      title: "Fundamentos e Técnica",
      description: "Incidências, critérios de qualidade, anatomia radiológica e roteiro sistemático de leitura.",
      icon: "📷",
      lessons: [
        {
          id: "rx-1-1",
          title: "Técnica e Qualidade do RX",
          subtitle: "PA vs AP, critérios de qualidade, mnemônico ABCDE",
          theory: `## Princípios da Radiografia de Tórax

O raio-X de tórax é o **exame de imagem mais solicitado** na prática médica. É rápido, barato, acessível e fornece uma visão panorâmica do tórax. Para interpretá-lo corretamente, é obrigatório entender a técnica.

### Incidências Fundamentais

#### PA (Póstero-Anterior) — O Padrão-Ouro
- Raios entram pelas **costas** e o filme fica **anterior** (junto ao peito)
- O coração está **próximo ao filme** → silhueta com tamanho real
- Paciente em **ortostase**, braços em rotação interna, inspiração profunda
- **Sempre solicite PA** — é a referência para todas as medidas

#### AP (Ântero-Posterior) — O RX de Leito
- Raios entram pelo **peito** e o filme fica **posterior** (nas costas)
- O coração está **longe do filme** → **magnificação de ~20%**
- Usado em UTI, emergência, pacientes acamados
- ⚠️ **NUNCA avalie cardiomegalia em AP** — o coração parece maior do que realmente é

#### Perfil (Lateral Esquerdo)
- Paciente com o **lado esquerdo** junto ao filme
- Complementar para avaliar:
  - Lesões **retrocardíacas** (invisíveis no PA)
  - Derrames **loculados** em cisuras
  - **Coluna vertebral**: normalmente os corpos ficam mais transparentes de cima para baixo. Se isso não ocorre → lesão retroCardíaca

#### Incidência de Laurell (Decúbito Lateral)
- Paciente deitado **sobre o lado afetado** com raios horizontais
- Finalidade: confirmar **derrame pleural livre** (líquido se move com gravidade)
- Se espessura > 1 cm → **derrame puncionável**

---

## Critérios de Qualidade — Mnemônico "ABCDE"

Antes de interpretar qualquer achado, avalie se o exame tem qualidade:

### A — Alinhamento (Rotação)
- Os **processos espinhosos** devem estar equidistantes das extremidades mediais das clavículas
- Clavícula D mais próxima da linha média → paciente **rotado para a esquerda**
- Rotação altera a aparência do mediastino e pode simular alargamento

### B — Brilho (Penetração)
- **Ideal**: visualizar corpos vertebrais atrás do mediastino, mas não com excessiva clareza
- **Hipopenetrado** (escuro): falsa opacidade, perde detalhes, simula consolidação
- **Hiperpenetrado** (claro): perde detalhes pulmonares, não vê infiltrado sutil

### C — Cobertura (Campo Incluído)
- Do **ápice pulmonar** até os **seios costofrênicos** bilateralmente
- Deve incluir **partes moles laterais** completas
- Ápices cortados → perde nódulos apicais e pneumotórax

### D — Dispositivos
- Antes de qualquer interpretação, identifique: TOT, cateter venoso central, Swan-Ganz, dreno torácico, sonda nasogástrica, marca-passo, PICC
- Verifique **posição adequada** de cada dispositivo

### E — Expansão (Inspiração)
- Conte **arcos costais anteriores** visíveis acima do diafragma
- **Ideal: 6 arcos anteriores** (ou 9-10 posteriores)
- < 5 arcos → **hiperinsuflação inadequada** (falsa congestão)
- > 7 arcos → **hiperinsuflação** (enfisema, asma)`,
          keyPoints: [
            "PA é o padrão-ouro — AP magnifica o coração em ~20% (nunca avalie ICT em AP)",
            "Sem rotação: processos espinhosos centrados entre as extremidades mediais das clavículas",
            "Boa inspiração: 6 arcos costais anteriores acima do diafragma",
            "Laurell > 1cm = derrame puncionável",
            "Sempre identifique dispositivos antes de interpretar o parênquima",
          ],
          clinicalTip: "Na emergência, o RX AP de leito é comum. Antes de laudar 'cardiomegalia' ou 'alargamento de mediastino', confirme a incidência. No AP, o coração parece 20% maior e o mediastino superior pode parecer alargado mesmo sem patologia.",
          images: [
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Chest_Xray_PA_3-8-2010.png/800px-Chest_Xray_PA_3-8-2010.png", caption: "RX de tórax PA normal — observe a silhueta cardíaca, mediastino centralizado e seios costofrênicos agudos." },
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Chest_radiograph_of_a_healthy_male.jpg/600px-Chest_radiograph_of_a_healthy_male.jpg", caption: "RX PA de paciente saudável com boa inspiração (6 arcos costais anteriores visíveis)." },
          ],
          quiz: [
            {
              question: "Em qual incidência do RX de tórax NÃO se deve avaliar o índice cardiotorácico (ICT)?",
              options: ["PA (póstero-anterior)", "AP (ântero-posterior)", "Perfil esquerdo", "Laurell"],
              correctIndex: 1,
              explanation: "Na incidência AP, os raios entram pelo peito e o coração está longe do filme, causando magnificação de ~20%. Isso superestima o tamanho cardíaco, tornando a medida do ICT não confiável."
            },
            {
              question: "Qual o número ideal de arcos costais anteriores visíveis acima do diafragma em um RX bem inspirado?",
              options: ["4 arcos", "5 arcos", "6 arcos", "8 arcos"],
              correctIndex: 2,
              explanation: "O ideal são 6 arcos costais anteriores (ou 9-10 posteriores). Menos que 5 sugere inspiração inadequada; mais que 7 sugere hiperinsuflação (DPOC, asma)."
            },
            {
              question: "Na incidência de Laurell, qual espessura do derrame pleural indica necessidade de punção?",
              options: ["Qualquer quantidade visível", "> 0,5 cm", "> 1 cm", "> 3 cm"],
              correctIndex: 2,
              explanation: "Derrame com espessura > 1 cm no Laurell indica volume significativo (~200mL) e é indicação de toracocentese para análise (diferencial entre transudato e exsudato)."
            },
          ],
        },
        {
          id: "rx-1-2",
          title: "Anatomia Radiológica Normal",
          subtitle: "Silhueta cardíaca, mediastino, hilos, parênquima, pleura e diafragma",
          theory: `## Roteiro Sistemático de Leitura do RX de Tórax

A interpretação do RX de tórax deve seguir um **roteiro sistemático** para não perder achados. Nunca vá direto ao "óbvio" — achados sutis estão nos cantos.

### 1. Partes Moles e Esqueleto

- **Enfisema subcutâneo**: ar nos tecidos moles (linhas radiolucentes entre fibras musculares)
- **Fraturas costais**: procure especialmente em costelas inferiores (trauma) e superiores (metástases)
- **Lesões líticas**: áreas de destruição óssea (metástases de mama, pulmão, rim, tireoide)
- **Lesões blásticas**: áreas de esclerose (metástases de próstata)
- **Mastectomia prévia**: assimetria de partes moles = pista diagnóstica ("mama fantasma")
- **Calcificações vasculares**: aorta, coronárias (aterosclerose)

### 2. Mediastino — Compartimentos

#### Superior
- **Traqueia**: deve estar **centralizada** (desvio = massa, pneumotórax, atelectasia)
- **Grandes vasos**: arco aórtico, VCS, tronco braquiocefálico

#### Anterior (Pré-vascular) — "Os 4 T's"
- **T**imoma (mais comum em adultos)
- **T**ireoide retroesternal (bócio mergulhante)
- **T**eratoma (e outros tumores germinativos)
- **T**errível linfoma (Hodgkin é o mais comum)

#### Médio (Visceral)
- Coração, pericárdio, grandes vasos
- Linfonodos hilares e paratraqueais
- Esôfago (não visível normalmente)

#### Posterior (Paravertebral)
- Esôfago, aorta descendente
- Coluna vertebral, discos, tumores neurogênicos (schwannoma)

### 3. Silhueta Cardíaca

#### Borda Direita (de cima para baixo)
1. **VCS** (veia cava superior)
2. **Átrio direito** (AD)

#### Borda Esquerda (de cima para baixo)
1. **Botão aórtico** (arco aórtico)
2. **Tronco da artéria pulmonar** (janela aortopulmonar)
3. **Aurícula do átrio esquerdo** (AE)
4. **Ventrículo esquerdo** (VE)

#### Índice Cardiotorácico (ICT)
- ICT = diâmetro cardíaco máximo / diâmetro torácico interno
- **Normal: < 0,50** (apenas em PA!)
- ICT > 0,50 = **cardiomegalia** (sensibilidade ~60%, especificidade ~95%)

### 4. Hilos Pulmonares

- **Composição**: artérias pulmonares (principal componente), veias, brônquios, linfonodos
- **Hilo esquerdo** é normalmente **mais alto** que o direito (1-3 cm)
- **Hilo aumentado**: HAP, linfadenopatia (sarcoidose, linfoma, TB), massa
- **Hilo deslocado**: atelectasia (puxa para cima), derrame (empurra para baixo)
- **Dança dos hilos**: hilos pulsáteis na fluoroscopia = HAP

### 5. Parênquima Pulmonar

Compare **sistematicamente** os dois lados (ápice com ápice, base com base):

| Padrão | Características | Exemplos |
|--------|----------------|----------|
| **Alveolar** | Opacidade homogênea, broncograma aéreo, coalescência | Pneumonia, edema, hemorragia |
| **Intersticial reticular** | Linhas finas formando rede | Fibrose, ICC, linfangite |
| **Intersticial nodular** | Múltiplos nódulos | Metástases, TB miliar, silicose |
| **Intersticial reticulonodular** | Linhas + nódulos | Sarcoidose, pneumoconioses |
| **Nódulo/massa** | Opacidade arredondada (< ou > 3cm) | Tumor, granuloma, abscesso |
| **Cavitação** | Lesão com centro radiolucente | TB, abscesso, carcinoma escamoso |

### 6. Pleura e Diafragma

- **Seios costofrênicos**: devem ser **agudos** (livres)
- **Velamento**: sinal de derrame (> 200mL para ser visível em PA)
- **Hemidiafragma direito** normalmente **mais alto** que o esquerdo (fígado)
- **Retificação diafragmática**: hiperinsuflação (DPOC, asma grave)
- **Elevação unilateral**: paralisia frênica, hepatomegalia, abscesso subfrênico`,
          keyPoints: [
            "ICT < 0,50 é normal em PA — ICT > 0,50 = cardiomegalia",
            "Borda esquerda: botão aórtico → tronco pulmonar → aurícula AE → VE",
            "Hilo esquerdo mais alto que o direito é NORMAL",
            "Seios costofrênicos agudos = normais; velados = derrame (> 200mL)",
            "Massas do mediastino anterior: 4 T's (Timoma, Tireoide, Teratoma, Terrível linfoma)",
          ],
          clinicalTip: "O 'sinal da silhueta' é fundamental: se uma opacidade apaga a borda do coração, está no mesmo plano (segmento anterior/língula). Se apaga o diafragma, está na base posterior. Se não apaga nenhum → está no lobo médio/posterior. Use para localizar lesões sem TC!",
          images: [
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Heart_normal_short_axis_section.jpg/800px-Heart_normal_short_axis_section.jpg", caption: "Anatomia cardíaca em corte — base para entender a silhueta no RX." },
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Blausen_0458_Heart_Anterior.png/800px-Blausen_0458_Heart_Anterior.png", caption: "Visão anterior do coração — correlação com as bordas cardíacas vistas no RX PA." },
          ],
          quiz: [
            {
              question: "Qual estrutura forma a borda cardíaca esquerda mais inferior no RX PA?",
              options: ["Átrio esquerdo", "Ventrículo esquerdo", "Ventrículo direito", "Botão aórtico"],
              correctIndex: 1,
              explanation: "O VE forma a porção mais inferior e lateral da borda esquerda. De cima para baixo: botão aórtico → tronco pulmonar → aurícula do AE → VE."
            },
            {
              question: "As massas do mediastino anterior são lembradas pelo mnemônico '4 T's'. Qual NÃO pertence a esse grupo?",
              options: ["Timoma", "Tireoide retroesternal", "Tuberculose", "Teratoma"],
              correctIndex: 2,
              explanation: "A TB causa linfadenopatia do mediastino médio e posterior, não anterior. Os 4 T's são: Timoma, Tireoide, Teratoma e Terrível linfoma."
            },
            {
              question: "O 'sinal da silhueta' positivo (apagamento da borda cardíaca esquerda) indica que a lesão está em qual localização?",
              options: ["Lobo inferior posterior", "Lobo superior", "Língula ou segmento anterior", "Mediastino posterior"],
              correctIndex: 2,
              explanation: "Se a opacidade apaga a borda do coração, ela está no mesmo plano anteroposterior — ou seja, na língula (esquerda) ou lobo médio (direita). Lesões posteriores não apagam a silhueta cardíaca."
            },
          ],
        },
        {
          id: "rx-1-3",
          title: "Sinal da Silhueta e Localização",
          subtitle: "Identificando a localização de lesões sem TC",
          theory: `## O Sinal da Silhueta — A Ferramenta Mais Poderosa do RX

O sinal da silhueta foi descrito por **Benjamin Felson** e é talvez o conceito mais útil na interpretação do RX de tórax. Ele permite **localizar lesões** sem necessidade de TC.

### Princípio Fundamental

> Quando duas estruturas de **mesma densidade radiológica** estão em contato no mesmo plano, **seus contornos se apagam** (perdem a interface).

Exemplo: se uma consolidação no lobo médio (anterior) toca o coração (anterior), a borda cardíaca direita **desaparece** → sinal da silhueta positivo.

### Aplicações Práticas

| Borda apagada | Localização da lesão |
|--------------|---------------------|
| Borda cardíaca D (AD) | Lobo médio direito |
| Borda cardíaca E (VE) | Língula |
| Hemidiafragma D | Lobo inferior D (segmento basal posterior) |
| Hemidiafragma E | Lobo inferior E (segmento basal posterior) |
| Botão aórtico | Lobo superior E (segmento apicoposterior) |
| Aorta descendente | Lobo inferior E (segmento posterior) |

### Sinal da Silhueta NEGATIVO
- Se a opacidade **NÃO apaga** a borda adjacente → está em **plano diferente** (mais posterior ou anterior)
- Exemplo: opacidade na base E sem apagar o hemidiafragma → lesão no segmento superior do lobo inferior (posterior ao diafragma)

### Outros Sinais de Localização

#### Sinal da Convergência Hilar
- Vasos convergem para a opacidade → **massa hilar** (tumor de pulmão)
- Vasos NÃO convergem → **massa mediastinal** (linfoma, timoma)

#### Sinal do Broncograma Aéreo
- Ar nos brônquios visível dentro de opacidade → consolidação **parenquimatosa**
- Confirma que a lesão é PULMONAR (não pleural ou mediastinal)

#### Sinal da Coluna Vertebral (no Perfil)
- Normalmente: corpos vertebrais ficam progressivamente mais **transparentes** de cima para baixo
- Se isso não ocorre (ficam mais brancos) → **lesão retrocardíaca** (derrame, massa, consolidação)

#### Sinal do Cervical
- Massa mediastinal que se estende acima das clavículas sem alterar contorno → **origem posterior** (neurôgenio)
- Se altera contorno do mediastino → **origem anterior** (tireoide, timoma)`,
          keyPoints: [
            "Sinal da silhueta: apagamento de borda = lesão no MESMO plano anteroposterior",
            "Borda cardíaca D apagada → lobo médio; borda E → língula",
            "Diafragma apagado → lesão basal posterior",
            "Broncograma aéreo = lesão parenquimatosa (não pleural nem mediastinal)",
            "Sinal da coluna no perfil: perda de transparência progressiva = lesão retrocardíaca",
          ],
          clinicalTip: "Na prova, quando mostrarem um RX com opacidade que apaga a borda cardíaca, a resposta provavelmente é 'pneumonia de lobo médio' (direita) ou 'pneumonia da língula' (esquerda). Se a opacidade NÃO apaga a borda cardíaca, a lesão está mais posterior — lobo inferior.",
          quiz: [
            {
              question: "Uma opacidade no hemitórax direito que apaga a borda do átrio direito sugere lesão em qual localização?",
              options: ["Lobo superior direito", "Lobo médio direito", "Lobo inferior direito (segmento posterior)", "Mediastino posterior"],
              correctIndex: 1,
              explanation: "O lobo médio é anterior, no mesmo plano que o átrio direito. Quando uma consolidação o preenche, apaga a interface entre ambos (sinal da silhueta positivo com borda cardíaca direita)."
            },
            {
              question: "No RX em perfil, os corpos vertebrais torácicos devem ficar progressivamente mais transparentes de cima para baixo. Se isso NÃO ocorre, o que sugere?",
              options: ["Hiperinsuflação pulmonar", "Lesão retrocardíaca (derrame, massa ou consolidação)", "Derrame pericárdico", "Pneumotórax posterior"],
              correctIndex: 1,
              explanation: "O sinal da coluna vertebral indica lesão retrocardíaca — geralmente derrame pleural, consolidação do lobo inferior ou massa mediastinal posterior. Normalmente o pulmão aerado torna os corpos mais transparentes nas porções inferiores."
            },
          ],
        },
      ],
    },
    {
      id: "rx-pathology",
      title: "Patologias Essenciais",
      description: "Pneumonia, derrame pleural, pneumotórax e atelectasia — os diagnósticos que você PRECISA dominar.",
      icon: "🫁",
      lessons: [
        {
          id: "rx-2-1",
          title: "Pneumonia e Consolidação",
          subtitle: "Padrão alveolar, broncograma aéreo, tipos de pneumonia e complicações",
          theory: `## Consolidação Pulmonar no RX

### O Padrão Alveolar — Características Cardinais
1. **Opacidade homogênea** com limites mal definidos
2. **Broncograma aéreo**: ar nos brônquios visível dentro da opacidade (patognomônico de lesão parenquimatosa)
3. **Sinal da silhueta**: apagamento da estrutura adjacente
4. **Tendência à coalescência**: opacidades que se fundem
5. **Evolução rápida**: muda em horas a dias (diferente do intersticial)

### Pneumonia Lobar (Típica)
- **Agente mais comum**: *Streptococcus pneumoniae*
- **RX**: consolidação homogênea densa, respeitando limites lobares (cisuras)
- **Broncograma aéreo**: PRESENTE (ar nos brônquios, alvéolos preenchidos)
- **Localização preferencial**: lobos inferiores
- **Evolução**: pneumonia → hepatização vermelha → hepatização cinza → resolução

> **Caso clínico típico**: Homem de 55 anos, febre alta (39,5°C), tosse com escarro ferrugem (pneumocócica), dor pleurítica. RX: consolidação do lobo inferior direito com broncograma aéreo.

### Broncopneumonia
- **Agentes**: *Staphylococcus aureus*, gram-negativos, anaeróbios
- **RX**: opacidades multifocais, heterogêneas, bilaterais
- **Não respeita limites lobares** (disseminação pelas vias aéreas)
- Complicações mais frequentes: abscesso, pneumatocele, empiema

### Pneumonia Atípica (Intersticial)
- **Agentes**: *Mycoplasma pneumoniae* (mais comum), vírus, *Chlamydia*, *Legionella*
- **RX**: infiltrado intersticial reticular ou reticulonodular, bilateral
- **Dissociação clínico-radiológica**: RX parece grave, paciente parece bem (ou vice-versa)
- Pode evoluir para padrão alveolar

### Pneumonia Redonda
- Opacidade **esférica**, bem delimitada — diagnóstico diferencial com nódulo/massa
- Mais comum em **crianças** (poros de Kohn imaturos)
- Geralmente pneumocócica, boa resposta a ATB

### Pneumonia Aspirativa
- **Localização**: segmentos posteriores dos lobos superiores (deitado) ou segmentos basais dos lobos inferiores (em pé)
- **Fatores de risco**: etilismo, AVC, disfagia, anestesia, DRGE
- **Agentes**: flora mista com anaeróbios → tendência a **abscesso** e **empiema**
- RX: consolidação nos segmentos dependentes (gravitacionais)

### Complicações Radiológicas
| Complicação | RX | Significado |
|------------|-----|------------|
| Derrame parapneumônico | Velamento costofrênico | Laurell > 1cm → puncionar |
| Empiema | Derrame septado, espessamento pleural | Drenagem + ATB |
| Abscesso pulmonar | Cavitação com **nível hidroaéreo** | ATB prolongado ± drenagem |
| Pneumatocele | Cavidade de **paredes finas** | Pós-estafilocócica, observar |`,
          keyPoints: [
            "Consolidação = opacidade homogênea + broncograma aéreo + sinal da silhueta",
            "Pneumonia lobar (S. pneumoniae): respeita cisuras, broncograma aéreo presente",
            "Pneumonia atípica (Mycoplasma): padrão intersticial com dissociação clínico-radiológica",
            "Pneumonia aspirativa: segmentos posteriores superiores (deitado) ou basais inferiores (em pé)",
            "Derrame parapneumônico com Laurell > 1cm → toracocentese obrigatória",
          ],
          clinicalTip: "Pneumonia do lobo superior direito com abaulamento da cisura horizontal ('sinal do lobo pesado') sugere *Klebsiella pneumoniae* — o Friedlander. Clássico em etilistas e diabéticos. Tem tendência a cavitação e alta mortalidade!",
          images: [
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Pneumonia_x-ray.jpg/800px-Pneumonia_x-ray.jpg", caption: "Pneumonia lobar — consolidação densa no lobo inferior direito com broncograma aéreo." },
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Aspiration_pneumonia.jpg/448px-Aspiration_pneumonia.jpg", caption: "Pneumonia aspirativa — opacidade no segmento posterior do lobo superior direito." },
          ],
          quiz: [
            {
              question: "Qual achado radiológico é PATOGNOMÔNICO de consolidação parenquimatosa?",
              options: ["Opacidade homogênea", "Broncograma aéreo", "Sinal da silhueta", "Derrame pleural associado"],
              correctIndex: 1,
              explanation: "O broncograma aéreo (ar nos brônquios dentro de uma opacidade) confirma que a lesão é PARENQUIMATOSA (alvéolos preenchidos), diferenciando de derrame pleural ou massa mediastinal."
            },
            {
              question: "A 'dissociação clínico-radiológica' (paciente pouco sintomático com RX extenso) é clássica de qual tipo de pneumonia?",
              options: ["Pneumonia lobar pneumocócica", "Pneumonia atípica (Mycoplasma)", "Broncopneumonia estafilocócica", "Pneumonia aspirativa"],
              correctIndex: 1,
              explanation: "Na pneumonia por Mycoplasma, o infiltrado intersticial pode parecer extenso no RX, mas o paciente apresenta sintomas leves — tosse seca, estado geral preservado. É a clássica 'pneumonia que anda' (walking pneumonia)."
            },
            {
              question: "Paciente etilista, 50 anos, com pneumonia do lobo superior direito e abaulamento da cisura horizontal. Qual agente é mais provável?",
              options: ["Streptococcus pneumoniae", "Mycoplasma pneumoniae", "Klebsiella pneumoniae", "Staphylococcus aureus"],
              correctIndex: 2,
              explanation: "O 'sinal do lobo pesado' (abaulamento da cisura por edema intenso) é clássico da Klebsiella (Friedlander). Comum em etilistas/diabéticos, com tendência a cavitação e alta mortalidade."
            },
          ],
        },
        {
          id: "rx-2-2",
          title: "Derrame Pleural",
          subtitle: "Detecção, classificação, critérios de Light e armadilhas diagnósticas",
          theory: `## Derrame Pleural — O Achado Mais Comum no RX

### Sensibilidade por Incidência
| Incidência | Volume mínimo detectável |
|-----------|------------------------|
| USG de tórax | > 5 mL (mais sensível!) |
| Laurell (decúbito lateral) | > 10 mL |
| Perfil | > 50 mL |
| PA em ortostase | > 200-300 mL |
| AP (leito) | > 500 mL |

### Sinais Radiológicos — Progressão

#### Derrame Pequeno (200-500 mL)
- **Velamento do seio costofrênico** (sinal mais precoce em PA)
- O ângulo agudo torna-se **obtuso** (borrado)

#### Derrame Moderado (500-1500 mL)
- **Menisco** (curva de Damoiseau): concavidade superior, mais alta lateralmente
- Opacificação parcial do hemitórax

#### Derrame Volumoso (> 1500 mL)
- **Opacificação completa** do hemitórax
- **Desvio do mediastino** para o lado OPOSTO
- Se hemitórax opaco COM desvio mediastinal → derrame
- Se hemitórax opaco SEM desvio → atelectasia total

#### Derrame Subpulmonar
- Líquido se acumula **entre o pulmão e o diafragma**
- Simula **elevação do hemidiafragma**
- Pista: o "pico" do diafragma está mais lateral que o normal
- Confirmação: Laurell (líquido se espalha)

#### Derrame Loculado
- Líquido aprisionado por aderências (empiema, hemotórax organizado)
- **NÃO se move** no Laurell
- Pode simular massa pleural ou pulmonar
- Forma de "fuso" quando em cisura (pseudotumor, tumor fantasma da IC)

### Classificação — Critérios de Light

É **EXSUDATO** se QUALQUER UM dos seguintes:
1. Proteína líquido/sérica > **0,5**
2. LDH líquido/sérica > **0,6**
3. LDH do líquido > **2/3** do limite superior normal sérico

> Se NENHUM critério → **transudato** (fuga de líquido por pressão)

### Etiologia

| Transudato | Exsudato |
|-----------|----------|
| ICC (causa #1!) | Derrame parapneumônico |
| Cirrose/ascite | TB pleural (ADA > 40) |
| Síndrome nefrótica | Neoplasia |
| Hipotireoidismo | TEP |
| Diálise peritoneal | Artrite reumatoide/LES |

### Armadilhas Diagnósticas
- Derrame à **ESQUERDA isolado** na suposta ICC → pensar em outras causas (TB, neoplasia)
- Derrame + **febre** que não melhora com ATB → empiema? TB? Neoplasia com infecção?
- **Líquido sanguinolento** (hemorrágico): neoplasia, TEP, trauma`,
          keyPoints: [
            "PA detecta derrame > 200mL; USG > 5mL (muito mais sensível)",
            "Curva de Damoiseau: concavidade superior, mais alta lateralmente",
            "Hemitórax opaco + desvio contralateral = derrame; SEM desvio = atelectasia",
            "Critérios de Light: qualquer 1 positivo = exsudato",
            "Derrame subpulmonar: simula elevação do diafragma — confirme com Laurell",
          ],
          clinicalTip: "Na IC, o derrame pleural é bilateral em 75% dos casos e isolado à DIREITA em 15%. Derrame isolado à ESQUERDA é atípico para IC — investigue TB, neoplasia ou TEP. Não aceite esse achado como 'só IC'!",
          images: [
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Pleural_effusion.jpg/420px-Pleural_effusion.jpg", caption: "Derrame pleural volumoso à esquerda — opacificação do hemitórax com desvio do mediastino para a direita." },
          ],
          quiz: [
            {
              question: "Hemitórax completamente opaco sem desvio do mediastino. Qual é o diagnóstico mais provável?",
              options: ["Derrame pleural maciço", "Atelectasia total do pulmão", "Consolidação pneumônica extensa", "Hemotórax traumático"],
              correctIndex: 1,
              explanation: "Na atelectasia total, o pulmão colaba e NÃO há efeito de massa (não desvia o mediastino — na verdade pode atrair). No derrame maciço, há efeito de massa com desvio CONTRALATERAL."
            },
            {
              question: "Qual exame é o MAIS sensível para detectar derrame pleural mínimo?",
              options: ["RX PA em ortostase", "RX em perfil", "Incidência de Laurell", "Ultrassonografia de tórax"],
              correctIndex: 3,
              explanation: "A USG de tórax detecta derrames a partir de 5 mL, muito mais sensível que qualquer incidência radiográfica. É o exame de escolha para confirmar e guiar punção."
            },
          ],
        },
        {
          id: "rx-2-3",
          title: "Pneumotórax",
          subtitle: "Diagnóstico, classificação, pneumotórax hipertensivo e condutas",
          theory: `## Pneumotórax — Ar na Cavidade Pleural

### Diagnóstico Radiológico

#### Achados Clássicos
- **Linha pleural visceral** visível: fina linha branca separada da parede torácica
- **Ausência de trama vascular** lateral à linha pleural
- **Hipotransparência** entre a pleura visceral e a parede (ar puro = preto)
- Melhor visualizado em **expiração forçada** (pulmão menor, pneumotórax mais evidente)

#### Onde Procurar
- **Em ortostase**: ÁPICE (ar sobe)
- **Em decúbito (UTI)**: ângulo costofrênico anterior (ar vai para cima = anteromedial)
  - Sinais sutis: **sinal do sulco profundo** (seio costofrênico hiperlucente e profundo)
  - **Nitidez excessiva** da borda cardíaca ou diafragma

### Classificação — Tamanho (Diretriz BTS)

| Tamanho | Critério | Conduta |
|---------|---------|---------|
| Pequeno | < 2 cm do ápice à cúpula pleural | Observação + O₂ suplementar |
| Grande | ≥ 2 cm | Drenagem torácica (5° EIC, linha axilar média) |

> O O₂ suplementar em alta concentração acelera a reabsorção do pneumotórax em até **4x** (gradiente de nitrogênio)

### Pneumotórax Hipertensivo — EMERGÊNCIA CLÍNICA

#### ⚠️ DIAGNÓSTICO É CLÍNICO, NÃO RADIOLÓGICO!
- **Tríade clássica**: hipotensão + dispneia + desvio de traqueia contralateral
- Outros sinais: turgência jugular, MV abolido, enfisema subcutâneo
- **NÃO espere o RX** — trate imediatamente

#### Achados no RX (se realizado)
- Desvio do mediastino para o lado OPOSTO
- Rebaixamento/retificação do hemidiafragma ipsilateral
- Colapso pulmonar completo

#### Tratamento Imediato
1. **Punção descompressiva**: jelco 14G no **2° EIC, linha hemiclavicular** (face anterior)
2. Depois: **drenagem torácica** no 5° EIC, linha axilar média

### Tipos Etiológicos

| Tipo | Causa | Perfil |
|------|-------|--------|
| Primário espontâneo | Ruptura de bolha/bleb subpleural | Homem jovem, alto, magro, tabagista |
| Secundário espontâneo | Doença pulmonar de base (DPOC, fibrose cística, TB) | Paciente pneumopata |
| Traumático | Trauma torácico penetrante/contuso | Fratura de costela |
| Iatrogênico | Punção venosa central, biópsia pleural, ventilação mecânica | Procedimento médico |
| Catamenial | Endometriose pleural/diafragmática | Mulher, coincide com menstruação |

### Hidropneumotórax
- **Ar + líquido** na cavidade pleural simultaneamente
- **Nível hidroaéreo retilíneo** (horizontal) = PATOGNOMÔNICO
- Diferencia de abscesso pulmonar (nível curvo, dentro do parênquima)
- Causas: trauma, fístula broncopleural, drenagem com ar residual`,
          keyPoints: [
            "Linha pleural visceral + ausência de trama distal = pneumotórax",
            "Em decúbito (UTI): procure o sinal do sulco profundo (anteromedial)",
            "Pneumotórax hipertensivo: diagnóstico CLÍNICO — NÃO espere o RX",
            "Punção descompressiva: jelco 14G, 2° EIC, linha hemiclavicular",
            "Hidropneumotórax: nível hidroaéreo retilíneo (horizontal) = patognomônico",
          ],
          clinicalTip: "Na UTI, o pneumotórax é ANTEROMEDIAL (ar sobe com o paciente deitado). O RX AP de leito pode parecer normal! Procure o 'sinal do sulco profundo' — um seio costofrênico anormalmente profundo e hiperlucente. Na dúvida, peça TC ou USG point-of-care.",
          images: [
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Pneumothorax_CXR.jpg/600px-Pneumothorax_CXR.jpg", caption: "Pneumotórax à direita — observe a linha pleural visceral e a ausência de trama vascular lateral." },
          ],
          quiz: [
            {
              question: "Paciente na UTI, em ventilação mecânica, com hipotensão súbita. RX AP mostra seio costofrênico direito anormalmente profundo e hiperlucente. Qual é o diagnóstico?",
              options: ["Derrame pleural subpulmonar", "Pneumotórax anterior (sinal do sulco profundo)", "Atelectasia basal", "Hiperinsuflação por auto-PEEP"],
              correctIndex: 1,
              explanation: "Em decúbito dorsal, o ar do pneumotórax se acumula anteriormente. O 'sinal do sulco profundo' (seio costofrênico profundo e hiperlucente) é o achado mais confiável no RX AP de leito."
            },
            {
              question: "Qual é o local correto para punção descompressiva no pneumotórax hipertensivo?",
              options: ["5° EIC, linha axilar anterior", "2° EIC, linha hemiclavicular", "4° EIC, linha axilar média", "7° EIC, linha axilar posterior"],
              correctIndex: 1,
              explanation: "A punção descompressiva é realizada no 2° espaço intercostal, na linha hemiclavicular, com jelco 14G. É o procedimento de emergência. A drenagem definitiva é feita depois no 5° EIC, linha axilar média."
            },
          ],
        },
        {
          id: "rx-2-4",
          title: "Atelectasia",
          subtitle: "Tipos, sinais diretos e indiretos, diagnóstico diferencial com derrame",
          theory: `## Atelectasia — Colapso Pulmonar

### Definição
Atelectasia é o **colapso parcial ou total** do parênquima pulmonar por perda de aeração. Não é uma doença, mas uma **consequência** de outra patologia.

### Tipos de Atelectasia

| Tipo | Mecanismo | Causa |
|------|-----------|-------|
| **Obstrutiva** (reabsortiva) | Obstrução brônquica → ar reabsorvido | Tumor endobrônquico (#1), corpo estranho, rolha de muco |
| **Compressiva** | Compressão externa do parênquima | Derrame pleural, pneumotórax, massa |
| **Cicatricial** | Fibrose retrai o parênquima | TB, fibrose pulmonar, radioterapia |
| **Adesiva** | Deficiência de surfactante | Síndrome do desconforto respiratório (neonatal), SDRA |
| **Passiva/Relaxamento** | Perda de pressão negativa intrapleural | Pneumotórax |

### Sinais Radiológicos

#### Sinais Diretos
- **Opacidade** na região colapsada
- **Deslocamento da cisura** em direção à atelectasia

#### Sinais Indiretos (efeito de TRAÇÃO)
- **Elevação do hemidiafragma** ipsilateral
- **Desvio do mediastino** para o MESMO lado (diferença crucial com derrame!)
- **Estreitamento dos espaços intercostais** ipsilateral
- **Deslocamento hilar** (para cima se lobo superior, para baixo se inferior)
- **Hiperinsuflação compensatória** do pulmão contralateral

### Padrões por Lobo

#### Lobo Superior Direito
- Opacidade triangular com ápice no hilo
- Cisura menor deslocada para CIMA
- **Sinal do "S" de Golden**: contorno em S da cisura → sugere massa hilar (carcinoma broncogênico)

#### Lobo Médio
- Perda da nitidez da borda cardíaca direita (sinal da silhueta)
- Opacidade tênue em PA, mais evidente no PERFIL

#### Lobo Inferior (D ou E)
- Opacidade triangular retrocardíaca
- Hemidiafragma ipsilateral elevado
- Hilo deslocado para BAIXO

#### Atelectasia Total
- **Hemitórax opaco** com desvio do mediastino para o MESMO lado
- DD: derrame maciço (desvio para o lado OPOSTO)

### Diagnóstico Diferencial Crucial

| Achado | Atelectasia Total | Derrame Maciço |
|--------|-------------------|----------------|
| Hemitórax | Opaco | Opaco |
| Desvio do mediastino | **IPSILATERAL** (puxa) | **CONTRALATERAL** (empurra) |
| Diafragma | Elevado | Rebaixado |
| Espaços intercostais | Estreitados | Alargados |`,
          keyPoints: [
            "Atelectasia obstrutiva: causa #1 em adultos é tumor endobrônquico",
            "Desvio do mediastino para MESMO lado = atelectasia (puxa); lado OPOSTO = derrame (empurra)",
            "Sinal do S de Golden: atelectasia de LSD com contorno em S = carcinoma broncogênico",
            "Atelectasia de lobo médio: perda da silhueta cardíaca direita (sinal da silhueta)",
            "Cisura deslocada em direção à opacidade = sinal direto mais confiável",
          ],
          clinicalTip: "Em adulto tabagista com atelectasia persistente de lobo superior, pense SEMPRE em carcinoma broncogênico até prova em contrário. O 'sinal do S de Golden' (contorno em S da cisura retraída) é clássico e aponta para massa hilar obstrutiva. Solicite broncoscopia!",
          quiz: [
            {
              question: "Hemitórax esquerdo completamente opaco com desvio do mediastino para a ESQUERDA. Qual é o diagnóstico?",
              options: ["Derrame pleural maciço", "Atelectasia total do pulmão esquerdo", "Pneumonia extensa", "Hemotórax traumático"],
              correctIndex: 1,
              explanation: "Desvio do mediastino para o MESMO LADO da opacidade indica TRAÇÃO (atelectasia). No derrame, o mediastino é EMPURRADO para o lado oposto."
            },
            {
              question: "Atelectasia do lobo superior direito com contorno em 'S' da cisura (sinal do S de Golden). Qual é a etiologia mais provável?",
              options: ["Rolha de muco pós-cirúrgica", "Carcinoma broncogênico hilar", "Corpo estranho endobrônquico", "Tuberculose endobrônquica"],
              correctIndex: 1,
              explanation: "O sinal do S de Golden descreve o contorno côncavo-convexo da cisura: a parte côncava é a cisura retraída pelo colapso, e a parte convexa é a MASSA hilar que obstrui o brônquio. É clássico do carcinoma broncogênico."
            },
          ],
        },
      ],
    },
    {
      id: "rx-cardiopulm",
      title: "Cardiopulmonar",
      description: "Insuficiência cardíaca, DPOC, edema e hipertensão pulmonar no RX.",
      icon: "❤️",
      lessons: [
        {
          id: "rx-3-1",
          title: "Insuficiência Cardíaca no RX",
          subtitle: "Congestão pulmonar progressiva, edema alveolar, mnemônico ABCDE",
          theory: `## Sinais de IC no RX de Tórax — Progressão

A congestão pulmonar na IC segue uma progressão previsível que se correlaciona com a **pressão capilar pulmonar (PCP)**:

### Estágio 1 — Redistribuição de Fluxo (PCP 12-18 mmHg)
- **Cefalização vascular**: vasos dos ápices tornam-se calibrosos
- Normalmente, vasos das bases são maiores que dos ápices (gravidade)
- Na congestão, há **inversão**: ápices = bases ou ápices > bases
- É o sinal **MAIS PRECOCE** de congestão

### Estágio 2 — Edema Intersticial (PCP 18-25 mmHg)
- **Linhas B de Kerley**: linhas horizontais finas (1-2 cm) nas BASES, perpendiculares à pleura
  - Representam septos interlobulares espessados por edema
  - Presentes em apenas 20-30% dos casos (sensibilidade baixa!)
- **Cuffing peribronquial**: espessamento da parede brônquica (halo ao redor dos brônquios em corte transversal)
- **Borramento peribroncovascular**: perda da nitidez dos vasos hilares
- **Espessamento de cisuras**: líquido nas cisuras interlobares

### Estágio 3 — Edema Alveolar (PCP > 25 mmHg)
- **Opacidade bilateral em "asa de borboleta"** (perihilar, poupando a periferia)
  - Distribuição central porque a drenagem linfática é mais eficiente na periferia
- **Consolidação alveolar difusa**: pode ter broncograma aéreo
- **Aspecto algodonoso**: opacidades flocosas bilaterais

### Outros Achados da IC
- **Cardiomegalia**: ICT > 0,50 em PA
- **Derrame pleural**: bilateral (75%), isolado à D (15%), isolado à E (10%)
  - Derrame isolado à E → questione o diagnóstico de IC!
- **Aumento do pedículo vascular**: > 70 mm (medido na altura do arco aórtico)
- **Pseudotumor** (tumor fantasma): derrame loculado em cisura → desaparece com diurético

### Mnemônico "ABCDE" da IC no RX
- **A** — Alveolar edema (asa de borboleta)
- **B** — B-lines de Kerley (septos interlobulares espessados)
- **C** — Cardiomegalia (ICT > 0,50)
- **D** — Derrame pleural (bilateral, mais à D)
- **E** — Equalização/cefalização dos vasos

### IC Direita vs IC Esquerda no RX

| Achado | IC Esquerda | IC Direita |
|--------|------------|------------|
| Congestão pulmonar | SIM (venocapilar) | NÃO (campos limpos) |
| Cardiomegalia | Sim (VE dilatado) | Sim (VD dilatado) |
| Derrame pleural | Sim | Sim |
| VCS alargada | Não | Sim |
| Veia ázigos ingurgitada | Não | Sim (> 10mm em ortostase) |`,
          keyPoints: [
            "Cefalização vascular é o sinal MAIS PRECOCE de congestão (PCP 12-18 mmHg)",
            "Linhas B de Kerley = edema intersticial (septos interlobulares, bases, horizontais)",
            "Asa de borboleta = edema alveolar (PCP > 25 mmHg)",
            "Mnemônico: ABCDE (Alveolar, B-lines, Cardiomegalia, Derrame, Equalização)",
            "Derrame isolado à esquerda é ATÍPICO para IC — investigue!",
          ],
          clinicalTip: "O 'tumor fantasma' é um derrame loculado em cisura que simula massa pulmonar no RX. Desaparece magicamente com diurético na IC compensada. Se a 'massa' some no RX de controle pós-diurético, é pseudotumor — não peça biópsia!",
          images: [
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Pulmonary_edema.jpg/800px-Pulmonary_edema.jpg", caption: "Edema pulmonar cardiogênico — opacidade bilateral em 'asa de borboleta' com cardiomegalia." },
          ],
          quiz: [
            {
              question: "Qual é o achado radiológico MAIS PRECOCE da congestão pulmonar na IC?",
              options: ["Linhas B de Kerley", "Edema alveolar em asa de borboleta", "Cefalização vascular (redistribuição de fluxo)", "Derrame pleural bilateral"],
              correctIndex: 2,
              explanation: "A cefalização vascular surge com PCP entre 12-18 mmHg — é o primeiro sinal. As linhas de Kerley aparecem com PCP 18-25 mmHg e o edema alveolar só com PCP > 25 mmHg."
            },
            {
              question: "Na IC, o derrame pleural é mais frequentemente:",
              options: ["Unilateral à esquerda", "Unilateral à direita", "Bilateral (ou unilateral à direita)", "Ausente na maioria dos casos"],
              correctIndex: 2,
              explanation: "O derrame da IC é bilateral em 75% e isolado à direita em 15%. Isso ocorre pela anatomia do ducto torácico e drenagem linfática. Derrame isolado à ESQUERDA deve levantar suspeita de TB, neoplasia ou TEP."
            },
          ],
        },
        {
          id: "rx-3-2",
          title: "DPOC e Hiperinsuflação",
          subtitle: "Enfisema, sinais de hiperinsuflação e cor pulmonale",
          theory: `## DPOC no RX de Tórax

O RX na DPOC pode ser **normal** nos estágios iniciais. Os achados são mais evidentes no enfisema do que na bronquite crônica.

### Sinais de Hiperinsuflação (Enfisema)

#### Achados no PA
- **Pulmões hiperinsuflados**: campos pulmonares hipertransparentes
- **Retificação dos hemidiafragmas**: perdem a convexidade normal
- **> 7 arcos costais anteriores** acima do diafragma
- **Coração em gota** (verticalizado): diâmetro transversal reduzido
- **Alargamento dos espaços intercostais**
- **Rarefação vascular periférica**: vasos finos e espaçados

#### Achados no Perfil
- **Aumento do diâmetro AP** do tórax ("tórax em barril")
- **Aumento do espaço retroesternal** (> 3 cm entre esterno e aorta ascendente)
- **Retificação diafragmática**: em perfil é mais evidente

### Bolhas de Enfisema
- Áreas de destruição parenquimatosa com **paredes finas**
- Podem ser **gigantes** (ocupando > 1/3 do hemitórax)
- Risco de pneumotórax espontâneo
- DD com pneumotórax: as bolhas têm paredes visíveis e vasos ao redor

### Bronquite Crônica no RX
- **Espessamento de paredes brônquicas** ("trilhos de trem" no PA, "anéis de sinete" no perfil)
- **Hilos ingurgitados**: vasos calibrosos (hipertensão pulmonar associada)
- "Pulmão sujo": aumento da trama broncovascular

### Cor Pulmonale (IC Direita por Doença Pulmonar)
- **Artérias pulmonares centrais dilatadas** (tronco AP > 29 mm)
- **Rarefação vascular periférica** (vasos centrais grandes, periferia pobre = "poda vascular")
- **Cardiomegalia às custas do VD**: borda cardíaca esquerda formada pelo VD (não VE)
- **VCS e veia ázigos ingurgitadas**`,
          keyPoints: [
            "Hiperinsuflação: diafragma retificado, > 7 arcos costais, pulmões hipertransparentes",
            "Coração em gota (verticalizado) é clássico do enfisema",
            "Espaço retroesternal > 3 cm no perfil = hiperinsuflação",
            "Cor pulmonale: artérias centrais dilatadas + rarefação periférica (poda vascular)",
            "Bronquite crônica: espessamento brônquico ('trilhos de trem') + pulmão sujo",
          ],
          clinicalTip: "Paciente com DPOC e RX mostrando consolidação que não resolve com ATB → pense em carcinoma broncogênico. O tabagismo é fator de risco para ambos! Todo paciente com DPOC e opacidade persistente merece investigação com TC e/ou broncoscopia.",
          quiz: [
            {
              question: "Qual achado radiológico NÃO é esperado na hiperinsuflação pulmonar por enfisema?",
              options: ["Retificação dos hemidiafragmas", "Coração em gota", "Opacidade alveolar bilateral", "Aumento do espaço retroesternal"],
              correctIndex: 2,
              explanation: "O enfisema causa hiperinsuflação com campos hipertransparentes (mais pretos, não mais brancos). Opacidade alveolar bilateral sugere edema, pneumonia ou hemorragia — achados opostos ao enfisema."
            },
          ],
        },
      ],
    },
    {
      id: "rx-advanced",
      title: "Diagnósticos Avançados",
      description: "Tuberculose, nódulos pulmonares, TEP e armadilhas de prova.",
      icon: "🎯",
      lessons: [
        {
          id: "rx-4-1",
          title: "Tuberculose Pulmonar",
          subtitle: "TB primária, pós-primária, miliar — padrões radiológicos e diagnósticos diferenciais",
          theory: `## TB no RX de Tórax — O Diagnóstico Mais Cobrado

### TB Primária (Primo-infecção)
- **Complexo de Ranke**: nódulo parenquimatoso (nódulo de Ghon) + linfadenopatia hilar ipsilateral
- **Mais comum em crianças** e adolescentes (primeiro contato)
- O nódulo pode estar em **qualquer lobo** (não tem predileção — diferente da reativação!)
- **Linfadenopatia hilar unilateral** é a apresentação mais frequente na criança
- Geralmente **autolimitada** com calcificação residual (complexo de Ranke calcificado)

### TB Pós-Primária (Reativação/Adulto)
- **Localização clássica**: segmentos **apicais e posteriores** dos lobos superiores (segmentos 1 e 2)
- Também frequente no segmento superior do lobo inferior (segmento 6 de Nelson)

#### Padrões Radiológicos
| Padrão | Descrição |
|--------|-----------|
| Infiltrado fibronodular apical | Opacidades heterogêneas nos ápices — achado mais precoce |
| **Cavitação** | Cavidade com paredes **espessas e irregulares** — forma MAIS BACILÍFERA |
| Consolidação com broncograma | Pode simular pneumonia bacteriana |
| Disseminação broncogênica | Nódulos acinares no lobo contralateral ("árvore em brotamento" na TC) |
| Tuberculoma | Nódulo solitário, geralmente calcificado, estável |

#### Sequelas
- Fibrose e retração apical com desvio mediastinal
- Bronquiectasias de tração
- Calcificações parenquimatosas e linfonodais
- Bola fúngica (aspergiloma) dentro de caverna residual

### TB Miliar
- **Micronódulos difusos** (1-3 mm) bilaterais, uniformes
- Padrão **"grãos de areia"** distribuídos homogeneamente
- Disseminação **hematogênica**
- Mais comum em **imunossuprimidos** (HIV com CD4 < 200, corticoterapia prolongada)
- ⚠️ Pode ter **RX normal** inicialmente — TC é mais sensível!

### TB Pleural
- Derrame pleural **unilateral** (geralmente direito)
- Exsudato com **predomínio linfocítico** (> 80%)
- **ADA > 40 U/L** = fortemente sugestivo (sensibilidade ~90%)
- Mais comum em **adultos jovens** (primeira forma extrapulmonar mais frequente)

### TB e HIV — Padrões Atípicos

| CD4 | Padrão Radiológico |
|-----|-------------------|
| > 350 | Clássico (cavitação apical) |
| 200-350 | Transição — pode ser clássico ou atípico |
| < 200 | ATÍPICO: infiltrado difuso, adenopatia hilar, miliar, OU **RX normal com BAAR+** |

### Diagnósticos Diferenciais da Cavitação Apical
- **Tuberculose** (mais comum)
- Carcinoma escamoso (parede espessa, irregular)
- Abscesso pulmonar (nível hidroaéreo)
- Granulomatose de Wegener (GPA)
- Aspergiloma (bola fúngica dentro da cavidade — "sinal do crescente aéreo")`,
          keyPoints: [
            "TB primária: complexo de Ranke (nódulo de Ghon + linfonodomegalia hilar) — qualquer lobo",
            "TB pós-primária: cavitação em ápices dos lobos superiores (segmentos 1 e 2) — forma mais bacilífera",
            "TB miliar: micronódulos difusos bilaterais uniformes — pode ter RX normal inicial",
            "ADA > 40 U/L no líquido pleural = fortemente sugestivo de TB pleural",
            "HIV com CD4 < 200: TB atípica — infiltrado difuso, miliar ou RX normal com BAAR+",
          ],
          clinicalTip: "Em paciente com HIV e CD4 < 200, NÃO espere RX clássico de TB. A TB pode se apresentar com infiltrado difuso bilateral, adenopatia mediastinal ou até RX COMPLETAMENTE NORMAL com baciloscopia positiva. Na dúvida, peça TC e colete escarro.",
          images: [
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Tuberculosis-x-ray-1.jpg/800px-Tuberculosis-x-ray-1.jpg", caption: "TB pós-primária — cavitação no lobo superior direito com infiltrado fibronodular apical bilateral." },
            { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Miliary_tuberculosis.jpg/450px-Miliary_tuberculosis.jpg", caption: "TB miliar — micronódulos difusos bilaterais uniformes ('grãos de areia')." },
          ],
          quiz: [
            {
              question: "Qual é a forma radiológica MAIS BACILÍFERA da tuberculose pulmonar?",
              options: ["TB miliar com micronódulos difusos", "TB com cavitação apical", "TB primária com complexo de Ranke", "TB pleural com derrame unilateral"],
              correctIndex: 1,
              explanation: "A forma cavitária é a mais bacilífera — a caverna está em comunicação direta com as vias aéreas, permitindo grande eliminação de bacilos. Por isso é a forma mais CONTAGIOSA."
            },
            {
              question: "Paciente HIV+ com CD4 = 80 apresenta febre, tosse e RX de tórax NORMAL. A baciloscopia do escarro é positiva. Isso é possível?",
              options: ["Não — TB sempre altera o RX", "Sim — com CD4 < 200 a resposta imune não forma granuloma", "Não — provavelmente é outra micobactéria", "Sim — mas apenas na TB extrapulmonar"],
              correctIndex: 1,
              explanation: "Com CD4 < 200, a imunidade celular está tão comprometida que não forma granulomas adequados — a TB se dissemina sem produzir os achados radiológicos clássicos. O RX pode ser normal mesmo com baciloscopia positiva!"
            },
            {
              question: "Na TB pleural, qual exame do líquido é mais utilizado para diagnóstico presuntivo?",
              options: ["pH do líquido < 7,20", "Glicose do líquido < 60 mg/dL", "ADA (adenosina deaminase) > 40 U/L", "Proteína do líquido > 3 g/dL"],
              correctIndex: 2,
              explanation: "A ADA > 40 U/L tem sensibilidade ~90% e especificidade ~92% para TB pleural no Brasil (área endêmica). É o exame mais utilizado para diagnóstico presuntivo, junto com o predomínio linfocítico."
            },
          ],
        },
        {
          id: "rx-4-2",
          title: "Nódulo Pulmonar Solitário",
          subtitle: "Critérios de benignidade vs malignidade, conduta e seguimento",
          theory: `## Nódulo Pulmonar Solitário (NPS)

### Definição
- Opacidade **arredondada**, **< 3 cm**, completamente circundada por parênquima pulmonar aerado
- **> 3 cm** = MASSA (maior probabilidade de malignidade)
- Sem atelectasia, derrame pleural ou adenopatia associada

### Critérios Radiológicos — Benigno vs Maligno

| Característica | Sugere BENIGNO | Sugere MALIGNO |
|---------------|---------------|----------------|
| Tamanho | < 2 cm | > 2 cm (especialmente > 3 cm) |
| Bordas | **Lisas**, bem definidas | **Espiculadas**, irregulares ("corona radiata") |
| Calcificação | Central, laminar, em pipoca, difusa | Excêntrica ou ausente |
| Crescimento | Estável > 2 anos | **Tempo de duplicação 20-400 dias** |
| Cavitação | Paredes finas (< 4 mm) | Paredes espessas (> 15 mm) |
| Idade | < 35 anos | > 50 anos, tabagista |
| Densidade | Sólido com gordura (hamartoma) | Sólido ou parcialmente sólido (vidro fosco) |

### Padrões de Calcificação

#### Calcificações BENIGNAS (padrão típico)
- **Central/target**: granuloma (TB, histoplasmose)
- **Laminar/concêntrica**: granuloma cicatricial
- **Em pipoca/popcorn**: **hamartoma** (tumor benigno mais comum do pulmão)
- **Difusa/homogênea**: granuloma antigo

#### Calcificação SUSPEITA
- **Excêntrica**: tumor que engloba granuloma pré-existente
- **Pontilhada/amorfa**: calcificação distrófica em tumor

### Conduta Prática (Fleischner Society)

| Tamanho | Baixo risco | Alto risco (tabagista > 50a) |
|---------|------------|---------------------------|
| < 6 mm | Sem seguimento | TC em 12 meses |
| 6-8 mm | TC em 6-12 meses | TC em 6-12 meses + considerar PET |
| > 8 mm | TC em 3 meses, PET ou biópsia | PET-CT ± biópsia |

### Causas Principais

#### Benignas (~60%)
- Granuloma infeccioso (TB, histoplasmose) — mais comum!
- Hamartoma (gordura + calcificação em pipoca = patognomônico)
- Cisto broncogênico

#### Malignas (~40%)
- Carcinoma broncogênico primário
- Metástase solitária (cólon, rim, melanoma, sarcoma)
- Carcinoide brônquico`,
          keyPoints: [
            "Nódulo < 3 cm; massa > 3 cm (maior risco de malignidade)",
            "Bordas espiculadas ('corona radiata') = alta suspeita de malignidade",
            "Calcificação em pipoca = hamartoma (tumor benigno mais comum do pulmão)",
            "Estável > 2 anos = provavelmente benigno (exceto vidro fosco!)",
            "Tempo de duplicação de 20-400 dias = compatível com malignidade",
          ],
          clinicalTip: "A calcificação em 'pipoca' é PATOGNOMÔNICA do hamartoma — o tumor benigno mais comum do pulmão. Se a TC mostrar gordura + calcificação popcorn, o diagnóstico está feito sem biópsia. Qualquer outro padrão de calcificação excêntrica ou amorfa é suspeito!",
          quiz: [
            {
              question: "Nódulo pulmonar solitário de 2,5 cm com bordas espiculadas ('corona radiata') em tabagista de 60 anos. Qual a conduta mais adequada?",
              options: ["Observação com RX em 6 meses", "PET-CT e/ou biópsia", "Antibioticoterapia empírica por 30 dias", "TC de controle em 12 meses"],
              correctIndex: 1,
              explanation: "Nódulo > 2 cm com bordas espiculadas em tabagista > 50 anos tem alta probabilidade de malignidade. A conduta é investigação ativa com PET-CT (avalia metabolismo) e/ou biópsia percutânea/broncoscopia."
            },
            {
              question: "Qual padrão de calcificação é PATOGNOMÔNICO do hamartoma?",
              options: ["Central (target)", "Laminar concêntrica", "Em pipoca (popcorn)", "Excêntrica irregular"],
              correctIndex: 2,
              explanation: "A calcificação em pipoca (popcorn) + presença de gordura na TC é patognomônica do hamartoma — o tumor benigno mais comum do pulmão. Não necessita biópsia quando achado típico."
            },
          ],
        },
        {
          id: "rx-4-3",
          title: "Armadilhas de Prova",
          subtitle: "Erros comuns, pegadinhas clássicas e sinais menos conhecidos",
          theory: `## Armadilhas Clássicas no RX de Tórax

### 1. Cardiomegalia em AP
- O RX AP **magnifica o coração em ~20%**
- ⚠️ **NUNCA** laude cardiomegalia em AP sem correlação clínica
- Na prova: se o RX é AP e perguntam sobre ICT → a resposta é "não avaliável"

### 2. Derrame Subpulmonar
- Simula **elevação do hemidiafragma**
- Pista: o "pico" do diafragma aparente está **mais lateral** que o normal
- Confirmação: Laurell mostra líquido livre

### 3. Pneumotórax em Decúbito (UTI)
- Ar vai para **anterior e medial** (não para o ápice!)
- O RX AP pode parecer **completamente normal**
- Procure: sinal do sulco profundo, nitidez excessiva da borda cardíaca
- Na dúvida: USG ou TC

### 4. "Pulmão Branco" — Atelectasia vs Derrame
- **COM desvio ipsilateral**: atelectasia (puxa o mediastino)
- **COM desvio contralateral**: derrame maciço (empurra o mediastino)
- **SEM desvio**: pensar em consolidação extensa, SDRA ou combinação

### 5. Alargamento de Mediastino no AP
- Em AP, o mediastino parece **naturalmente mais largo**
- Correlacionar com clínica de dissecção/aneurisma antes de alarmar
- Em trauma: mediastino > 8 cm em PA pode sugerir ruptura de aorta

### 6. Tumor Fantasma (Pseudotumor)
- Derrame **loculado em cisura** na IC descompensada
- Simula massa pulmonar ou nódulo
- Desaparece com **diurético** (se repetir RX)
- Na prova: "massa" que some no RX de controle = tumor fantasma

### 7. Mama e Mastectomia
- Mama volumosa pode causar **assimetria de transparência** simulando opacidade
- Mastectomia prévia: hemitórax ipsilateral mais **transparente** (parece hiperinsuflado)
- Compare sempre as partes moles antes de interpretar campos pulmonares

### 8. Efeito Mach
- Banda escura na interface entre coração e pulmão
- Artefato óptico → pode simular pneumomediastino ou pneumopericárdio
- Não confundir com ar real no mediastino

### 9. Corpo Estranho Radiolucente
- Nem todo CE é visível no RX (plásticos, alimentos)
- Procure sinais INDIRETOS: atelectasia, hiperinsuflação por mecanismo de válvula, desvio mediastinal
- **Sinal de Holzknecht**: na expiração, o mediastino se desvia para o lado NORMAL (ar preso do lado do CE)

### 10. Sinal de Hampton (TEP)
- Opacidade **triangular** de base pleural (cunha) — infarto pulmonar
- Sinal específico, mas pouco sensível
- **Westermark**: oligoemia focal (área hipertransparente distal ao êmbolo)
- RX normal NÃO descarta TEP!`,
          keyPoints: [
            "Cardiomegalia em AP: NÃO avaliável — magnificação de ~20%",
            "Pulmão branco + desvio ipsilateral = atelectasia; desvio contralateral = derrame",
            "Tumor fantasma: derrame loculado em cisura que some com diurético",
            "TEP: RX pode ser NORMAL; sinal de Hampton (cunha pleural) e Westermark (oligoemia focal)",
            "Corpo estranho radiolucente: busque sinais indiretos (atelectasia, hiperinsuflação unilateral)",
          ],
          clinicalTip: "Na prova, quando mostrarem RX com 'hemitórax opaco', a primeira pergunta é: para onde desvia o mediastino? IPSILATERAL = atelectasia (puxa). CONTRALATERAL = derrame (empurra). SEM desvio = consolidação maciça ou combinação de ambos. Essa é a resposta de 90% das questões sobre pulmão branco.",
          quiz: [
            {
              question: "RX de tórax PA mostra uma opacidade arredondada na cisura horizontal direita. Após tratamento com diurético, a opacidade desaparece. Qual é o diagnóstico?",
              options: ["Pneumonia redonda", "Hamartoma", "Tumor fantasma (pseudotumor)", "Carcinoma broncogênico"],
              correctIndex: 2,
              explanation: "O tumor fantasma (pseudotumor) é derrame pleural loculado em cisura, clássico da IC descompensada. Desaparece completamente com diurético — diferente de massas reais."
            },
            {
              question: "Criança com história de engasgo, RX mostra desvio do mediastino para a ESQUERDA durante a expiração forçada. Onde está o corpo estranho?",
              options: ["Brônquio fonte esquerdo", "Brônquio fonte direito", "Traqueia", "Esôfago"],
              correctIndex: 1,
              explanation: "O sinal de Holzknecht: na expiração, o mediastino se desvia para o lado NORMAL. Se desvia para a esquerda, o ar está aprisionado à DIREITA (mecanismo de válvula pelo CE no brônquio direito). O brônquio fonte direito é mais verticalizado e mais frequentemente acometido."
            },
            {
              question: "Paciente com dor torácica e dispneia súbita. RX mostra uma área de hipertransparência focal no lobo inferior direito (Westermark) e opacidade triangular de base pleural (Hampton). Qual é o diagnóstico mais provável?",
              options: ["Pneumonia lobar", "Tromboembolismo pulmonar", "Pneumotórax localizado", "Enfisema bolhoso"],
              correctIndex: 1,
              explanation: "O sinal de Westermark (oligoemia focal) + sinal de Hampton (opacidade triangular = infarto pulmonar) são clássicos do TEP. Porém, o RX é normal em ~50% dos casos de TEP — angio-TC é o padrão-ouro!"
            },
          ],
        },
      ],
    },
  ],
};
