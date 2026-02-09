/**
 * Parses AI-generated question text (CESPE or multiple choice) into structured data.
 */

export interface ParsedQuestion {
  statement: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic?: string;
}

export function parseQuestionsFromText(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];

  // Split by question markers: **Questão:** or **Questão X:**
  const blocks = text.split(/\*\*Questão[^:]*:\*\*/i).slice(1);

  for (const block of blocks) {
    try {
      const q = parseBlock(block.trim());
      if (q) questions.push(q);
    } catch {
      // skip unparseable blocks
    }
  }

  return questions;
}

function parseBlock(block: string): ParsedQuestion | null {
  // Extract explanation
  const explMatch = block.match(/\*\*Explicação:\*\*\s*([\s\S]*?)$/i);
  const explanation = explMatch?.[1]?.trim() || "";

  // Extract correct answer
  const gabMatch = block.match(/\*\*Gabarito:\*\*\s*(.+)/i);
  const gabText = gabMatch?.[1]?.trim().toLowerCase() || "";

  // Check if it's CESPE (Certo/Errado)
  const isCespe = /\(\s*\)\s*certo\s*\(\s*\)\s*errado/i.test(block);

  if (isCespe) {
    // CESPE style
    const statement = block.split(/\(\s*\)\s*certo/i)[0].trim();
    if (!statement) return null;

    const correctIndex = gabText.includes("certo") ? 0 : 1;

    return {
      statement,
      options: ["Certo", "Errado"],
      correctIndex,
      explanation,
    };
  }

  // Multiple choice - extract options
  const optionMatches = block.match(/^[a-e]\)\s*.+/gim);
  if (optionMatches && optionMatches.length >= 2) {
    // Statement is everything before the first option
    const firstOptIdx = block.search(/^[a-e]\)\s*/im);
    const statement = block.slice(0, firstOptIdx).trim();

    const options = optionMatches.map((o) => o.replace(/^[a-e]\)\s*/i, "").trim());

    // Determine correct index from gabarito letter
    const letterMatch = gabText.match(/^([a-e])/i);
    const correctIndex = letterMatch ? letterMatch[1].toLowerCase().charCodeAt(0) - 97 : 0;

    if (!statement) return null;

    return {
      statement,
      options,
      correctIndex,
      explanation,
    };
  }

  return null;
}
