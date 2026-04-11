/**
 * Mnemonic List Optimizer — improves item quality for stronger mnemonics.
 * Runs AFTER autoComplete, BEFORE generation.
 * Pure local logic — no AI calls, no clinical meaning distortion.
 */

// ══════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════

export interface OptimizeParams {
  topic: string;
  subtopic?: string;
  items: string[];
}

export interface OptimizeResult {
  optimizedItems: string[];
  changes: string[];
  score: number;
}

// ══════════════════════════════════════════════════
// SHORTENING MAP — verbose → concise (preserves meaning)
// ══════════════════════════════════════════════════

const SHORTENING_RULES: Array<[RegExp, string]> = [
  // ECG / Cardio
  [/^presenca de supra de st$/i, "Supra ST"],
  [/^supra de st$/i, "Supra ST"],
  [/^supradesnivelamento de st$/i, "Supra ST"],
  [/^elevacao de st$/i, "Supra ST"],
  [/^alteracao da onda t$/i, "Inversão T"],
  [/^inversao de onda t$/i, "Inversão T"],
  [/^inversao da onda t$/i, "Inversão T"],
  [/^onda t invertida$/i, "Inversão T"],
  [/^onda q patologica$/i, "Onda Q"],
  [/^presenca de onda q$/i, "Onda Q"],
  [/^q patologica$/i, "Onda Q"],
  [/^bloqueio atrioventricular de 1o? grau$/i, "BAV 1º grau"],
  [/^bloqueio av de primeiro grau$/i, "BAV 1º grau"],
  [/^pr prolongado$/i, "PR prolongado"],
  [/^taquicardia ventricular$/i, "TV"],
  [/^taquicardia supraventricular$/i, "TSV"],
  [/^fibrilacao atrial$/i, "FA"],
  [/^fibrilacao ventricular$/i, "FV"],
  [/^flutter atrial$/i, "Flutter atrial"],

  // AVC
  [/^deficit neurologico focal$/i, "Déficit focal"],
  [/^sintomas focais agudos$/i, "Déficit focal"],
  [/^tempo de inicio dos sintomas$/i, "Tempo de início"],
  [/^tempo de inicio$/i, "Tempo de início"],
  [/^imagem inicial \(tc de cranio\)$/i, "TC de crânio"],
  [/^imagem inicial$/i, "TC de crânio"],
  [/^nivel de consciencia$/i, "Nível consciência"],
  [/^rebaixamento de consciencia$/i, "Rebaixamento"],

  // Sepse
  [/^hipotensao arterial$/i, "Hipotensão"],
  [/^lactato elevado$/i, "Lactato elevado"],
  [/^disfuncao organica$/i, "Disfunção orgânica"],
  [/^disfuncao de orgaos$/i, "Disfunção orgânica"],

  // Genéricos longos
  [/^insuficiencia cardiaca congestiva$/i, "ICC"],
  [/^tromboembolismo pulmonar$/i, "TEP"],
  [/^doenca pulmonar obstrutiva cronica$/i, "DPOC"],
  [/^sindrome coronariana aguda$/i, "SCA"],
  [/^edema agudo de pulmao$/i, "EAP"],
  [/^acidente vascular cerebral$/i, "AVC"],
];

// ══════════════════════════════════════════════════
// WEAK / GENERIC ITEMS — to flag or replace
// ══════════════════════════════════════════════════

const WEAK_ITEMS = new Set([
  "exame", "exame fisico", "avaliar", "avaliacao", "avaliacao clinica",
  "investigar", "investigacao", "conduta", "tratamento", "acompanhamento",
  "observar", "monitorizar", "verificar", "checar",
]);

// ══════════════════════════════════════════════════
// EXAM PRIORITY ORDER — per topic
// ══════════════════════════════════════════════════

interface PriorityMap {
  patterns: RegExp[];
  order: string[]; // normalized concept keywords, highest priority first
}

const EXAM_PRIORITY: PriorityMap[] = [
  {
    patterns: [/\biam\b/, /\becg\b.*\biam\b/, /\binfarto\b/],
    order: ["supra", "onda q", "inversao", "infra", "bloqueio", "arritmia"],
  },
  {
    patterns: [/\bavc\b/, /\bacidente vascular\b/],
    order: ["deficit", "tempo", "tc", "imagem", "consciencia", "cefaleia", "sangramento"],
  },
  {
    patterns: [/\bsepse\b/, /\bsepsis\b/],
    order: ["lactato", "hipotensao", "disfuncao", "febre", "leucocit", "taquicardia"],
  },
  {
    patterns: [/\bkillip\b/],
    order: ["killip i", "killip ii", "killip iii", "killip iv"],
  },
  {
    patterns: [/\bjones\b/, /\bfebre reumatica\b/],
    order: ["cardite", "artrite", "coreia", "eritema", "nodulo"],
  },
];

