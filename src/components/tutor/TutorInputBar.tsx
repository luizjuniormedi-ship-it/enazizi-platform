import { Send, Loader2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TutorInputBarProps {
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  onSend: () => void;
  isListening?: boolean;
  hasSpeechRecognition?: boolean;
  onToggleListening?: () => void;
}

const TutorInputBar = ({
  input, setInput, isLoading, onSend,
  isListening, hasSpeechRecognition, onToggleListening,
}: TutorInputBarProps) => (
  <div className="flex gap-2">
    <Input
      placeholder={isListening ? "Ouvindo..." : "Sua resposta ou dúvida..."}
      className="bg-background/60 backdrop-blur-sm border-border/60 text-sm h-10 sm:h-11 rounded-xl"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onSend()}
      disabled={isLoading}
    />
    {hasSpeechRecognition && onToggleListening && (
      <Button
        onClick={onToggleListening}
        size="icon"
        variant="ghost"
        className={`flex-shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all ${
          isListening
            ? "text-destructive ring-2 ring-destructive/60 animate-pulse bg-destructive/10"
            : "text-muted-foreground hover:text-foreground"
        }`}
        disabled={isLoading}
      >
        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
    )}
    <Button onClick={onSend} size="icon" className="glow flex-shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" disabled={isLoading || !input.trim()}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
    </Button>
  </div>
);

export default TutorInputBar;
