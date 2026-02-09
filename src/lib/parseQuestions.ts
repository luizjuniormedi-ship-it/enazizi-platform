/**
 * Parses AI-generated question text (CESPE or multiple choice) into structured data.
 * Handles both markdown-bold and plain-text formats.
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

  // Split by question markers — supports:
  // **Questão:** / **Questão 1:** / Questão 01 / Questão: etc.
  const blocks = text.split(/\*{0,2}Questão\s*\d*\s*:?\s*\*{0,2}/i).slice(1);

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
  // Extract explanation — supports **Explicação:** and Explicação:
  const explMatch = block.match(/\*{0,2}Explicação\s*:?\s*\*{0,2}\s*([\s\S]*?)$/i);
  const explanation = explMatch?.[1]?.trim().replace(/^\*{1,2}\s*/, "") || "";

  // Extract correct answer — supports **Gabarito:** and Gabarito:
  const gabMatch = block.match(/\*{0,2}Gabarito\s*:?\s*\*{0,2}\s*(.+)/i);
  const gabText = gabMatch?.[1]?.trim().replace(/\*+/g, "").toLowerCase() || "";

  // Check if it's CESPE (Certo/Errado)
  const isCespe = /\(\s*\)\s*certo\s*\(\s*\)\s*errado/i.test(block);

  if (isCespe) {
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

  // Multiple choice
  const optionMatches = block.match(/^[a-e]\)\s*.+/gim);
  if (optionMatches && optionMatches.length >= 2) {
    const firstOptIdx = block.search(/^[a-e]\)\s*/im);
    const statement = block.slice(0, firstOptIdx).trim();
    const options = optionMatches.map((o) => o.replace(/^[a-e]\)\s*/i, "").trim());

    const letterMatch = gabText.match(/([a-e])/i);
    const correctIndex = letterMatch ? letterMatch[1].toLowerCase().charCodeAt(0) - 97 : 0;

    if (!statement) return null;

    return { statement, options, correctIndex, explanation };
  }

  return null;
}
