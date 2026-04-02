import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const today = new Date().toISOString().slice(0, 10);
  const logs: string[] = [];
  const log = (msg: string) => { logs.push(`[${new Date().toISOString()}] ${msg}`); console.log(msg); };

  try {
    // ── Step 1: Check if already ran today ──
    const { data: existingExec } = await supabase
      .from("whatsapp_send_executions")
      .select("id, status")
      .eq("execution_date", today)
      .eq("mode", "auto")
      .limit(1);

    if (existingExec && existingExec.length > 0) {
      log(`Execução automática já existe hoje (${existingExec[0].id}), pulando.`);
      return new Response(JSON.stringify({ skipped: true, reason: "already_ran_today", logs }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Step 2: Get an admin user for auth context ──
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1);

    if (!adminRoles || adminRoles.length === 0) {
      log("Nenhum admin encontrado.");
      return new Response(JSON.stringify({ error: "No admin user found", logs }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminUserId = adminRoles[0].user_id;
    log(`Admin encontrado: ${adminUserId}`);

    // ── Step 3: Call whatsapp-agent to generate messages ──
    log("Gerando mensagens via whatsapp-agent...");
    const agentResp = await fetch(`${supabaseUrl}/functions/v1/whatsapp-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ app_url: "https://enazizi-com-br.lovable.app" }),
    });

    const agentData = await agentResp.json();
    if (!agentResp.ok) {
      log(`Erro ao gerar mensagens: ${agentData.error || "unknown"}`);
      return new Response(JSON.stringify({ error: "Failed to generate messages", details: agentData, logs }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const students = agentData.students || [];
    const pendingStudents = students.filter((s: any) => !s.already_sent_today);
    log(`${students.length} alunos encontrados, ${pendingStudents.length} pendentes.`);

    if (pendingStudents.length === 0) {
      log("Nenhum aluno pendente para envio.");
      return new Response(JSON.stringify({ skipped: true, reason: "no_pending_students", logs }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Step 4: Insert message logs for pending students ──
    log("Inserindo logs de mensagem...");
    const messageLogs = pendingStudents.map((s: any) => ({
      admin_user_id: adminUserId,
      target_user_id: s.user_id,
      message_text: s.message,
      delivery_status: "pending",
      execution_mode: "auto",
    }));

    const { error: insertErr } = await supabase
      .from("whatsapp_message_log")
      .insert(messageLogs);

    if (insertErr) {
      log(`Erro ao inserir logs: ${insertErr.message}`);
      return new Response(JSON.stringify({ error: insertErr.message, logs }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Step 5: Create execution ──
    log("Criando execução automática...");
    const { data: exec, error: execErr } = await supabase
      .from("whatsapp_send_executions")
      .insert({
        admin_user_id: adminUserId,
        execution_date: today,
        mode: "auto",
        status: "running",
        started_at: new Date().toISOString(),
        total_items: pendingStudents.length,
      })
      .select()
      .single();

    if (execErr) {
      log(`Erro ao criar execução: ${execErr.message}`);
      return new Response(JSON.stringify({ error: execErr.message, logs }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Step 6: Associate pending items with execution ──
    const { error: linkErr } = await supabase
      .from("whatsapp_message_log")
      .update({ execution_id: exec.id })
      .eq("delivery_status", "pending")
      .eq("execution_mode", "auto")
      .is("execution_id", null)
      .gte("created_at", today + "T00:00:00Z");

    if (linkErr) {
      log(`Erro ao associar itens: ${linkErr.message}`);
    }

    // ── Step 7: Log the action ──
    await supabase.from("whatsapp_execution_logs").insert({
      execution_id: exec.id,
      action: "auto_execution_started",
      status: "success",
      message: `Execução automática criada com ${pendingStudents.length} itens`,
    });

    await supabase.from("admin_audit_log").insert({
      admin_user_id: adminUserId,
      action: "whatsapp_auto_execution",
      details: { execution_id: exec.id, total_items: pendingStudents.length, date: today },
    });

    log(`✅ Execução automática criada: ${exec.id} com ${pendingStudents.length} itens`);

    return new Response(JSON.stringify({
      success: true,
      execution_id: exec.id,
      total_items: pendingStudents.length,
      logs,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    log(`Erro fatal: ${e.message}`);
    return new Response(JSON.stringify({ error: e.message, logs }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
