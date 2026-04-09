import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUSPICIOUS_URL_PATTERNS = [
  "mockup", "screenshot", "placeholder", "laptop", "dashboard",
  "notebook", "landing-page", "landing_page", "wireframe",
  "ui-design", "ui_design", "template", "stock-photo", "stockphoto",
  "infographic", "chart-image", "graph-image",
  "hero-image", "feature-image", "banner-image",
  "certificate", "badge-image", "award-image",
  "social-media", "facebook", "twitter", "instagram",
  "shutterstock", "gettyimages", "istockphoto", "dreamstime",
  "unsplash.com", "pexels.com", "pixabay.com",
  "youtube.com/", "vimeo.com/",
  "portrait", "selfie", "headshot", "face-photo", "face_photo",
  "profile-photo", "profile_photo", "profile-pic", "profile_pic",
  "avatar", "person-photo", "person_photo",
  "logo", "branding", "institutional", "team-photo", "team_photo",
  "corporate", "company-photo", "company_photo",
  "icon-", "icon_", "emoji", "sticker", "clipart", "cartoon",
  "illustration", "vector", "flat-design", "flat_design",
];

function isUrlSuspicious(url: string | null): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  for (const p of SUSPICIOUS_URL_PATTERNS) {
    if (lower.includes(p)) return true;
  }
  // Must look like an image URL
  if (!lower.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i) && !lower.includes("/storage/") && !lower.includes("/question-images/")) {
    return true;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // 1. Find active assets with suspicious URLs
    const { data: assets, error: fetchErr } = await sb
      .from("medical_image_assets")
      .select("id, image_url, image_type, diagnosis, review_status, validation_level, asset_origin, clinical_confidence, is_active")
      .eq("is_active", true)
      .not("review_status", "eq", "blocked_clinical")
      .limit(500);

    if (fetchErr) throw fetchErr;

    let blockedCount = 0;
    const blockedDetails: { id: string; image_type: string; reason: string }[] = [];

    for (const asset of assets || []) {
      let blockReason = "";

      // Check suspicious URL
      if (isUrlSuspicious(asset.image_url)) {
        blockReason = "URL suspeita ou não clínica";
      }

      // Check missing/invalid origin
      if (!blockReason && !["real_medical", "validated_medical"].includes(asset.asset_origin || "")) {
        blockReason = `Origem inválida: ${asset.asset_origin}`;
      }

      // Check low confidence
      if (!blockReason && (asset.clinical_confidence == null || asset.clinical_confidence < 0.90)) {
        blockReason = `Confiança clínica baixa: ${asset.clinical_confidence}`;
      }

      if (blockReason) {
        const { error: updateErr } = await sb
          .from("medical_image_assets")
          .update({
            review_status: "blocked_clinical",
            validation_level: "blocked",
            multimodal_ready: false,
            is_active: false,
          })
          .eq("id", asset.id);

        if (!updateErr) {
          blockedCount++;
          blockedDetails.push({ id: asset.id, image_type: asset.image_type, reason: blockReason });

          // Also move related questions to needs_review
          await sb
            .from("medical_image_questions")
            .update({ status: "needs_review" })
            .eq("asset_id", asset.id)
            .in("status", ["published", "upgraded"]);
        }
      }
    }

    const result = {
      total_scanned: assets?.length || 0,
      blocked_count: blockedCount,
      blocked_details: blockedDetails.slice(0, 50),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
