/**
 * Parses AI-generated question text (CESPE or multiple choice) into structured data.
 * Handles both markdown-bold and plain-text formats, with or without brackets.
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

  // Split into blocks by Tópico or Questão markers using lookahead
  const blockRegex = /(?=\*{0,2}(?:Tópico|Questão)\s*\d*\s*:?\s*\*{0,2})/gi;
  const rawBlocks = text.split(blockRegex).filter((b) => b.trim());

  // Merge Tópico-only blocks with their following Questão block
  const merged: string[] = [];
  for (let i = 0; i < rawBlocks.length; i++) {
    const b = rawBlocks[i].trim();
    const hasQuestion = /\(\s*\)\s*certo/i.test(b) || /^[a-e]\)\s/im.test(b);
    if (!hasQuestion && /^\*{0,2}Tópico/i.test(b) && i + 1 < rawBlocks.length) {
      // Merge topic block with next block
      merged.push(b + "\n" + rawBlocks[i + 1]);
      i++; // skip next
    } else if (hasQuestion) {
      merged.push(b);
    }
  }

  for (const raw of merged) {
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
  // Extract topic — supports: **Tópico:** X, Tópico: X, Tópico: [X]
  const topicMatch = block.match(/\*{0,2}Tópico\s*:?\s*\*{0,2}\s*\[?\s*([^\]\n]+)\s*\]?/i);
  let topic: string | undefined;
  if (topicMatch) {
    const raw = topicMatch[1].trim().replace(/\*+/g, "").replace(/\]$/, "");
    if (raw.length > 0 && raw.length < 80 && !/\?\s*$/.test(raw)) {
      topic = raw;
    }
  }

  // Extract explanation
  const explMatch = block.match(/\*{0,2}Explicação\s*:?\s*\*{0,2}\s*([\s\S]*?)$/i);
  const explanation = explMatch?.[1]?.trim().replace(/^\*{1,2}\s*/, "") || "";

  // Extract correct answer
  const gabMatch = block.match(/\*{0,2}Gabarito\s*:?\s*\*{0,2}\s*(.+)/i);
  const gabText = gabMatch?.[1]?.trim().replace(/\*+/g, "").toLowerCase() || "";

  // Check if it's CESPE (Certo/Errado)
  const isCespe = /\(\s*\)\s*certo\s*\(\s*\)\s*errado/i.test(block);

  if (isCespe) {
    let statement = block.split(/\(\s*\)\s*certo/i)[0].trim();
    // Remove topic and questão header lines from statement
    statement = statement.replace(/\*{0,2}Tópico\s*:?\s*\*{0,2}\s*\[?[^\]\n]*\]?\s*\n?/gi, "");
    statement = statement.replace(/\*{0,2}Questão\s*\d*\s*:?\s*\*{0,2}\s*/gi, "");
    statement = statement.trim();
    if (!statement) return null;

    const correctIndex = gabText.includes("certo") ? 0 : 1;
    return { statement, options: ["Certo", "Errado"], correctIndex, explanation, topic };
  }

  // Multiple choice
  const optionMatches = block.match(/^[a-e]\)\s*.+/gim);
  if (optionMatches && optionMatches.length >= 2) {
    const firstOptIdx = block.search(/^[a-e]\)\s*/im);
    let statement = block.slice(0, firstOptIdx).trim();
    statement = statement.replace(/\*{0,2}Tópico\s*:?\s*\*{0,2}\s*\[?[^\]\n]*\]?\s*\n?/gi, "");
    statement = statement.replace(/\*{0,2}Questão\s*\d*\s*:?\s*\*{0,2}\s*/gi, "");
    statement = statement.trim();
    const options = optionMatches.map((o) => o.replace(/^[a-e]\)\s*/i, "").trim());

    const letterMatch = gabText.match(/([a-e])/i);
    const correctIndex = letterMatch ? letterMatch[1].toLowerCase().charCodeAt(0) - 97 : 0;

    if (!statement) return null;
    return { statement, options, correctIndex, explanation, topic };
  }

  return null;
}
