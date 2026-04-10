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
  | "QUESTAO_EM_INGLES" | "ENUNCIADO_CURTO" | "QUESTAO_SEM_ESTRUTURA"
  | "APPROVAL_FORA_DA_FAIXA" | "CACHE_VAZIO" | "CACHE_NAO_POPULADO"
  | "LOG_IA_AUSENTE" | "AUTH_401" | "AUTH_TOKEN_INVALIDO"
  | "EDGE_TIMEOUT" | "EDGE_500" | "JSON_INVALIDO"
  | "RESPOSTA_IA_EM_INGLES" | "TUTOR_GENERICO" | "MISSAO_INCOERENTE"
  | "PROGRESSO_NAO_ATUALIZA" | "FSRS_SUBUTILIZADO" | "DADOS_ORFAOS"
  | "RLS_NEGANDO_INDEVIDAMENTE" | "CTA_SEM_ACAO" | "REGRESSAO_DE_PERFORMANCE"
  | "IA_QUALIDADE" | "IA_JSON_INVALIDO" | "ALTERNATIVA_FRACA"
  | "PERFORMANCE_BAIXA";

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

  // 1. ENUNCIADO_CURTO
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
        impacto: `${short.length} questões aprovadas com enunciado < 200 chars`,
        details: { count: short.length, sample_ids: short.slice(0, 10).map((q: any) => q.id) },
      });
    }

    // 2. QUESTAO_EM_INGLES
    const english = shortQuestions.filter((q: any) => {
      const s = (q.statement || "").toLowerCase();
      return /\bthe patient\b/.test(s) || /\bmost likely\b/.test(s) || /\bwhich of the following\b/.test(s) || /\bpresents with\b/.test(s);
    });
    if (english.length > 0) {
      events.push({
        error_type: "QUESTAO_EM_INGLES",
        module: "questions_bank",
        severity: "critico",
        causa_provavel: "Questões geradas ou ingeridas sem filtro de idioma",
        impacto: `${english.length} questões em inglês no banco aprovado`,
        details: { count: english.length, sample_ids: english.slice(0, 10).map((q: any) => q.id) },
      });
    }
  }

  // 3. APPROVAL_FORA_DA_FAIXA
  const { data: badScores } = await sb.from("approval_scores")
    .select("id, score, user_id")
    .or("score.gt.100,score.lt.0")
    .limit(100);

  if (badScores && badScores.length > 0) {
    events.push({
      error_type: "APPROVAL_FORA_DA_FAIXA",
      module: "approval_scores",
      severity: "alto",
      causa_provavel: "Função calculate-approval-score não aplica clamp 0-100",
      impacto: `${badScores.length} scores fora da faixa válida`,
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

  // 5. LOG_IA_AUSENTE
  const { count: logCount } = await sb.from("ai_usage_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date(Date.now() - 86400000 * 7).toISOString());

  if ((logCount || 0) === 0) {
    events.push({
      error_type: "LOG_IA_AUSENTE",
      module: "ai_usage_logs",
      severity: "medio",
      causa_provavel: "Edge functions não estão registrando chamadas no ai_usage_logs",
      impacto: "Sem visibilidade de uso de IA",
      details: { logs_last_7d: 0 },
    });
  }

  // 6. FSRS_SUBUTILIZADO
  const { count: fsrsCount } = await sb.from("fsrs_cards").select("*", { count: "exact", head: true });
  if ((fsrsCount || 0) < 20) {
    events.push({
      error_type: "FSRS_SUBUTILIZADO",
      module: "fsrs_cards",
      severity: "medio",
      causa_provavel: "Sistema FSRS quase inativo — cards não estão sendo criados automaticamente",
      impacto: "Revisão espaçada não funciona para a maioria dos alunos",
      details: { total_cards: fsrsCount },
    });
  }

  // 7. EDGE_TIMEOUT / EDGE_500 - test critical functions (level >= 2)
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
        await resp.text();
        if (!resp.ok && resp.status !== 400 && resp.status !== 401) {
          events.push({
            error_type: "EDGE_500",
            module: fn,
            severity: "alto",
            causa_provavel: `Edge function ${fn} retornou status ${resp.status}`,
            impacto: "Funcionalidade indisponível para o usuário",
            details: { status: resp.status },
          });
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

  return events;
}

// ─── Auto-Fix Actions ───────────────────────────────────────────
async function autoFix(sb: any, event: QAEvent): Promise<FixResult | null> {
  const start = Date.now();

  switch (event.error_type) {
    case "ENUNCIADO_CURTO": {
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

    case "QUESTAO_EM_INGLES": {
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

    case "APPROVAL_FORA_DA_FAIXA": {
      const { error: e1 } = await sb.from("approval_scores").update({ score: 100 }).gt("score", 100);
      const { error: e2 } = await sb.from("approval_scores").update({ score: 0 }).lt("score", 0);
      return {
        action: "Scores fora da faixa clampados para 0-100",
        before: { invalid_scores: event.details?.count },
        after: { clamped: true },
        success: !e1 && !e2,
        duration_ms: Date.now() - start,
      };
    }

    default:
      return null;
  }
}

// ─── Escalation ─────────────────────────────────────────────────
function generateEscalation(event: QAEvent) {
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
      hypothesis_secondary: "Função exige auth mas não deveria",
      recommended_action: "Revisar lógica de autenticação da edge function",
    },
    CACHE_VAZIO: {
      report: "Cache global de IA está vazio.",
      hypothesis_primary: "Módulos de IA não integram com ai-cache.ts",
      hypothesis_secondary: "Cache expirou e warmup não está rodando",
      recommended_action: "Integrar getCachedContent/setCachedContent nos módulos de IA",
    },
    LOG_IA_AUSENTE: {
      report: "Logs de uso de IA não estão sendo registrados.",
      hypothesis_primary: "logAiUsage não está integrado nas edge functions",
      hypothesis_secondary: "Falha silenciosa no insert do log",
      recommended_action: "Integrar logAiUsage em todos os módulos de IA",
    },
    FSRS_SUBUTILIZADO: {
      report: "Sistema FSRS com poucos cards criados.",
      hypothesis_primary: "completeStudyAction não cria cards automaticamente",
      hypothesis_secondary: "Poucos usuários atingem condição de criação",
      recommended_action: "Verificar lógica de criação de cards no fsrsAutoCreate",
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
  const level = body.level || 2;
  const runType = body.run_type || "manual";
  const maxLoops = body.max_loops || 3;

  try {
    console.log(`[qa-bot] Starting pipeline level=${level} type=${runType} maxLoops=${maxLoops}`);

    // Create run record
    const { data: runRow } = await sb.from("qa_runs").insert({
      run_type: runType,
      level,
      status: "running",
      started_at: new Date().toISOString(),
    }).select("id").single();
    const runId = runRow?.id;

    // Get previous run for comparison
    const { data: prevRun } = await sb.from("qa_runs")
      .select("total_findings, total_corrected, total_escalated, auto_fix_rate_pct")
      .neq("id", runId || "")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let loopCount = 0;
    let hasCritical = true;
    const allResults: any[] = [];
    const modulesChecked = new Set<string>();

    // ─── LOOP until stable or max loops ───
    while (hasCritical && loopCount < maxLoops) {
      loopCount++;
      console.log(`[qa-bot] Loop ${loopCount}/${maxLoops}`);

      const events = await detectErrors(sb, level);
      console.log(`[qa-bot] Loop ${loopCount}: detected ${events.length} issues`);

      if (events.length === 0) {
        hasCritical = false;
        break;
      }

      // Check if any critical/alto remain
      const criticalEvents = events.filter(e => e.severity === "critico" || e.severity === "alto");

      for (const event of events) {
        modulesChecked.add(event.module);

        // Insert event
        const { data: inserted } = await sb.from("qa_events").insert({
          error_type: event.error_type,
          module: event.module,
          severity: event.severity,
          causa_provavel: event.causa_provavel,
          impacto: event.impacto,
          payload: event.payload,
          details: event.details,
        }).select("id").single();

        if (!inserted) continue;
        const eventId = inserted.id;
        let finalStatus: FixStatus = "detectado";

        // Auto-fix (level >= 2)
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
            allResults.push({ event_id: eventId, error_type: event.error_type, module: event.module, severity: event.severity, status: finalStatus, fix, loop: loopCount });
          } else {
            finalStatus = "escalado";
            const esc = generateEscalation(event);
            await sb.from("qa_escalations").insert({ event_id: eventId, ...esc });
            allResults.push({ event_id: eventId, error_type: event.error_type, module: event.module, severity: event.severity, status: finalStatus, escalation: esc, loop: loopCount });
          }
        } else {
          allResults.push({ event_id: eventId, error_type: event.error_type, module: event.module, severity: event.severity, status: finalStatus, loop: loopCount });
        }

        await sb.from("qa_events").update({
          status: finalStatus,
          resolved_at: finalStatus.startsWith("corrigido") ? new Date().toISOString() : null,
        }).eq("id", eventId);
      }

      // After fixes, check if critical issues remain (only if we can fix)
      if (level < 2 || criticalEvents.length === 0) {
        hasCritical = false;
      } else {
        // Re-check: did we fix the critical ones?
        const fixedCritical = allResults.filter(r => r.loop === loopCount && (r.severity === "critico" || r.severity === "alto") && r.status === "corrigido_automaticamente");
        if (fixedCritical.length === 0) {
          // No critical was fixed this loop, stop to avoid infinite loop
          hasCritical = false;
        }
      }
    }

    // Compute summary
    const corrected = allResults.filter(r => r.status === "corrigido_automaticamente").length;
    const partial = allResults.filter(r => r.status === "corrigido_parcialmente").length;
    const escalated = allResults.filter(r => r.status === "escalado").length;
    const detected = allResults.filter(r => r.status === "detectado").length;
    const totalFindings = allResults.length;
    const autoFixRate = totalFindings > 0 ? Math.round((corrected / totalFindings) * 100) : 0;
    const durationMs = Date.now() - new Date(runRow?.started_at || Date.now()).getTime();

    // Comparison with previous run
    const comparison = prevRun ? {
      findings_delta: totalFindings - (prevRun.total_findings || 0),
      corrected_delta: corrected - (prevRun.total_corrected || 0),
      escalated_delta: escalated - (prevRun.total_escalated || 0),
      fix_rate_delta: autoFixRate - (prevRun.auto_fix_rate_pct || 0),
      trend: totalFindings < (prevRun.total_findings || 0) ? "melhorando" : totalFindings === (prevRun.total_findings || 0) ? "estável" : "piorando",
    } : null;

    // Determine final status
    const finalRunStatus = allResults.some(r => r.status === "falha_persistente" || (r.status === "escalado" && (r.severity === "critico")))
      ? "critical_open" : "completed";

    // Update run record
    if (runId) {
      await sb.from("qa_runs").update({
        status: finalRunStatus,
        finished_at: new Date().toISOString(),
        duration_ms: durationMs,
        modules_checked: Array.from(modulesChecked),
        total_findings: totalFindings,
        total_corrected: corrected,
        total_partial: partial,
        total_escalated: escalated,
        total_detected: detected,
        auto_fix_rate_pct: autoFixRate,
        summary_report: {
          loops_executed: loopCount,
          results: allResults.slice(0, 50),
          comparison,
        },
        previous_comparison: comparison,
      }).eq("id", runId);
    }

    console.log(`[qa-bot] Done: ${corrected} corrigidos, ${partial} parciais, ${escalated} escalados, ${detected} detectados (${loopCount} loops, ${durationMs}ms)`);

    return new Response(JSON.stringify({
      run_id: runId,
      total_issues: totalFindings,
      corrected,
      partial,
      escalated,
      detected,
      auto_fix_rate_pct: autoFixRate,
      loops_executed: loopCount,
      duration_ms: durationMs,
      level,
      run_type: runType,
      status: finalRunStatus,
      comparison,
      results: allResults,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[qa-bot] Fatal error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
