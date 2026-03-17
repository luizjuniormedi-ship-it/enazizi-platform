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
    
    // Validate token using service role client's admin API
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(JSON.stringify({ error: "Token inválido. Faça login novamente." }), {
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
        const [{ data: profiles }, { data: roles }, { data: subs }, { data: quotas }, { data: domainMaps }, { data: attempts }] = await Promise.all([
          supabaseAuth.from("profiles").select("user_id, display_name, email, is_blocked, created_at, avatar_url, organization_id, status, approved_by, approved_at").order("created_at", { ascending: false }),
          supabaseAuth.from("user_roles").select("user_id, role"),
          supabaseAuth.from("subscriptions").select("user_id, status, plan_id, plans(name, price)").eq("status", "active"),
          supabaseAuth.from("user_quotas").select("user_id, questions_used, questions_limit"),
          supabaseAuth.from("medical_domain_map").select("user_id, specialty, domain_score, questions_answered"),
          supabaseAuth.from("practice_attempts").select("user_id, correct, created_at"),
        ]);

        const users = (profiles || []).map((p) => {
          const userRoles = (roles || []).filter((r) => r.user_id === p.user_id).map((r) => r.role);
          const sub = (subs || []).find((s) => s.user_id === p.user_id);
          const quota = (quotas || []).find((q) => q.user_id === p.user_id);
          
          // Evolution summary
          const userDomains = (domainMaps || []).filter((d: any) => d.user_id === p.user_id);
          const avgScore = userDomains.length > 0 ? Math.round(userDomains.reduce((sum: number, d: any) => sum + (d.domain_score || 0), 0) / userDomains.length) : 0;
          const totalQuestions = userDomains.reduce((sum: number, d: any) => sum + (d.questions_answered || 0), 0);
          const specialties = userDomains.length;
          
          // Recent activity
          const userAttempts = (attempts || []).filter((a: any) => a.user_id === p.user_id);
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const recentAttempts = userAttempts.filter((a: any) => a.created_at >= sevenDaysAgo).length;
          const correctRecent = userAttempts.filter((a: any) => a.created_at >= sevenDaysAgo && a.correct).length;
          const recentAccuracy = recentAttempts > 0 ? Math.round((correctRecent / recentAttempts) * 100) : 0;
          
          return { ...p, roles: userRoles, subscription: sub || null, quota: quota || null, evolution: { avgScore, totalQuestions, specialties, recentAttempts, recentAccuracy } };
        });
        return ok({ users });
      }

      case "approve_user": {
        const { target_user_id } = params;
        if (!target_user_id) throw new Error("target_user_id obrigatório");
        await supabaseAuth.from("profiles").update({
          status: "active",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        }).eq("user_id", target_user_id);
        await logAudit(supabaseAuth, user.id, "approve_user", target_user_id, {});
        return ok({ success: true });
      }

      case "reject_user": {
        const { target_user_id } = params;
        if (!target_user_id) throw new Error("target_user_id obrigatório");
        await supabaseAuth.from("profiles").update({ status: "disabled" }).eq("user_id", target_user_id);
        await logAudit(supabaseAuth, user.id, "reject_user", target_user_id, {});
        return ok({ success: true });
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

      case "toggle_professor": {
        const { target_user_id, make_professor } = params;
        if (!target_user_id) throw new Error("target_user_id obrigatório");

        if (make_professor) {
          await supabaseAuth.from("user_roles").upsert({ user_id: target_user_id, role: "professor" }, { onConflict: "user_id,role" });
        } else {
          await supabaseAuth.from("user_roles").delete().eq("user_id", target_user_id).eq("role", "professor");
        }
        await logAudit(supabaseAuth, user.id, make_professor ? "promote_professor" : "demote_professor", target_user_id, { make_professor });
        return ok({ success: true, is_professor: make_professor });
      }

      case "reset_password": {
        const { target_user_id, new_password } = params;
        if (!target_user_id || !new_password) throw new Error("target_user_id e new_password obrigatórios");
        if (new_password.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres");
        const { error: updateErr } = await supabaseAuth.auth.admin.updateUserById(target_user_id, { password: new_password });
        if (updateErr) throw new Error(`Erro ao redefinir senha: ${updateErr.message}`);
        await logAudit(supabaseAuth, user.id, "reset_password", target_user_id, {});
        return ok({ success: true });
      }

      case "get_stats": {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const [{ count: totalUsers }, { count: blockedUsers }, { data: activeSubs }, { count: pendingUsers }, { count: onlineUsers }, { data: onlineDetails }] = await Promise.all([
          supabaseAuth.from("profiles").select("id", { count: "exact", head: true }),
          supabaseAuth.from("profiles").select("id", { count: "exact", head: true }).eq("is_blocked", true),
          supabaseAuth.from("subscriptions").select("plans(name)").eq("status", "active"),
          supabaseAuth.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabaseAuth.from("user_presence").select("user_id", { count: "exact", head: true }).gte("last_seen_at", fiveMinutesAgo),
          supabaseAuth.from("user_presence").select("user_id, last_seen_at, current_page").gte("last_seen_at", fiveMinutesAgo),
        ]);

        // Enrich online users with names
        let onlineUsersData: any[] = [];
        if (onlineDetails && onlineDetails.length > 0) {
          const onlineIds = onlineDetails.map((o: any) => o.user_id);
          const { data: onlineProfiles } = await supabaseAuth.from("profiles").select("user_id, display_name, email").in("user_id", onlineIds);
          onlineUsersData = onlineDetails.map((o: any) => {
            const profile = (onlineProfiles || []).find((p: any) => p.user_id === o.user_id);
            return { ...o, display_name: profile?.display_name || "Sem nome", email: profile?.email || "" };
          });
        }

        const planCounts: Record<string, number> = {};
        (activeSubs || []).forEach((s: any) => {
          const name = s.plans?.name || "Free";
          planCounts[name] = (planCounts[name] || 0) + 1;
        });

        return ok({ totalUsers: totalUsers || 0, blockedUsers: blockedUsers || 0, activeSubs: activeSubs?.length || 0, pendingUsers: pendingUsers || 0, planCounts, onlineUsers: onlineUsers || 0, onlineUsersData });
      }

      case "get_user_tracking": {
        const { target_user_id } = params;
        if (!target_user_id) throw new Error("target_user_id obrigatório");

        const [
          { data: profile },
          { data: performance },
          { data: domainMap },
          { data: errorBank },
          { data: attempts },
          { data: flashcards },
          { data: studyPlans },
          { data: examSessions },
          { data: diagnostics },
          { data: quota },
        ] = await Promise.all([
          supabaseAuth.from("profiles").select("*").eq("user_id", target_user_id).maybeSingle(),
          supabaseAuth.from("study_performance").select("*").eq("user_id", target_user_id).order("updated_at", { ascending: false }).limit(1),
          supabaseAuth.from("medical_domain_map").select("*").eq("user_id", target_user_id).order("domain_score", { ascending: false }),
          supabaseAuth.from("error_bank").select("id, tema, subtema, vezes_errado, created_at").eq("user_id", target_user_id).order("vezes_errado", { ascending: false }).limit(20),
          supabaseAuth.from("practice_attempts").select("id, correct, created_at").eq("user_id", target_user_id).order("created_at", { ascending: false }).limit(200),
          supabaseAuth.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", target_user_id),
          supabaseAuth.from("study_plans").select("id, plan_json, updated_at").eq("user_id", target_user_id).order("updated_at", { ascending: false }).limit(1),
          supabaseAuth.from("exam_sessions").select("id, title, score, total_questions, status, started_at, finished_at").eq("user_id", target_user_id).order("started_at", { ascending: false }).limit(10),
          supabaseAuth.from("diagnostic_results").select("*").eq("user_id", target_user_id).order("completed_at", { ascending: false }).limit(1),
          supabaseAuth.from("user_quotas").select("*").eq("user_id", target_user_id).maybeSingle(),
        ]);

        // Calculate stats from attempts
        const totalAttempts = (attempts || []).length;
        const correctAttempts = (attempts || []).filter((a: any) => a.correct).length;
        const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const recentAttempts = (attempts || []).filter((a: any) => a.created_at >= sevenDaysAgo).length;

        return ok({
          profile,
          performance: performance?.[0] || null,
          domainMap: domainMap || [],
          errorBank: errorBank || [],
          stats: { totalAttempts, correctAttempts, accuracy, recentAttempts },
          flashcardsCount: flashcards || 0,
          latestPlan: studyPlans?.[0] || null,
          examSessions: examSessions || [],
          diagnostic: diagnostics?.[0] || null,
          quota: quota || null,
        });
      }

      case "get_audit_log": {
        const { limit = 50 } = params;
        const { data: logs } = await supabaseAuth
          .from("admin_audit_log")
          .select("id, admin_user_id, action, target_user_id, details, created_at")
          .order("created_at", { ascending: false })
          .limit(limit);

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

      case "get_user_access": {
        const { target_user_id } = params;
        if (!target_user_id) throw new Error("target_user_id obrigatório");
        const { data: modules } = await supabaseAuth
          .from("user_module_access")
          .select("module_key, enabled")
          .eq("user_id", target_user_id);
        return ok({ modules: modules || [] });
      }

      case "set_user_access": {
        const { target_user_id, modules } = params;
        if (!target_user_id || !modules) throw new Error("target_user_id e modules obrigatórios");
        
        // modules is an array of { module_key: string, enabled: boolean }
        for (const mod of modules as { module_key: string; enabled: boolean }[]) {
          await supabaseAuth
            .from("user_module_access")
            .upsert(
              { user_id: target_user_id, module_key: mod.module_key, enabled: mod.enabled, granted_by: user.id },
              { onConflict: "user_id,module_key" }
            );
        }
        await logAudit(supabaseAuth, user.id, "set_user_access", target_user_id, { modules_count: (modules as any[]).length });
        return ok({ success: true });
      }

      case "force_logout": {
        const { target_user_id } = params;
        if (!target_user_id) throw new Error("target_user_id obrigatório");
        if (target_user_id === user.id) throw new Error("Você não pode desconectar a si mesmo.");
        // Ban briefly to invalidate all sessions, then unban
        const { error: banErr } = await supabaseAuth.auth.admin.updateUserById(target_user_id, { ban_duration: "1s" });
        if (banErr) throw new Error(`Erro ao desconectar: ${banErr.message}`);
        // Immediately unban so user can log in again
        await supabaseAuth.auth.admin.updateUserById(target_user_id, { ban_duration: "none" });
        await logAudit(supabaseAuth, user.id, "force_logout", target_user_id, {});
        return ok({ success: true });
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
