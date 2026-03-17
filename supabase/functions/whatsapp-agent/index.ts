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
          champion: "O aluno tá mandando bem! Elogie o streak e a dedicação com humor médico. Tom: orgulhoso e engraçado.",
          good: "O aluno tá indo bem mas pode melhorar. Tom: encorajador e positivo com pitadas de humor.",
          meh: "O aluno tá morno, precisa de um empurrão. Tom: provocativo mas amigável e divertido.",
          slacking: "O aluno NÃO está estudando! Sequência zerou! Tom: bronca divertida mas firme.",
          danger: "URGENTE! Muitas revisões atrasadas e urgentes. Tom: alarmante mas motivador com humor negro médico.",
        };

        const randomSeed = Math.random().toString(36).substring(2, 10);
        const dayOfWeek = new Date().toLocaleDateString("pt-BR", { weekday: "long" });
        const hour = new Date().getHours();

        const prompt = `Gere uma mensagem de WhatsApp curta e motivacional (máximo 500 caracteres) para um aluno de medicina.
Use emojis com moderação. Seja direto e encorajador. NÃO use markdown. NÃO use asteriscos.

SEED ALEATÓRIA (use para variar): ${randomSeed}
DIA: ${dayOfWeek} | HORA: ${hour}h

⚠️ REGRA ABSOLUTA DE ORIGINALIDADE — NUNCA repita abertura, estrutura ou piada.
Varie OBRIGATORIAMENTE entre estes estilos de humor (escolha UM aleatório):
1. Trocadilho médico ("Sua sequência tá mais saudável que paciente de check-up!")
2. Analogia de plantão ("Se suas revisões fossem pacientes, já teriam dado entrada na UTI")
3. Referência pop/meme ("Ninguém: ... Suas revisões: SOCORRO")
4. Ironia carinhosa ("Ah sim, deixar pra última hora sempre funciona né? 🙄")
5. Narração épica ("Capítulo ${streak} da saga do(a) ${(profile.display_name || "Aluno").split(" ")[0]}")
6. Comparação absurda ("Seu streak tá maior que fila de UPA em noite de chuva")
7. Personificação ("Seus temas pendentes tão te olhando com cara de abandono")
8. Coach de academia ("BORA! Dia de treinar o cérebro! 🧠💪")

TOM: ${moodInstructions[mood]}

Dados do aluno:
- Nome: ${profile.display_name || "Aluno"}
- Streak: ${streak} dias seguidos
- Nível: ${gamification.level} | XP: ${gamification.xp}

Revisões pendentes (${revisoes.length} total, ${urgentes.length} urgentes):
${revisoesText}

${app_url ? `Link: ${app_url}` : ""}

A mensagem DEVE:
1. COMEÇAR saudando pelo primeiro nome com frase ENGRAÇADA e ÚNICA
2. Incluir pelo menos UMA piada ou trocadilho médico
3. Mencionar revisões do dia (quantidade e temas urgentes)
4. Se streak=0, bronca HILÁRIA mas firme
5. Terminar com encorajamento divertido ou link do app`;

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
                { role: "system", content: "Você é um assistente HILÁRIO que gera mensagens de WhatsApp para alunos de medicina. Cada mensagem deve ser ÚNICA, ENGRAÇADA e MEMORÁVEL. Use humor brasileiro autêntico: trocadilhos médicos, referências a plantão, memes de internato, analogias com séries médicas. NUNCA repita a mesma piada ou estrutura. Mensagens curtas, diretas, com emojis moderados. Sem markdown. Sem asteriscos. Temperatura máxima de criatividade!" },
                { role: "user", content: prompt },
              ],
              max_tokens: 512,
              temperature: 0.95,
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
