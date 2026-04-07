import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Find a user with pending reviews
  const { data: revs } = await supabase
    .from("revisoes")
    .select("user_id, id, tema_id, data_revisao, temas_estudados(tema, especialidade)")
    .eq("status", "pendente")
    .lte("data_revisao", new Date().toISOString().slice(0, 10))
    .order("data_revisao", { ascending: true })
    .limit(3);

  if (!revs || revs.length === 0) {
    return new Response(JSON.stringify({ error: "No pending reviews found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = revs[0].user_id;

  // Find errors for same user
  const { data: errors } = await supabase
    .from("error_bank")
    .select("id, tema, vezes_errado")
    .eq("user_id", userId)
    .eq("dominado", false)
    .limit(3);

  // Simulate what the engine does
  const simulatedRecs = revs.map((rev: any, i: number) => ({
    id: `rev-${i}`,
    type: "review",
    topic: rev.temas_estudados?.tema || "Unknown",
    sourceTable: "revisoes",
    sourceRecordId: rev.id,
    sourceRecordId_type: typeof rev.id,
    has_id: "id" in rev,
    raw_id: rev.id,
  }));

  const simulatedErrors = (errors || []).map((err: any, i: number) => ({
    id: `err-${i}`,
    type: "error_review",
    topic: err.tema,
    sourceTable: "error_bank",
    sourceRecordId: err.id,
    errorBankId: err.id,
  }));

  // Check latest mission for this user
  const { data: mission } = await supabase
    .from("user_missions")
    .select("id, current_tasks, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const missionFirstTask = mission ? (mission.current_tasks as any[])?.[0] : null;

  return new Response(JSON.stringify({
    userId,
    diagnosis: {
      engine_would_produce: {
        reviews: simulatedRecs,
        errors: simulatedErrors,
      },
      mission_stored: {
        missionId: mission?.id,
        created_at: mission?.created_at,
        firstTask: missionFirstTask,
        firstTask_has_sourceRecordId: missionFirstTask ? "sourceRecordId" in missionFirstTask : null,
        firstTask_has_errorBankId: missionFirstTask ? "errorBankId" in missionFirstTask : null,
      },
      conclusion: missionFirstTask?.sourceRecordId
        ? "IDs canônicos PRESENTES na missão"
        : "IDs canônicos AUSENTES na missão — bug confirmado",
    },
  }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
