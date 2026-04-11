import { supabase } from "@/integrations/supabase/client";
import { ensureFsrsCard } from "@/lib/fsrsAutoCreate";
import { triggerAdaptiveMnemonicCheck } from "@/lib/mnemonicAdaptiveService";

interface LogErrorParams {
  userId: string;
  tema: string;
  subtema?: string;
  tipoQuestao: "objetiva" | "flashcard" | "active-recall" | "discursiva" | "simulado" | "diagnostico";
  conteudo?: string;
  motivoErro?: string;
  categoriaErro?: string;
  dificuldade?: number;
}

/**
 * Logs a wrong answer to the error_bank table.
 * If a similar error (same tema + conteudo) already exists, increments vezes_errado.
 */
export async function logErrorToBank(params: LogErrorParams): Promise<void> {
  const {
    userId,
    tema,
    subtema,
    tipoQuestao,
    conteudo,
    motivoErro,
    categoriaErro,
    dificuldade,
  } = params;

  try {
    // Check for existing similar error
    let query = supabase
      .from("error_bank")
      .select("id, vezes_errado")
      .eq("user_id", userId)
      .eq("tema", tema)
      .eq("tipo_questao", tipoQuestao);

    if (conteudo) {
      query = query.eq("conteudo", conteudo.slice(0, 500));
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      await supabase
        .from("error_bank")
        .update({
          vezes_errado: (existing.vezes_errado || 1) + 1,
          updated_at: new Date().toISOString(),
          motivo_erro: motivoErro || undefined,
        })
        .eq("id", existing.id);

      // Check if repeated errors should trigger adaptive mnemonic
      if ((existing.vezes_errado || 1) + 1 >= 2) {
        triggerAdaptiveMnemonicCheck(userId, tema);
      }
    } else {
      const { data: inserted } = await supabase.from("error_bank").insert({
        user_id: userId,
        tema,
        subtema: subtema || null,
        tipo_questao: tipoQuestao,
        conteudo: conteudo?.slice(0, 500) || null,
        motivo_erro: motivoErro || null,
        categoria_erro: categoriaErro || null,
        dificuldade: dificuldade || 3,
        vezes_errado: 1,
      }).select("id").single();

      // Auto-create FSRS card for new errors
      if (inserted) {
        ensureFsrsCard(userId, "erro", inserted.id);
      }
    }
  } catch (err) {
    console.error("Error logging to error_bank:", err);
  }
}
