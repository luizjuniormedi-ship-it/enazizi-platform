import { Send, Loader2, Mic, MicOff, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TutorInputBarProps {
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  hasSpeechRecognition: boolean;
  onSend: () => void;
  onToggleListening: () => void;
  onStopSpeaking: () => void;
}

const TutorInputBar = ({
  input, setInput, isLoading, isSpeaking, isListening,
  hasSpeechRecognition, onSend, onToggleListening, onStopSpeaking,
}: TutorInputBarProps) => (
  <div className="flex gap-2">
    {hasSpeechRecognition && (
      <Button
        variant={isListening ? "destructive" : "outline"}
        size="icon"
        className={`flex-shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-xl ${isListening ? "animate-pulse" : ""}`}
        onClick={onToggleListening}
        title={isListening ? "Parar gravação" : "Falar"}
      >
        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
    )}
    <Input
      placeholder="Sua resposta ou dúvida..."
      className="bg-background/60 backdrop-blur-sm border-border/60 text-sm h-10 sm:h-11 rounded-xl"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onSend()}
      disabled={isLoading}
    />
    {isSpeaking && (
      <Button variant="outline" size="icon" className="flex-shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-xl" onClick={onStopSpeaking} title="Parar fala">
        <VolumeX className="h-4 w-4" />
      </Button>
    )}
    <Button onClick={onSend} size="icon" className="glow flex-shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" disabled={isLoading || !input.trim()}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
    </Button>
  </div>
);

export default TutorInputBar;
