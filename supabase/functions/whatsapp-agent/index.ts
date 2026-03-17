import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Validate admin
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

    // Check admin role
    const { data: roleData } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { app_url } = await req.json().catch(() => ({ app_url: "" }));

    // Fetch all profiles with phone
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, phone")
      .not("phone", "is", null)
      .neq("phone", "")
      .eq("status", "active")
      .eq("is_blocked", false);

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ students: [], message: "Nenhum aluno com telefone cadastrado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().split("T")[0];

    // Fetch pending reviews for today for all users
    const userIds = profiles.map((p: any) => p.user_id);
    const { data: allRevisoes } = await supabaseAdmin
      .from("revisoes")
      .select("user_id, tipo_revisao, risco_esquecimento, tema_id, temas_estudados(tema, especialidade)")
      .eq("status", "pendente")
      .lte("data_revisao", today)
      .in("user_id", userIds);

    // Fetch gamification data
    const { data: allGamification } = await supabaseAdmin
      .from("user_gamification")
      .select("user_id, current_streak, xp, level")
      .in("user_id", userIds);

    // Group data by user
    const revisoesByUser: Record<string, any[]> = {};
    (allRevisoes || []).forEach((r: any) => {
      if (!revisoesByUser[r.user_id]) revisoesByUser[r.user_id] = [];
      revisoesByUser[r.user_id].push(r);
    });

    const gamificationByUser: Record<string, any> = {};
    (allGamification || []).forEach((g: any) => {
      gamificationByUser[g.user_id] = g;
    });

    // Generate AI messages for each student
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const students: any[] = [];

    // Process in batches of 5 to avoid rate limits
    for (let i = 0; i < profiles.length; i += 5) {
      const batch = profiles.slice(i, i + 5);
      const promises = batch.map(async (profile: any) => {
        const revisoes = revisoesByUser[profile.user_id] || [];
        const gamification = gamificationByUser[profile.user_id] || { current_streak: 0, xp: 0, level: 1 };
        
        const urgentes = revisoes.filter((r: any) => r.risco_esquecimento === "alto" || r.risco_esquecimento === "critico");
        
        const revisoesText = revisoes.length > 0
          ? revisoes.map((r: any) => {
              const tema = r.temas_estudados?.tema || "Tema";
              const esp = r.temas_estudados?.especialidade || "";
              const risco = r.risco_esquecimento === "critico" ? "🔴 CRÍTICO" : r.risco_esquecimento === "alto" ? "🟠 URGENTE" : "🟡";
              return `- ${tema} (${esp}) ${r.tipo_revisao} ${risco}`;
            }).join("\n")
          : "Nenhuma revisão pendente hoje.";

        // Determine mood like the dashboard MotivationalGreeting
        const streak = gamification.current_streak || 0;
        let mood = "meh";
        if (streak >= 5 && revisoes.length <= 3) mood = "champion";
        else if (streak >= 2) mood = "good";
        else if (streak === 0) mood = "slacking";
        if (revisoes.length > 5 && urgentes.length > 2) mood = "danger";

        const moodInstructions: Record<string, string> = {
          champion: "O aluno tá mandando bem! Elogie o streak e a dedicação com humor médico. Tom: orgulhoso e engraçado. Exemplos de abertura: '🏆 Tá voando, hein?', '🔥 Sequência de X dias!', '👑 Nesse ritmo, a banca vai pensar que vazou a prova.'",
          good: "O aluno tá indo bem mas pode melhorar. Tom: encorajador e positivo. Exemplos de abertura: '😊 Bom te ver por aqui!', '📚 Tá no caminho certo!', '💡 Dica: quem estuda todo dia não surta na véspera.'",
          meh: "O aluno tá morno, precisa de um empurrão. Tom: provocativo mas amigável. Exemplos de abertura: '🤷 Bora estudar ou vai ficar só olhando?', '☕ Pega um café e bora!', '🎬 Fim do intervalo!'",
          slacking: "O aluno NÃO está estudando! Sequência zerou! Tom: bronca divertida mas firme. COMECE com uma dessas frases (adapte): '😤 Cadê você?! A sequência zerou!', '🦥 Tá querendo passar na prova ou virar especialista em procrastinação?', '🚨 Sua sequência de estudos morreu. Causa mortis: abandono.', '😬 Sem estudar? Amanhã você vai se arrepender.', '📉 Seu progresso tá mais parado que fila do SUS.'",
          danger: "URGENTE! Muitas revisões atrasadas e urgentes. Tom: alarmante mas motivador. Exemplos de abertura: '🚨 ALERTA!', '⏳ Cada hora conta!', '🔴 MODO EMERGÊNCIA!'",
        };

        const prompt = `Gere uma mensagem de WhatsApp curta e motivacional (máximo 500 caracteres) para um aluno de medicina.
Use emojis com moderação. Seja direto e encorajador. NÃO use markdown. NÃO use asteriscos.

IMPORTANTE - TOM DA MENSAGEM:
${moodInstructions[mood]}

Dados do aluno:
- Nome: ${profile.display_name || "Aluno"}
- Streak: ${streak} dias seguidos
- Nível: ${gamification.level}
- XP total: ${gamification.xp}

Revisões pendentes hoje (${revisoes.length} total, ${urgentes.length} urgentes):
${revisoesText}

${app_url ? `Link do app: ${app_url}` : ""}

A mensagem DEVE:
1. COMEÇAR com uma frase motivacional/bronca no estilo descrito acima (saudando pelo primeiro nome)
2. Mencionar as revisões do dia (quantidade e temas urgentes se houver)
3. Motivar ou cobrar baseado no progresso/streak
4. Se o aluno não estuda (streak 0), dar uma bronca engraçada mas firme
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
                { role: "system", content: "Você é um assistente que gera mensagens de WhatsApp motivacionais para alunos de medicina. Mensagens curtas, diretas, com emojis moderados. Sem markdown." },
                { role: "user", content: prompt },
              ],
              max_tokens: 512,
            }),
          });

          if (!aiResp.ok) {
            console.error(`AI error for ${profile.user_id}:`, aiResp.status);
            // Fallback message
            const firstName = (profile.display_name || "Aluno").split(" ")[0];
            return {
              user_id: profile.user_id,
              display_name: profile.display_name,
              phone: profile.phone,
              message: `Olá ${firstName}! 📚 Você tem ${revisoes.length} revisão(ões) pendente(s) hoje${urgentes.length > 0 ? `, sendo ${urgentes.length} urgente(s)` : ""}. Não deixe acumular! 💪`,
              revisoes_count: revisoes.length,
              urgentes_count: urgentes.length,
              ai_generated: false,
            };
          }

          const aiData = await aiResp.json();
          const message = aiData.choices?.[0]?.message?.content || "";

          return {
            user_id: profile.user_id,
            display_name: profile.display_name,
            phone: profile.phone,
            message: message.trim(),
            revisoes_count: revisoes.length,
            urgentes_count: urgentes.length,
            ai_generated: true,
          };
        } catch (err) {
          console.error(`Error generating message for ${profile.user_id}:`, err);
          const firstName = (profile.display_name || "Aluno").split(" ")[0];
          return {
            user_id: profile.user_id,
            display_name: profile.display_name,
            phone: profile.phone,
            message: `Olá ${firstName}! 📚 Você tem ${revisoes.length} revisão(ões) pendente(s) hoje. Bons estudos! 💪`,
            revisoes_count: revisoes.length,
            urgentes_count: urgentes.length,
            ai_generated: false,
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
