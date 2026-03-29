import { forwardRef } from "react";
import { User, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import tutorAvatar from "@/assets/tutor-avatar-hd.png";
import MultimediaControls from "@/components/agents/MultimediaControls";
import type { Msg } from "@/components/tutor/TutorConstants";

/** Convert bare URLs in text to markdown links so ReactMarkdown renders them clickable */
function linkifyBareUrls(text: string): string {
  // Don't touch URLs already inside markdown link syntax [text](url)
  return text.replace(
    /(?<!\]\()(?<!\()(https?:\/\/[^\s\)>\]]+)/g,
    (url) => `[${url.includes('pubmed') ? 'Ver no PubMed' : url.includes('doi.org') ? 'Ver DOI' : 'Abrir link'}](${url})`
  );
}

interface TutorMessageListProps {
  messages: Msg[];
  isLoading: boolean;
  onCopy: (text: string) => void;
}

const TutorMessageList = forwardRef<HTMLDivElement, TutorMessageListProps>(
  ({ messages, isLoading, onCopy }, ref) => (
    <div ref={ref} className="flex-1 rounded-xl border border-border/50 bg-card/50 p-2 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 mb-2 sm:mb-3 min-h-0 pattern-dots">
      {messages.map((msg, i) => (
        <div key={i} className={`flex gap-2 sm:gap-3 ${msg.role === "user" ? "justify-end" : ""} animate-fade-in`}>
          {msg.role === "assistant" && (
            <div className="h-12 w-9 sm:h-14 sm:w-11 rounded-xl overflow-hidden flex-shrink-0 tutor-glow bot-breathing ring-1 ring-primary/25 shadow-md">
              <img src={tutorAvatar} alt="Tutor" className="h-full w-full object-contain" />
            </div>
          )}
          <div className={`rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm leading-relaxed relative group ${
            msg.role === "user"
              ? "max-w-[85%] sm:max-w-[75%] bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
              : "w-full bg-secondary/80 backdrop-blur-sm text-secondary-foreground relative gradient-border-subtle"
          }`}>
            {msg.role === "assistant" ? (
              <>
                <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-xs sm:text-sm prose-p:my-3 prose-headings:mt-5 prose-headings:mb-2 prose-ul:my-3 prose-ol:my-3 prose-li:my-1 [&_p:has(+ul)]:mb-1 [&_p:has(+ol)]:mb-1 [&>p+p]:mt-4 [&_strong]:text-foreground [&_hr]:my-4 [&_blockquote]:my-3">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children, ...props }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80" {...props}>{children}</a>
                      ),
                    }}
                  >{linkifyBareUrls(msg.content)}</ReactMarkdown>
                </div>
                <MultimediaControls text={msg.content} />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button onClick={() => onCopy(msg.content)} className="p-1.5 rounded-lg hover:bg-background/50 backdrop-blur-sm" title="Copiar">
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </>
            ) : (
              <span className="whitespace-pre-wrap">{msg.content}</span>
            )}
          </div>
          {msg.role === "user" && (
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          )}
        </div>
      ))}
      {isLoading && messages[messages.length - 1]?.role === "user" && (
        <div className="flex gap-2 sm:gap-3 animate-fade-in">
          <div className="h-12 w-9 sm:h-14 sm:w-11 rounded-xl overflow-hidden flex-shrink-0 tutor-glow bot-breathing ring-1 ring-primary/25 shadow-md">
            <img src={tutorAvatar} alt="Tutor" className="h-full w-full object-contain" />
          </div>
          <div className="rounded-xl px-4 py-3 bg-secondary/80 backdrop-blur-sm">
            <div className="flex gap-1.5 items-center">
              <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
);

TutorMessageList.displayName = "TutorMessageList";

export default TutorMessageList;
