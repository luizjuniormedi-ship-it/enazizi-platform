import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date().toISOString();
    let publishedCount = 0;
    let assignedCount = 0;

    // 1. Publish scheduled simulados whose time has arrived
    const { data: scheduledSims } = await sb
      .from("teacher_simulados")
      .select("id")
      .eq("status", "scheduled")
      .lte("scheduled_at", now);

    if (scheduledSims && scheduledSims.length > 0) {
      const ids = scheduledSims.map((s: any) => s.id);
      await sb.from("teacher_simulados").update({ status: "published" }).in("id", ids);
      publishedCount = ids.length;
      console.log(`Published ${publishedCount} scheduled simulados`);
    }

    // 2. Auto-assign students to simulados with auto_assign = true
    const { data: autoSims } = await sb
      .from("teacher_simulados")
      .select("id, faculdade_filter, periodo_filter, total_questions")
      .eq("auto_assign", true)
      .in("status", ["published"]);

    for (const sim of (autoSims || [])) {
      let query = sb.from("profiles").select("user_id").eq("status", "active");
      if (sim.faculdade_filter) query = query.eq("faculdade", sim.faculdade_filter);
      if (sim.periodo_filter) query = query.eq("periodo", sim.periodo_filter);
      const { data: students } = await query;
      if (!students || students.length === 0) continue;

      const { data: existingResults } = await sb
        .from("teacher_simulado_results")
        .select("student_id")
        .eq("simulado_id", sim.id);

      const existingIds = new Set((existingResults || []).map((r: any) => r.student_id));
      const newStudents = students.filter((s: any) => !existingIds.has(s.user_id));

      if (newStudents.length > 0) {
        const results = newStudents.map((s: any) => ({
          simulado_id: sim.id,
          student_id: s.user_id,
          total_questions: sim.total_questions,
          status: "pending",
        }));
        await sb.from("teacher_simulado_results").insert(results);
        assignedCount += newStudents.length;
        console.log(`Assigned ${newStudents.length} students to simulado ${sim.id}`);
      }
    }

    // 3. Auto-assign students to clinical cases
    let clinicalAssigned = 0;
    const { data: clinicalCases } = await sb
      .from("teacher_clinical_cases")
      .select("id, faculdade_filter, periodo_filter")
      .eq("status", "published");

    for (const cc of (clinicalCases || [])) {
      let query = sb.from("profiles").select("user_id").eq("status", "active");
      if (cc.faculdade_filter) query = query.eq("faculdade", cc.faculdade_filter);
      if (cc.periodo_filter) query = query.eq("periodo", cc.periodo_filter);
      const { data: students } = await query;
      if (!students || students.length === 0) continue;

      const { data: existingResults } = await sb
        .from("teacher_clinical_case_results")
        .select("student_id")
        .eq("case_id", cc.id);

      const existingIds = new Set((existingResults || []).map((r: any) => r.student_id));
      const newStudents = students.filter((s: any) => !existingIds.has(s.user_id));

      if (newStudents.length > 0) {
        const results = newStudents.map((s: any) => ({
          case_id: cc.id,
          student_id: s.user_id,
          status: "pending",
        }));
        await sb.from("teacher_clinical_case_results").insert(results);
        clinicalAssigned += newStudents.length;
        console.log(`Assigned ${newStudents.length} students to clinical case ${cc.id}`);
      }
    }

    // 4. Auto-assign students to study assignments
    let studyAssigned = 0;
    const { data: studyAssignments } = await sb
      .from("teacher_study_assignments")
      .select("id, faculdade_filter, periodo_filter")
      .eq("status", "published");

    for (const sa of (studyAssignments || [])) {
      let query = sb.from("profiles").select("user_id").eq("status", "active");
      if (sa.faculdade_filter) query = query.eq("faculdade", sa.faculdade_filter);
      if (sa.periodo_filter) query = query.eq("periodo", sa.periodo_filter);
      const { data: students } = await query;
      if (!students || students.length === 0) continue;

      const { data: existingResults } = await sb
        .from("teacher_study_assignment_results")
        .select("student_id")
        .eq("assignment_id", sa.id);

      const existingIds = new Set((existingResults || []).map((r: any) => r.student_id));
      const newStudents = students.filter((s: any) => !existingIds.has(s.user_id));

      if (newStudents.length > 0) {
        const results = newStudents.map((s: any) => ({
          assignment_id: sa.id,
          student_id: s.user_id,
          status: "pending",
        }));
        await sb.from("teacher_study_assignment_results").insert(results);
        studyAssigned += newStudents.length;
        console.log(`Assigned ${newStudents.length} students to study assignment ${sa.id}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        published: publishedCount,
        assigned_simulados: assignedCount,
        assigned_clinical: clinicalAssigned,
        assigned_study: studyAssigned,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("auto-assign error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
