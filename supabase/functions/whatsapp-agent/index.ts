import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub as string;

    const { data: roleData } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { app_url } = await req.json().catch(() => ({ app_url: "" }));

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, phone")
      .not("phone", "is", null)
      .neq("phone", "")
      .eq("status", "active")
      .eq("is_blocked", false)
      .eq("whatsapp_opt_out", false);

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ students: [], message: "Nenhum aluno com telefone cadastrado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const userIds = profiles.map((p: any) => p.user_id);

    // Fetch today's already-sent messages to avoid repetition
    const { data: todayLogs } = await supabaseAdmin
      .from("whatsapp_message_log")
      .select("target_user_id, message_text")
      .gte("sent_at", `${today}T00:00:00Z`)
      .eq("delivery_status", "sent")
      .in("target_user_id", userIds);

    const sentTodayByUser: Record<string, string[]> = {};
    (todayLogs || []).forEach((log: any) => {
      if (!sentTodayByUser[log.target_user_id]) sentTodayByUser[log.target_user_id] = [];
      sentTodayByUser[log.target_user_id].push(log.message_text);
    });

    // Fetch last 7 days of messages per user for anti-repetition context
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentLogs } = await supabaseAdmin
      .from("whatsapp_message_log")
      .select("target_user_id, message_text")
      .gte("sent_at", sevenDaysAgo)
      .in("target_user_id", userIds)
      .order("sent_at", { ascending: false })
      .limit(500);

    const recentMsgsByUser: Record<string, string[]> = {};
    (recentLogs || []).forEach((log: any) => {
      if (!recentMsgsByUser[log.target_user_id]) recentMsgsByUser[log.target_user_id] = [];
      if (recentMsgsByUser[log.target_user_id].length < 5) {
        recentMsgsByUser[log.target_user_id].push(log.message_text);
      }
    });

    const { data: allRevisoes } = await supabaseAdmin
      .from("revisoes")
      .select("user_id, tipo_revisao, risco_esquecimento, tema_id, temas_estudados(tema, especialidade)")
      .eq("status", "pendente")
      .lte("data_revisao", today)
      .in("user_id", userIds);

    const { data: allGamification } = await supabaseAdmin
      .from("user_gamification")
      .select("user_id, current_streak, xp, level")
      .in("user_id", userIds);

    const revisoesByUser: Record<string, any[]> = {};
    (allRevisoes || []).forEach((r: any) => {
      if (!revisoesByUser[r.user_id]) revisoesByUser[r.user_id] = [];
      revisoesByUser[r.user_id].push(r);
    });

    const gamificationByUser: Record<string, any> = {};
    (allGamification || []).forEach((g: any) => {
      gamificationByUser[g.user_id] = g;
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const students: any[] = [];

    for (let i = 0; i < profiles.length; i += 5) {
      const batch = profiles.slice(i, i + 5);
      const promises = batch.map(async (profile: any) => {
        const alreadySentToday = (sentTodayByUser[profile.user_id] || []).length > 0;
        const revisoes = revisoesByUser[profile.user_id] || [];
        const gamification = gamificationByUser[profile.user_id] || { current_streak: 0, xp: 0, level: 1 };
        const urgentes = revisoes.filter((r: any) => r.risco_esquecimento === "alto" || r.risco_esquecimento === "critico");
        const previousMessages = recentMsgsByUser[profile.user_id] || [];

        const revisoesText = revisoes.length > 0
          ? revisoes.map((r: any) => {
              const tema = r.temas_estudados?.tema || "Tema";
              const esp = r.temas_estudados?.especialidade || "";
              const risco = r.risco_esquecimento === "critico" ? "🔴 CRÍTICO" : r.risco_esquecimento === "alto" ? "🟠 URGENTE" : "🟡";
              return `- ${tema} (${esp}) ${r.tipo_revisao} ${risco}`;
            }).join("\n")
          : "Nenhuma revisão pendente hoje.";

        const streak = gamification.current_streak || 0;
        let mood = "meh";
        if (streak >= 5 && revisoes.length <= 3) mood = "champion";
        else if (streak >= 2) mood = "good";
        else if (streak === 0) mood = "slacking";
        if (revisoes.length > 5 && urgentes.length > 2) mood = "danger";

        const moodInstructions: Record<string, string> = {
          champion: "O aluno tá mandando bem! Elogie o streak com humor médico. Tom: orgulhoso e engraçado.",
          good: "O aluno tá indo bem. Tom: encorajador e positivo com pitadas de humor.",
          meh: "O aluno tá morno. Tom: provocativo mas amigável e divertido.",
          slacking: "O aluno NÃO está estudando! Streak zerou! Tom: bronca divertida mas firme.",
          danger: "URGENTE! Muitas revisões atrasadas. Tom: alarmante com humor negro médico.",
        };

        const randomSeed = Math.random().toString(36).substring(2, 10);
        const dayOfWeek = new Date().toLocaleDateString("pt-BR", { weekday: "long" });
        const hour = new Date().getHours();

        // Build anti-repetition context from previous messages
        const antiRepetitionBlock = previousMessages.length > 0
          ? `\n🚫 MENSAGENS JÁ ENVIADAS NOS ÚLTIMOS 7 DIAS (NÃO REPITA NADA PARECIDO):\n${previousMessages.map((m, i) => `[${i + 1}] "${m.substring(0, 120)}..."`).join("\n")}\n`
          : "";

        const prompt = `Gere uma mensagem de WhatsApp curta e motivacional (máximo 500 caracteres) para um aluno de medicina.
Use emojis com moderação. Seja direto e encorajador. NÃO use markdown. NÃO use asteriscos.

SEED: ${randomSeed} | DIA: ${dayOfWeek} | HORA: ${hour}h
${antiRepetitionBlock}
⚠️ REGRA ABSOLUTA DE ORIGINALIDADE — A mensagem DEVE ser completamente diferente de qualquer uma listada acima.
Varie OBRIGATORIAMENTE entre estes estilos (escolha UM aleatório):
1. Trocadilho médico  2. Analogia de plantão  3. Referência pop/meme
4. Ironia carinhosa  5. Narração épica  6. Comparação absurda
7. Personificação  8. Coach de academia

TOM: ${moodInstructions[mood]}

Dados do aluno:
- Nome: ${profile.display_name || "Aluno"} | Streak: ${streak} dias | Nível: ${gamification.level} | XP: ${gamification.xp}

Revisões pendentes (${revisoes.length} total, ${urgentes.length} urgentes):
${revisoesText}

${app_url ? `Link: ${app_url}` : ""}

A mensagem DEVE:
1. COMEÇAR saudando pelo primeiro nome com frase ENGRAÇADA e ÚNICA
2. Incluir pelo menos UMA piada ou trocadilho médico ORIGINAL
3. Mencionar revisões do dia
4. Se streak=0, bronca HILÁRIA mas firme
5. Terminar com encorajamento ou link do app`;

        try {
          const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                { role: "system", content: "Você é um assistente HILÁRIO que gera mensagens de WhatsApp para alunos de medicina. Cada mensagem deve ser ÚNICA, ENGRAÇADA e MEMORÁVEL. Use humor brasileiro autêntico. NUNCA repita piada, abertura ou estrutura de mensagens anteriores. Sem markdown. Sem asteriscos." },
                { role: "user", content: prompt },
              ],
              max_tokens: 512,
              temperature: 0.95,
            }),
          });

          if (!aiResp.ok) {
            console.error(`AI error for ${profile.user_id}:`, aiResp.status);
            const firstName = (profile.display_name || "Aluno").split(" ")[0];
            return {
              user_id: profile.user_id, display_name: profile.display_name, phone: profile.phone,
              message: `Olá ${firstName}! 📚 Você tem ${revisoes.length} revisão(ões) pendente(s) hoje${urgentes.length > 0 ? `, sendo ${urgentes.length} urgente(s)` : ""}. Não deixe acumular! 💪`,
              revisoes_count: revisoes.length, urgentes_count: urgentes.length, ai_generated: false, already_sent_today: alreadySentToday,
            };
          }

          const aiData = await aiResp.json();
          const message = aiData.choices?.[0]?.message?.content || "";

          return {
            user_id: profile.user_id, display_name: profile.display_name, phone: profile.phone,
            message: message.trim(),
            revisoes_count: revisoes.length, urgentes_count: urgentes.length, ai_generated: true, already_sent_today: alreadySentToday,
          };
        } catch (err) {
          console.error(`Error generating message for ${profile.user_id}:`, err);
          const firstName = (profile.display_name || "Aluno").split(" ")[0];
          return {
            user_id: profile.user_id, display_name: profile.display_name, phone: profile.phone,
            message: `Olá ${firstName}! 📚 Você tem ${revisoes.length} revisão(ões) pendente(s) hoje. Bons estudos! 💪`,
            revisoes_count: revisoes.length, urgentes_count: urgentes.length, ai_generated: false, already_sent_today: alreadySentToday,
          };
        }
      });

      const results = await Promise.all(promises);
      students.push(...results);
    }

    return new Response(JSON.stringify({ students }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("whatsapp-agent error:", err);
    const message = err instanceof Error ? err.message : "Erro interno";
    if (message === "AI_CREDITS_EXHAUSTED") {
      return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