// ══════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shortenItem(item: string): { shortened: string; changed: boolean } {
  const norm = normalize(item);
  for (const [pattern, replacement] of SHORTENING_RULES) {
    if (pattern.test(norm)) {
      return { shortened: replacement, changed: replacement !== item };
    }
  }
  return { shortened: item, changed: false };
}

function isWeak(item: string): boolean {
  return WEAK_ITEMS.has(normalize(item));
}

function getExamPriority(topic: string): string[] | null {
  const normTopic = normalize(topic);
  for (const pm of EXAM_PRIORITY) {
    if (pm.patterns.some((p) => p.test(normTopic))) return pm.order;
  }
  return null;
}

function priorityIndex(item: string, order: string[]): number {
  const norm = normalize(item);
  for (let i = 0; i < order.length; i++) {
    if (norm.includes(order[i])) return i;
  }
  return order.length; // unknown items go last
}

function getInitial(item: string): string {
  const clean = item.replace(/^[^a-zA-ZÀ-ÿ]/, "").trim();
  return clean.charAt(0).toUpperCase();
}

// ══════════════════════════════════════════════════
// SCORING
// ══════════════════════════════════════════════════

function scoreList(items: string[], topic: string): number {
  let score = 50; // baseline

  // +10 for ideal count (3-6)
  if (items.length >= 3 && items.length <= 6) score += 10;

  // +10 for no weak items
  if (!items.some(isWeak)) score += 10;

  // +10 for short items (avg <= 20 chars)
  const avgLen = items.reduce((s, i) => s + i.length, 0) / items.length;
  if (avgLen <= 20) score += 10;

  // +10 for diverse initials
  const initials = new Set(items.map(getInitial));
  const diversityRatio = initials.size / items.length;
  if (diversityRatio >= 0.6) score += 10;
  else if (diversityRatio >= 0.4) score += 5;

  // +10 for exam priority alignment
  const order = getExamPriority(topic);
  if (order) {
    const covered = items.filter((i) => priorityIndex(i, order) < order.length).length;
    const coverage = covered / Math.min(items.length, order.length);
    score += Math.round(coverage * 10);
  } else {
    score += 5; // neutral if no priority map
  }

  return Math.min(100, Math.max(0, score));
}

// ══════════════════════════════════════════════════
// MAIN FUNCTION
// ══════════════════════════════════════════════════

export function optimizeMnemonicItems(params: OptimizeParams): OptimizeResult {
  const { topic, items } = params;
  const changes: string[] = [];
  let working = [...items];

  // 1. SHORTEN — make items concise
  working = working.map((item, i) => {
    const { shortened, changed } = shortenItem(item);
    if (changed) changes.push(`"${items[i]}" → "${shortened}"`);
    return shortened;
  });

  // 2. REMOVE WEAK — flag generic items
  const filtered = working.filter((item) => {
    if (isWeak(item)) {
      changes.push(`Removido item genérico: "${item}"`);
      return false;
    }
    return true;
  });
  // Only apply removal if we still have >= 3 items
  if (filtered.length >= 3) {
    working = filtered;
  }

  // 3. DEDUPLICATE after shortening (shortening might collapse two items)
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const item of working) {
    const key = normalize(item);
    if (seen.has(key)) {
      changes.push(`Duplicata removida após otimização: "${item}"`);
      continue;
    }
    seen.add(key);
    deduped.push(item);
  }
  working = deduped;

  // 4. SORT by exam priority
  const order = getExamPriority(topic);
  if (order) {
    working.sort((a, b) => priorityIndex(a, order) - priorityIndex(b, order));
    changes.push("Itens reordenados por prioridade de prova");
  }

  // 5. INITIAL COLLISION mitigation — if >2 items share initial, log warning
  const initialCounts = new Map<string, number>();
  for (const item of working) {
    const init = getInitial(item);
    initialCounts.set(init, (initialCounts.get(init) || 0) + 1);
  }
  for (const [init, count] of initialCounts) {
    if (count > 2) {
      changes.push(`Aviso: ${count} itens começam com "${init}" — pode dificultar mnemônico`);
    }
  }

  // 6. SCORE
  const score = scoreList(working, topic);

  return {
    optimizedItems: working,
    changes: changes.length > 0 ? changes : [],
    score,
  };
}
