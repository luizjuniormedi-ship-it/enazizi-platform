import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isUrlSuspicious, validateImageVision } from "../_shared/vision-gate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const sb = createClient(supabaseUrl, serviceKey);

  const body = await req.json().catch(() => ({}));
  const dryRun = body.dry_run !== false;
  const batchSize = body.batch_size || 20;

  // Get all active published assets
  const { data: assets, error } = await sb
    .from("medical_image_assets")
    .select("id, asset_code, image_url, diagnosis, image_type, review_status, is_active")
    .eq("is_active", true)
    .in("review_status", ["published", "needs_review"])
    .not("image_url", "is", null)
    .limit(batchSize);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: any[] = [];
  let blocked = 0;
  let passed = 0;
  let questionsBlocked = 0;

  for (const asset of assets || []) {
    // Step 1: URL check
    const urlCheck = isUrlSuspicious(asset.image_url);
    let shouldBlock = false;
    let blockReason = "";

    if (urlCheck.suspicious) {
      shouldBlock = true;
      blockReason = `URL: ${urlCheck.reason}`;
    } else {
      // Step 2: Vision gate
      const visionResult = await validateImageVision(
        asset.image_url, asset.diagnosis || "", asset.image_type || "", LOVABLE_API_KEY
      );
      if (!visionResult.valid) {
        shouldBlock = true;
        blockReason = `Vision: ${visionResult.reason}`;
      } else {
        results.push({ asset_code: asset.asset_code, status: "passed", reason: visionResult.reason });
        passed++;
      }
    }

    if (shouldBlock) {
      results.push({ asset_code: asset.asset_code, status: "blocked", reason: blockReason });
      if (!dryRun) {
        // Update asset
        const { error: updateErr, data: updateData } = await sb
          .from("medical_image_assets")
          .update({
            is_active: false,
            review_status: "rejected",
            curation_notes: `Cleanup: ${blockReason}`,
          })
          .eq("id", asset.id)
          .select("id");

        console.log(`[cleanup] Asset ${asset.asset_code} update:`, updateErr ? `ERROR: ${updateErr.message}` : `OK (${updateData?.length} rows)`);

        // Block linked questions
        const { data: linkedQs, error: qErr } = await sb
          .from("medical_image_questions")
          .update({ status: "rejected" } as any)
          .eq("asset_id", asset.id)
          .neq("status", "rejected")
          .select("id");

        const qCount = linkedQs?.length || 0;
        console.log(`[cleanup] Questions for ${asset.asset_code}: ${qCount} blocked`, qErr ? `ERROR: ${qErr.message}` : "");
        questionsBlocked += qCount;
      }
      blocked++;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  return new Response(JSON.stringify({
    dry_run: dryRun,
    total_checked: assets?.length || 0,
    blocked,
    passed,
    questions_blocked: questionsBlocked,
    results,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
