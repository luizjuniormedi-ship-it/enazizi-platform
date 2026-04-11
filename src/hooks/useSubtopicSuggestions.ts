import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubtopicSuggestion {
  name: string;
  priority?: string;
}

export function useSubtopicSuggestions(topic: string, debounceMs = 400) {
  const [suggestions, setSuggestions] = useState<SubtopicSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = topic.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("suggest-mnemonic-subtopics", {
          body: { topic: trimmed },
        });
        if (!error && Array.isArray(data?.subtopics)) {
          setSuggestions(data.subtopics.slice(0, 5));
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [topic, debounceMs]);

  return { suggestions, loading };
}
