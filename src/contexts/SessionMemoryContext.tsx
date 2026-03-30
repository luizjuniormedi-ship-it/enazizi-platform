import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";

export type ResponseDepth = "curto" | "medio" | "aprofundado";

export interface SessionMemoryState {
  lastTopic: string | null;
  lastQuestion: string | null;
  lastIncorrectAnswer: string | null;
  recentDifficulty: string | null;
  consecutiveErrors: Record<string, number>; // topic → count
  currentContext: string | null;
  totalSessionErrors: number;
  totalSessionCorrect: number;
}

export interface SessionMemoryPayload {
  ultimo_tema: string | null;
  ultima_pergunta: string | null;
  ultimo_erro: string | null;
  erros_consecutivos: number;
  erros_consecutivos_por_tema: Record<string, number>;
  profundidade_resposta: ResponseDepth;
  total_erros_sessao: number;
  total_acertos_sessao: number;
  contexto_atual: string | null;
}

interface SessionMemoryContextValue {
  memory: SessionMemoryState;
  recordAnswer: (topic: string, correct: boolean, question?: string, incorrectAnswer?: string) => void;
  recordTopicChange: (topic: string) => void;
  getMemoryPayload: (taskType?: string, isReview?: boolean) => SessionMemoryPayload;
  computeResponseDepth: (taskType?: string, isReview?: boolean) => ResponseDepth;
  resetMemory: () => void;
}

const initialState: SessionMemoryState = {
  lastTopic: null,
  lastQuestion: null,
  lastIncorrectAnswer: null,
  recentDifficulty: null,
  consecutiveErrors: {},
  currentContext: null,
  totalSessionErrors: 0,
  totalSessionCorrect: 0,
};

const SessionMemoryContext = createContext<SessionMemoryContextValue | null>(null);

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function SessionMemoryProvider({ children }: { children: ReactNode }) {
  const [memory, setMemory] = useState<SessionMemoryState>(initialState);
  const lastActivityRef = useRef(Date.now());

  // Inactivity reset timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT_MS) {
        setMemory(initialState);
      }
    }, 60_000); // check every minute
    return () => clearInterval(interval);
  }, []);

  const touch = () => { lastActivityRef.current = Date.now(); };

  const recordAnswer = useCallback((topic: string, correct: boolean, question?: string, incorrectAnswer?: string) => {
    touch();
    setMemory(prev => {
      const consecutiveErrors = { ...prev.consecutiveErrors };
      if (correct) {
        consecutiveErrors[topic] = 0;
      } else {
        consecutiveErrors[topic] = (consecutiveErrors[topic] || 0) + 1;
      }
      return {
        ...prev,
        lastTopic: topic,
        lastQuestion: question || prev.lastQuestion,
        lastIncorrectAnswer: correct ? prev.lastIncorrectAnswer : (incorrectAnswer || question || prev.lastIncorrectAnswer),
        consecutiveErrors,
        totalSessionErrors: prev.totalSessionErrors + (correct ? 0 : 1),
        totalSessionCorrect: prev.totalSessionCorrect + (correct ? 1 : 0),
      };
    });
  }, []);

  const recordTopicChange = useCallback((topic: string) => {
    touch();
    setMemory(prev => ({
      ...prev,
      lastTopic: topic,
      currentContext: topic,
    }));
  }, []);

  const computeResponseDepth = useCallback((taskType?: string, isReview?: boolean): ResponseDepth => {
    if (isReview || taskType === "review" || taskType === "error_review") return "curto";
    const topicErrors = memory.lastTopic ? (memory.consecutiveErrors[memory.lastTopic] || 0) : 0;
    if (topicErrors >= 2) return "medio";
    return "aprofundado";
  }, [memory.lastTopic, memory.consecutiveErrors]);

  const getMemoryPayload = useCallback((taskType?: string, isReview?: boolean): SessionMemoryPayload => {
    const topicErrors = memory.lastTopic ? (memory.consecutiveErrors[memory.lastTopic] || 0) : 0;
    return {
      ultimo_tema: memory.lastTopic,
      ultima_pergunta: memory.lastQuestion,
      ultimo_erro: memory.lastIncorrectAnswer,
      erros_consecutivos: topicErrors,
      erros_consecutivos_por_tema: memory.consecutiveErrors,
      profundidade_resposta: computeResponseDepth(taskType, isReview),
      total_erros_sessao: memory.totalSessionErrors,
      total_acertos_sessao: memory.totalSessionCorrect,
      contexto_atual: memory.currentContext,
    };
  }, [memory, computeResponseDepth]);

  const resetMemory = useCallback(() => {
    setMemory(initialState);
  }, []);

  return (
    <SessionMemoryContext.Provider value={{ memory, recordAnswer, recordTopicChange, getMemoryPayload, computeResponseDepth, resetMemory }}>
      {children}
    </SessionMemoryContext.Provider>
  );
}

export function useSessionMemory() {
  const ctx = useContext(SessionMemoryContext);
  if (!ctx) throw new Error("useSessionMemory must be used within SessionMemoryProvider");
  return ctx;
}
