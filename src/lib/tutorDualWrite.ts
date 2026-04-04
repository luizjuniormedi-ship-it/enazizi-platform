/**
 * Tutor dual-write: fire-and-forget writes to new tutor tables
 * (tutor_sessions, tutor_messages, tutor_context_snapshots)
 * while legacy chat_conversations/chat_messages remain the primary source.
 */
import { supabase } from "@/integrations/supabase/client";

/** Map from legacy conversation_id to tutor_session_id (in-memory cache) */
const sessionMap = new Map<string, string>();

/**
 * Create a tutor_session mirroring a chat_conversation.
 * Returns the new session id or null on failure.
 */
export function dualWriteTutorSession(params: {
  userId: string;
  conversationId: string;
  mode?: "free" | "mission";
  topic?: string;
  specialty?: string;
  missionId?: string;
  phase?: string;
}): void {
  const { userId, conversationId, mode, topic, specialty, missionId, phase } = params;

  (async () => {
    try {
      // Skip if already mapped
      if (sessionMap.has(conversationId)) return;

      const { data, error } = await supabase
        .from("tutor_sessions" as any)
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          mode: mode || "free",
          topic: topic || null,
          specialty: specialty || null,
          mission_id: missionId || null,
          current_phase: phase || null,
          source_context: "dual-write",
        })
        .select("id")
        .single();

      if (data && !error) {
        sessionMap.set(conversationId, (data as any).id);
      }
    } catch {
      // Silent — legacy flow continues
    }
  })();
}

/**
 * Get the tutor_session_id for a conversation, or null if not yet mapped.
 */
function getSessionId(conversationId: string): string | null {
  return sessionMap.get(conversationId) || null;
}

/**
 * Write a message to tutor_messages mirroring chat_messages.
 */
export function dualWriteTutorMessage(params: {
  userId: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  modelUsed?: string;
  tokensUsed?: number;
}): void {
  const { userId, conversationId, role, content, modelUsed, tokensUsed } = params;

  (async () => {
    try {
      let sessionId = getSessionId(conversationId);

      // If no session yet, try to find or create one
      if (!sessionId) {
        const { data: existing } = await supabase
          .from("tutor_sessions" as any)
          .select("id")
          .eq("conversation_id", conversationId)
          .maybeSingle();

        if (existing) {
          sessionId = (existing as any).id;
          sessionMap.set(conversationId, sessionId!);
        } else {
          // Create session on-the-fly
          const { data: newSession } = await supabase
            .from("tutor_sessions" as any)
            .insert({
              user_id: userId,
              conversation_id: conversationId,
              mode: "free",
              source_context: "dual-write-auto",
            })
            .select("id")
            .single();

          if (newSession) {
            sessionId = (newSession as any).id;
            sessionMap.set(conversationId, sessionId!);
          }
        }
      }

      if (!sessionId) return;

      await supabase.from("tutor_messages" as any).insert({
        tutor_session_id: sessionId,
        user_id: userId,
        role,
        content: content.slice(0, 50000),
        model_used: modelUsed || null,
        tokens_used: tokensUsed || null,
      });
    } catch {
      // Silent — legacy flow continues
    }
  })();
}

/**
 * Save a context snapshot for the current tutor interaction.
 */
export function dualWriteTutorContextSnapshot(params: {
  userId: string;
  missionId?: string;
  mainError?: string;
  currentGoal?: string;
  pendingReviews?: number;
  accuracy?: number;
  phase?: string;
  examFocus?: string;
  extraContext?: Record<string, unknown>;
}): void {
  const {
    userId, missionId, mainError, currentGoal,
    pendingReviews, accuracy, phase, examFocus, extraContext,
  } = params;

  (async () => {
    try {
      await supabase.from("tutor_context_snapshots" as any).insert({
        user_id: userId,
        mission_id: missionId || null,
        main_error: mainError || null,
        current_goal: currentGoal || null,
        pending_reviews: pendingReviews ?? null,
        accuracy: accuracy ?? null,
        phase: phase || null,
        exam_focus: examFocus || null,
        context_json: extraContext ? JSON.stringify(extraContext) : null,
      });
    } catch {
      // Silent
    }
  })();
}
