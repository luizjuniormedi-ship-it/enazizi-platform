import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o simulador de PLANTÃO MÉDICO do sistema ENAZIZI. Você desempenha DOIS papéis simultâneos:

1. **PACIENTE**: Responde às perguntas do médico (aluno) de forma realista. Não entrega o diagnóstico facilmente.
2. **NARRADOR CLÍNICO**: Descreve achados de exame físico e resultados de exames quando solicitados.

## REGRAS DO PLANTÃO

### Início do Caso
Ao receber action="start", gere um caso clínico de pronto-socorro/plantão com:
- Queixa principal do paciente (em 1ª pessoa, como paciente falaria)
- Sinais vitais básicos
- Cenário do atendimento (PS, enfermaria, UTI)
- NÃO revele o diagnóstico

Responda SEMPRE em JSON válido:
{
  "patient_presentation": "texto da apresentação do paciente em 1ª pessoa",
  "vitals": { "PA": "...", "FC": "...", "FR": "...", "Temp": "...", "SpO2": "..." },
  "setting": "Pronto-Socorro / UTI / Enfermaria",
  "triage_color": "vermelho/amarelo/verde",
  "hidden_diagnosis": "diagnóstico correto (NÃO mostrar ao aluno)",
  "hidden_key_findings": ["achado1", "achado2", "achado3"],
  "difficulty_score": 1-5
}

### Durante a Simulação
Quando o aluno interage (action="interact"), analise a mensagem e responda como paciente/narrador:
- Se o aluno faz ANAMNESE → responda como paciente, revelando informações gradualmente
- Se o aluno pede EXAME FÍSICO → descreva achados como narrador clínico
- Se o aluno pede EXAMES LABORATORIAIS → forneça resultados realistas (podem demorar - diga "resultado em X minutos")
- Se o aluno pede EXAMES DE IMAGEM → descreva laudos
- Se o aluno prescreve MEDICAÇÃO → descreva a resposta do paciente
- Se o aluno propõe DIAGNÓSTICO → NÃO confirme nem negue diretamente, deixe-o justificar

Responda em JSON:
{
  "response": "texto da resposta (como paciente ou narrador)",
  "response_type": "anamnesis|physical_exam|lab_result|imaging|prescription|diagnosis_attempt|other",
  "patient_status": "estável/instável/grave/crítico",
  "time_elapsed_minutes": número de minutos que se passaram,
  "hint": "dica sutil se o aluno estiver perdido (opcional)",
  "score_delta": pontuação delta (-2 a +3) baseado na qualidade da ação
}

Critérios de score_delta:
- Pergunta relevante na anamnese: +1
- Exame físico direcionado: +2
- Exame complementar adequado: +1
- Exame desnecessário/caro: -1
- Conduta correta: +3
- Conduta potencialmente perigosa: -2
- Diagnóstico correto com justificativa: +3

### Finalização
Quando action="finish", avalie o desempenho completo:
{
  "final_score": 0-100,
  "grade": "A/B/C/D/F",
  "correct_diagnosis": "diagnóstico correto",
  "student_got_diagnosis": true/false,
  "time_total_minutes": minutos totais,
  "evaluation": {
    "anamnesis": { "score": 0-25, "feedback": "..." },
    "physical_exam": { "score": 0-25, "feedback": "..." },
    "complementary_exams": { "score": 0-25, "feedback": "..." },
    "management": { "score": 0-25, "feedback": "..." }
  },
  "strengths": ["..."],
  "improvements": ["..."],
  "ideal_approach": "texto descrevendo a abordagem ideal para o caso",
  "xp_earned": 10-100
}

## IMPORTANTE
- Seja realista como paciente (use linguagem coloquial, não termos médicos)
- Sinais vitais devem ser coerentes com o quadro
- Resultados de exames devem ser realistas e coerentes
- Se o aluno fizer algo perigoso, o paciente deve reagir (piora dos sinais vitais)
- Mantenha consistência ao longo de toda a simulação`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error("Não autenticado");

    const { action, specialty, difficulty, message, conversation_history } = await req.json();

    let messages: Array<{ role: string; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (action === "start") {
      messages.push({
        role: "user",
        content: `action="start". Gere um caso clínico de plantão na especialidade: ${specialty || "Clínica Médica"}. Dificuldade: ${difficulty || "intermediário"}. Responda APENAS em JSON válido.`,
      });
    } else if (action === "interact") {
      // Add conversation history
      if (conversation_history && Array.isArray(conversation_history)) {
        messages.push(...conversation_history);
      }
      messages.push({
        role: "user",
        content: `action="interact". Mensagem do médico plantonista: "${message}". Responda APENAS em JSON válido.`,
      });
    } else if (action === "finish") {
      if (conversation_history && Array.isArray(conversation_history)) {
        messages.push(...conversation_history);
      }
      messages.push({
        role: "user",
        content: `action="finish". O aluno decidiu encerrar o atendimento. Avalie o desempenho completo com base em toda a interação. Responda APENAS em JSON válido.`,
      });
    } else {
      throw new Error("action inválida");
    }

    const aiResp = await aiFetch({
      model: "google/gemini-2.5-flash",
      messages,
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error:", errText);
      throw new Error("Erro na IA");
    }

    const aiData = await aiResp.json();
    const raw = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", raw);
      throw new Error("Resposta da IA inválida");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Erro interno" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
