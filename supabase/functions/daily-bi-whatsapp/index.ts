import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

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
        // Check if already sent today
        const { data: alreadySent } = await supabase
          .from("whatsapp_message_log")
          .select("id")
          .eq("target_user_id", user.user_id)
          .eq("execution_mode", "daily_bi")
          .gte("sent_at", `${today}T00:00:00Z`)
          .limit(1);

        if (alreadySent && alreadySent.length > 0) {
          console.log(`User ${user.user_id} already received message today, skipping`);
          continue;
        }

        // 2. Coletar BI do dia
        const { data: attempts } = await supabase
          .from("practice_attempts")
          .select("correct")
          .eq("user_id", user.user_id)
          .gte("created_at", `${today}T00:00:00`)
          .lt("created_at", `${today}T23:59:59`);

        const totalQ = attempts?.length || 0;
        const correctQ = attempts?.filter((a: any) => a.correct).length || 0;
        const accuracy = totalQ > 0 ? Math.min(100, Math.round((correctQ / totalQ) * 100)) : 0;

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

        // Proficiência — atividades do professor
        const { data: simResults } = await supabase
          .from("teacher_simulado_results")
          .select("status, score, total_questions")
          .eq("student_id", user.user_id);

        const { data: caseResults } = await supabase
          .from("teacher_clinical_case_results")
          .select("status, final_score, grade, student_got_diagnosis")
          .eq("student_id", user.user_id);

        const { data: assignResults } = await supabase
          .from("teacher_study_assignment_results")
          .select("status")
          .eq("student_id", user.user_id);

        let proficienciaInfo = "";

        if ((simResults && simResults.length > 0) || (caseResults && caseResults.length > 0) || (assignResults && assignResults.length > 0)) {
          const parts: string[] = [];

          if (simResults && simResults.length > 0) {
            const done = simResults.filter((r: any) => r.status === "completed");
            const pending = simResults.filter((r: any) => r.status === "pending").length;
            const avgScore = done.length > 0
              ? Math.min(100, Math.round(done.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / done.length))
              : 0;
            parts.push(`- Simulados: ${done.length} feito(s)${done.length > 0 ? ` (média ${avgScore}%)` : ""}, ${pending} pendente(s)`);
          }

          if (caseResults && caseResults.length > 0) {
            const done = caseResults.filter((r: any) => r.status === "completed");
            const pending = caseResults.filter((r: any) => r.status === "pending").length;
            const avgScore = done.length > 0
              ? Math.round(done.reduce((sum: number, r: any) => sum + (r.final_score || 0), 0) / done.length)
              : 0;
            const diagOk = done.filter((r: any) => r.student_got_diagnosis).length;
            parts.push(`- Casos clínicos: ${done.length} feito(s)${done.length > 0 ? ` (nota média ${avgScore}, diagnóstico correto ${diagOk}/${done.length})` : ""}, ${pending} pendente(s)`);
          }

          if (assignResults && assignResults.length > 0) {
            const done = assignResults.filter((r: any) => r.status === "completed").length;
            const pending = assignResults.filter((r: any) => r.status === "pending").length;
            parts.push(`- Temas de estudo: ${done} concluído(s), ${pending} pendente(s)`);
          }

          proficienciaInfo = `\nATIVIDADES DO PROFESSOR:\n${parts.join("\n")}`;
        }

        // 4. Gerar mensagem via IA
        const nome = user.display_name?.split(" ")[0] || "Aluno";

        const prompt = `Gere uma mensagem WhatsApp curta e motivacional (máx 600 chars) em português brasileiro para o aluno ${nome} com este resumo do dia e programação de amanhã. Use emojis. Inclua TODOS os dados abaixo. Não invente dados.

REGRAS IMPORTANTES:
- NUNCA mostre percentuais acima de 100%. Valores são de 0% a 100%.
- NÃO invente dados ou métricas que não foram fornecidos.
- NÃO calcule "probabilidade de aprovação" — apenas relate os dados fornecidos.

RESUMO DE HOJE:
- Questões respondidas: ${totalQ}
- Acurácia: ${accuracy}%
- Streak: ${streak} dias
- XP total: ${xp}
- Temas estudados: ${temasHoje}
${proficienciaInfo}

AMANHÃ:
- Revisões: ${temasAmanha}
- Áreas para focar: ${temasFracos}

No final, adicione: "Responda SAIR para não receber mais."
Link do app: https://enazizi.com`;

        let messageText: string;
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

        if (LOVABLE_API_KEY) {
          try {
            const aiResp = await fetch(LOVABLE_GATEWAY, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 1024,
              }),
            });

            if (aiResp.ok) {
              const aiData = await aiResp.json();
              messageText = aiData?.choices?.[0]?.message?.content ||
                buildFallbackMessage(nome, totalQ, accuracy, streak, temasAmanha, temasFracos, proficienciaInfo);
            } else {
              console.warn(`AI returned ${aiResp.status}, using fallback`);
              messageText = buildFallbackMessage(nome, totalQ, accuracy, streak, temasAmanha, temasFracos, proficienciaInfo);
            }
          } catch (aiErr) {
            console.error("AI fetch error:", aiErr);
            messageText = buildFallbackMessage(nome, totalQ, accuracy, streak, temasAmanha, temasFracos, proficienciaInfo);
          }
        } else {
          messageText = buildFallbackMessage(nome, totalQ, accuracy, streak, temasAmanha, temasFracos, proficienciaInfo);
        }

        // Fix AI sometimes splitting "enazizi" into "e nazizi"
        messageText = messageText.replace(/e\s+nazizi\.com/gi, "enazizi.com");

        // 5. Inserir na fila
        await supabase.from("whatsapp_message_log").insert({
          admin_user_id: adminId,
          target_user_id: user.user_id,
          message_text: messageText,
          delivery_status: "pending",
          execution_mode: "daily_bi",
        });

        queued++;
      } catch (userErr) {
        console.error(`Error processing user ${user.user_id}:`, userErr);
      }
    }

    // 6. Criar execução ativa para o agente local detectar
    if (queued > 0) {
      try {
        // Check for existing active execution today — reuse if found
        const { data: activeExecs } = await supabase
          .from("whatsapp_send_executions")
          .select("*")
          .in("status", ["running", "paused"])
          .eq("execution_date", today)
          .limit(1);

        let exec: any;
        let reused = false;

        if (activeExecs && activeExecs.length > 0) {
          exec = activeExecs[0];
          reused = true;
          if (exec.status !== "running") {
            await supabase
              .from("whatsapp_send_executions")
              .update({ status: "running" })
              .eq("id", exec.id);
          }
        } else {
          const { data: newExec, error: execErr } = await supabase
            .from("whatsapp_send_executions")
            .insert({
              admin_user_id: adminId,
              execution_date: today,
              mode: "desktop",
              status: "running",
              started_at: new Date().toISOString(),
            })
            .select("id")
            .single();

          if (execErr) {
            console.error("Failed to create execution:", execErr);
          } else {
            exec = newExec;
          }
        }

        if (exec) {
          // Link pending orphan items from today to this execution
          const { error: linkErr } = await supabase
            .from("whatsapp_message_log")
            .update({ execution_id: exec.id })
            .eq("delivery_status", "pending")
            .is("execution_id", null)
            .gte("created_at", `${today}T00:00:00Z`);

          if (linkErr) {
            console.error("Failed to link items to execution:", linkErr);
          }

          // Update total_items count
          const { count } = await supabase
            .from("whatsapp_message_log")
            .select("id", { count: "exact", head: true })
            .eq("execution_id", exec.id);

          await supabase
            .from("whatsapp_send_executions")
            .update({ total_items: count || queued })
            .eq("id", exec.id);

          // Log
          await supabase.from("whatsapp_execution_logs").insert({
            execution_id: exec.id,
            action: reused ? "execution_reused" : "execution_started",
            status: "success",
            message: reused
              ? `BI diário: ${queued} novos itens vinculados`
              : `BI diário: execução criada com ${queued} itens`,
          });

          // Audit log
          await supabase.from("admin_audit_log").insert({
            admin_user_id: adminId,
            action: "whatsapp_daily_bi_execution",
            details: { execution_id: exec.id, queued, date: today, reused },
          });

          console.log(`${reused ? "Reused" : "Created"} execution ${exec.id} with ${queued} items`);
        }
      } catch (execCreateErr) {
        console.error("Error creating execution:", execCreateErr);
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

function buildFallbackMessage(
  nome: string, totalQ: number, accuracy: number, streak: number,
  temasAmanha: string, temasFracos: string, proficienciaInfo: string = ""
): string {
  const profBlock = proficienciaInfo ? `\n📋 Proficiência:${proficienciaInfo}\n` : "";
  return `📊 Resumo de hoje, ${nome}:\n${totalQ} questões | ${accuracy}% acurácia | 🔥 ${streak} dias\n${profBlock}\n📋 Amanhã:\nRevisão: ${temasAmanha}\nFoco: ${temasFracos}\n\nhttps://enazizi.com\nResponda SAIR para não receber mais.`;
}
