/**
 * Limpa resíduos de LaTeX de textos de questões.
 * Aplicado no client-side para questões já salvas no banco.
 */
export function cleanLatex(text: string): string {
  if (!text) return text;
  let cleaned = text;

  // LaTeX inline math: $(83+84)$ → (83+84)
  cleaned = cleaned.replace(/\$([^$]{1,80})\$/g, (_m, inner: string) => {
    let r = inner.trim().replace(/\s+/g, '');
    r = r.replace(/\\times/g, '×');
    r = r.replace(/\\%/g, '%');
    r = r.replace(/~/g, '');
    r = r.replace(/\\text\{([^}]*)\}/g, '$1');
    r = r.replace(/\\mathrm\{([^}]*)\}/g, '$1');
    r = r.replace(/\\,/g, ' ');
    r = r.replace(/\\/g, '');
    return r;
  });

  // Standalone LaTeX commands
  cleaned = cleaned.replace(/\\times\b/g, '×');
  cleaned = cleaned.replace(/\\%/g, '%');
  cleaned = cleaned.replace(/\\textit\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/\\textbf\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/\\emph\{([^}]*)\}/g, '$1');

  return cleaned;
}
