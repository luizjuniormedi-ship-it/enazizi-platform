import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Upload } from "@/components/tutor/TutorConstants";

export function useChatContext(userId: string | undefined, currentTopic: string) {
  const [availableUploads, setAvailableUploads] = useState<Upload[]>([]);
  const [selectedUploadIds, setSelectedUploadIds] = useState<Set<string>>(new Set());
  const [showUploads, setShowUploads] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<Array<{ statement: string; options: any; correct_index: number | null; explanation: string | null; topic: string | null }>>([]);
  const [errorBankData, setErrorBankData] = useState<Array<{ tema: string; subtema: string | null; tipo_questao: string; categoria_erro: string | null; vezes_errado: number }>>([]);

  // Load uploads
  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const { data } = await supabase
        .from("uploads")
        .select("id, filename, extracted_text, category")
        .eq("status", "processed")
        .not("extracted_text", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data && data.length > 0) {
        setAvailableUploads(data);
        setSelectedUploadIds(new Set(data.map((u) => u.id)));
      }
    };
    load();
  }, [userId]);

  // Load bank questions for current topic
  useEffect(() => {
    if (!userId || !currentTopic) { setBankQuestions([]); return; }
    const loadQuestions = async () => {
      const { data } = await supabase
        .from("questions_bank")
        .select("statement, options, correct_index, explanation, topic")
        .or(`user_id.eq.${userId},is_global.eq.true`)
        .ilike("topic", `%${currentTopic}%`)
        .order("created_at", { ascending: false })
        .limit(10);
      setBankQuestions(data || []);
    };
    loadQuestions();
  }, [userId, currentTopic]);

  // Load error bank
  useEffect(() => {
    if (!userId) return;
    const loadErrorBank = async () => {
      const { data } = await supabase
        .from("error_bank")
        .select("tema, subtema, tipo_questao, categoria_erro, vezes_errado")
        .eq("user_id", userId)
        .order("vezes_errado", { ascending: false })
        .limit(20);
      setErrorBankData((data as any[]) || []);
    };
    loadErrorBank();
  }, [userId]);

  const toggleUpload = useCallback((id: string) => {
    setSelectedUploadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const buildUserContext = useCallback(() => {
    let ctx = "";
    for (const upload of availableUploads) {
      if (!selectedUploadIds.has(upload.id)) continue;
      const snippet = upload.extracted_text?.slice(0, 2000) || "";
      if (ctx.length + snippet.length > 6000) break;
      ctx += `\n\n📄 ${upload.filename} (${upload.category || "material"}):\n${snippet}`;
    }
    if (bankQuestions.length > 0) {
      ctx += `\n\n📋 BANCO DE QUESTÕES DO ALUNO (${bankQuestions.length} questões sobre "${currentTopic}"):\n`;
      bankQuestions.slice(0, 5).forEach((q, i) => {
        ctx += `\nQ${i + 1}: ${q.statement.slice(0, 300)}`;
        if (q.options && Array.isArray(q.options)) {
          (q.options as string[]).forEach((opt: string, j: number) => {
            ctx += `\n  ${String.fromCharCode(65 + j)}) ${opt}`;
          });
        }
        if (q.correct_index != null) ctx += `\n  Gabarito: ${String.fromCharCode(65 + q.correct_index)}`;
        if (q.explanation) ctx += `\n  Explicação: ${q.explanation.slice(0, 200)}`;
      });
      ctx += `\n\nUSE estas questões como referência para o estilo, dificuldade e temas. Priorize CASOS CLÍNICOS.`;
    }
    return ctx.trim();
  }, [availableUploads, selectedUploadIds, bankQuestions, currentTopic]);

  return {
    availableUploads, selectedUploadIds, setSelectedUploadIds,
    showUploads, setShowUploads,
    bankQuestions, errorBankData,
    toggleUpload, buildUserContext,
  };
}
