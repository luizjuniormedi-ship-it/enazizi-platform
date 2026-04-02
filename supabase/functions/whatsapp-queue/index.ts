import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Admin check
    const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = (roles || []).some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    const respond = (data: any, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // ── Actions ──────────────────────────────────────────────

    if (action === "start_execution") {
      // Check no active execution
      const { data: active } = await supabaseAdmin
        .from("whatsapp_send_executions")
        .select("id")
        .in("status", ["running", "paused"])
        .limit(1);

      if (active && active.length > 0) {
        return respond({ error: "Já existe uma execução ativa", execution_id: active[0].id }, 409);
      }

      const today = new Date().toISOString().slice(0, 10);

      // Create execution
      const { data: exec, error: execErr } = await supabaseAdmin
        .from("whatsapp_send_executions")
        .insert({
          admin_user_id: user.id,
          execution_date: today,
          mode: "desktop",
          status: "running",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (execErr) return respond({ error: execErr.message }, 500);

      // Associate pending items from today
      const { data: items, error: updateErr } = await supabaseAdmin
        .from("whatsapp_message_log")
        .update({ execution_id: exec.id, delivery_status: "pending", execution_mode: "desktop" })
        .eq("delivery_status", "pending")
        .gte("created_at", today + "T00:00:00Z")
        .lte("created_at", today + "T23:59:59Z")
        .select("id");

      const count = items?.length || 0;
      await supabaseAdmin
        .from("whatsapp_send_executions")
        .update({ total_items: count })
        .eq("id", exec.id);

      // Log
      await supabaseAdmin.from("whatsapp_execution_logs").insert({
        execution_id: exec.id,
        action: "execution_started",
        status: "success",
        message: `Execução iniciada com ${count} itens`,
      });

      return respond({ execution_id: exec.id, total_items: count });
    }

    if (action === "next_item") {
      const executionId = body.execution_id || url.searchParams.get("execution_id");
      if (!executionId) return respond({ error: "execution_id required" }, 400);

      // Check execution is running
      const { data: exec } = await supabaseAdmin
        .from("whatsapp_send_executions")
        .select("status")
        .eq("id", executionId)
        .single();

      if (!exec || exec.status !== "running") {
        return respond({ item: null, reason: "execution_not_running" });
      }

      // Optimistic lock: grab next pending item
      const { data: pending } = await supabaseAdmin
        .from("whatsapp_message_log")
        .select("id, target_user_id, message_text, attempts")
        .eq("execution_id", executionId)
        .eq("delivery_status", "pending")
        .order("created_at", { ascending: true })
        .limit(1);

      if (!pending || pending.length === 0) {
        return respond({ item: null, reason: "queue_empty" });
      }

      const item = pending[0];

      // Mark as processing
      await supabaseAdmin
        .from("whatsapp_message_log")
        .update({ delivery_status: "processing" })
        .eq("id", item.id)
        .eq("delivery_status", "pending"); // optimistic lock

      // Fetch student info
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("display_name, phone")
        .eq("user_id", item.target_user_id)
        .single();

      return respond({
        item: {
          id: item.id,
          target_user_id: item.target_user_id,
          message_text: item.message_text,
          attempts: item.attempts,
          display_name: profile?.display_name || "Aluno",
          phone: profile?.phone || "",
        },
      });
    }

    if (action === "update_status") {
      const { item_id, status: newStatus, error_message: errMsg, execution_id: execId } = body;
      if (!item_id || !newStatus) return respond({ error: "item_id and status required" }, 400);

      const validStatuses = ["sent", "error", "skipped"];
      if (!validStatuses.includes(newStatus)) return respond({ error: "Invalid status" }, 400);

      // Update item
      const updateData: any = {
        delivery_status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (newStatus === "sent") updateData.sent_at = new Date().toISOString();
      if (errMsg) updateData.error_message = errMsg;

      await supabaseAdmin.rpc("increment_whatsapp_attempts" as any, { p_item_id: item_id }).catch(() => {
        // If RPC doesn't exist, do manual increment
      });

      // Manual increment
      const { data: current } = await supabaseAdmin
        .from("whatsapp_message_log")
        .select("attempts")
        .eq("id", item_id)
        .single();

      updateData.attempts = (current?.attempts || 0) + 1;

      await supabaseAdmin
        .from("whatsapp_message_log")
        .update(updateData)
        .eq("id", item_id);

      // Update execution counters
      if (execId) {
        const counterField = newStatus === "sent" ? "total_sent" : newStatus === "error" ? "total_error" : "total_skipped";
        const { data: execData } = await supabaseAdmin
          .from("whatsapp_send_executions")
          .select("total_sent, total_error, total_skipped")
          .eq("id", execId)
          .single();

        if (execData) {
          await supabaseAdmin
            .from("whatsapp_send_executions")
            .update({ [counterField]: (execData as any)[counterField] + 1 })
            .eq("id", execId);
        }

        // Log
        await supabaseAdmin.from("whatsapp_execution_logs").insert({
          execution_id: execId,
          queue_item_id: item_id,
          action: `item_${newStatus}`,
          status: newStatus,
          message: errMsg || `Item marcado como ${newStatus}`,
        });
      }

      return respond({ ok: true });
    }

    if (action === "execution_status") {
      const executionId = body.execution_id || url.searchParams.get("execution_id");

      let query = supabaseAdmin.from("whatsapp_send_executions").select("*");
      if (executionId) {
        query = query.eq("id", executionId);
      } else {
        query = query.in("status", ["running", "paused"]).order("created_at", { ascending: false }).limit(1);
      }

      const { data } = await query;
      if (!data || data.length === 0) return respond({ execution: null });

      // Also get item breakdown
      const exec = data[0];
      const { data: items } = await supabaseAdmin
        .from("whatsapp_message_log")
        .select("id, target_user_id, message_text, delivery_status, attempts, error_message, sent_at")
        .eq("execution_id", exec.id)
        .order("created_at", { ascending: true });

      // Enrich with profile data
      const userIds = [...new Set((items || []).map((i: any) => i.target_user_id))];
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, display_name, phone")
        .in("user_id", userIds);

      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });

      const enrichedItems = (items || []).map((i: any) => ({
        ...i,
        display_name: profileMap[i.target_user_id]?.display_name || "Aluno",
        phone: profileMap[i.target_user_id]?.phone || "",
      }));

      return respond({ execution: exec, items: enrichedItems });
    }

    if (action === "pause_execution" || action === "resume_execution" || action === "stop_execution") {
      const executionId = body.execution_id;
      if (!executionId) return respond({ error: "execution_id required" }, 400);

      const newStatus = action === "pause_execution" ? "paused" : action === "resume_execution" ? "running" : "stopped";
      const updateData: any = { status: newStatus };
      if (action === "stop_execution") updateData.finished_at = new Date().toISOString();

      await supabaseAdmin
        .from("whatsapp_send_executions")
        .update(updateData)
        .eq("id", executionId);

      // If stopping, cancel all pending items
      if (action === "stop_execution") {
        await supabaseAdmin
          .from("whatsapp_message_log")
          .update({ delivery_status: "cancelled" })
          .eq("execution_id", executionId)
          .in("delivery_status", ["pending", "processing"]);
      }

      await supabaseAdmin.from("whatsapp_execution_logs").insert({
        execution_id: executionId,
        action: action.replace("_execution", ""),
        status: "success",
        message: `Execução ${newStatus}`,
      });

      return respond({ ok: true, status: newStatus });
    }

    if (action === "reprocess_errors") {
      const executionId = body.execution_id;
      if (!executionId) return respond({ error: "execution_id required" }, 400);

      const { data: updated } = await supabaseAdmin
        .from("whatsapp_message_log")
        .update({ delivery_status: "pending", error_message: null })
        .eq("execution_id", executionId)
        .eq("delivery_status", "error")
        .select("id");

      // Also ensure execution is running
      await supabaseAdmin
        .from("whatsapp_send_executions")
        .update({ status: "running" })
        .eq("id", executionId);

      return respond({ ok: true, reprocessed: updated?.length || 0 });
    }

    if (action === "list_executions") {
      const { data: execs } = await supabaseAdmin
        .from("whatsapp_send_executions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      return respond({ executions: execs || [] });
    }

    return respond({ error: "Unknown action" }, 400);
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
