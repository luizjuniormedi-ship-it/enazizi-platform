import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import InteractiveQuestionCard from "@/components/agents/InteractiveQuestionCard";
import { parseQuestionsFromMarkdown } from "@/components/agents/InteractiveQuestionRenderer";

/**
 * Maps emoji-prefixed headings to colour accents for immersive section styling.
 */
const SECTION_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  "🩺": { bg: "bg-blue-500/5", border: "border-l-blue-400", icon: "🩺" },
  "🧠": { bg: "bg-purple-500/5", border: "border-l-purple-400", icon: "🧠" },
  "⚡": { bg: "bg-yellow-500/5", border: "border-l-yellow-400", icon: "⚡" },
  "⚠️": { bg: "bg-amber-500/5", border: "border-l-amber-400", icon: "⚠️" },
  "📉": { bg: "bg-red-500/5", border: "border-l-red-400", icon: "📉" },
  "🚨": { bg: "bg-red-500/5", border: "border-l-red-500", icon: "🚨" },
  "⚖️": { bg: "bg-emerald-500/5", border: "border-l-emerald-400", icon: "⚖️" },
  "💥": { bg: "bg-orange-500/5", border: "border-l-orange-400", icon: "💥" },
  "🌅": { bg: "bg-sky-500/5", border: "border-l-sky-400", icon: "🌅" },
  "📚": { bg: "bg-indigo-500/5", border: "border-l-indigo-400", icon: "📚" },
  "🔬": { bg: "bg-teal-500/5", border: "border-l-teal-400", icon: "🔬" },
  "📝": { bg: "bg-violet-500/5", border: "border-l-violet-400", icon: "📝" },
  "🔥": { bg: "bg-orange-500/5", border: "border-l-orange-500", icon: "🔥" },
  "🎯": { bg: "bg-emerald-500/5", border: "border-l-emerald-500", icon: "🎯" },
  "🚀": { bg: "bg-sky-500/5", border: "border-l-sky-500", icon: "🚀" },
  "🌸": { bg: "bg-pink-500/5", border: "border-l-pink-400", icon: "🌸" },
  "⏱️": { bg: "bg-cyan-500/5", border: "border-l-cyan-400", icon: "⏱️" },
  "✅": { bg: "bg-green-500/5", border: "border-l-green-500", icon: "✅" },
  "❌": { bg: "bg-red-500/5", border: "border-l-red-400", icon: "❌" },
};

function getSectionStyle(text: string) {
  for (const [emoji, style] of Object.entries(SECTION_STYLES)) {
    if (text.includes(emoji)) return style;
  }
  return null;
}

/**
 * Split chronicle text into visually distinct "sections" based on markdown headings
 * or horizontal rules, then render each with appropriate styling.
 */
function splitIntoSections(content: string): string[] {
  // Split on lines that start with ## or ### or --- (section separators)
  const lines = content.split("\n");
  const sections: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    const isHeading = /^#{1,4}\s/.test(line.trim());
    const isHr = /^-{3,}$/.test(line.trim());

    if ((isHeading || isHr) && current.length > 0) {
      const joined = current.join("\n").trim();
      if (joined) sections.push(joined);
      current = [];
    }

    if (!isHr) {
      current.push(line);
    }
  }

  if (current.length > 0) {
    const joined = current.join("\n").trim();
    if (joined) sections.push(joined);
  }

  return sections;
}

interface Props {
  content: string;
}

const ChronicleRenderer = ({ content }: Props) => {
  // First check for interactive questions
  const { segments } = parseQuestionsFromMarkdown(content);
  const hasQuestions = segments.some((s) => s.type === "question");

  // If there are interactive questions, render them inline within the styled sections
  const sections = splitIntoSections(content);

  if (sections.length <= 1 && !hasQuestions) {
    // Fallback for very short/streaming content — just render nicely
    return (
      <div className="chronicle-content prose prose-base dark:prose-invert max-w-none leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  let qIdx = 0;

  return (
    <div className="chronicle-content space-y-4">
      {hasQuestions ? (
        // Render with interactive questions
        segments.map((seg, i) => {
          if (seg.type === "question" && seg.question) {
            const idx = qIdx++;
            return <InteractiveQuestionCard key={`q-${i}`} question={seg.question} index={idx} />;
          }
          if (seg.type === "text" && seg.content) {
            const innerSections = splitIntoSections(seg.content);
            return (
              <div key={`t-${i}`} className="space-y-4">
                {innerSections.map((sec, j) => (
                  <SectionBlock key={j} content={sec} />
                ))}
              </div>
            );
          }
          return null;
        })
      ) : (
        // Render sections with visual styling
        sections.map((sec, i) => <SectionBlock key={i} content={sec} />)
      )}
    </div>
  );
};

const SectionBlock = ({ content }: { content: string }) => {
  const firstLine = content.split("\n")[0] || "";
  const style = getSectionStyle(firstLine);

  // Check if this is a "pausa didática" or table-heavy section
  const isTable = content.includes("|") && content.split("\n").filter(l => l.includes("|")).length >= 3;
  const isPausa = firstLine.toLowerCase().includes("pausa") || firstLine.includes("⚖️");

  if (style) {
    return (
      <div className={`rounded-xl border-l-4 ${style.border} ${style.bg} p-4 sm:p-5 transition-all`}>
        <div className="prose prose-base dark:prose-invert max-w-none leading-relaxed
          [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
          prose-headings:text-base prose-headings:sm:text-lg prose-headings:font-bold prose-headings:mb-3
          prose-p:my-2.5 prose-p:text-sm prose-p:sm:text-base prose-p:leading-7
          prose-ul:my-3 prose-ol:my-3 prose-li:my-1.5
          prose-li:text-sm prose-li:sm:text-base
          prose-blockquote:border-l-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-3
          prose-strong:text-foreground
          prose-table:text-xs prose-table:sm:text-sm
          prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2
          prose-td:px-3 prose-td:py-2 prose-td:border-border
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  if (isTable || isPausa) {
    return (
      <div className="rounded-xl border border-border/50 bg-muted/30 p-4 sm:p-5 overflow-x-auto">
        <div className="prose prose-base dark:prose-invert max-w-none leading-relaxed
          [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
          prose-p:my-2.5 prose-p:text-sm prose-p:sm:text-base prose-p:leading-7
          prose-table:text-xs prose-table:sm:text-sm prose-table:w-full
          prose-th:bg-primary/10 prose-th:px-3 prose-th:py-2 prose-th:text-primary prose-th:font-semibold
          prose-td:px-3 prose-td:py-2 prose-td:border-border
          prose-strong:text-foreground
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  // Default section
  return (
    <div className="px-1 sm:px-2">
      <div className="prose prose-base dark:prose-invert max-w-none leading-relaxed
        [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
        prose-headings:text-base prose-headings:sm:text-lg prose-headings:font-bold prose-headings:mb-3 prose-headings:mt-2
        prose-p:my-2.5 prose-p:text-sm prose-p:sm:text-base prose-p:leading-7
        prose-ul:my-3 prose-ol:my-3 prose-li:my-1.5
        prose-li:text-sm prose-li:sm:text-base
        prose-strong:text-foreground
        prose-blockquote:border-l-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-3
      ">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default ChronicleRenderer;
