import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

const FUNCTIONS_URL = Deno.env.get("SUPABASE_URL")! + "/functions/v1";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";

// ─── Error Taxonomy ─────────────────────────────────────────────
type ErrorType =
  | "IA_QUALIDADE" | "IA_JSON_INVALIDO" | "IA_RESPOSTA_EM_INGLES"
  | "ENUNCIADO_CURTO" | "ALTERNATIVA_FRACA"
  | "CACHE_VAZIO" | "CACHE_NAO_POPULADO"
  | "AUTH_401" | "AUTH_TOKEN_AUSENTE"
  | "EDGE_TIMEOUT" | "EDGE_FALHA_INTERNA"
  | "DADOS_INCONSISTENTES" | "DADOS_ORFAOS"
  | "RLS_NEGANDO_ACESSO" | "LOG_NAO_REGISTRADO"
  | "MISSAO_INCOERENTE" | "TUTOR_GENERICO"
  | "PROGRESSO_NAO_ATUALIZA" | "CTA_SEM_ACAO" | "PERFORMANCE_BAIXA";

type Severity = "critico" | "alto" | "medio" | "baixo";
type FixStatus = "detectado" | "corrigido_automaticamente" | "corrigido_com_retry" | "corrigido_parcialmente" | "falha_persistente" | "escalado";

interface QAEvent {
  error_type: ErrorType;
  module: string;
  severity: Severity;
  causa_provavel: string;
  impacto: string;
  payload?: any;
  details?: any;
}

interface FixResult {
  action: string;
  before: any;
  after: any;
  success: boolean;
  duration_ms: number;
}

