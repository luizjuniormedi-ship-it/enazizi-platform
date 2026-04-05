/**
 * Legacy review queue — used when `new_fsrs_flow_enabled` is OFF.
 *
 * Builds a review queue from `revisoes` (overdue first) + `error_bank`
 * without depending on fsrs_cards, stability, or retrievability.
 */
import { supabase } from "@/integrations/supabase/client";

export interface LegacyReviewItem {
  id: string;
  topic: string;
  specialty: string;
  subtopic?: string;
  /** Days overdue (0 = due today, negative = future) */
  daysOverdue: number;
  source: "revisao" | "error";
  /** 0-100 priority */
  priority: number;
}

export async function generateLegacyReviewQueue(userId: string): Promise<LegacyReviewItem[]> {
  const today = new Date().toISOString().split("T")[0];
  const items: LegacyReviewItem[] = [];

  // 1. Overdue + pending revisoes (sorted by most overdue first)
  const { data: revisoes } = await supabase
    .from("revisoes")
    .select("id, tema_id, data_revisao, prioridade, risco_esquecimento, temas_estudados(tema, especialidade)")
    .eq("user_id", userId)
    .eq("status", "pendente")
    .order("data_revisao", { ascending: true })
    .limit(30);

  for (const rev of (revisoes || [])) {
    const daysOverdue = Math.floor(
      (Date.now() - new Date(rev.data_revisao).getTime()) / 86400000
    );
    const tema = (rev as any).temas_estudados?.tema || "Tema";
    const spec = (rev as any).temas_estudados?.especialidade || "Geral";

    // Priority: more overdue = higher priority
    const basePrio = Math.min(95, 60 + Math.max(daysOverdue, 0) * 3);
    const riskBonus = rev.risco_esquecimento === "alto" ? 8 : rev.risco_esquecimento === "medio" ? 4 : 0;

    items.push({
      id: rev.id,
      topic: tema,
      specialty: spec,
      daysOverdue,
      source: "revisao",
      priority: Math.min(100, basePrio + riskBonus),
    });
  }

  // 2. Error bank — unmastered errors as reinforcement
  const { data: errors } = await supabase
    .from("error_bank")
    .select("id, tema, subtema, vezes_errado")
    .eq("user_id", userId)
    .eq("dominado", false)
    .order("vezes_errado", { ascending: false })
    .limit(10);

  for (const err of (errors || [])) {
    items.push({
      id: err.id,
      topic: err.tema,
      specialty: err.subtema || "Geral",
      subtopic: err.subtema || undefined,
      daysOverdue: 0,
      source: "error",
      priority: Math.min(85, 50 + (err.vezes_errado || 1) * 5),
    });
  }

  // Sort by priority descending
  items.sort((a, b) => b.priority - a.priority);
  return items;
}
