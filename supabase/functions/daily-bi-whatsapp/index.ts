import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Buscar usuários que optaram pelo BI diário
    const { data: users, error: usersErr } = await supabase
      .from("profiles")
      .select("user_id, display_name, phone")
      .eq("whatsapp_daily_bi", true)
      .eq("whatsapp_opt_out", false)
      .not("phone", "is", null)
      .neq("phone", "");

    if (usersErr) throw usersErr;
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: "No users opted in", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    let queued = 0;

    // Get admin user for sender
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();
    const adminId = adminRole?.user_id || users[0].user_id;

    for (const user of users) {
      try {
        // 2. Coletar BI do dia
        const { count: questionsCount } = await supabase
          .from("practice_attempts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.user_id)
          .gte("created_at", `${today}T00:00:00`)
          .lt("created_at", `${today}T23:59:59`);

        const { data: attempts } = await supabase
          .from("practice_attempts")
          .select("correct")
          .eq("user_id", user.user_id)
          .gte("created_at", `${today}T00:00:00`)
          .lt("created_at", `${today}T23:59:59`);

        const totalQ = attempts?.length || 0;
        const correctQ = attempts?.filter((a: any) => a.correct).length || 0;
        const accuracy = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;

        // Gamification (XP, streak)
        const { data: gamif } = await supabase
          .from("user_gamification")
          .select("xp, streak_days")
          .eq("user_id", user.user_id)
          .single();

        const xp = gamif?.xp || 0;
        const streak = gamif?.streak_days || 0;

        // Temas estudados hoje
        const { data: temas } = await supabase
          .from("temas_estudados")
          .select("tema")
          .eq("user_id", user.user_id)
          .eq("data_estudo", today)
          .limit(5);

        const temasHoje = temas?.map((t: any) => t.tema).join(", ") || "nenhum";

        // 3. Programação de amanhã - revisões pendentes
        const { data: revisoes } = await supabase
          .from("revisoes")
          .select("tema_id")
          .eq("user_id", user.user_id)
          .eq("data_revisao", tomorrow)
          .eq("status", "pendente")
          .limit(5);

        let temasAmanha = "nenhuma revisão agendada";
        if (revisoes && revisoes.length > 0) {
          const temaIds = revisoes.map((r: any) => r.tema_id);
          const { data: temasData } = await supabase
            .from("temas_estudados")
            .select("tema")
            .in("id", temaIds);
          temasAmanha = temasData?.map((t: any) => t.tema).join(", ") || "revisões pendentes";
        }

        // Temas fracos (error_bank não dominados)
        const { data: erros } = await supabase
          .from("error_bank")
          .select("tema")
          .eq("user_id", user.user_id)
          .eq("dominado", false)
          .order("vezes_errado", { ascending: false })
          .limit(3);

        const temasFracos = erros?.map((e: any) => e.tema).join(", ") || "nenhum identificado";

        // 4. Gerar mensagem via IA
        const nome = user.display_name?.split(" ")[0] || "Aluno";

        const prompt = `Gere uma mensagem WhatsApp curta e motivacional (máx 500 chars) em português brasileiro para o aluno ${nome} com este resumo do dia e programação de amanhã. Use emojis. Inclua TODOS os dados abaixo. Não invente dados.

RESUMO DE HOJE:
- Questões respondidas: ${totalQ}
- Acurácia: ${accuracy}%
- Streak: ${streak} dias
- XP total: ${xp}
- Temas estudados: ${temasHoje}

AMANHÃ:
- Revisões: ${temasAmanha}
- Áreas para focar: ${temasFracos}

No final, adicione: "Responda SAIR para não receber mais."
Link do app: https://enazizi.com`;

        const aiResp = await fetch("https://qszsyskumcmuknumwxtk.supabase.co/functions/v1/ai-proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [{ role: "user", content: prompt }],
          }),
        });

        let messageText: string;
        if (aiResp.ok) {
          const aiData = await aiResp.json();
          messageText = aiData?.choices?.[0]?.message?.content ||
            `📊 Resumo de hoje, ${nome}:\n${totalQ} questões | ${accuracy}% acurácia | 🔥 ${streak} dias\n\n📋 Amanhã:\nRevisão: ${temasAmanha}\nFoco: ${temasFracos}\n\nhttps://enazizi.com\nResponda SAIR para não receber mais.`;
        } else {
          messageText = `📊 Resumo de hoje, ${nome}:\n${totalQ} questões | ${accuracy}% acurácia | 🔥 ${streak} dias\n\n📋 Amanhã:\nRevisão: ${temasAmanha}\nFoco: ${temasFracos}\n\nhttps://enazizi.com\nResponda SAIR para não receber mais.`;
        }

        // Fix AI sometimes splitting "enazizi" into "e nazizi"
        messageText = messageText.replace(/e\s+nazizi\.com/gi, "enazizi.com");

        // 5. Inserir na fila
        await supabase.from("whatsapp_message_log").insert({
          admin_user_id: adminId,
          target_user_id: user.user_id,
          message_text: messageText,
          delivery_status: "pending",
          execution_mode: "auto",
        });

        queued++;
      } catch (userErr) {
        console.error(`Error processing user ${user.user_id}:`, userErr);
      }
    }

    return new Response(JSON.stringify({ message: "Daily BI queued", count: queued }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
