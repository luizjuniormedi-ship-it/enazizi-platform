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
  const dryRun = body.dry_run !== false; // default: dry_run = true
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
    if (urlCheck.suspicious) {
      results.push({ asset_code: asset.asset_code, status: "blocked", reason: `URL: ${urlCheck.reason}` });
      if (!dryRun) {
        await sb.from("medical_image_assets").update({
          is_active: false,
          review_status: "rejected",
          integrity_status: "contaminated",
          curation_notes: `Bloqueado pelo cleanup: ${urlCheck.reason}`,
        }).eq("id", asset.id);

        // Block linked questions
        const { count } = await sb.from("medical_image_questions")
          .update({ status: "rejected" } as any)
          .eq("asset_id", asset.id)
          .neq("status", "rejected")
          .select("id", { count: "exact", head: true });
        questionsBlocked += count || 0;
      }
      blocked++;
      continue;
    }

    // Step 2: Vision gate re-validation
    const visionResult = await validateImageVision(
      asset.image_url, asset.diagnosis || "", asset.image_type || "", LOVABLE_API_KEY
    );

    if (!visionResult.valid) {
      results.push({ asset_code: asset.asset_code, status: "blocked", reason: `Vision: ${visionResult.reason}` });
      if (!dryRun) {
        await sb.from("medical_image_assets").update({
          is_active: false,
          review_status: "rejected",
          integrity_status: "contaminated",
          curation_notes: `Bloqueado pelo cleanup vision: ${visionResult.reason}`,
        }).eq("id", asset.id);

        // Block linked questions
        const { data: linkedQs } = await sb.from("medical_image_questions")
          .select("id")
          .eq("asset_id", asset.id)
          .neq("status", "rejected");
        
        if (linkedQs && linkedQs.length > 0) {
          await sb.from("medical_image_questions")
            .update({ status: "rejected" } as any)
            .in("id", linkedQs.map(q => q.id));
          questionsBlocked += linkedQs.length;
        }
      }
      blocked++;
    } else {
      results.push({ asset_code: asset.asset_code, status: "passed", reason: visionResult.reason });
      passed++;
    }

    // Rate limit
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
