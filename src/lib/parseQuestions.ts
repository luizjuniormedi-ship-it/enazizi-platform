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

  // Split by Tópico or Questão markers — each block should contain one question.
  // We split on "Tópico" first (since it comes before Questão), falling back to "Questão".
  // Use a lookahead-like approach: split on lines starting with Tópico or Questão markers.
  const blockRegex = /(?=\*{0,2}(?:Tópico|Questão)\s*\d*\s*:?\s*\*{0,2})/gi;
  const rawBlocks = text.split(blockRegex).filter((b) => b.trim());

  for (const raw of rawBlocks) {
    // Skip blocks that don't contain a question indicator (Certo/Errado or a-e options)
    if (!/\(\s*\)\s*certo/i.test(raw) && !/^[a-e]\)\s/im.test(raw)) continue;
    try {
      const q = parseBlock(raw.trim());
      if (q) questions.push(q);
    } catch {
      // skip unparseable blocks
    }
  }

  return questions;
}

function parseBlock(block: string): ParsedQuestion | null {
  // Extract topic — only accept short, clean topic strings
  const topicMatch = block.match(/\*{0,2}Tópico\s*:?\s*\*{0,2}\s*(.+)/i);
  let topic: string | undefined;
  if (topicMatch) {
    const raw = topicMatch[1].trim().replace(/\*+/g, "");
    // Only keep if it looks like a real topic (< 80 chars, no question-like text)
    if (raw.length > 0 && raw.length < 80 && !/\?\s*$/.test(raw)) {
      topic = raw;
    }
  }

  // Extract explanation — supports **Explicação:** and Explicação:
  const explMatch = block.match(/\*{0,2}Explicação\s*:?\s*\*{0,2}\s*([\s\S]*?)$/i);
  const explanation = explMatch?.[1]?.trim().replace(/^\*{1,2}\s*/, "") || "";

  // Extract correct answer — supports **Gabarito:** and Gabarito:
  const gabMatch = block.match(/\*{0,2}Gabarito\s*:?\s*\*{0,2}\s*(.+)/i);
  const gabText = gabMatch?.[1]?.trim().replace(/\*+/g, "").toLowerCase() || "";

  // Check if it's CESPE (Certo/Errado)
  const isCespe = /\(\s*\)\s*certo\s*\(\s*\)\s*errado/i.test(block);

  if (isCespe) {
    let statement = block.split(/\(\s*\)\s*certo/i)[0].trim();
    // Remove topic line from statement
    statement = statement.replace(/\*{0,2}Tópico\s*:?\s*\*{0,2}\s*.+\n?/i, "").trim();
    if (!statement) return null;

    const correctIndex = gabText.includes("certo") ? 0 : 1;

    return { statement, options: ["Certo", "Errado"], correctIndex, explanation, topic };
  }

  // Multiple choice
  const optionMatches = block.match(/^[a-e]\)\s*.+/gim);
  if (optionMatches && optionMatches.length >= 2) {
    const firstOptIdx = block.search(/^[a-e]\)\s*/im);
    let statement = block.slice(0, firstOptIdx).trim();
    statement = statement.replace(/\*{0,2}Tópico\s*:?\s*\*{0,2}\s*.+\n?/i, "").trim();
    const options = optionMatches.map((o) => o.replace(/^[a-e]\)\s*/i, "").trim());

    const letterMatch = gabText.match(/([a-e])/i);
    const correctIndex = letterMatch ? letterMatch[1].toLowerCase().charCodeAt(0) - 97 : 0;

    if (!statement) return null;

    return { statement, options, correctIndex, explanation, topic };
  }

  return null;
}
