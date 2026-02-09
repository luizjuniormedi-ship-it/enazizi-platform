/**
 * Parses AI-generated question text (CESPE or multiple choice) into structured data.
 * Handles various AI output formats with or without markdown.
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

  // Split by numbered question markers: "Questão 01", "**Questão 1:**", etc.
  // Use lookahead so each block starts with its marker.
  const parts = text.split(/(?=\*{0,2}Questão\s*\d+\s*:?\s*\*{0,2})/gi).filter((b) => b.trim());

  for (const part of parts) {
    // Must contain answer options to be a real question block
    if (!/\(\s*\)\s*certo/i.test(part) && !/^[a-e]\)\s/im.test(part)) continue;
    try {
      const q = parseBlock(part.trim());
      if (q) questions.push(q);
    } catch {
      // skip
    }
  }

  return questions;
}

function parseBlock(block: string): ParsedQuestion | null {
  // Extract topic — many formats:
  // Tópico: X / **Tópico:** X / Tópico: [X] / **Tópico:** [X]
  const topicMatch = block.match(/\*{0,2}Tópico\s*:?\s*\*{0,2}\s*\[?\s*([^\]\n]+?)\s*\]?\s*(?:\n|$)/i);
  let topic: string | undefined;
  if (topicMatch) {
    const raw = topicMatch[1].trim().replace(/\*+/g, "");
    if (raw.length > 0 && raw.length < 80) {
      topic = raw;
    }
  }

  // Extract explanation
  const explMatch = block.match(/\*{0,2}Explicação\s*:?\s*\*{0,2}\s*([\s\S]*?)$/i);
  const explanation = explMatch?.[1]?.trim().replace(/^\*{1,2}\s*/, "") || "";

  // Extract gabarito
  const gabMatch = block.match(/\*{0,2}Gabarito\s*:?\s*\*{0,2}\s*(.+)/i);
  const gabText = gabMatch?.[1]?.trim().replace(/\*+/g, "").toLowerCase() || "";

  // CESPE (Certo/Errado)
  const isCespe = /\(\s*\)\s*certo\s*\(\s*\)\s*errado/i.test(block);

  if (isCespe) {
    let statement = block.split(/\(\s*\)\s*certo/i)[0].trim();
    // Clean: remove header lines (Questão X, Tópico, Questão:)
    statement = cleanStatement(statement);
    if (!statement) return null;

    const correctIndex = gabText.includes("certo") ? 0 : 1;
    return { statement, options: ["Certo", "Errado"], correctIndex, explanation, topic };
  }

  // Multiple choice
  const optionMatches = block.match(/^[a-e]\)\s*.+/gim);
  if (optionMatches && optionMatches.length >= 2) {
    const firstOptIdx = block.search(/^[a-e]\)\s*/im);
    let statement = block.slice(0, firstOptIdx).trim();
    statement = cleanStatement(statement);
    const options = optionMatches.map((o) => o.replace(/^[a-e]\)\s*/i, "").trim());

    const letterMatch = gabText.match(/([a-e])/i);
    const correctIndex = letterMatch ? letterMatch[1].toLowerCase().charCodeAt(0) - 97 : 0;

    if (!statement) return null;
    return { statement, options, correctIndex, explanation, topic };
  }

  return null;
}

/** Remove header lines (Questão N, Tópico, Questão:) from statement text */
function cleanStatement(text: string): string {
  return text
    .replace(/\*{0,2}Questão\s*\d*\s*:?\s*\*{0,2}\s*/gi, "")
    .replace(/\*{0,2}Tópico\s*:?\s*\*{0,2}\s*\[?[^\]\n]*\]?\s*/gi, "")
    .trim();
}
