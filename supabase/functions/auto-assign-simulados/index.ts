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

    // 2. Auto-assign new students to simulados with auto_assign = true
    const { data: autoSims } = await sb
      .from("teacher_simulados")
      .select("id, faculdade_filter, periodo_filter, total_questions")
      .eq("auto_assign", true)
      .in("status", ["published"]);

    for (const sim of (autoSims || [])) {
      // Find matching students
      let query = sb.from("profiles").select("user_id").eq("status", "active");
      if (sim.faculdade_filter) query = query.eq("faculdade", sim.faculdade_filter);
      if (sim.periodo_filter) query = query.eq("periodo", sim.periodo_filter);
      const { data: students } = await query;

      if (!students || students.length === 0) continue;

      // Get existing results for this simulado
      const { data: existingResults } = await sb
        .from("teacher_simulado_results")
        .select("student_id")
        .eq("simulado_id", sim.id);

      const existingIds = new Set((existingResults || []).map((r: any) => r.student_id));

      // Find new students not yet assigned
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
        console.log(`Assigned ${newStudents.length} new students to simulado ${sim.id}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, published: publishedCount, assigned: assignedCount }),
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
