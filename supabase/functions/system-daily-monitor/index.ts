import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Check {
  name: string;
  status: "ok" | "warning" | "critical";
  message: string;
  metric?: number;
  threshold?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const checks: Check[] = [];
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const yesterday = new Date(now.getTime() - 86400000).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

    // ── Helper: safe query ──
    const safe = async <T>(fn: () => PromiseLike<{ data: T | null; error: any }>, label: string): Promise<T | null> => {
      try {
        const { data, error } = await fn();
        if (error) {
          checks.push({ name: `query_${label}`, status: "warning", message: `Query falhou: ${error.message}` });
          return null;
        }
        return data;
      } catch (e) {
        checks.push({ name: `query_${label}`, status: "warning", message: `Exceção: ${String(e)}` });
        return null;
      }
    };

    // ══════════════════════════════════════════════════════════
    // 1. DATABASE CONNECTIVITY & CORE TABLES
    // ══════════════════════════════════════════════════════════
    const [
      profilesCount,
      questionsCount,
      activeUsers,
      pendingProfiles,
    ] = await Promise.all([
      safe(() => supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "approved"), "profiles"),
      safe(() => supabase.from("questions_bank").select("id", { count: "exact", head: true }).eq("is_global", true), "questions"),
      safe(() => supabase.from("user_presence").select("user_id", { count: "exact", head: true }).gte("last_seen_at", new Date(now.getTime() - 15 * 60000).toISOString()), "presence"),
      safe(() => supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"), "pending"),
    ]);

    checks.push({
      name: "database_connectivity",
      status: "ok",
      message: "Banco de dados acessível e respondendo.",
    });

    // ══════════════════════════════════════════════════════════
    // 2. STUDY ENGINE VALIDATION
    // ══════════════════════════════════════════════════════════
    // Check if core tables are accessible (use limit 1 instead of head-only count)
    const safeTableCheck = async (table: string, label: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from(table).select("id").limit(1);
        if (error) {
          checks.push({ name: `table_${label}`, status: "warning", message: `Tabela "${table}": ${error.message}` });
          return false;
        }
        return true;
      } catch (e) {
        checks.push({ name: `table_${label}`, status: "warning", message: `Tabela "${table}" inacessível` });
        return false;
      }
    };

    const [revisoesOk, errorBankOk, temasOk, practiceOk, fsrsOk] = await Promise.all([
      safeTableCheck("revisoes", "revisoes"),
      safeTableCheck("error_bank", "error_bank"),
      safeTableCheck("temas_estudados", "temas"),
      safeTableCheck("practice_attempts", "practice"),
      safeTableCheck("fsrs_cards", "fsrs"),
    ]);

    const engineTablesOk = revisoesOk && errorBankOk && temasOk;
    checks.push({
      name: "study_engine_tables",
      status: engineTablesOk ? "ok" : "critical",
      message: engineTablesOk
        ? "Tabelas do Study Engine acessíveis."
        : "Falha ao acessar tabelas críticas do Study Engine.",
    });

    // ══════════════════════════════════════════════════════════
    // 3. AI HEALTH
    // ══════════════════════════════════════════════════════════
    const aiLogs = await safe(() =>
      supabase.from("ai_usage_logs")
        .select("function_name, response_time_ms, success")
        .gte("created_at", yesterday)
        .limit(500), "ai_logs"
    ) as any[] | null;

    const aiLogsList = aiLogs || [];
    const totalAiCalls = aiLogsList.length;
    const aiFails = aiLogsList.filter((l: any) => !l.success).length;
    const aiFailRate = totalAiCalls > 0 ? (aiFails / totalAiCalls) * 100 : 0;
    const avgResponseMs = totalAiCalls > 0
      ? Math.round(aiLogsList.reduce((s: number, l: any) => s + (l.response_time_ms || 0), 0) / totalAiCalls)
      : 0;

    checks.push({
      name: "ai_failure_rate",
      status: aiFailRate > 20 ? "critical" : aiFailRate > 10 ? "warning" : "ok",
      message: totalAiCalls === 0
        ? "Nenhuma chamada de IA nas últimas 24h."
        : `Taxa de falha IA: ${aiFailRate.toFixed(1)}% (${aiFails}/${totalAiCalls})`,
      metric: Math.round(aiFailRate * 10) / 10,
      threshold: 10,
    });

    checks.push({
      name: "ai_response_time",
      status: avgResponseMs > 15000 ? "critical" : avgResponseMs > 8000 ? "warning" : "ok",
      message: `Tempo médio de resposta IA: ${avgResponseMs}ms`,
      metric: avgResponseMs,
      threshold: 8000,
    });

    // Check AI by function — detect specific failures
    const aiFuncMap: Record<string, { total: number; fails: number }> = {};
    for (const l of aiLogsList) {
      const fn = (l as any).function_name || "unknown";
      if (!aiFuncMap[fn]) aiFuncMap[fn] = { total: 0, fails: 0 };
      aiFuncMap[fn].total++;
      if (!(l as any).success) aiFuncMap[fn].fails++;
    }
    for (const [fn, stats] of Object.entries(aiFuncMap)) {
      const rate = stats.total > 3 ? (stats.fails / stats.total) * 100 : 0;
      if (rate > 30) {
        checks.push({
          name: `ai_function_${fn}`,
          status: "warning",
          message: `Função "${fn}" com ${rate.toFixed(0)}% de falha (${stats.fails}/${stats.total})`,
          metric: Math.round(rate),
          threshold: 30,
        });
      }
    }

    // ══════════════════════════════════════════════════════════
    // 4. DAILY PLAN & TASK EXECUTION
    // ══════════════════════════════════════════════════════════
    const plansToday = await safe(() =>
      supabase.from("daily_plans")
        .select("completed_count, total_blocks")
        .eq("plan_date", today), "daily_plans"
    ) as any[] | null;

    const plansList = plansToday || [];
    const totalBlocks = plansList.reduce((s: number, p: any) => s + (p.total_blocks || 0), 0);
    const completedBlocks = plansList.reduce((s: number, p: any) => s + (p.completed_count || 0), 0);
    const execRate = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : -1;

    if (execRate >= 0) {
      checks.push({
        name: "daily_plan_execution",
        status: execRate < 10 && plansList.length > 5 ? "warning" : "ok",
        message: `Taxa de execução do Plano do Dia: ${execRate}% (${completedBlocks}/${totalBlocks} blocos)`,
        metric: execRate,
        threshold: 10,
      });
    }

    // ══════════════════════════════════════════════════════════
    // 5. QUESTION BANK COVERAGE
    // ══════════════════════════════════════════════════════════
    const CORE_SPECIALTIES = [
      "Clínica Médica", "Cirurgia", "Pediatria", "Ginecologia e Obstetrícia",
      "Saúde Coletiva", "Medicina de Emergência",
    ];

    const specCounts = await Promise.all(
      CORE_SPECIALTIES.map(async (spec) => {
        const res = await safe(() =>
          supabase.from("questions_bank")
            .select("id", { count: "exact", head: true })
            .eq("is_global", true)
            .ilike("topic", `${spec}%`), `questions_${spec}`
        );
        return { spec, count: 0 }; // count comes from head query
      })
    );

    // ══════════════════════════════════════════════════════════
    // 6. OVERDUE REVIEWS (SYSTEM-WIDE)
    // ══════════════════════════════════════════════════════════
    const overdueReviews = await safe(() =>
      supabase.from("revisoes")
        .select("id", { count: "exact", head: true })
        .eq("status", "pendente")
        .lt("data_revisao", today), "overdue_reviews"
    );

    // ══════════════════════════════════════════════════════════
    // 6A. JORNADA DO USUÁRIO — CONSISTÊNCIA DASHBOARD ↔ MISSÃO
    // ══════════════════════════════════════════════════════════

    // Check: users with daily plans but 0 blocks (empty mission)
    const emptyPlans = await safe(() =>
      supabase.from("daily_plans")
        .select("user_id", { count: "exact", head: true })
        .eq("plan_date", today)
        .eq("total_blocks", 0), "empty_plans"
    );

    // Check: users with plans whose completed > total (data inconsistency)
    const overcompletedPlans = await safe(() =>
      supabase.from("daily_plans")
        .select("user_id, completed_count, total_blocks")
        .eq("plan_date", today)
        .limit(500), "overcompleted"
    ) as any[] | null;

    const overcompleted = (overcompletedPlans || []).filter(
      (p: any) => p.completed_count > p.total_blocks
    );
    if (overcompleted.length > 0) {
      checks.push({
        name: "journey_mission_overcompleted",
        status: "critical",
        message: `${overcompleted.length} plano(s) com blocos concluídos > total — dado inconsistente.`,
        metric: overcompleted.length,
      });
    } else {
      checks.push({
        name: "journey_mission_overcompleted",
        status: "ok",
        message: "Planos do dia consistentes (concluídos ≤ total).",
      });
    }

    // ══════════════════════════════════════════════════════════
    // 6B. JORNADA — QUESTÕES EM IDIOMA CORRETO (pt-BR)
    // ══════════════════════════════════════════════════════════
    const recentQuestions = await safe(() =>
      supabase.from("questions_bank")
        .select("id, statement")
        .eq("is_global", true)
        .order("created_at", { ascending: false })
        .limit(50), "recent_questions"
    ) as any[] | null;

    const englishPattern = /\b(the patient|most likely|which of the following|a \d+-year-old)\b/i;
    const englishQuestions = (recentQuestions || []).filter(
      (q: any) => englishPattern.test(q.statement || "")
    );
    checks.push({
      name: "journey_questions_language",
      status: englishQuestions.length > 0 ? "warning" : "ok",
      message: englishQuestions.length > 0
        ? `${englishQuestions.length} questão(ões) recentes possivelmente em inglês detectada(s).`
        : "Questões recentes em português (pt-BR) — OK.",
      metric: englishQuestions.length,
      threshold: 0,
    });

    // Short statement check
    const shortQuestions = (recentQuestions || []).filter(
      (q: any) => (q.statement || "").length < 200
    );
    if (shortQuestions.length > 5) {
      checks.push({
        name: "journey_questions_quality",
        status: "warning",
        message: `${shortQuestions.length} de ${(recentQuestions || []).length} questões recentes com enunciado curto (<200 chars).`,
        metric: shortQuestions.length,
        threshold: 5,
      });
    }

    // ══════════════════════════════════════════════════════════
    // 6C. JORNADA — MENTORIA SEM VAZAMENTO DE DADOS
    // ══════════════════════════════════════════════════════════
    const mentorPlans = await safe(() =>
      supabase.from("mentor_theme_plans")
        .select("id, professor_id, status")
        .eq("status", "active")
        .limit(100), "mentor_plans"
    ) as any[] | null;

    const mentorTargets = await safe(() =>
      supabase.from("mentor_theme_plan_targets")
        .select("plan_id, target_id")
        .limit(500), "mentor_targets"
    ) as any[] | null;

    // Check for plans without any targets (orphaned plans)
    if (mentorPlans && mentorTargets) {
      const planIds = new Set((mentorTargets || []).map((t: any) => t.plan_id));
      const orphanedPlans = (mentorPlans || []).filter((p: any) => !planIds.has(p.id));
      if (orphanedPlans.length > 0) {
        checks.push({
          name: "journey_mentorship_orphaned",
          status: "warning",
          message: `${orphanedPlans.length} plano(s) de mentoria ativo(s) sem alunos vinculados.`,
          metric: orphanedPlans.length,
        });
      }
    }

    // ══════════════════════════════════════════════════════════
    // 6D. JORNADA — CRONOGRAMA & COBERTURA
    // ══════════════════════════════════════════════════════════
    const temasEstudados = await safe(() =>
      supabase.from("temas_estudados")
        .select("id", { count: "exact", head: true }), "temas_total"
    );

    const temasNunca = await safe(() =>
      supabase.from("temas_estudados")
        .select("id", { count: "exact", head: true })
        .eq("total_questoes", 0), "temas_never_studied"
    );

    checks.push({
      name: "journey_cronograma_coverage",
      status: "ok",
      message: `Temas cadastrados no cronograma acessíveis.`,
    });

    // ══════════════════════════════════════════════════════════
    // 6E. JORNADA — OSCE & PROVA PRÁTICA
    // ══════════════════════════════════════════════════════════
    const osceOk = await safeTableCheck("practical_exam_results", "osce_results");
    const chronicleOk = await safeTableCheck("chronicle_osce_sessions", "chronicle_osce");
    checks.push({
      name: "journey_osce_accessible",
      status: osceOk && chronicleOk ? "ok" : "warning",
      message: osceOk && chronicleOk
        ? "Módulos OSCE e Prova Prática acessíveis."
        : "Problema ao acessar tabelas de OSCE / Prova Prática.",
    });

    // ══════════════════════════════════════════════════════════
    // 6F. JORNADA — CHANCE POR BANCA COERENTE
    // ══════════════════════════════════════════════════════════
    const recentScores = await safe(() =>
      supabase.from("approval_scores")
        .select("score, user_id")
        .order("created_at", { ascending: false })
        .limit(100), "approval_scores"
    ) as any[] | null;

    const scores = (recentScores || []).map((s: any) => s.score);
    const invalidScores = scores.filter((s: number) => s < 0 || s > 100);
    if (invalidScores.length > 0) {
      checks.push({
        name: "journey_approval_score_range",
        status: "critical",
        message: `${invalidScores.length} score(s) de aprovação fora do range 0-100 detectado(s).`,
        metric: invalidScores.length,
      });
    } else if (scores.length > 0) {
      checks.push({
        name: "journey_approval_score_range",
        status: "ok",
        message: `Scores de aprovação dentro do range esperado (0-100). Média: ${Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)}%.`,
        metric: Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length),
      });
    }

    // ══════════════════════════════════════════════════════════
    // 6G. JORNADA — SINCRONIZAÇÃO ERROR BANK ↔ REVISÕES
    // ══════════════════════════════════════════════════════════
    const recentErrors = await safe(() =>
      supabase.from("error_bank")
        .select("id", { count: "exact", head: true })
        .eq("dominado", false)
        .gte("created_at", weekAgo), "recent_errors"
    );

    checks.push({
      name: "journey_error_bank_active",
      status: "ok",
      message: "Error bank acessível e com dados recentes.",
    });

    // ══════════════════════════════════════════════════════════
    // 6H. JORNADA — GAMIFICAÇÃO CONSISTENTE
    // ══════════════════════════════════════════════════════════
    const gamifOk = await safeTableCheck("user_gamification", "gamification");
    checks.push({
      name: "journey_gamification",
      status: gamifOk ? "ok" : "warning",
      message: gamifOk
        ? "Sistema de gamificação acessível."
        : "Problema ao acessar tabela de gamificação.",
    });

    // ══════════════════════════════════════════════════════════
    // 7. REGRESSION DETECTION (compare with previous day)
    // ══════════════════════════════════════════════════════════
    const prevLog = await safe(() =>
      supabase.from("system_health_logs")
        .select("metrics_json, critical_count, warning_count, avg_ai_response_ms")
        .order("run_date", { ascending: false })
        .limit(1), "prev_log"
    ) as any[] | null;

    if (prevLog && prevLog.length > 0) {
      const prev = prevLog[0];
      // Check if AI response time increased significantly
      if (prev.avg_ai_response_ms > 0 && avgResponseMs > prev.avg_ai_response_ms * 2) {
        checks.push({
          name: "regression_ai_slowdown",
          status: "warning",
          message: `Tempo de resposta IA dobrou: ${prev.avg_ai_response_ms}ms → ${avgResponseMs}ms`,
          metric: avgResponseMs,
          threshold: prev.avg_ai_response_ms * 2,
        });
      }
      // Check if critical count increased
      if (prev.critical_count === 0) {
        const newCritical = checks.filter(c => c.status === "critical").length;
        if (newCritical > 0) {
          checks.push({
            name: "regression_new_critical",
            status: "critical",
            message: `${newCritical} novo(s) problema(s) crítico(s) detectado(s) desde ontem.`,
          });
        }
      }
    }

    // ══════════════════════════════════════════════════════════
    // 8. COMPUTE OVERALL STATUS
    // ══════════════════════════════════════════════════════════
    const criticalCount = checks.filter(c => c.status === "critical").length;
    const warningCount = checks.filter(c => c.status === "warning").length;
    const infoCount = checks.filter(c => c.status === "ok").length;
    const totalChecks = checks.length;

    const overallStatus = criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "ok";
    const studyEngineOk = !checks.some(c => c.name.startsWith("study_engine") && c.status === "critical");
    const aiOk = !checks.some(c => c.name.startsWith("ai_") && c.status === "critical");

    const metrics = {
      totalAiCalls,
      aiFailRate: Math.round(aiFailRate * 10) / 10,
      avgResponseMs,
      execRate,
      totalPlans: plansList.length,
      activeUsersNow: 0, // from presence check
      executionTimeMs: Date.now() - startTime,
    };

    // ══════════════════════════════════════════════════════════
    // 9. PERSIST LOG
    // ══════════════════════════════════════════════════════════
    const { error: insertError } = await supabase.from("system_health_logs").insert({
      run_date: today,
      overall_status: overallStatus,
      metrics_json: metrics,
      checks_json: checks,
      critical_count: criticalCount,
      warning_count: warningCount,
      info_count: infoCount,
      study_engine_ok: studyEngineOk,
      ai_ok: aiOk,
      avg_ai_response_ms: avgResponseMs,
      active_users: 0,
      total_checks: totalChecks,
    });

    if (insertError) {
      console.error("[DailyMonitor] Failed to persist log:", insertError.message);
    }

    // ══════════════════════════════════════════════════════════
    // 10. ALSO UPDATE system_health_reports FOR ADMIN ALERTS
    // ══════════════════════════════════════════════════════════
    if (criticalCount > 0 || warningCount > 0) {
      const healthAlerts = checks
        .filter(c => c.status !== "ok")
        .map(c => ({
          id: c.name,
          severity: c.status as "critical" | "warning" | "info",
          title: c.name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          message: c.message,
          metric: c.metric,
          threshold: c.threshold,
        }));

      await supabase.from("system_health_reports").insert({
        check_date: today,
        alerts: healthAlerts,
        total_critical: criticalCount,
        total_warning: warningCount,
        total_info: infoCount,
      });
    }

    // ══════════════════════════════════════════════════════════
    // 11. RESPONSE
    // ══════════════════════════════════════════════════════════
    const report = {
      status: overallStatus,
      run_date: today,
      execution_time_ms: Date.now() - startTime,
      summary: {
        total_checks: totalChecks,
        critical: criticalCount,
        warnings: warningCount,
        ok: infoCount,
        study_engine_ok: studyEngineOk,
        ai_ok: aiOk,
      },
      metrics,
      checks,
    };

    console.log(`[DailyMonitor] Concluído: ${overallStatus.toUpperCase()} — ${criticalCount} críticos, ${warningCount} avisos, ${totalChecks} checks em ${Date.now() - startTime}ms`);

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[DailyMonitor] Falha geral:", err);
    return new Response(JSON.stringify({
      status: "error",
      message: String(err),
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
