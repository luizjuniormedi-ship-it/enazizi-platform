import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logAudit = async (sb: any, adminId: string, action: string, targetUserId: string | null, details: Record<string, unknown>) => {
  await sb.from("admin_audit_log").insert({
    admin_user_id: adminId,
    action,
    target_user_id: targetUserId,
    details,
  });
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabaseAuth
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Acesso negado. Apenas administradores." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();
    const ok = (data: unknown) => new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    switch (action) {
      case "list_users": {
        const [{ data: profiles }, { data: roles }, { data: subs }, { data: quotas }] = await Promise.all([
          supabaseAuth.from("profiles").select("user_id, display_name, email, is_blocked, created_at, avatar_url, organization_id").order("created_at", { ascending: false }),
          supabaseAuth.from("user_roles").select("user_id, role"),
          supabaseAuth.from("subscriptions").select("user_id, status, plan_id, plans(name, price)").eq("status", "active"),
          supabaseAuth.from("user_quotas").select("user_id, questions_used, questions_limit"),
        ]);

        const users = (profiles || []).map((p) => {
          const userRoles = (roles || []).filter((r) => r.user_id === p.user_id).map((r) => r.role);
          const sub = (subs || []).find((s) => s.user_id === p.user_id);
          const quota = (quotas || []).find((q) => q.user_id === p.user_id);
          return { ...p, roles: userRoles, subscription: sub || null, quota: quota || null };
        });
        return ok({ users });
      }

      case "block_user": {
        const { target_user_id, blocked } = params;
        if (!target_user_id) throw new Error("target_user_id obrigatório");
        await supabaseAuth.from("profiles").update({ is_blocked: blocked }).eq("user_id", target_user_id);
        await logAudit(supabaseAuth, user.id, blocked ? "block_user" : "unblock_user", target_user_id, { blocked });
        return ok({ success: true, blocked });
      }

      case "change_plan": {
        const { target_user_id, plan_name } = params;
        if (!target_user_id || !plan_name) throw new Error("target_user_id e plan_name obrigatórios");

        const planLimits: Record<string, { price: number; limit: number }> = {
          Free: { price: 0, limit: 50 },
          Pro: { price: 59.9, limit: 2000 },
          Premium: { price: 99.9, limit: 8000 },
          Enterprise: { price: 299.9, limit: 999999 },
        };

        let { data: plan } = await supabaseAuth.from("plans").select("id, name").eq("name", plan_name).single();
        if (!plan) {
          const cfg = planLimits[plan_name] || { price: 0, limit: 50 };
          const { data: newPlan } = await supabaseAuth.from("plans").insert({ name: plan_name, price: cfg.price, features_json: [] }).select("id").single();
          if (!newPlan) throw new Error("Erro ao criar plano");
          plan = { id: newPlan.id, name: plan_name };
        }

        await supabaseAuth.from("subscriptions").update({ status: "canceled" }).eq("user_id", target_user_id).eq("status", "active");
        await supabaseAuth.from("subscriptions").insert({ user_id: target_user_id, plan_id: plan.id, status: "active" });
        const limit = planLimits[plan_name]?.limit || 50;
        await supabaseAuth.from("user_quotas").upsert({ user_id: target_user_id, questions_limit: limit, questions_used: 0 }, { onConflict: "user_id" });
        await logAudit(supabaseAuth, user.id, "change_plan", target_user_id, { plan_name });
        return ok({ success: true, plan: plan_name });
      }

      case "toggle_admin": {
        const { target_user_id, make_admin } = params;
        if (!target_user_id) throw new Error("target_user_id obrigatório");
        if (target_user_id === user.id) throw new Error("Você não pode remover seu próprio acesso admin.");

        if (make_admin) {
          await supabaseAuth.from("user_roles").upsert({ user_id: target_user_id, role: "admin" }, { onConflict: "user_id,role" });
        } else {
          await supabaseAuth.from("user_roles").delete().eq("user_id", target_user_id).eq("role", "admin");
        }
        await logAudit(supabaseAuth, user.id, make_admin ? "promote_admin" : "demote_admin", target_user_id, { make_admin });
        return ok({ success: true, is_admin: make_admin });
      }

      case "get_stats": {
        const [{ count: totalUsers }, { count: blockedUsers }, { data: activeSubs }] = await Promise.all([
          supabaseAuth.from("profiles").select("id", { count: "exact", head: true }),
          supabaseAuth.from("profiles").select("id", { count: "exact", head: true }).eq("is_blocked", true),
          supabaseAuth.from("subscriptions").select("plans(name)").eq("status", "active"),
        ]);

        const planCounts: Record<string, number> = {};
        (activeSubs || []).forEach((s: any) => {
          const name = s.plans?.name || "Free";
          planCounts[name] = (planCounts[name] || 0) + 1;
        });

        return ok({ totalUsers: totalUsers || 0, blockedUsers: blockedUsers || 0, activeSubs: activeSubs?.length || 0, planCounts });
      }

      case "get_audit_log": {
        const { limit = 50 } = params;
        const { data: logs } = await supabaseAuth
          .from("admin_audit_log")
          .select("id, admin_user_id, action, target_user_id, details, created_at")
          .order("created_at", { ascending: false })
          .limit(limit);

        // Enrich with admin/target names
        const userIds = new Set<string>();
        (logs || []).forEach((l: any) => {
          if (l.admin_user_id) userIds.add(l.admin_user_id);
          if (l.target_user_id) userIds.add(l.target_user_id);
        });

        const { data: profiles } = await supabaseAuth
          .from("profiles")
          .select("user_id, display_name, email")
          .in("user_id", Array.from(userIds));

        const profileMap: Record<string, { name: string; email: string }> = {};
        (profiles || []).forEach((p) => {
          profileMap[p.user_id] = { name: p.display_name || "Sem nome", email: p.email || "" };
        });

        const enriched = (logs || []).map((l: any) => ({
          ...l,
          admin_name: profileMap[l.admin_user_id]?.name || "Desconhecido",
          admin_email: profileMap[l.admin_user_id]?.email || "",
          target_name: l.target_user_id ? profileMap[l.target_user_id]?.name || "Desconhecido" : null,
          target_email: l.target_user_id ? profileMap[l.target_user_id]?.email || "" : null,
        }));

        return ok({ logs: enriched });
      }

      default:
        return new Response(JSON.stringify({ error: `Ação desconhecida: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
