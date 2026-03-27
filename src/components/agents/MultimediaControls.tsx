import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, VolumeX, Pause, Play, RotateCcw, User2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type MediaStatus, generateAudio, generateAvatar } from "@/lib/multimediaService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TutorAvatar3D from "@/components/agents/TutorAvatar3D";
import { useLipSync } from "@/hooks/useLipSync";

interface MultimediaControlsProps {
  text: string;
  /** Compact mode for mobile */
  compact?: boolean;
}

const SPEED_OPTIONS = [1, 1.5, 2] as const;

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
  const lipSync = useLipSync();

  const hasTTS = typeof window !== "undefined" && "speechSynthesis" in window;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
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

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setAudioStatus("ready");
    };
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setAudioError("Erro na reprodução");
      setAudioStatus("error");
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [text, speed, hasTTS, cleanText]);

  const handleListenClick = useCallback(() => {
    if (audioStatus === "idle") {
      generateAudio(text, (status, _url, error) => {
        setAudioStatus(status);
        if (error) setAudioError(error);
        if (status === "ready") {
          playAudio();
        }
      });
    } else {
      playAudio();
    }
  }, [audioStatus, text, playAudio]);

  const pauseAudio = useCallback(() => {
    window.speechSynthesis?.pause();
    setIsPaused(true);
  }, []);

  const resumeAudio = useCallback(() => {
    window.speechSynthesis?.resume();
    setIsPaused(false);
  }, []);

  const stopAudio = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const repeatAudio = useCallback(() => {
    stopAudio();
    setTimeout(() => playAudio(), 100);
  }, [stopAudio, playAudio]);

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      const idx = SPEED_OPTIONS.indexOf(prev as any);
      const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
      // If currently playing, restart with new speed
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

  // ─── AVATAR ──────────────────────────────────────────────

  const handleAvatarClick = useCallback(() => {
    if (avatarStatus === "idle") {
      generateAvatar(text, (status, _url, error) => {
        setAvatarStatus(status);
        if (error) setAvatarError(error);
        if (status === "ready") {
          setShowAvatarModal(true);
        }
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
      lipSync.startSpeaking();
    };
    utterance.onboundary = (e) => {
      if (e.name === "word") {
        const word = clean.slice(e.charIndex, e.charIndex + (e.charLength || 5));
        lipSync.feedWord(word);
      }
    };
    utterance.onend = () => {
      setAvatarSpeaking(false);
      lipSync.stopSpeaking();
    };
    utterance.onerror = () => {
      setAvatarSpeaking(false);
      lipSync.stopSpeaking();
    };

    window.speechSynthesis.speak(utterance);
  }, [text, speed, hasTTS, cleanText, lipSync]);

  const stopAvatarNarration = useCallback(() => {
    window.speechSynthesis?.cancel();
    setAvatarSpeaking(false);
    lipSync.stopSpeaking();
  }, [lipSync]);

  // Auto-start narration when modal opens
  useEffect(() => {
    if (showAvatarModal && avatarStatus === "ready" && !avatarSpeaking) {
      const timer = setTimeout(startAvatarNarration, 300);
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
            <span>{audioStatus === "generating" ? "Gerando..." : "Ouvir"}</span>
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

        <div className="w-px h-4 bg-border/40 mx-1" />

        {/* Avatar button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[10px] sm:text-xs gap-1 text-muted-foreground hover:text-accent"
          onClick={handleAvatarClick}
          disabled={avatarStatus === "generating"}
        >
          {avatarStatus === "generating" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <User2 className="h-3 w-3" />
          )}
          <span>{avatarStatus === "generating" ? "Preparando..." : "Avatar"}</span>
        </Button>

        {statusIcon(avatarStatus, avatarError)}

        {/* Speed indicator when not playing */}
        {!isPlaying && speed !== 1 && (
          <span className="text-[9px] font-mono text-muted-foreground ml-auto">{speed}x</span>
        )}
      </div>

      {/* Avatar Modal */}
      <Dialog open={showAvatarModal} onOpenChange={(open) => { if (!open) handleCloseAvatarModal(); }}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-gradient-to-br from-card via-card to-accent/5 border-primary/20">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <User2 className="h-4 w-4 text-primary" />
              Avatar Narrador
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-3">
            {/* 3D Avatar */}
            <div className="rounded-xl overflow-hidden border border-border/50 bg-background/50">
              <TutorAvatar3D isSpeaking={avatarSpeaking} lipSync={lipSync} className="h-48 sm:h-64" />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              {avatarSpeaking ? (
                <>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={stopAvatarNarration}>
                    <Pause className="h-3.5 w-3.5" /> Pausar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { stopAvatarNarration(); setTimeout(startAvatarNarration, 200); }}>
                    <RotateCcw className="h-3.5 w-3.5" /> Repetir
                  </Button>
                </>
              ) : (
                <Button size="sm" className="gap-1.5 text-xs bg-gradient-to-r from-primary to-primary/80" onClick={startAvatarNarration}>
                  <Play className="h-3.5 w-3.5" /> Narrar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-mono font-bold"
                onClick={cycleSpeed}
              >
                {speed}x
              </Button>
            </div>

            {/* Text preview */}
            <div className="max-h-32 overflow-y-auto rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground leading-relaxed">
              {text.slice(0, 500)}{text.length > 500 ? "..." : ""}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
