import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    const userId = user.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // ── Gather data ────────────────────────────────────────────
    const [
      practiceRes,
      domainRes,
      reviewRes,
      examRes,
      errorRes,
      streakRes,
      clinicalRes,
      diagnosticRes,
    ] = await Promise.all([
      adminClient
        .from("practice_attempts")
        .select("correct")
        .eq("user_id", userId)
        .limit(1000),
      adminClient
        .from("medical_domain_map")
        .select("domain_score, questions_answered")
        .eq("user_id", userId),
      adminClient
        .from("revisoes")
        .select("status, data_revisao")
        .eq("user_id", userId)
        .limit(500),
      adminClient
        .from("exam_sessions")
        .select("score, total_questions, status")
        .eq("user_id", userId)
        .eq("status", "finished")
        .order("finished_at", { ascending: false })
        .limit(20),
      adminClient
        .from("error_bank")
        .select("dominado, vezes_errado")
        .eq("user_id", userId)
        .limit(500),
      adminClient
        .from("user_gamification")
        .select("current_streak, longest_streak")
        .eq("user_id", userId)
        .single(),
      adminClient
        .from("simulation_history")
        .select("final_score")
        .eq("user_id", userId)
        .limit(20),
      adminClient
        .from("diagnostic_sessions")
        .select("score")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    // ── 1. Accuracy (0-100) ───────────────────────────────────
    const attempts = practiceRes.data || [];
    const totalAttempts = attempts.length;
    const totalCorrect = attempts.filter((a: any) => a.correct).length;
    const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;

    // ── 2. Domain score (0-100) ───────────────────────────────
    const domains = domainRes.data || [];
    const domainScore =
      domains.length > 0
        ? domains.reduce((s: number, d: any) => s + (d.domain_score || 0), 0) /
          domains.length
        : 0;

    // ── 3. Review score (0-100) ───────────────────────────────
    const reviews = reviewRes.data || [];
    const totalReviews = reviews.length;
    const completedReviews = reviews.filter(
      (r: any) => r.status === "concluida"
    ).length;
    const reviewScore =
      totalReviews > 0 ? (completedReviews / totalReviews) * 100 : 0;

    // ── 4. Consistency (0-100) ────────────────────────────────
    const streak = streakRes.data;
    const currentStreak = streak?.current_streak || 0;
    const consistencyScore = Math.min(currentStreak * 10, 100);

    // ── 5. Simulation score (0-100) ──────────────────────────
    const exams = examRes.data || [];
    const clinicals = clinicalRes.data || [];

    // exam_sessions.score já é percentual (0-100), então NÃO dividir por total_questions
    const examScores = exams
      .map((e: any) => Number(e.score))
      .filter((s: number) => Number.isFinite(s))
      .map((s: number) => Math.max(0, Math.min(100, s)));

    const clinicalScores = clinicals
      .map((c: any) => Number(c.final_score))
      .filter((s: number) => Number.isFinite(s))
      .map((s: number) => Math.max(0, Math.min(100, s)));

    const allSimScores = [...examScores, ...clinicalScores];
    const simulationScore =
      allSimScores.length > 0
        ? allSimScores.reduce((a: number, b: number) => a + b, 0) /
          allSimScores.length
        : 0;

    // ── 6. Error penalty (0-100, higher = more errors) ───────
    const errors = errorRes.data || [];
    const activeErrors = errors.filter((e: any) => !e.dominado);
    const totalErrorWeight = activeErrors.reduce(
      (s: number, e: any) => s + (e.vezes_errado || 1),
      0,
    );
    const rawPenalty = Math.min(totalErrorWeight / 20, 1) * 100;
    const errorComponent = 100 - rawPenalty;

    // ── 7. Diagnostic score with dynamic weight ──────────────
    const diagnosticSessions = diagnosticRes.data || [];
    const hasDiagnostic = diagnosticSessions.length > 0;
    const diagnosticScore = hasDiagnostic ? (diagnosticSessions[0] as any).score : 0;
    // Dynamic weight: 40% if little history, 10% if sufficient
    const hasEnoughHistory = totalAttempts >= 50 && totalReviews >= 10;
    const diagnosticWeight = hasDiagnostic ? (hasEnoughHistory ? 0.10 : 0.40) : 0;
    // Redistribute remaining weight proportionally
    const remainingWeight = 1 - diagnosticWeight;

    // ── Final score (dynamic weighting) ──────────────────────
    const rawScore =
      accuracy * 0.25 * remainingWeight +
      domainScore * 0.15 * remainingWeight +
      reviewScore * 0.15 * remainingWeight +
      consistencyScore * 0.15 * remainingWeight +
      simulationScore * 0.20 * remainingWeight +
      errorComponent * 0.10 * remainingWeight +
      diagnosticScore * diagnosticWeight;

    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    // ── Persist ──────────────────────────────────────────────
    const { error: insertError } = await adminClient
      .from("approval_scores")
      .insert({
        user_id: userId,
        score,
        accuracy: Math.round(accuracy * 100) / 100,
        domain_score: Math.round(domainScore * 100) / 100,
        review_score: Math.round(reviewScore * 100) / 100,
        consistency_score: Math.round(consistencyScore * 100) / 100,
        simulation_score: Math.round(simulationScore * 100) / 100,
        error_penalty: Math.round(rawPenalty * 100) / 100,
        details_json: {
          total_attempts: totalAttempts,
          domains_count: domains.length,
          reviews_total: totalReviews,
          reviews_completed: completedReviews,
          current_streak: currentStreak,
          exams_count: exams.length,
          clinical_count: clinicals.length,
          active_errors: activeErrors.length,
        },
      });

    if (insertError) {
      console.error("Insert error:", insertError);
    }

    return new Response(
      JSON.stringify({
        score,
        accuracy: Math.round(accuracy * 100) / 100,
        domain_score: Math.round(domainScore * 100) / 100,
        review_score: Math.round(reviewScore * 100) / 100,
        consistency_score: Math.round(consistencyScore * 100) / 100,
        simulation_score: Math.round(simulationScore * 100) / 100,
        error_penalty: Math.round(rawPenalty * 100) / 100,
        phase:
          score < 50
            ? "critico"
            : score < 70
            ? "atencao"
            : score < 85
            ? "competitivo"
            : "pronto",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("calculate-approval-score error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
