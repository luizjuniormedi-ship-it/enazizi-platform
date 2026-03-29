import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Score mapping helpers ──

function inactivityScore(daysSinceLastActivity: number): number {
  if (daysSinceLastActivity <= 0) return 0;
  if (daysSinceLastActivity === 1) return 5;
  if (daysSinceLastActivity === 2) return 10;
  if (daysSinceLastActivity === 3) return 20;
  if (daysSinceLastActivity === 4) return 30;
  if (daysSinceLastActivity === 5) return 40;
  if (daysSinceLastActivity === 6) return 50;
  if (daysSinceLastActivity === 7) return 60;
  if (daysSinceLastActivity <= 10) return 75;
  if (daysSinceLastActivity <= 14) return 90;
  return 100;
}

function ratioScore(ratio: number): number {
  if (ratio <= 0) return 0;
  if (ratio <= 0.10) return 10;
  if (ratio <= 0.25) return 25;
  if (ratio <= 0.40) return 45;
  if (ratio <= 0.60) return 65;
  if (ratio <= 0.80) return 85;
  return 100;
}

function ratioScoreLinear(ratio: number): number {
  if (ratio <= 0) return 0;
  if (ratio <= 0.20) return 20;
  if (ratio <= 0.40) return 40;
  if (ratio <= 0.60) return 60;
  if (ratio <= 0.80) return 80;
  return 100;
}

function approvalDropScore(drop: number): number {
  if (drop <= 0) return 0;
  if (drop <= 4) return 10;
  if (drop <= 9) return 25;
  if (drop <= 14) return 45;
  if (drop <= 19) return 70;
  return 100;
}

function activeDaysScore(days: number): number {
  const map = [0, 15, 30, 45, 60, 75, 90, 100];
  return map[Math.min(days, 7)];
}

function tutorUsageScore(sessions: number): number {
  if (sessions === 0) return 0;
  if (sessions === 1) return 25;
  if (sessions === 2) return 50;
  if (sessions === 3) return 70;
  if (sessions === 4) return 85;
  return 100;
}

function simuladoUsageScore(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 40;
  if (count === 2) return 70;
  return 100;
}

