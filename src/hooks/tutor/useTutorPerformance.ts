import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mapTopicToSpecialty } from "@/lib/mapTopicToSpecialty";
import { useGamification, XP_REWARDS, getSmartXpMultiplier } from "@/hooks/useGamification";
import { showEvolutionFeedback } from "@/lib/evolutionFeedback";
import { useToast } from "@/hooks/use-toast";
import { dualWritePerformanceByTopic, dualWriteUserTopicProfile } from "@/lib/dualWrite";
import type { StudyPerformance } from "@/components/tutor/TutorConstants";

const DEFAULT_PERFORMANCE: StudyPerformance = {
  tema_atual: null,
  questoes_respondidas: 0,
  taxa_acerto: 0,
  pontuacao_discursiva: null,
  temas_fracos: [],
  historico_estudo: [],
};

export function useTutorPerformance(userId: string | undefined) {
  const [performance, setPerformance] = useState<StudyPerformance>(DEFAULT_PERFORMANCE);
  const [sessionQuestions, setSessionQuestions] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const { addXp } = useGamification();
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;
    const loadPerformance = async () => {
      const { data } = await supabase
        .from("study_performance")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (data) {
        setPerformance({
          tema_atual: data.tema_atual,
          questoes_respondidas: data.questoes_respondidas,
          taxa_acerto: Number(data.taxa_acerto),
          pontuacao_discursiva: data.pontuacao_discursiva != null ? Number(data.pontuacao_discursiva) : null,
          temas_fracos: (data.temas_fracos as string[]) || [],
          historico_estudo: (data.historico_estudo as StudyPerformance["historico_estudo"]) || [],
        });
      }
    };
    loadPerformance();
  }, [userId]);

  const savePerformance = useCallback(async (updates: Partial<StudyPerformance>) => {
    if (!userId) return;
    const newPerf = { ...performance, ...updates };
    setPerformance(newPerf);
    const dbData = {
      user_id: userId,
      tema_atual: newPerf.tema_atual,
      questoes_respondidas: newPerf.questoes_respondidas,
      taxa_acerto: newPerf.taxa_acerto,
      pontuacao_discursiva: newPerf.pontuacao_discursiva,
      temas_fracos: newPerf.temas_fracos as any,
      historico_estudo: newPerf.historico_estudo as any,
    };
    const { data: existing } = await supabase
      .from("study_performance")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) {
      await supabase.from("study_performance").update(dbData).eq("user_id", userId);
    } else {
      await supabase.from("study_performance").insert(dbData);
    }
  }, [userId, performance]);

  const handleFinishSession = useCallback(async (
    currentTopic: string,
    completeSessionCb: () => Promise<void>,
    saveEnaziziStepCb: (step: number, tema: string | null) => Promise<void>,
  ) => {
    const totalQuestions = performance.questoes_respondidas + sessionQuestions;
    const totalCorrect = Math.round((performance.taxa_acerto / 100) * performance.questoes_respondidas) + sessionCorrect;
    const newAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const sessionEntry = {
      tema: currentTopic,
      data: new Date().toISOString(),
      questoes: sessionQuestions,
      acerto: sessionQuestions > 0 ? Math.round((sessionCorrect / sessionQuestions) * 100) : 0,
      discursiva: null as number | null,
    };
    const newHistory = [...performance.historico_estudo, sessionEntry].slice(-50);
    await savePerformance({
      tema_atual: null,
      questoes_respondidas: totalQuestions,
      taxa_acerto: newAccuracy,
      historico_estudo: newHistory,
    });
    // Update domain map
    if (userId && currentTopic) {
      const specialty = mapTopicToSpecialty(currentTopic);
      if (specialty) {
        try {
          const { data: existing } = await supabase
            .from("medical_domain_map")
            .select("id, questions_answered, correct_answers, reviews_count")
            .eq("user_id", userId)
            .eq("specialty", specialty)
            .maybeSingle();
          const newQA = (existing?.questions_answered || 0) + sessionQuestions;
          const newCA = (existing?.correct_answers || 0) + sessionCorrect;
          const newR = (existing?.reviews_count || 0) + 1;
          const domainScore = Math.max(0, Math.min(100, Math.round(newQA > 0 ? (newCA / newQA) * 100 : 0)));
          if (existing) {
            await supabase.from("medical_domain_map").update({
              questions_answered: newQA, correct_answers: newCA, reviews_count: newR,
              domain_score: domainScore, last_studied_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            }).eq("id", existing.id);
          } else {
            await supabase.from("medical_domain_map").insert({
              user_id: userId, specialty, questions_answered: sessionQuestions,
              correct_answers: sessionCorrect, reviews_count: 1, domain_score: domainScore,
              last_studied_at: new Date().toISOString(),
            });
          }
        } catch (e) { console.error("Error updating domain map:", e); }
      }
    }

    // Smart XP calculation
    const sessionAccuracy = sessionQuestions > 0 ? (sessionCorrect / sessionQuestions) * 100 : 0;
    const previousAccuracy = performance.taxa_acerto;
    const isImproved = sessionAccuracy > previousAccuracy && previousAccuracy > 0;
    const isRepetition = sessionQuestions > 0 && sessionAccuracy > 90 && previousAccuracy > 85;

    const multiplier = getSmartXpMultiplier({
      isTopicImproved: isImproved,
      isRepetition,
      consecutiveCorrect: sessionCorrect,
    });

    const baseXp = sessionQuestions > 0
      ? (sessionCorrect * XP_REWARDS.question_correct) + ((sessionQuestions - sessionCorrect) * XP_REWARDS.question_answered)
      : 0;
    const xpGained = Math.round(baseXp * multiplier);

    // Evolution feedback
    if (isImproved && sessionQuestions >= 3) {
      showEvolutionFeedback("topic_improved", currentTopic);
    }
    if (xpGained > 0) await addXp(xpGained);
    await saveEnaziziStepCb(1, null);
    await completeSessionCb();

    const q = sessionQuestions;
    setSessionQuestions(0);
    setSessionCorrect(0);
    toast({ title: "Sessão finalizada!", description: `Dados salvos. ${q} questões nesta sessão.` });
  }, [userId, performance, sessionQuestions, sessionCorrect, savePerformance, addXp, toast]);

  return {
    performance, setPerformance, savePerformance,
    sessionQuestions, setSessionQuestions,
    sessionCorrect, setSessionCorrect,
    handleFinishSession,
  };
}
