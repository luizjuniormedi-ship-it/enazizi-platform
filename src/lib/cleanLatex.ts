/**
 * Limpa resíduos de LaTeX de textos de questões.
 * Aplicado no client-side para questões já salvas no banco.
 */
export function cleanLatex(text: string): string {
  if (!text) return text;
  let cleaned = text;

  // LaTeX inline math: $( 8 3 + 8 4 )$ → (83+84)
  // Also handles $. 3 8 %$ → 38%  and $1 4 8 ~ \times ~ 9 0$ → 148×90
  cleaned = cleaned.replace(/\$([^$]{1,120})\$/g, (_m, inner: string) => {
    let r = inner.trim();
    // Remove spacing artifacts between digits: "8 3" → "83", ". 3 8" → ".38"
    r = r.replace(/(\d)\s+(\d)/g, '$1$2');
    r = r.replace(/(\d)\s+(\d)/g, '$1$2'); // second pass for chains like "1 4 8"
    r = r.replace(/\.\s+(\d)/g, '.$1'); // ". 3 8" → ".38"
    r = r.replace(/\\times/g, '×');
    r = r.replace(/\\%/g, '%');
    r = r.replace(/~/g, '');
    r = r.replace(/\\text\{([^}]*)\}/g, '$1');
    r = r.replace(/\\mathrm\{([^}]*)\}/g, '$1');
    r = r.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2');
    r = r.replace(/\\,/g, ' ');
    r = r.replace(/\\;/g, ' ');
    r = r.replace(/\\quad/g, ' ');
    r = r.replace(/\\leq/g, '≤');
    r = r.replace(/\\geq/g, '≥');
    r = r.replace(/\\pm/g, '±');
    r = r.replace(/\\degree/g, '°');
    r = r.replace(/\\circ/g, '°');
    r = r.replace(/\\approx/g, '≈');
    r = r.replace(/\\neq/g, '≠');
    r = r.replace(/\\infty/g, '∞');
    r = r.replace(/\\alpha/g, 'α');
    r = r.replace(/\\beta/g, 'β');
    r = r.replace(/\\gamma/g, 'γ');
    r = r.replace(/\\delta/g, 'δ');
    r = r.replace(/\\mu/g, 'μ');
    r = r.replace(/\\_/g, '_');
    r = r.replace(/\\\\/g, '');
    r = r.replace(/\\/g, '');
    // Clean remaining multiple spaces
    r = r.replace(/\s{2,}/g, ' ').trim();
    return r;
  });

  // Standalone LaTeX commands outside $...$
  cleaned = cleaned.replace(/\\times\b/g, '×');
  cleaned = cleaned.replace(/\\%/g, '%');
  cleaned = cleaned.replace(/\\textit\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/\\textbf\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/\\emph\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/\\text\{([^}]*)\}/g, '$1');

  // Stray dollar signs that weren't matched (unbalanced)
  cleaned = cleaned.replace(/\$\s*([^$]{1,6})\s*\$/g, '$1');

  return cleaned;
}
