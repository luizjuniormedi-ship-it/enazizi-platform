import { supabase } from "@/integrations/supabase/client";
import { mapTopicToSpecialty } from "./mapTopicToSpecialty";
import { dualWritePerformanceByTopic } from "./dualWrite";

interface DomainEntry {
  topic: string;
  correct: boolean;
}

/**
 * Updates medical_domain_map for a user based on answered questions.
 * Groups by normalized specialty and upserts scores.
 */
export async function updateDomainMap(userId: string, entries: DomainEntry[]): Promise<void> {
  if (!userId || entries.length === 0) return;

  const specialtyMap: Record<string, { correct: number; total: number }> = {};
  for (const e of entries) {
    const specialty = mapTopicToSpecialty(e.topic) || e.topic || "Clínica Médica";
    if (!specialtyMap[specialty]) specialtyMap[specialty] = { correct: 0, total: 0 };
    specialtyMap[specialty].total++;
    if (e.correct) specialtyMap[specialty].correct++;
  }

  for (const [specialty, { correct, total }] of Object.entries(specialtyMap)) {
    try {
      const { data: existing } = await supabase
        .from("medical_domain_map")
        .select("id, questions_answered, correct_answers")
        .eq("user_id", userId)
        .eq("specialty", specialty)
        .maybeSingle();

      if (existing) {
        const newAnswered = existing.questions_answered + total;
        const newCorrect = existing.correct_answers + correct;
        const newScore = Math.round((newCorrect / newAnswered) * 100);
        await supabase.from("medical_domain_map").update({
          questions_answered: newAnswered,
          correct_answers: newCorrect,
          domain_score: newScore,
          last_studied_at: new Date().toISOString(),
        }).eq("id", existing.id);

        // Dual-write to new performance_by_topic table
        dualWritePerformanceByTopic({
          userId, specialty, topic: specialty,
          questionsAnswered: total, correctAnswers: correct,
        });
      } else {
        await supabase.from("medical_domain_map").insert({
          user_id: userId,
          specialty,
          questions_answered: total,
          correct_answers: correct,
          domain_score: Math.round((correct / total) * 100),
          last_studied_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Error updating domain map:", err);
    }
  }
}
