import { useState, useCallback } from "react";

export function useTutorAudio() {
  const [autoSpeak, setAutoSpeak] = useState(() => localStorage.getItem("tutor-auto-speak") === "true");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakText = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[#*_`~>\-|]/g, "").replace(/\[.*?\]\(.*?\)/g, "").replace(/\n{2,}/g, ". ");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "pt-BR";
    utterance.rate = 1.05;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const toggleAutoSpeak = useCallback(() => {
    setAutoSpeak(v => {
      const next = !v;
      localStorage.setItem("tutor-auto-speak", String(next));
      return next;
    });
  }, []);

  return { autoSpeak, isSpeaking, speakText, stopSpeaking, toggleAutoSpeak };
}
