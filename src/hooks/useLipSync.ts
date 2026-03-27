import { useRef, useCallback, useEffect } from "react";

// Viseme blend shape names from Ready Player Me models
const VISEME_NAMES = [
  "viseme_sil", // silence
  "viseme_PP",  // p, b, m
  "viseme_FF",  // f, v
  "viseme_TH",  // th
  "viseme_DD",  // t, d, n
  "viseme_kk",  // k, g
  "viseme_CH",  // ch, j, sh
  "viseme_SS",  // s, z
  "viseme_nn",  // n (nasal)
  "viseme_RR",  // r
  "viseme_aa",  // a
  "viseme_E",   // e
  "viseme_I",   // i
  "viseme_O",   // o
  "viseme_U",   // u
];

// Map characters to viseme indices for Portuguese
const CHAR_TO_VISEME: Record<string, number> = {
  a: 10, á: 10, à: 10, ã: 10, â: 10,
  e: 11, é: 11, ê: 11,
  i: 12, í: 12,
  o: 13, ó: 13, ô: 13, õ: 13,
  u: 14, ú: 14, ü: 14,
  p: 1, b: 1, m: 1,
  f: 2, v: 2,
  t: 4, d: 4,
  k: 5, g: 5, c: 5, q: 5,
  s: 7, z: 7, ç: 7,
  n: 8,
  r: 9,
  l: 4,
  h: 0,
  j: 6, x: 6,
};

// Cycling viseme pattern for fallback (when onboundary isn't available)
const SPEAK_CYCLE = [10, 11, 0, 13, 14, 0, 12, 10, 0];

export interface LipSyncControls {
  /** Current active viseme index (0 = silence) */
  activeViseme: React.MutableRefObject<number>;
  /** Start speaking animation synced to a word string */
  startSpeaking: () => void;
  /** Stop speaking animation */
  stopSpeaking: () => void;
  /** Feed a word to drive visemes */
  feedWord: (word: string) => void;
  /** List of viseme blend shape names */
  visemeNames: string[];
}

export function useLipSync(): LipSyncControls {
  const activeViseme = useRef(0);
  const cycleTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleIdx = useRef(0);
  const wordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopSpeaking = useCallback(() => {
    if (cycleTimer.current) {
      clearInterval(cycleTimer.current);
      cycleTimer.current = null;
    }
    if (wordTimer.current) {
      clearTimeout(wordTimer.current);
      wordTimer.current = null;
    }
    activeViseme.current = 0;
    cycleIdx.current = 0;
  }, []);

  const startSpeaking = useCallback(() => {
    stopSpeaking();
    // Fallback: cycle through visemes at ~8Hz
    cycleTimer.current = setInterval(() => {
      cycleIdx.current = (cycleIdx.current + 1) % SPEAK_CYCLE.length;
      activeViseme.current = SPEAK_CYCLE[cycleIdx.current];
    }, 120);
  }, [stopSpeaking]);

  const feedWord = useCallback((word: string) => {
    // Stop cycling if active, animate character by character
    if (cycleTimer.current) {
      clearInterval(cycleTimer.current);
      cycleTimer.current = null;
    }
    const chars = word.toLowerCase().split("");
    let delay = 0;
    for (const ch of chars) {
      const visemeIdx = CHAR_TO_VISEME[ch] ?? 0;
      setTimeout(() => {
        activeViseme.current = visemeIdx;
      }, delay);
      delay += 80;
    }
    // Return to silence after word
    wordTimer.current = setTimeout(() => {
      activeViseme.current = 0;
      // Resume cycle
      cycleTimer.current = setInterval(() => {
        cycleIdx.current = (cycleIdx.current + 1) % SPEAK_CYCLE.length;
        activeViseme.current = SPEAK_CYCLE[cycleIdx.current];
      }, 120);
    }, delay + 50);
  }, []);

  useEffect(() => {
    return () => stopSpeaking();
  }, [stopSpeaking]);

  return {
    activeViseme,
    startSpeaking,
    stopSpeaking,
    feedWord,
    visemeNames: VISEME_NAMES,
  };
}
