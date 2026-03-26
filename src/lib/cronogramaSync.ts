import { supabase } from "@/integrations/supabase/client";

interface TemaInfo {
  id: string;
  tema: string;
  especialidade: string;
}

interface SyncResult {
  questoesVinculadas: number;
  flashcardsCriados: number;
  temasRegistrados: number;
}

/**
 * Searches questions_bank for questions matching a topic/specialty
 */
async function getRelatedQuestions(tema: string, especialidade: string): Promise<number> {
  const searchTerms = tema.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (searchTerms.length === 0) return 0;

  // Search by topic field using ilike on the main term
  const { count } = await supabase
    .from("questions_bank")
    .select("id", { count: "exact", head: true })
    .or(`topic.ilike.%${tema}%,statement.ilike.%${searchTerms[0]}%`)
    .limit(1);

  return count || 0;
}

/**
 * Generates flashcards for topics that don't have existing flashcards
 */
async function generateFlashcardsForTemas(
  userId: string,
  temas: TemaInfo[],
  accessToken: string
): Promise<number> {
  let created = 0;

  // Check which topics already have flashcards
  const { data: existingFlashcards } = await supabase
    .from("flashcards")
    .select("topic")
    .eq("user_id", userId);

  const existingTopics = new Set(
    (existingFlashcards || []).map(f => f.topic?.toLowerCase()).filter(Boolean)
  );

  // Filter topics without flashcards
  const temasWithoutFlashcards = temas.filter(
    t => !existingTopics.has(t.tema.toLowerCase())
  );

  if (temasWithoutFlashcards.length === 0) return 0;

  // Generate flashcards in batches (max 5 at a time to avoid overload)
  const batch = temasWithoutFlashcards.slice(0, 10);

  for (const tema of batch) {
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-flashcards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            messages: [
              { role: "user", content: `Gere 3 flashcards sobre ${tema.tema} na área de ${tema.especialidade}` }
            ],
          }),
        }
      );
      if (resp.ok) {
        // The edge function returns a stream; count 1 successful generation
        created += 3;
      }
    } catch {
      // silently continue on individual failures
    }
  }

  return created;
}

/**
 * Updates study_performance with cronograma topics as priority context
 */
export async function updateStudyPerformanceContext(
  userId: string,
  temas: TemaInfo[]
): Promise<void> {
  const temasForContext = temas.map(t => t.tema).slice(0, 20);

  const { data: existing } = await supabase
    .from("study_performance")
    .select("id, historico_estudo")
    .eq("user_id", userId)
    .maybeSingle();

  const historicoAtual = (existing?.historico_estudo as any[]) || [];
  const newEntries = temasForContext
    .filter(t => !historicoAtual.some((h: any) => h.tema === t))
    .map(t => ({ tema: t, fonte: "cronograma", registrado_em: new Date().toISOString() }));

  if (newEntries.length === 0) return;

  const updatedHistorico = [...historicoAtual, ...newEntries].slice(-50);

  if (existing) {
    await supabase
      .from("study_performance")
      .update({ historico_estudo: updatedHistorico, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("study_performance")
      .insert({
        user_id: userId,
        historico_estudo: updatedHistorico,
        temas_fracos: [],
      });
  }
}

/**
 * Main sync function: after generating temas from the study plan,
 * populates flashcards, links questions, and sets tutor context.
 */
export async function syncTemasToModules(
  userId: string,
  temas: TemaInfo[]
): Promise<SyncResult> {
  const result: SyncResult = {
    questoesVinculadas: 0,
    flashcardsCriados: 0,
    temasRegistrados: temas.length,
  };

  if (temas.length === 0) return result;

  // Get session for edge function calls
  const { data: session } = await supabase.auth.getSession();
  const accessToken = session?.session?.access_token;

  // Run in parallel: questions search, flashcard generation, tutor context
  const [questionsCount, flashcardsCount] = await Promise.all([
    // 1. Count related questions in the bank
    Promise.all(temas.map(t => getRelatedQuestions(t.tema, t.especialidade)))
      .then(counts => counts.reduce((s, c) => s + c, 0)),

    // 2. Generate flashcards for new topics
    accessToken
      ? generateFlashcardsForTemas(userId, temas, accessToken)
      : Promise.resolve(0),

    // 3. Update tutor IA context
    updateStudyPerformanceContext(userId, temas),
  ]);

  result.questoesVinculadas = questionsCount;
  result.flashcardsCriados = flashcardsCount;

  return result;
}