function daysBetween(a: string, b: Date): number {
  return Math.max(0, Math.floor((b.getTime() - new Date(a).getTime()) / 86400000));
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

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

    // ── Parallel data fetch ──
    const [
      profilesRes,
      presenceRes,
      approvalCurrentRes,
      approvalHistoryRes,
      dailyPlansWeekRes,
      reviewsDueRes,
      reviewsCompletedRes,
      tutorSessionsRes,
      simuladoSessionsRes,
      topicProfilesRes,
      simSessionsRes,
      anamnesisSessionsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, email, status, daily_study_hours").eq("status", "approved").limit(500),
      supabase.from("user_presence").select("user_id, last_seen_at").limit(500),
      supabase.from("approval_scores").select("user_id, score, accuracy, created_at").order("created_at", { ascending: false }).limit(1000),
      supabase.from("approval_scores").select("user_id, score, created_at").gte("created_at", thirtyDaysAgo).order("created_at", { ascending: false }).limit(2000),
      supabase.from("daily_plans").select("user_id, plan_date, completed_count, total_blocks").gte("plan_date", sevenDaysAgo.split("T")[0]).limit(2000),
      supabase.from("revisoes").select("user_id, status, data_revisao").lte("data_revisao", today).limit(2000),
      supabase.from("revisoes").select("user_id, status").eq("status", "concluida").gte("concluida_em", sevenDaysAgo).limit(2000),
      supabase.from("chat_conversations").select("user_id, agent_type, created_at").eq("agent_type", "tutor").gte("created_at", sevenDaysAgo).limit(2000),
      supabase.from("exam_sessions").select("user_id, created_at").gte("created_at", thirtyDaysAgo).limit(1000),
      supabase.from("user_topic_profiles").select("user_id, topic, specialty, accuracy, mastery_level, total_questions").gte("total_questions", 3).limit(3000),
      supabase.from("simulation_sessions").select("user_id, final_score, status").eq("status", "completed").gte("created_at", thirtyDaysAgo).limit(500),
      supabase.from("anamnesis_sessions").select("user_id, final_score, status").eq("status", "completed").gte("created_at", thirtyDaysAgo).limit(500),
    ]);

    // ── Index data by user ──
    const presenceMap: Record<string, string> = {};
    for (const p of (presenceRes.data || [])) presenceMap[p.user_id] = p.last_seen_at;

    // Current approval score (latest per user)
    const currentApproval: Record<string, { score: number; accuracy: number }> = {};
    for (const s of (approvalCurrentRes.data || [])) {
      if (!currentApproval[s.user_id]) currentApproval[s.user_id] = { score: s.score, accuracy: s.accuracy };
    }

    // Historical approval (avg over 7-30 days, excluding latest)
    const approvalHistory: Record<string, number[]> = {};
    for (const s of (approvalHistoryRes.data || [])) {
      if (!approvalHistory[s.user_id]) approvalHistory[s.user_id] = [];
      approvalHistory[s.user_id].push(s.score);
    }

    // Daily plans aggregation per user (last 7 days)
    const plansMap: Record<string, { completed: number; total: number; activeDays: Set<string> }> = {};
    for (const p of (dailyPlansWeekRes.data || [])) {
      if (!plansMap[p.user_id]) plansMap[p.user_id] = { completed: 0, total: 0, activeDays: new Set() };
      plansMap[p.user_id].completed += p.completed_count || 0;
      plansMap[p.user_id].total += p.total_blocks || 0;
      if ((p.completed_count || 0) > 0) plansMap[p.user_id].activeDays.add(p.plan_date);
    }

    // Reviews
    const reviewsDue: Record<string, { total: number; overdue: number }> = {};
    for (const r of (reviewsDueRes.data || [])) {
      if (!reviewsDue[r.user_id]) reviewsDue[r.user_id] = { total: 0, overdue: 0 };
      reviewsDue[r.user_id].total++;
      if (r.status === "pendente") reviewsDue[r.user_id].overdue++;
    }

    const reviewsCompleted7d: Record<string, number> = {};
    for (const r of (reviewsCompletedRes.data || [])) {
      reviewsCompleted7d[r.user_id] = (reviewsCompleted7d[r.user_id] || 0) + 1;
    }

    // Tutor sessions
    const tutorSessions7d: Record<string, number> = {};
    for (const t of (tutorSessionsRes.data || [])) {
      tutorSessions7d[t.user_id] = (tutorSessions7d[t.user_id] || 0) + 1;
    }

    // Simulado sessions
    const simuladoSessions30d: Record<string, number> = {};
    for (const s of (simuladoSessionsRes.data || [])) {
      simuladoSessions30d[s.user_id] = (simuladoSessions30d[s.user_id] || 0) + 1;
    }

    // Topic profiles (weakest topics)
    const topicsByUser: Record<string, { topic: string; specialty: string; accuracy: number; mastery: number; questions: number }[]> = {};
    for (const t of (topicProfilesRes.data || [])) {
      if (!topicsByUser[t.user_id]) topicsByUser[t.user_id] = [];
      topicsByUser[t.user_id].push({ topic: t.topic, specialty: t.specialty, accuracy: t.accuracy, mastery: t.mastery_level, questions: t.total_questions });
    }

    // Simulation & anamnesis performance
    const simPerf: Record<string, number[]> = {};
    for (const s of (simSessionsRes.data || [])) {
      if (!simPerf[s.user_id]) simPerf[s.user_id] = [];
      if (s.final_score != null) simPerf[s.user_id].push(s.final_score);
    }
    const anamPerf: Record<string, number[]> = {};
    for (const a of (anamnesisSessionsRes.data || [])) {
      if (!anamPerf[a.user_id]) anamPerf[a.user_id] = [];
      if (a.final_score != null) anamPerf[a.user_id].push(a.final_score);
    }

    // ── Compute per student ──
    const students = (profilesRes.data || []).map((p: any) => {
      const uid = p.user_id;
      const lastSeen = presenceMap[uid] || null;
      const daysSince = lastSeen ? daysBetween(lastSeen, now) : 999;
      const approval = currentApproval[uid] || { score: 0, accuracy: 0 };
      const plans = plansMap[uid] || { completed: 0, total: 0, activeDays: new Set() };
      const reviews = reviewsDue[uid] || { total: 0, overdue: 0 };
      const revCompleted = reviewsCompleted7d[uid] || 0;
      const tutorCount = tutorSessions7d[uid] || 0;
      const simCount = simuladoSessions30d[uid] || 0;

      // ── Engagement Score ──
      const aDays = activeDaysScore(plans.activeDays.size);
      // study_time_score: approximate from plan execution
      const expectedWeeklyMin = (p.daily_study_hours || 4) * 60 * 5;
      const actualMin = plans.completed * 30; // ~30min per block
      const studyTimeRatio = actualMin / Math.max(expectedWeeklyMin, 1);
      const studyTime = ratioScoreLinear(studyTimeRatio);
      const planExec = ratioScoreLinear(plans.completed / Math.max(plans.total, 1));
      const tutorUse = tutorUsageScore(tutorCount);
      const simUse = simuladoUsageScore(simCount);
      const revDue = reviews.total > 0 ? reviews.total : 1;
      const reviewComp = ratioScoreLinear(revCompleted / revDue);

      const engagementScore = Math.round(
        aDays * 0.25 + studyTime * 0.20 + planExec * 0.25 +
        tutorUse * 0.10 + simUse * 0.10 + reviewComp * 0.10
      );

      // ── Risk Score ──
      const inact = inactivityScore(daysSince);
      const overdueTasks = plans.total > 0 ? Math.max(0, plans.total - plans.completed) : 0;
      const overdueTaskRatio = overdueTasks / Math.max(plans.total, 1);
      const overdueTasksS = ratioScore(overdueTaskRatio);
      const overdueReviewRatio = reviews.overdue / Math.max(reviews.total, 1);
      const overdueReviewsS = ratioScore(overdueReviewRatio);

      // Approval drop
      const history = approvalHistory[uid] || [];
      let prevAvg = 0;
      if (history.length > 1) {
        const older = history.slice(1, 6);
        prevAvg = older.reduce((a, b) => a + b, 0) / older.length;
      }
      const drop = history.length > 1 ? prevAvg - approval.score : 0;
      const approvalDropS = approvalDropScore(drop);

      const lowEngS = 100 - engagementScore;

      const riskScore = Math.round(
        inact * 0.30 + overdueTasksS * 0.20 + overdueReviewsS * 0.15 +
        approvalDropS * 0.20 + lowEngS * 0.15
      );

      // ── Student Status ──
      let studentStatus: "active" | "attention" | "risk" | "critical" = "active";
      if (riskScore >= 75) studentStatus = "critical";
      else if (riskScore >= 50) studentStatus = "risk";
      else if (riskScore >= 30) studentStatus = "attention";

      // Overrides
      if (daysSince >= 15 && studentStatus === "active") studentStatus = "risk";
      if (daysSince >= 15 && studentStatus === "attention") studentStatus = "risk";
      if (approval.score < 35 && engagementScore < 30) studentStatus = "critical";

      // ── Risk Reason ──
      const components = [
        { key: "inactivity", score: inact, text: "Sem acesso recente" },
        { key: "overdue_tasks", score: overdueTasksS, text: "Muitas tarefas atrasadas" },
        { key: "overdue_reviews", score: overdueReviewsS, text: "Revisões acumuladas" },
        { key: "approval_drop", score: approvalDropS, text: "Queda de desempenho" },
        { key: "low_engagement", score: lowEngS, text: "Baixo engajamento" },
      ];
      components.sort((a, b) => b.score - a.score);
      const riskReason = riskScore > 0 ? components[0].text : "Nenhum";

      // ── Student Profile ──
      const approvalImproved = history.length > 1 && approval.score > prevAvg + 10;
      const riskDropped = riskScore < 50 && history.length > 1;
      const approvalOscillation = history.length > 2
        ? Math.max(...history) - Math.min(...history)
        : 0;

      let studentProfile: "consistent" | "oscillating" | "disengaged" | "studying_the_wrong_way" | "recovering" = "consistent";

      if (approvalImproved || (history.length > 1 && drop < -15)) {
        studentProfile = "recovering";
      } else if (inact >= 60 || engagementScore < 35) {
        studentProfile = "disengaged";
      } else if (engagementScore >= 60 && approval.score < 55) {
        studentProfile = "studying_the_wrong_way";
      } else if (engagementScore >= 40 && engagementScore < 75 && approvalOscillation > 10) {
        studentProfile = "oscillating";
      }

      // ── Next Best Action ──
      const actions: string[] = [];
      const actionMap: Record<string, string> = {
        "Sem acesso recente": "Enviar mensagem de reengajamento e reduzir a carga inicial",
        "Muitas tarefas atrasadas": "Reduzir conteúdo novo e focar recuperação do plano",
        "Revisões acumuladas": "Priorizar revisões antes de avançar em novos temas",
        "Queda de desempenho": "Aplicar plano corretivo com Tutor IA e mini simulado",
        "Baixo engajamento": "Simplificar o plano e reforçar metas curtas",
      };
      if (riskReason !== "Nenhum") actions.push(actionMap[riskReason] || "Acompanhar de perto");

      // Check simulation performance
      const simScores = simPerf[uid] || [];
      if (simScores.length > 0) {
        const avgSim = simScores.reduce((a, b) => a + b, 0) / simScores.length;
        if (avgSim < 50) actions.push("Adicionar treino de Plantão");
      }
      const anamScores = anamPerf[uid] || [];
      if (anamScores.length > 0) {
        const avgAnam = anamScores.reduce((a, b) => a + b, 0) / anamScores.length;
        if (avgAnam < 50) actions.push("Adicionar treino de Anamnese");
      }

      const nextBestAction = actions.length > 0 ? actions.join(". ") : "Manter acompanhamento regular";

      // ── Weakest Topics ──
      const topics = topicsByUser[uid] || [];
      const weakestTopics = topics
        .map(t => ({
          topic: t.topic,
          specialty: t.specialty,
          weakness_score: Math.round(
            (100 - t.accuracy) * 0.50 + (100 - (t.mastery * 20)) * 0.30 + 50 * 0.20
          ),
          accuracy: t.accuracy,
          mastery: t.mastery,
        }))
        .sort((a, b) => b.weakness_score - a.weakness_score)
        .slice(0, 3);

      return {
        user_id: uid,
        display_name: p.display_name || p.email?.split("@")[0] || "—",
        email: p.email || "",
        last_seen_at: lastSeen,
        approval_score: Math.round(approval.score),
        accuracy: Math.round(approval.accuracy),
        risk_score: riskScore,
        engagement_score: engagementScore,
        student_status: studentStatus,
        risk_reason: riskReason,
        student_profile: studentProfile,
        next_best_action: nextBestAction,
        weakest_topics: weakestTopics,
        overdue_tasks: overdueTasks,
        overdue_reviews: reviews.overdue,
        completed_tasks_7d: plans.completed,
        scheduled_tasks_7d: plans.total,
        tutor_sessions_7d: tutorCount,
        simulados_30d: simCount,
        total_study_minutes_7d: actualMin,
        risk_components: {
          inactivity: inact,
          overdue_tasks: overdueTasksS,
          overdue_reviews: overdueReviewsS,
          approval_drop: approvalDropS,
          low_engagement: lowEngS,
        },
        engagement_components: {
          active_days: aDays,
          study_time: studyTime,
          plan_execution: planExec,
          tutor_usage: tutorUse,
          simulado_usage: simUse,
          review_completion: reviewComp,
        },
      };
    });

    // Sort by risk descending
    students.sort((a: any, b: any) => b.risk_score - a.risk_score);

    // ── Pedagogical Alerts ──
    const alerts = students
      .filter((s: any) => s.student_status !== "active")
      .map((s: any) => ({
        user_id: s.user_id,
        display_name: s.display_name,
        reason: s.risk_reason,
        severity: s.student_status === "critical" ? "high" : s.student_status === "risk" ? "medium" : "low",
        details: s.next_best_action,
        risk_score: s.risk_score,
        student_profile: s.student_profile,
      }));

    // ── Summary stats ──
    const statusCounts = { active: 0, attention: 0, risk: 0, critical: 0 };
    for (const s of students) statusCounts[s.student_status as keyof typeof statusCounts]++;

    return new Response(JSON.stringify({
      students,
      alerts,
      summary: {
        total: students.length,
        ...statusCounts,
        avg_approval: students.length > 0
          ? Math.round(students.reduce((sum: number, s: any) => sum + s.approval_score, 0) / students.length)
          : 0,
        avg_risk: students.length > 0
          ? Math.round(students.reduce((sum: number, s: any) => sum + s.risk_score, 0) / students.length)
          : 0,
        avg_engagement: students.length > 0
          ? Math.round(students.reduce((sum: number, s: any) => sum + s.engagement_score, 0) / students.length)
          : 0,
      },
      timestamp: now.toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("mentor-intelligence error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
