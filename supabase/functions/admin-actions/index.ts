import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    // Verify caller is admin
    const supabaseAuth = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
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

    switch (action) {
      case "list_users": {
        // Get all users from auth + profiles + roles + subscriptions
        const { data: profiles } = await supabaseAuth
          .from("profiles")
          .select("user_id, display_name, email, is_blocked, created_at, avatar_url, organization_id")
          .order("created_at", { ascending: false });

        const { data: roles } = await supabaseAuth
          .from("user_roles")
          .select("user_id, role");

        const { data: subs } = await supabaseAuth
          .from("subscriptions")
          .select("user_id, status, plan_id, plans(name, price)")
          .eq("status", "active");

        const { data: quotas } = await supabaseAuth
          .from("user_quotas")
          .select("user_id, questions_used, questions_limit");

        const users = (profiles || []).map((p) => {
          const userRoles = (roles || []).filter((r) => r.user_id === p.user_id).map((r) => r.role);
          const sub = (subs || []).find((s) => s.user_id === p.user_id);
          const quota = (quotas || []).find((q) => q.user_id === p.user_id);
          return {
            ...p,
            roles: userRoles,
            subscription: sub || null,
            quota: quota || null,
          };
        });

        return new Response(JSON.stringify({ users }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "block_user": {
        const { target_user_id, blocked } = params;
        if (!target_user_id) throw new Error("target_user_id obrigatório");

        await supabaseAuth
          .from("profiles")
          .update({ is_blocked: blocked })
          .eq("user_id", target_user_id);

        return new Response(JSON.stringify({ success: true, blocked }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "change_plan": {
        const { target_user_id, plan_name } = params;
        if (!target_user_id || !plan_name) throw new Error("target_user_id e plan_name obrigatórios");

        // Find plan
        const { data: plan } = await supabaseAuth
          .from("plans")
          .select("id, name")
          .eq("name", plan_name)
          .single();

        if (!plan) {
          // Create plan if it doesn't exist
          const planLimits: Record<string, { price: number; limit: number }> = {
            Free: { price: 0, limit: 50 },
            Pro: { price: 59.9, limit: 2000 },
            Premium: { price: 99.9, limit: 8000 },
            Enterprise: { price: 299.9, limit: 999999 },
          };
          const cfg = planLimits[plan_name] || { price: 0, limit: 50 };

          const { data: newPlan } = await supabaseAuth
            .from("plans")
            .insert({ name: plan_name, price: cfg.price, features_json: [] })
            .select("id")
            .single();

          if (!newPlan) throw new Error("Erro ao criar plano");

          // Deactivate old subs
          await supabaseAuth
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("user_id", target_user_id)
            .eq("status", "active");

          // Create new subscription
          await supabaseAuth
            .from("subscriptions")
            .insert({
              user_id: target_user_id,
              plan_id: newPlan.id,
              status: "active",
            });

          // Update quotas
          await supabaseAuth
            .from("user_quotas")
            .upsert({
              user_id: target_user_id,
              questions_limit: cfg.limit,
              questions_used: 0,
            }, { onConflict: "user_id" });

          return new Response(JSON.stringify({ success: true, plan: plan_name }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Plan exists
        const planLimits: Record<string, number> = {
          Free: 50, Pro: 2000, Premium: 8000, Enterprise: 999999,
        };

        await supabaseAuth
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("user_id", target_user_id)
          .eq("status", "active");

        await supabaseAuth
          .from("subscriptions")
          .insert({
            user_id: target_user_id,
            plan_id: plan.id,
            status: "active",
          });

        await supabaseAuth
          .from("user_quotas")
          .upsert({
            user_id: target_user_id,
            questions_limit: planLimits[plan_name] || 50,
            questions_used: 0,
          }, { onConflict: "user_id" });

        return new Response(JSON.stringify({ success: true, plan: plan_name }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "toggle_admin": {
        const { target_user_id, make_admin } = params;
        if (!target_user_id) throw new Error("target_user_id obrigatório");

        if (target_user_id === user.id) {
          throw new Error("Você não pode remover seu próprio acesso admin.");
        }

        if (make_admin) {
          await supabaseAuth
            .from("user_roles")
            .upsert({ user_id: target_user_id, role: "admin" }, { onConflict: "user_id,role" });
        } else {
          await supabaseAuth
            .from("user_roles")
            .delete()
            .eq("user_id", target_user_id)
            .eq("role", "admin");
        }

        return new Response(JSON.stringify({ success: true, is_admin: make_admin }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_stats": {
        const { count: totalUsers } = await supabaseAuth
          .from("profiles")
          .select("id", { count: "exact", head: true });

        const { count: blockedUsers } = await supabaseAuth
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("is_blocked", true);

        const { data: activeSubs } = await supabaseAuth
          .from("subscriptions")
          .select("plans(name)")
          .eq("status", "active");

        const planCounts: Record<string, number> = {};
        (activeSubs || []).forEach((s: any) => {
          const name = s.plans?.name || "Free";
          planCounts[name] = (planCounts[name] || 0) + 1;
        });

        return new Response(JSON.stringify({
          totalUsers: totalUsers || 0,
          blockedUsers: blockedUsers || 0,
          activeSubs: activeSubs?.length || 0,
          planCounts,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