// ─── Detection ──────────────────────────────────────────────────
async function detectErrors(sb: any, level: number): Promise<QAEvent[]> {
  const events: QAEvent[] = [];

  // 1. ENUNCIADO_CURTO - questions with short statements
  const { data: shortQuestions } = await sb.from("questions_bank")
    .select("id, statement, review_status")
    .eq("review_status", "approved")
    .limit(500);

  if (shortQuestions) {
    const short = shortQuestions.filter((q: any) => (q.statement || "").length < 200);
    if (short.length > 0) {
      events.push({
        error_type: "ENUNCIADO_CURTO",
        module: "questions_bank",
        severity: short.length > 50 ? "alto" : "medio",
        causa_provavel: "Prompt de geração fraco ou pós-processamento cortando conteúdo",
        impacto: `${short.length} questões aprovadas com enunciado < 200 chars — baixa qualidade pedagógica`,
        details: { count: short.length, sample_ids: short.slice(0, 5).map((q: any) => q.id) },
      });
    }
  }

  // 2. IA_RESPOSTA_EM_INGLES - questions in English
  if (shortQuestions) {
    const english = shortQuestions.filter((q: any) => {
      const s = (q.statement || "").toLowerCase();
      return /\bthe patient\b/.test(s) || /\bmost likely\b/.test(s) || /\bwhich of the following\b/.test(s) || /\bpresents with\b/.test(s);
    });
    if (english.length > 0) {
      events.push({
        error_type: "IA_RESPOSTA_EM_INGLES",
        module: "questions_bank",
        severity: "critico",
        causa_provavel: "Questões geradas ou ingeridas sem filtro de idioma",
        impacto: `${english.length} questões em inglês no banco aprovado`,
        details: { count: english.length, sample_ids: english.slice(0, 5).map((q: any) => q.id) },
      });
    }
  }

  // 3. DADOS_INCONSISTENTES - approval scores > 100
  const { data: badScores } = await sb.from("approval_scores")
    .select("id, score, user_id")
    .gt("score", 100)
    .limit(100);

  if (badScores && badScores.length > 0) {
    events.push({
      error_type: "DADOS_INCONSISTENTES",
      module: "approval_scores",
      severity: "alto",
      causa_provavel: "Função calculate-approval-score não aplica clamp 0-100",
      impacto: `${badScores.length} scores acima de 100% — dados inverossímeis`,
      details: { count: badScores.length, sample: badScores.slice(0, 3) },
    });
  }

  // 4. CACHE_VAZIO
  const { count: cacheCount } = await sb.from("ai_content_cache").select("*", { count: "exact", head: true });
  if ((cacheCount || 0) === 0) {
    events.push({
      error_type: "CACHE_VAZIO",
      module: "ai_content_cache",
      severity: "medio",
      causa_provavel: "Módulos de IA não estão gravando no cache global",
      impacto: "Sem reuso de conteúdo — custo maior e latência aumentada",
      details: { cache_entries: 0 },
    });
  }

  // 5. LOG_NAO_REGISTRADO - check if AI logs exist recently
  const { count: logCount } = await sb.from("ai_usage_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date(Date.now() - 86400000 * 7).toISOString());

  if ((logCount || 0) === 0) {
    events.push({
      error_type: "LOG_NAO_REGISTRADO",
      module: "ai_usage_logs",
      severity: "medio",
      causa_provavel: "Edge functions não estão registrando chamadas no ai_usage_logs",
      impacto: "Sem visibilidade de uso de IA — impossível monitorar custos e performance",
      details: { logs_last_7d: 0 },
    });
  }

  // 6. EDGE_TIMEOUT / EDGE_FALHA_INTERNA - test critical functions
  if (level >= 2) {
    const criticalFns = ["system-health-check", "calculate-approval-score"];
    for (const fn of criticalFns) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        const resp = await fetch(`${FUNCTIONS_URL}/${fn}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
          body: JSON.stringify({}),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!resp.ok && resp.status !== 400 && resp.status !== 401) {
          await resp.text();
          events.push({
            error_type: "EDGE_FALHA_INTERNA",
            module: fn,
            severity: "alto",
            causa_provavel: `Edge function ${fn} retornou status ${resp.status}`,
            impacto: "Funcionalidade indisponível para o usuário",
            details: { status: resp.status },
          });
        } else {
          await resp.text();
        }
      } catch (e) {
        events.push({
          error_type: "EDGE_TIMEOUT",
          module: fn,
          severity: "critico",
          causa_provavel: `Edge function ${fn} não respondeu em 15s`,
          impacto: "Timeout — funcionalidade travada",
          details: { error: (e as Error).message },
        });
      }
    }
  }

  // 7. DADOS_ORFAOS - fsrs_cards with no reviews
  const { count: fsrsCount } = await sb.from("fsrs_cards").select("*", { count: "exact", head: true });
  if ((fsrsCount || 0) < 5) {
    events.push({
      error_type: "DADOS_INCONSISTENTES",
      module: "fsrs_cards",
      severity: "medio",
      causa_provavel: "Sistema FSRS quase inativo — cards não estão sendo criados automaticamente",
      impacto: "Revisão espaçada não funciona para a maioria dos alunos",
      details: { total_cards: fsrsCount },
    });
  }

  return events;
}

// ─── Auto-Fix Actions ───────────────────────────────────────────
async function autoFix(sb: any, event: QAEvent): Promise<FixResult | null> {
  const start = Date.now();

  switch (event.error_type) {
    case "ENUNCIADO_CURTO": {
      // Move short questions to pending for review
      const ids = event.details?.sample_ids || [];
      if (ids.length === 0) return null;
      const { error } = await sb.from("questions_bank")
        .update({ review_status: "pending" })
        .in("id", ids);
      return {
        action: "Questões curtas movidas para 'pending' para revisão",
        before: { status: "approved", count: ids.length },
        after: { status: "pending", count: ids.length },
        success: !error,
        duration_ms: Date.now() - start,
      };
    }

    case "IA_RESPOSTA_EM_INGLES": {
      // Move English questions to pending
      const ids = event.details?.sample_ids || [];
      if (ids.length === 0) return null;
      const { error } = await sb.from("questions_bank")
        .update({ review_status: "pending" })
        .in("id", ids);
      return {
        action: "Questões em inglês movidas para 'pending'",
        before: { status: "approved", count: ids.length },
        after: { status: "pending", count: ids.length },
        success: !error,
        duration_ms: Date.now() - start,
      };
    }

    case "DADOS_INCONSISTENTES": {
      if (event.module === "approval_scores") {
        // Clamp scores to 0-100
        const { error } = await sb.from("approval_scores").update({ score: 100 }).gt("score", 100);
        return {
          action: "Scores acima de 100 limitados para 100",
          before: { invalid_scores: event.details?.count },
          after: { clamped: true },
          success: !error,
          duration_ms: Date.now() - start,
        };
      }
      return null;
    }

    case "CACHE_VAZIO":
    case "CACHE_NAO_POPULADO": {
      // We can't auto-populate cache meaningfully here, but mark as detected
      return null;
    }

    default:
      return null;
  }
}

// ─── Escalation ─────────────────────────────────────────────────
function generateEscalation(event: QAEvent): { report: string; hypothesis_primary: string; hypothesis_secondary: string; recommended_action: string } {
  const templates: Record<string, any> = {
    EDGE_TIMEOUT: {
      report: `Edge function ${event.module} não respondeu dentro do tempo limite.`,
      hypothesis_primary: "Processamento lento ou loop infinito na função",
      hypothesis_secondary: "Dependência externa (IA gateway) lenta ou indisponível",
      recommended_action: "Verificar logs da edge function e adicionar timeout interno",
    },
    AUTH_401: {
      report: `Autenticação falhou na função ${event.module}.`,
      hypothesis_primary: "Token ausente ou expirado na chamada",
      hypothesis_secondary: "Função exige auth mas não deveria, ou validação incorreta",
      recommended_action: "Revisar lógica de autenticação da edge function",
    },
    PERFORMANCE_BAIXA: {
      report: `Performance abaixo do aceitável no módulo ${event.module}.`,
      hypothesis_primary: "Consultas não otimizadas ao banco ou modelo de IA lento",
      hypothesis_secondary: "Ausência de cache ou índices faltando",
      recommended_action: "Analisar queries e considerar cache por usuário",
    },
  };

  return templates[event.error_type] || {
    report: `Erro ${event.error_type} no módulo ${event.module}: ${event.causa_provavel}`,
    hypothesis_primary: event.causa_provavel,
    hypothesis_secondary: "Causa secundária não identificada automaticamente",
    recommended_action: "Investigação manual necessária",
  };
}

// ─── Main Pipeline ──────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = getAdmin();
  const body = await req.json().catch(() => ({}));
  const level = body.level || 2; // 1=detect, 2=autofix, 3=debug

  try {
    console.log(`[qa-autocorrect] Starting pipeline level=${level}`);

    // Step 1: Detect errors
    const events = await detectErrors(sb, level);
    console.log(`[qa-autocorrect] Detected ${events.length} issues`);

    const results: Array<{
      event_id: string;
      error_type: string;
      module: string;
      severity: string;
      status: FixStatus;
      fix?: FixResult;
      escalation?: any;
    }> = [];

    for (const event of events) {
      // Step 2: Insert event
      const { data: inserted, error: insertErr } = await sb.from("qa_events").insert({
        error_type: event.error_type,
        module: event.module,
        severity: event.severity,
        causa_provavel: event.causa_provavel,
        impacto: event.impacto,
        payload: event.payload,
        details: event.details,
      }).select("id").single();

      if (insertErr || !inserted) {
        console.error(`[qa-autocorrect] Failed to insert event:`, insertErr);
        continue;
      }

      const eventId = inserted.id;
      let finalStatus: FixStatus = "detectado";

      // Step 3: Attempt auto-fix (level >= 2)
      if (level >= 2) {
        const fix = await autoFix(sb, event);
        if (fix) {
          await sb.from("qa_auto_fixes").insert({
            event_id: eventId,
            action_taken: fix.action,
            result_before: fix.before,
            result_after: fix.after,
            success: fix.success,
            duration_ms: fix.duration_ms,
          });

          finalStatus = fix.success ? "corrigido_automaticamente" : "corrigido_parcialmente";

          // Step 4: Revalidate (simple check)
          if (fix.success && event.error_type === "ENUNCIADO_CURTO") {
            // Verify the questions were actually moved
            const ids = event.details?.sample_ids || [];
            if (ids.length > 0) {
              const { data: check } = await sb.from("questions_bank")
                .select("review_status")
                .in("id", ids)
                .limit(1)
                .single();
              if (check?.review_status !== "pending") {
                finalStatus = "corrigido_parcialmente";
              }
            }
          }

          results.push({ event_id: eventId, error_type: event.error_type, module: event.module, severity: event.severity, status: finalStatus, fix });
        } else {
          // Can't auto-fix → escalate
          finalStatus = "escalado";
          const esc = generateEscalation(event);
          await sb.from("qa_escalations").insert({
            event_id: eventId,
            ...esc,
          });
          results.push({ event_id: eventId, error_type: event.error_type, module: event.module, severity: event.severity, status: finalStatus, escalation: esc });
        }
      } else {
        results.push({ event_id: eventId, error_type: event.error_type, module: event.module, severity: event.severity, status: finalStatus });
      }

      // Update event status
      await sb.from("qa_events").update({
        status: finalStatus,
        resolved_at: finalStatus.startsWith("corrigido") ? new Date().toISOString() : null,
      }).eq("id", eventId);
    }

    // Compute summary
    const corrected = results.filter(r => r.status === "corrigido_automaticamente").length;
    const partial = results.filter(r => r.status === "corrigido_parcialmente").length;
    const escalated = results.filter(r => r.status === "escalado").length;
    const detected = results.filter(r => r.status === "detectado").length;
    const autoFixRate = results.length > 0 ? Math.round((corrected / results.length) * 100) : 0;

    console.log(`[qa-autocorrect] Done: ${corrected} corrigidos, ${partial} parciais, ${escalated} escalados, ${detected} detectados`);

    return new Response(JSON.stringify({
      total_issues: events.length,
      corrected,
      partial,
      escalated,
      detected,
      auto_fix_rate_pct: autoFixRate,
      level,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[qa-autocorrect] Fatal error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
