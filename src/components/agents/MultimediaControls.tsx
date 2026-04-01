import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, VolumeX, Pause, Play, RotateCcw, Film, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type MediaStatus, generateAudio, generateAvatar } from "@/lib/multimediaService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CinematicAvatar from "@/components/agents/CinematicAvatar";

interface MultimediaControlsProps {
  text: string;
  compact?: boolean;
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 2] as const;

export default function MultimediaControls({ text, compact }: MultimediaControlsProps) {
  // Audio state
  const [audioStatus, setAudioStatus] = useState<MediaStatus>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [audioError, setAudioError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Avatar state
  const [avatarStatus, setAvatarStatus] = useState<MediaStatus>("idle");
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState("");

  const hasTTS = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  const cleanText = useCallback((t: string) => {
    return t
      .replace(/[#*_`~>\-|]/g, "")
      .replace(/\[.*?\]\(.*?\)/g, "")
      .replace(/\n{2,}/g, ". ");
  }, []);

  // ─── AUDIO ───────────────────────────────────────────────

  const playAudio = useCallback(() => {
    if (!hasTTS) return;
    window.speechSynthesis.cancel();
    const clean = cleanText(text);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "pt-BR";
    utterance.rate = speed;
    utterance.onstart = () => { setIsPlaying(true); setIsPaused(false); setAudioStatus("ready"); };
    utterance.onend = () => { setIsPlaying(false); setIsPaused(false); };
    utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); setAudioError("Erro na reprodução"); setAudioStatus("error"); };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [text, speed, hasTTS, cleanText]);

  const handleListenClick = useCallback(() => {
    if (audioStatus === "idle") {
      generateAudio(text, (status, _url, error) => {
        setAudioStatus(status);
        if (error) setAudioError(error);
        if (status === "ready") playAudio();
      });
    } else {
      playAudio();
    }
  }, [audioStatus, text, playAudio]);

  const pauseAudio = useCallback(() => { window.speechSynthesis?.pause(); setIsPaused(true); }, []);
  const resumeAudio = useCallback(() => { window.speechSynthesis?.resume(); setIsPaused(false); }, []);
  const stopAudio = useCallback(() => { window.speechSynthesis?.cancel(); setIsPlaying(false); setIsPaused(false); }, []);
  const repeatAudio = useCallback(() => { stopAudio(); setTimeout(() => playAudio(), 100); }, [stopAudio, playAudio]);

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      const idx = SPEED_OPTIONS.indexOf(prev as any);
      const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
      if (isPlaying) {
        window.speechSynthesis?.cancel();
        setTimeout(() => {
          const clean = cleanText(text);
          const utterance = new SpeechSynthesisUtterance(clean);
          utterance.lang = "pt-BR";
          utterance.rate = next;
          utterance.onstart = () => { setIsPlaying(true); setIsPaused(false); };
          utterance.onend = () => { setIsPlaying(false); setIsPaused(false); };
          utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); };
          utteranceRef.current = utterance;
          window.speechSynthesis.speak(utterance);
        }, 50);
      }
      return next;
    });
  }, [isPlaying, text, cleanText]);

  // ─── CINEMATIC AVATAR ──────────────────────────────────

  const handleAvatarClick = useCallback(() => {
    if (avatarStatus === "idle") {
      generateAvatar(text, (status, _url, error) => {
        setAvatarStatus(status);
        if (error) setAvatarError(error);
        if (status === "ready") setShowAvatarModal(true);
      });
    } else {
      setShowAvatarModal(true);
    }
  }, [avatarStatus, text]);

  const startAvatarNarration = useCallback(() => {
    if (!hasTTS) return;
    window.speechSynthesis.cancel();
    const clean = cleanText(text);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "pt-BR";
    utterance.rate = speed;

    utterance.onstart = () => {
      setAvatarSpeaking(true);
      setCurrentSubtitle("");
    };
    utterance.onboundary = (e) => {
      if (e.name === "word") {
        // Show ~8 words around current position as subtitle
        const words = clean.split(/\s+/);
        const charsSoFar = e.charIndex;
        let wordIdx = 0;
        let charCount = 0;
        for (let i = 0; i < words.length; i++) {
          charCount += words[i].length + 1;
          if (charCount >= charsSoFar) { wordIdx = i; break; }
        }
        const start = Math.max(0, wordIdx - 2);
        const end = Math.min(words.length, wordIdx + 6);
        setCurrentSubtitle(words.slice(start, end).join(" "));
      }
    };
    utterance.onend = () => { setAvatarSpeaking(false); setCurrentSubtitle(""); };
    utterance.onerror = () => { setAvatarSpeaking(false); setCurrentSubtitle(""); };

    window.speechSynthesis.speak(utterance);
  }, [text, speed, hasTTS, cleanText]);

  const stopAvatarNarration = useCallback(() => {
    window.speechSynthesis?.cancel();
    setAvatarSpeaking(false);
    setCurrentSubtitle("");
  }, []);

  // Auto-start narration when modal opens
  useEffect(() => {
    if (showAvatarModal && avatarStatus === "ready" && !avatarSpeaking) {
      const timer = setTimeout(startAvatarNarration, 400);
      return () => clearTimeout(timer);
    }
  }, [showAvatarModal]); // intentionally minimal deps

  const handleCloseAvatarModal = useCallback(() => {
    stopAvatarNarration();
    setShowAvatarModal(false);
  }, [stopAvatarNarration]);

  if (!hasTTS) return null;

  const statusIcon = (status: MediaStatus, error: string | null) => {
    if (status === "generating") return <Loader2 className="h-3 w-3 animate-spin" />;
    if (status === "error") return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild><AlertCircle className="h-3 w-3 text-destructive" /></TooltipTrigger>
          <TooltipContent className="text-xs">{error || "Erro"}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    return null;
  };

  return (
    <>
      {/* Inline controls bar */}
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/30">
        {/* Listen button */}
        {!isPlaying ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[10px] sm:text-xs gap-1 text-muted-foreground hover:text-primary"
            onClick={handleListenClick}
            disabled={audioStatus === "generating"}
          >
            {audioStatus === "generating" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Volume2 className="h-3 w-3" />
            )}
            <span>{audioStatus === "generating" ? "Gerando..." : "Ouvir explicação"}</span>
          </Button>
        ) : (
          <div className="flex items-center gap-0.5">
            {isPaused ? (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={resumeAudio} title="Retomar">
                <Play className="h-3 w-3 text-primary" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={pauseAudio} title="Pausar">
                <Pause className="h-3 w-3 text-primary" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={stopAudio} title="Parar">
              <VolumeX className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={repeatAudio} title="Repetir">
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-1.5 text-[10px] font-mono font-bold text-primary"
              onClick={cycleSpeed}
              title="Velocidade"
            >
              {speed}x
            </Button>
          </div>
        )}

        {statusIcon(audioStatus, audioError)}


        {/* Speed indicator when not playing */}
        {!isPlaying && speed !== 1 && (
          <span className="text-[9px] font-mono text-muted-foreground ml-auto">{speed}x</span>
        )}
      </div>

      {/* Cinematic Avatar Modal */}
      <Dialog open={showAvatarModal} onOpenChange={(open) => { if (!open) handleCloseAvatarModal(); }}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-slate-950 border-primary/20 gap-0">
          <DialogHeader className="p-3 pb-0">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-white">
              <Film className="h-4 w-4 text-primary" />
              Explicação Narrada
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-0">
            {/* Cinematic Avatar — 16:9 aspect */}
            <div className="aspect-video">
              <CinematicAvatar
                isSpeaking={avatarSpeaking}
                subtitle={currentSubtitle}
                className="h-full w-full"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 p-3 bg-slate-900/80">
              {avatarSpeaking ? (
                <>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs border-slate-700 text-slate-200 hover:bg-slate-800" onClick={stopAvatarNarration}>
                    <Pause className="h-3.5 w-3.5" /> Pausar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs border-slate-700 text-slate-200 hover:bg-slate-800" onClick={() => { stopAvatarNarration(); setTimeout(startAvatarNarration, 200); }}>
                    <RotateCcw className="h-3.5 w-3.5" /> Repetir
                  </Button>
                </>
              ) : (
                <Button size="sm" className="gap-1.5 text-xs bg-gradient-to-r from-primary to-primary/80 text-primary-foreground" onClick={startAvatarNarration}>
                  <Play className="h-3.5 w-3.5" /> Narrar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-mono font-bold border-slate-700 text-slate-200 hover:bg-slate-800"
                onClick={cycleSpeed}
              >
                {speed}x
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
