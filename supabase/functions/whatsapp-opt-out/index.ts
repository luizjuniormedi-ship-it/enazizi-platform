import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const respond = (data: any, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { phone, reply } = await req.json();
    if (!phone || !reply) {
      return respond({ error: "phone and reply are required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const cleanPhone = phone.replace(/\D/g, "");
    const replyUpper = reply.trim().toUpperCase();

    // Determine opt-out status
    const optOutKeywords = ["SAIR", "NÃO", "NAO", "PARAR", "CANCELAR", "STOP"];
    const optInKeywords = ["SIM", "VOLTAR", "RETOMAR", "ATIVAR"];

    let optOut: boolean | null = null;
    if (optOutKeywords.some(k => replyUpper.includes(k))) {
      optOut = true;
    } else if (optInKeywords.some(k => replyUpper.includes(k))) {
      optOut = false;
    }

    if (optOut === null) {
      return respond({ action: "ignored", message: "Reply not recognized as opt-out or opt-in" });
    }

    // Find profile by phone
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, phone")
      .or(`phone.eq.${cleanPhone},phone.eq.+${cleanPhone},phone.eq.+55${cleanPhone}`);

    if (!profiles || profiles.length === 0) {
      // Try partial match
      const { data: partialMatch } = await supabase
        .from("profiles")
        .select("user_id, display_name, phone")
        .ilike("phone", `%${cleanPhone.slice(-9)}`);

      if (!partialMatch || partialMatch.length === 0) {
        return respond({ error: "Profile not found for this phone" }, 404);
      }

      const { error } = await supabase
        .from("profiles")
        .update({ whatsapp_opt_out: optOut } as any)
        .eq("user_id", partialMatch[0].user_id);

      if (error) return respond({ error: error.message }, 500);

      return respond({
        action: optOut ? "opted_out" : "opted_in",
        user_id: partialMatch[0].user_id,
        display_name: partialMatch[0].display_name,
      });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ whatsapp_opt_out: optOut } as any)
      .eq("user_id", profiles[0].user_id);

    if (error) return respond({ error: error.message }, 500);

    return respond({
      action: optOut ? "opted_out" : "opted_in",
      user_id: profiles[0].user_id,
      display_name: profiles[0].display_name,
    });
  } catch (e) {
    return respond({ error: e.message }, 500);
  }
});
