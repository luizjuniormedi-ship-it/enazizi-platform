import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authErr,
    } = await userClient.auth.getUser();
    if (authErr || !user)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });

    const body = await req.json();
    const { topic, specialty, correct, total_questions } = body as {
      topic: string;
      specialty?: string;
      correct: number;
      total_questions: number;
    };

    if (!topic || correct == null || !total_questions) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: topic, correct, total_questions" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const userId = user.id;
    const spec = specialty || "Geral";

    // Get existing profile
    const { data: existing } = await adminClient
      .from("user_topic_profiles")
      .select("*")
      .eq("user_id", userId)
      .eq("topic", topic)
      .maybeSingle();

    const newTotal = (existing?.total_questions || 0) + total_questions;
    const newCorrect = (existing?.correct_answers || 0) + correct;
    const newAccuracy = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 0;

    // Determine confidence level
    let confidence = "baixo";
    if (newAccuracy >= 85 && newTotal >= 10) confidence = "alto";
    else if (newAccuracy >= 65 && newTotal >= 5) confidence = "medio";

    // Determine mastery level (0-5)
    let mastery = 0;
    if (newAccuracy >= 90 && newTotal >= 20) mastery = 5;
    else if (newAccuracy >= 80 && newTotal >= 15) mastery = 4;
    else if (newAccuracy >= 70 && newTotal >= 10) mastery = 3;
    else if (newAccuracy >= 60 && newTotal >= 5) mastery = 2;
    else if (newTotal >= 3) mastery = 1;

    // Calculate next review based on mastery
    const intervalDays = [1, 3, 7, 15, 30, 60][mastery] || 1;
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + intervalDays);

    const profileData = {
      user_id: userId,
      topic,
      specialty: spec,
      total_questions: newTotal,
      correct_answers: newCorrect,
      accuracy: newAccuracy,
      confidence_level: confidence,
      mastery_level: mastery,
      review_interval_days: intervalDays,
      next_review_at: nextReview.toISOString(),
      last_practiced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await adminClient
        .from("user_topic_profiles")
        .update(profileData)
        .eq("id", existing.id);
    } else {
      await adminClient.from("user_topic_profiles").insert(profileData);
    }

    // Auto-create FSRS card for this topic if not exists
    try {
      const cardRefId = `topic::${topic.toLowerCase().replace(/\s+/g, "-")}`;
      const { data: existingCard } = await adminClient
        .from("fsrs_cards")
        .select("id")
        .eq("user_id", userId)
        .eq("card_ref_id", cardRefId)
        .maybeSingle();

      if (!existingCard) {
        // New FSRS card: difficulty based on accuracy (lower accuracy = harder)
        const fsrsDifficulty = Math.max(1, Math.min(10, Math.round(10 - (newAccuracy / 10))));
        const initialStability = newAccuracy >= 70 ? 4 : newAccuracy >= 50 ? 2 : 1;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (newAccuracy >= 70 ? 3 : 1));

        await adminClient.from("fsrs_cards").insert({
          user_id: userId,
          card_ref_id: cardRefId,
          card_type: "topic",
          difficulty: fsrsDifficulty,
          stability: initialStability,
          due: dueDate.toISOString(),
          state: 0,
          reps: 0,
          lapses: 0,
          elapsed_days: 0,
          scheduled_days: newAccuracy >= 70 ? 3 : 1,
        });
        console.log(`[update-performance] Created FSRS card for user=${userId} topic=${topic}`);
      }
    } catch (fsrsErr) {
      console.warn("[update-performance] FSRS card creation failed (non-critical):", fsrsErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile: {
          topic,
          specialty: spec,
          accuracy: newAccuracy,
          confidence_level: confidence,
          mastery_level: mastery,
          next_review_at: nextReview.toISOString(),
          review_interval_days: intervalDays,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
