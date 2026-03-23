import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  metric?: number;
  threshold?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const alerts: HealthAlert[] = [];

    // 1. Check questions_bank count per MAIN specialty (not subtopics)
    const SPECIALTIES = [
      "Cardiologia", "Pneumologia", "Neurologia", "Endocrinologia",
      "Gastroenterologia", "Pediatria", "Ginecologia e Obstetrícia",
      "Cirurgia Geral", "Medicina Preventiva", "Nefrologia",
      "Infectologia", "Hematologia", "Reumatologia", "Dermatologia",
      "Ortopedia", "Urologia", "Psiquiatria", "Oftalmologia",
      "Otorrinolaringologia", "Emergência", "Semiologia", "Anatomia",
      "Farmacologia", "Oncologia",
    ];

    // Parallel count per main specialty
    const countResults = await Promise.all(
      SPECIALTIES.map(async (spec) => {
        const { count } = await supabase
          .from("questions_bank")
          .select("id", { count: "exact", head: true })
          .eq("is_global", true)
          .eq("topic", spec);
        return { spec, count: count || 0 };
      })
    );

    const MIN_PER_SPECIALTY = 20;
    const lowSpecs = countResults.filter((r) => r.count < MIN_PER_SPECIALTY);
    if (lowSpecs.length > 0) {
      const severity = lowSpecs.some((s) => s.count === 0) ? "critical" as const : "warning" as const;
      alerts.push({
        id: "low-questions",
        severity,
        title: "Especialidades com Poucas Questões",
        message: `${lowSpecs.length} especialidade(s) com menos de ${MIN_PER_SPECIALTY} questões: ${lowSpecs.sort((a, b) => a.count - b.count).slice(0, 8).map((s) => `${s.spec} (${s.count})`).join(", ")}`,
        metric: lowSpecs.length,
        threshold: MIN_PER_SPECIALTY,
      });
    }

    // 2. Check daily_generation_log failures (last 24h)
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const { data: genLogs } = await supabase
      .from("daily_generation_log")
      .select("*")
      .gte("created_at", yesterday);

    const failedGens = (genLogs || []).filter((l: any) => l.status !== "success");
    if (failedGens.length > 0) {
      alerts.push({
        id: "generation-failed",
        severity: "critical",
        title: "Geração Diária Falhou",
        message: `${failedGens.length} execução(ões) falharam nas últimas 24h. Questões podem não estar sendo geradas.`,
        metric: failedGens.length,
        threshold: 0,
      });
    }

    const noGenToday = (genLogs || []).length === 0;
    if (noGenToday) {
      alerts.push({
        id: "no-generation",
        severity: "critical",
        title: "Nenhuma Geração nas Últimas 24h",
        message: "Nenhum registro de geração de questões encontrado nas últimas 24 horas.",
        metric: 0,
        threshold: 1,
      });
    }

    // 3. Uploads pending > 24h
    const { data: pendingUploads } = await supabase
      .from("uploads")
      .select("id, created_at")
      .eq("status", "pending")
      .lt("created_at", yesterday);

    if ((pendingUploads || []).length > 0) {
      alerts.push({
        id: "pending-uploads",
        severity: "warning",
        title: "Uploads Pendentes",
        message: `${pendingUploads!.length} upload(s) pendente(s) há mais de 24 horas.`,
        metric: pendingUploads!.length,
        threshold: 0,
      });
    }

    // 4. Users with quota > 80%
    const { data: quotas } = await supabase
      .from("user_quotas")
      .select("user_id, questions_used, questions_limit");

    const overQuota = (quotas || []).filter(
      (q: any) => q.questions_limit > 0 && q.questions_used / q.questions_limit >= 0.8
    );
    if (overQuota.length > 0) {
      alerts.push({
        id: "quota-exhausted",
        severity: "warning",
        title: "Usuários com Cota Esgotando",
        message: `${overQuota.length} usuário(s) utilizaram 80%+ da cota de questões.`,
        metric: overQuota.length,
        threshold: 0,
      });
    }

    // 5. Pending profile approvals
    const { count: pendingProfiles } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    if ((pendingProfiles || 0) > 0) {
      alerts.push({
        id: "pending-profiles",
        severity: "warning",
        title: "Usuários Pendentes de Aprovação",
        message: `${pendingProfiles} usuário(s) aguardando aprovação.`,
        metric: pendingProfiles || 0,
        threshold: 0,
      });
    }

    // 6. Unread feedback (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { count: recentFeedback } = await supabase
      .from("user_feedback")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo);

    if ((recentFeedback || 0) > 0) {
      alerts.push({
        id: "unread-feedback",
        severity: "info",
        title: "Feedbacks Recentes",
        message: `${recentFeedback} feedback(s) recebido(s) nos últimos 7 dias.`,
        metric: recentFeedback || 0,
        threshold: 0,
      });
    }

    // 7. Stale flashcard reviews
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { count: staleReviews } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .lt("next_review", thirtyDaysAgo);

    if ((staleReviews || 0) > 50) {
      alerts.push({
        id: "stale-reviews",
        severity: "info",
        title: "Revisões Estagnadas",
        message: `${staleReviews} revisão(ões) atrasada(s) há mais de 30 dias no sistema.`,
        metric: staleReviews || 0,
        threshold: 50,
      });
    }

    // Save report
    const totalCritical = alerts.filter((a) => a.severity === "critical").length;
    const totalWarning = alerts.filter((a) => a.severity === "warning").length;
    const totalInfo = alerts.filter((a) => a.severity === "info").length;

    await supabase.from("system_health_reports").insert({
      alerts,
      total_critical: totalCritical,
      total_warning: totalWarning,
      total_info: totalInfo,
    });

    return new Response(
      JSON.stringify({
        success: true,
        total_alerts: alerts.length,
        critical: totalCritical,
        warning: totalWarning,
        info: totalInfo,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("system-health-check error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
