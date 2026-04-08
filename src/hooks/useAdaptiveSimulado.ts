import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdaptiveQuestion {
  statement: string;
  options: string[];
  correct: number;
  explanation: string;
  rationale_map?: Record<string, string>;
  image_url: string | null;
  image_type: string;
  topic: string;
  subtopic?: string;
  difficulty: string;
  exam_style: string;
  _isImageQuestion: boolean;
  _source?: string;
}

export interface AdaptiveMeta {
  focus: string;
  strategy: string;
  weakness_targeted: string;
  distribution: {
    modalities: Record<string, number>;
    difficulty: Record<string, number>;
    exam_style: Record<string, number>;
  };
}

export interface ModalityPerformance {
  by_modality: Record<string, number>;
  by_difficulty: Record<string, number>;
  response_time: Record<string, number>;
  error_patterns: string[];
}

interface UseAdaptiveSimuladoReturn {
  questions: AdaptiveQuestion[];
  meta: AdaptiveMeta | null;
  isLoading: boolean;
  error: string | null;
  generateAdaptive: (performance?: ModalityPerformance, targetCount?: number) => Promise<void>;
}

export function useAdaptiveSimulado(): UseAdaptiveSimuladoReturn {
  const [questions, setQuestions] = useState<AdaptiveQuestion[]>([]);
  const [meta, setMeta] = useState<AdaptiveMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAdaptive = useCallback(async (
    performance?: ModalityPerformance,
    targetCount = 20
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "generate-adaptive-simulado",
        {
          body: {
            target_question_count: targetCount,
            performance: performance || undefined,
          },
        }
      );

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || "Falha na geração adaptativa");

      setQuestions(data.questions || []);
      setMeta(data.meta || null);

      const total = data.questions?.length || 0;
      const generated = data.questions?.filter((q: any) => q._source === "generated").length || 0;
      toast.success(`${total} questões adaptativas carregadas (${generated} novas)`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setError(msg);
      toast.error(`Erro no simulado adaptativo: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { questions, meta, isLoading, error, generateAdaptive };
}
