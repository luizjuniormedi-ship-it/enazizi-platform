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
      const today = new Date().toISOString().slice(0, 10);

      // Check for existing active execution of today — reuse if found
      const { data: active } = await supabaseAdmin
        .from("whatsapp_send_executions")
        .select("*")
        .in("status", ["running", "paused"])
        .eq("execution_date", today)
        .limit(1);

      let exec: any;
      let reused = false;

      if (active && active.length > 0) {
        // Reuse existing execution
        exec = active[0];
        reused = true;
        // Ensure it's running
        if (exec.status !== "running") {
          await supabaseAdmin
            .from("whatsapp_send_executions")
            .update({ status: "running" })
            .eq("id", exec.id);
        }
      } else {
        // Create new execution
        const { data: newExec, error: execErr } = await supabaseAdmin
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
        exec = newExec;
      }

      // Associate ONLY unlinked pending items from today
      const { data: items } = await supabaseAdmin
        .from("whatsapp_message_log")
        .update({ execution_id: exec.id, delivery_status: "pending", execution_mode: "desktop" })
        .eq("delivery_status", "pending")
        .is("execution_id", null)
        .gte("created_at", today + "T00:00:00Z")
        .lte("created_at", today + "T23:59:59Z")
        .select("id");

      const newlyLinked = items?.length || 0;

      // Count total items linked to this execution
      const { count: totalCount } = await supabaseAdmin
        .from("whatsapp_message_log")
        .select("id", { count: "exact", head: true })
        .eq("execution_id", exec.id);

      const totalItems = totalCount || 0;
      await supabaseAdmin
        .from("whatsapp_send_executions")
        .update({ total_items: totalItems })
        .eq("id", exec.id);

      // Log
      await supabaseAdmin.from("whatsapp_execution_logs").insert({
        execution_id: exec.id,
        action: reused ? "execution_reused" : "execution_started",
        status: "success",
        message: reused
          ? `Execução reutilizada, ${newlyLinked} novos itens vinculados (total: ${totalItems})`
          : `Execução iniciada com ${totalItems} itens`,
      });

      return respond({ execution_id: exec.id, total_items: totalItems, reused });
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
      if (!item_id || !newStatus) return respond({ success: false, error: "item_id and status required" }, 400);

      const validStatuses = ["sent", "error", "skipped"];
      if (!validStatuses.includes(newStatus)) return respond({ success: false, error: "Invalid status" }, 400);

      try {
        // Get current attempts
        const { data: current, error: fetchErr } = await supabaseAdmin
          .from("whatsapp_message_log")
          .select("attempts")
          .eq("id", item_id)
          .single();

        if (fetchErr) {
          console.error("Fetch item error:", fetchErr.message);
          return respond({ success: false, error: fetchErr.message }, 500);
        }

        // Build update payload
        const updateData: any = {
          delivery_status: newStatus,
          updated_at: new Date().toISOString(),
          attempts: (current?.attempts || 0) + 1,
        };
        if (newStatus === "sent") updateData.sent_at = new Date().toISOString();
        if (errMsg) updateData.error_message = errMsg;

        // Update the item
        const { error: updateErr } = await supabaseAdmin
          .from("whatsapp_message_log")
          .update(updateData)
          .eq("id", item_id);

        if (updateErr) {
          console.error("Update item error:", updateErr.message);
          return respond({ success: false, error: updateErr.message }, 500);
        }

        // Update execution counters
        if (execId) {
          const counterField = newStatus === "sent" ? "total_sent" : newStatus === "error" ? "total_error" : "total_skipped";
          const { data: execData, error: execFetchErr } = await supabaseAdmin
            .from("whatsapp_send_executions")
            .select("total_sent, total_error, total_skipped")
            .eq("id", execId)
            .single();

          if (!execFetchErr && execData) {
            const { error: execUpdateErr } = await supabaseAdmin
              .from("whatsapp_send_executions")
              .update({ [counterField]: (execData as any)[counterField] + 1 })
              .eq("id", execId);

            if (execUpdateErr) {
              console.error("Update execution counter error:", execUpdateErr.message);
            }
          }

          // Audit log
          const { error: logErr } = await supabaseAdmin.from("whatsapp_execution_logs").insert({
            execution_id: execId,
            queue_item_id: item_id,
            action: `item_${newStatus}`,
            status: newStatus,
            message: errMsg || `Item marcado como ${newStatus}`,
          });

          if (logErr) {
            console.error("Insert execution log error:", logErr.message);
          }
        }

        return respond({ success: true });
      } catch (e) {
        console.error("update_status exception:", e.message);
        return respond({ success: false, error: e.message }, 500);
      }
    }

    if (action === "execution_status") {
      const executionId = body.execution_id || url.searchParams.get("execution_id");
      const today = new Date().toISOString().slice(0, 10);

      let query = supabaseAdmin.from("whatsapp_send_executions").select("*");
      if (executionId) {
        query = query.eq("id", executionId);
      } else {
        query = query.in("status", ["running", "paused"]).order("created_at", { ascending: false }).limit(1);
      }

      const { data } = await query;
      let exec = data && data.length > 0 ? data[0] : null;

      // ── Self-healing: auto-link orphan messages ──
      if (exec) {
        // Check for orphan pending messages from today not linked to any execution
        const { data: orphans } = await supabaseAdmin
          .from("whatsapp_message_log")
          .select("id")
          .is("execution_id", null)
          .eq("delivery_status", "pending")
          .gte("created_at", `${today}T00:00:00Z`)
          .limit(500);

        if (orphans && orphans.length > 0) {
          await supabaseAdmin
            .from("whatsapp_message_log")
            .update({ execution_id: exec.id })
            .is("execution_id", null)
            .eq("delivery_status", "pending")
            .gte("created_at", `${today}T00:00:00Z`);

          // Update total_items
          const { count } = await supabaseAdmin
            .from("whatsapp_message_log")
            .select("id", { count: "exact", head: true })
            .eq("execution_id", exec.id);

          await supabaseAdmin
            .from("whatsapp_send_executions")
            .update({ total_items: count || 0 })
            .eq("id", exec.id);

          console.log(`Auto-linked ${orphans.length} orphan messages to execution ${exec.id}`);
        }

        // ── Auto-complete: if no pending/processing items remain, mark as completed ──
        const { count: pendingCount } = await supabaseAdmin
          .from("whatsapp_message_log")
          .select("id", { count: "exact", head: true })
          .eq("execution_id", exec.id)
          .in("delivery_status", ["pending", "processing"]);

        if ((pendingCount || 0) === 0 && (orphans?.length || 0) === 0) {
          await supabaseAdmin
            .from("whatsapp_send_executions")
            .update({ status: "completed", finished_at: new Date().toISOString() })
            .eq("id", exec.id);

          exec = { ...exec, status: "completed" };
          console.log(`Auto-completed execution ${exec.id}`);
        }
      } else if (!executionId) {
        // ── Self-healing: auto-create execution if orphan messages exist but no active execution ──
        const { data: orphans } = await supabaseAdmin
          .from("whatsapp_message_log")
          .select("id")
          .is("execution_id", null)
          .eq("delivery_status", "pending")
          .gte("created_at", `${today}T00:00:00Z`)
          .limit(1);

        if (orphans && orphans.length > 0) {
          const { data: newExec } = await supabaseAdmin
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

          if (newExec) {
            // Link all orphan messages
            await supabaseAdmin
              .from("whatsapp_message_log")
              .update({ execution_id: newExec.id })
              .is("execution_id", null)
              .eq("delivery_status", "pending")
              .gte("created_at", `${today}T00:00:00Z`);

            const { count } = await supabaseAdmin
              .from("whatsapp_message_log")
              .select("id", { count: "exact", head: true })
              .eq("execution_id", newExec.id);

            await supabaseAdmin
              .from("whatsapp_send_executions")
              .update({ total_items: count || 0 })
              .eq("id", newExec.id);

            exec = newExec;
            console.log(`Auto-created execution ${newExec.id} with ${count} orphan items`);
          }
        }
      }

      if (!exec) return respond({ execution: null });

      // Get item breakdown
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
