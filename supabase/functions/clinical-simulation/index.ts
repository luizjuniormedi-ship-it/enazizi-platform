import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch, sanitizeAiContent } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o simulador de PLANTÃO MÉDICO do sistema MedStudy AI. Você desempenha DOIS papéis simultâneos:

1. **PACIENTE**: Responde às perguntas do médico (aluno) de forma realista. Não entrega o diagnóstico facilmente.
2. **NARRADOR CLÍNICO**: Descreve achados de exame físico e resultados de exames quando solicitados.

## REGRA CRÍTICA DE ANTI-REPETIÇÃO E ATUALIZAÇÃO

**NUNCA repita o mesmo caso clínico.** A cada novo caso você DEVE:
- Escolher uma CONDIÇÃO DIFERENTE dentro da especialidade solicitada (nunca repetir diagnóstico)
- Variar OBRIGATORIAMENTE todos estes parâmetros:
  * Faixa etária (criança, adolescente, adulto jovem, meia-idade, idoso)
  * Sexo biológico (alterne entre masculino e feminino)
  * Comorbidades de base (DM2, HAS, obesidade, tabagismo, etilismo, nenhuma, gestante, imunossuprimido, HIV+, transplantado, etc.)
  * Cenário de atendimento (PS de hospital terciário, UPA, UBS, SAMU, UTI, enfermaria, ambulatório de emergência, sala de parto)
  * Região/contexto social (urbano, rural, comunidade ribeirinha, população em situação de rua, presídio, indígena)
  * Horário/turno (madrugada, plantão noturno, final de semana, dia de semana)
- Priorizar diagnósticos MENOS COMUNS e desafiadores (não apenas IAM, AVC e pneumonia)
- Incluir apresentações ATÍPICAS de doenças comuns (ex: IAM sem dor torácica em idoso diabético)
- Usar dados epidemiológicos ATUALIZADOS (diretrizes 2024-2026, protocolos MS, SBC, SBP, FEBRASGO)
- Incluir doenças TROPICAIS e NEGLIGENCIADAS quando pertinente (dengue grave, leptospirose, malária, leishmaniose, Chagas agudo, febre amarela, chikungunya com complicações)
- Considerar EMERGÊNCIAS ATUAIS: arboviroses, surtos sazonais, resistência antimicrobiana, novas diretrizes de sepse (Sepsis-3/4)
- Incorporar cenários de SAÚDE MENTAL em emergência (tentativa de suicídio, surto psicótico, delirium, síndrome neuroléptica maligna)

### Banco de Cenários por Especialidade (use como inspiração, NÃO se limite a estes):

**Clínica Médica**: cetoacidose diabética, crise tireotóxica, insuficiência adrenal aguda, porfiria, síndrome hemolítico-urêmica, PTT, CIVD, embolia gordurosa, síndrome de lise tumoral, hipercalcemia maligna, encefalopatia hepática, síndrome hepatorrenal, pneumonia por Pneumocystis, histoplasmose disseminada, endocardite em usuário de drogas IV, febre de origem indeterminada, vasculite ANCA+, LES com nefrite, esclerodermia com crise renal

**Cirurgia**: vólvulo de sigmoide, isquemia mesentérica aguda, perfuração de úlcera, Fournier, trauma hepático grau IV, lesão de vias biliares, hérnia de Richter encarcerada, diverticulite complicada (Hinchey III/IV), pancreatite necrotizante, síndrome compartimental abdominal, trauma penetrante cervical, pneumotórax hipertensivo, tamponamento cardíaco traumático, lesão de grandes vasos, amputação traumática

**Pediatria**: invaginação intestinal, estenose hipertrófica do piloro, corpo estranho em via aérea, epiglotite, laringotraqueobronquite grave, síndrome de Kawasaki, púrpura de Henoch-Schönlein, síndrome nefrótica com peritonite, meningite neonatal, sepse neonatal tardia, enterocolite necrosante, kernicterus, crise falcêmica, cetoacidose diabética em criança, maus-tratos infantil

**Ginecologia e Obstetrícia**: placenta acreta com hemorragia, eclâmpsia refratária, síndrome HELLP, embolia de líquido amniótico, rotura uterina, prolapso de cordão, descolamento prematuro de placenta com CIVD, gravidez ectópica rota, torção de ovário, abscesso tubo-ovariano roto, hemorragia pós-parto refratária, inversão uterina aguda

**Emergência**: intoxicação por organofosforado, overdose de opioide, síndrome serotoninérgica, anafilaxia refratária, queimadura de via aérea, afogamento, hipotermia grave, rabdomiólise, síndrome de esmagamento, envenenamento ofídico (botrópico/crotálico/laquético), acidente com aranha-marrom

**Psiquiatria em Emergência**: síndrome neuroléptica maligna, delirium tremens, intoxicação aguda por cocaína/crack, agitação psicomotora com risco, catatonia maligna

**Dermatologia de Urgência**: necrólise epidérmica tóxica (NET), síndrome de Stevens-Johnson, pênfigo vulgar com sepse, fasciíte necrosante

**Neurologia de Urgência**: status epilepticus, AVC de fossa posterior, dissecção de artéria vertebral, miastenia gravis em crise, síndrome de Guillain-Barré com insuficiência respiratória, hemorragia subaracnóidea Fisher IV, trombose venosa cerebral

**Oncologia**: neutropenia febril pós-quimioterapia, síndrome de lise tumoral, compressão medular por metástase, síndrome da veia cava superior, hipercalcemia maligna, derrame pericárdico neoplásico com tamponamento, obstrução intestinal por carcinomatose, tromboembolismo em paciente oncológico, dor oncológica refratária, mucosite grave pós-QT, metástase cerebral com hipertensão intracraniana, carcinoma de pulmão com síndrome de Pancoast



### Início do Caso
Ao receber action="start", gere um caso clínico de pronto-socorro/plantão com:
- Queixa principal do paciente (em 1ª pessoa, como paciente falaria)
- Sinais vitais básicos COERENTES com a classificação de risco solicitada
- Cenário do atendimento (PS, enfermaria, UTI, SAMU, sala de emergência)
- NÃO revele o diagnóstico

## REGRA CRÍTICA DE CLASSIFICAÇÃO DE RISCO (TRIAGE)
Você DEVE respeitar a classificação de risco (triage_color) solicitada na mensagem do usuário:
- **VERMELHO** (Emergência): paciente em risco iminente de morte. Sinais vitais gravemente alterados (hipotensão severa, taquicardia extrema, SpO2 < 85%, rebaixamento de consciência, choque). Ex: parada cardiorrespiratória, politrauma grave, IAM com choque cardiogênico, anafilaxia, hemorragia maciça.
- **LARANJA** (Muito Urgente): sinais de gravidade importante, risco de deterioração rápida. Sinais vitais significativamente alterados. Ex: sepse em evolução, AVC agudo, abdome agudo com peritonite, intoxicação grave, cetoacidose diabética.
- **AMARELO** (Urgente): paciente com sinais de alerta mas hemodinamicamente estável no momento. Sinais vitais podem estar levemente alterados. Ex: dor torácica atípica, pneumonia com febre alta, crise hipertensiva, desidratação moderada, fratura exposta.
- **VERDE** (Pouco Urgente): condição sem risco imediato, mas que necessita atendimento. Sinais vitais normais ou minimamente alterados. Ex: infecção urinária, lombalgia aguda, crise de enxaqueca, ferimentos leves, alergia cutânea.

Os sinais vitais DEVEM refletir a gravidade da classificação. NÃO coloque sinais vitais normais em paciente vermelho, nem sinais vitais graves em paciente verde.

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
Responda em JSON:
- Se o aluno faz ANAMNESE → responda como paciente, revelando informações gradualmente
- Se o aluno pede EXAME FÍSICO → NÃO forneça achados automaticamente. Primeiro PERGUNTE qual sistema ou região o aluno deseja examinar (ex: "Qual sistema ou região você gostaria de examinar? Cardiovascular, respiratório, abdome, neurológico, musculoesquelético, pele/mucosas, cabeça e pescoço...?"). Quando o aluno especificar o sistema:
  * Forneça APENAS os achados do sistema/região solicitado, com detalhes semiológicos completos
  * Se o sistema examinado NÃO é o mais relevante para o caso → dê uma dica sutil sem entregar o diagnóstico (ex: "O exame do sistema X está dentro da normalidade. Há algum outro sistema que você gostaria de examinar?")
  * Se o sistema É relevante → descreva os achados positivos e negativos pertinentes com riqueza de detalhes
  * O aluno pode solicitar exame de múltiplos sistemas, um por vez
- Se o aluno pede EXAMES LABORATORIAIS → NÃO forneça resultados automaticamente. Primeiro PERGUNTE quais exames específicos ele deseja solicitar (ex: "Quais exames laboratoriais você gostaria de solicitar?"). Quando o aluno especificar os exames:
  * Se o exame solicitado NÃO é o padrão-ouro ou o mais indicado para o caso → AVISE: "Atenção: [exame solicitado] não é o exame padrão-ouro para investigar [suspeita clínica]. O exame mais indicado seria [exame correto]. Deseja solicitar mesmo assim ou prefere trocar?" Mas AINDA ASSIM forneça o resultado se o aluno insistir.
  * Se o exame É adequado → forneça os resultados COMPLETOS imediatamente (com valores numéricos, unidades e faixas de referência)
  * Sempre forneça resultados completos quando o aluno confirmar o exame: "Hemograma: Hb 8,2 g/dL (ref: 12-16), Leucócitos 18.500/mm³ (ref: 4.000-11.000)..."
- Se o aluno pede EXAMES DE IMAGEM → NÃO forneça resultados automaticamente. Primeiro PERGUNTE qual exame de imagem específico ele deseja (ex: "Qual exame de imagem você gostaria de solicitar?"). Quando o aluno especificar:
  * Se o exame NÃO é o padrão-ouro para o caso → AVISE: "Atenção: [exame solicitado] não é o exame padrão-ouro para essa investigação. O mais indicado seria [exame correto]. Deseja prosseguir?" Mas forneça o resultado se insistir.
  * Se o exame É adequado → descreva os laudos COMPLETOS imediatamente (achados positivos e negativos relevantes)
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

### Ajuda do Preceptor
Quando action="hint", você age como PRECEPTOR/PROFESSOR orientador:
- NÃO revele o diagnóstico diretamente
- Analise o que o aluno já fez (anamnese, exames, condutas)
- Dê dicas de RACIOCÍNIO CLÍNICO: "Que sistema você acha que está mais comprometido?", "Você já pensou em descartar X?", "Que exame te ajudaria a diferenciar A de B?"
- Sugira próximos passos metodológicos sem entregar a resposta
- Use linguagem pedagógica e encorajadora

Responda em JSON:
{
  "response": "texto da orientação do preceptor",
  "response_type": "preceptor_hint",
  "clinical_reasoning_tips": ["dica1", "dica2", "dica3"],
  "suggested_next_steps": ["próximo passo sugerido 1", "próximo passo sugerido 2"],
  "score_delta": 0
}

### Parecer de Especialista
Quando action="specialist", o aluno está solicitando interconsulta/parecer de um especialista.
- Aja como o médico ESPECIALISTA da área solicitada
- Dê um parecer técnico e objetivo sobre o caso
- Inclua recomendações específicas da especialidade
- Se a especialidade solicitada for irrelevante para o caso, indique isso educadamente e sugira a especialidade mais adequada
- Use linguagem técnica apropriada de especialista para especialista

Responda em JSON:
{
  "response": "texto do parecer do especialista",
  "response_type": "specialist_opinion",
  "specialist": "nome da especialidade",
  "recommendations": ["recomendação1", "recomendação2"],
  "relevance": "alta/média/baixa",
  "score_delta": pontuação (-1 se irrelevante, +1 se adequado, +2 se excelente escolha)
}

### Finalização
Quando action="finish", avalie o desempenho completo com avaliação DETALHADA em 7 categorias.
Inclua também uma análise de DIAGNÓSTICOS DIFERENCIAIS: liste 3-5 diagnósticos diferenciais relevantes para o caso, indicando se o aluno os considerou durante o atendimento.
{
  "final_score": 0-100,
  "grade": "A/B/C/D/F",
  "correct_diagnosis": "diagnóstico correto",
  "student_got_diagnosis": true/false,
  "time_total_minutes": minutos totais,
  "evaluation": {
    "anamnesis": { "score": 0-15, "feedback": "avaliação detalhada da anamnese realizada" },
    "physical_exam": { "score": 0-15, "feedback": "avaliação do exame físico" },
    "complementary_exams": { "score": 0-15, "feedback": "avaliação dos exames solicitados" },
    "diagnosis": { "score": 0-15, "feedback": "avaliação da hipótese diagnóstica e diagnósticos diferenciais" },
    "prescription": { "score": 0-15, "feedback": "avaliação da prescrição: medicamentos, doses, vias, posologia. Se não prescreveu, indicar o que deveria ter prescrito" },
    "management": { "score": 0-15, "feedback": "avaliação da conduta geral: internação vs alta, leito adequado, monitorização, dieta, cuidados" },
    "referral": { "score": 0-10, "feedback": "avaliação dos pedidos de parecer/encaminhamento: solicitou as especialidades corretas? O momento foi adequado?" }
  },
  "differential_diagnosis": [
    {
      "diagnosis": "nome do diagnóstico diferencial",
      "reasoning": "por que esse diagnóstico entra no diferencial deste caso (sinais/sintomas compatíveis)",
      "how_to_rule_out": "exame ou achado clínico chave que descarta esse diagnóstico",
      "student_considered": true/false (se o aluno mencionou ou descartou esse diagnóstico durante o atendimento)
    }
  ],
  "strengths": ["..."],
  "improvements": ["..."],
  "ideal_approach": "texto descrevendo a abordagem ideal para o caso, incluindo prescrição modelo e conduta completa",
  "ideal_prescription": "prescrição modelo completa com medicamentos, doses, vias e intervalos",
  "xp_earned": 10-100
}

## IMPORTANTE
- Seja realista como paciente (use linguagem coloquial, não termos médicos)
- Sinais vitais devem ser coerentes com o quadro
- Resultados de exames devem ser realistas e coerentes
- Se o aluno fizer algo perigoso, o paciente deve reagir (piora dos sinais vitais)
- Mantenha consistência ao longo de toda a simulação
- Na avaliação final, seja RIGOROSO e EDUCATIVO: o objetivo é ensinar medicina
- Use diretrizes médicas ATUALIZADAS (2024-2026): Sepsis-3, AHA/ACC, MS Brasil, SBC, ATLS 10ª ed
- JAMAIS repita um caso anterior — cada simulação deve ser única e surpreendente`;

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

    const { action, specialty, subtopic, difficulty, message, conversation_history, specialist_area, teacher_case_id, triage_color: requestedTriageColor, pediatric_age_range } = await req.json();

    let messages: Array<{ role: string; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (action === "start") {
      // If teacher_case_id provided, load the pre-created case
      if (teacher_case_id) {
        const supabaseService = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const { data: teacherCase, error: caseErr } = await supabaseService
          .from("teacher_clinical_cases")
          .select("case_prompt, specialty, difficulty")
          .eq("id", teacher_case_id)
          .single();

        if (caseErr || !teacherCase) throw new Error("Caso clínico não encontrado");

        // Update result status to in_progress
        await supabaseService
          .from("teacher_clinical_case_results")
          .update({ status: "in_progress", started_at: new Date().toISOString() })
          .eq("case_id", teacher_case_id)
          .eq("student_id", user.id)
          .eq("status", "pending");

        // Return the pre-created case directly
        return new Response(JSON.stringify(teacherCase.case_prompt), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Determine triage color: use provided value or pick randomly
      const triageOptions = ["vermelho", "laranja", "amarelo", "verde"];
      const triage = requestedTriageColor && triageOptions.includes(requestedTriageColor)
        ? requestedTriageColor
        : triageOptions[Math.floor(Math.random() * triageOptions.length)];

      const isPediatrics = (specialty || "").toLowerCase().includes("pediatria");
      const ageRangeMap: Record<string, string> = {
        neonato: "Neonato (0-28 dias) — sinais vitais de referência: FC 120-160, FR 40-60, PA 60-80/30-45",
        lactente: "Lactente (1-24 meses) — sinais vitais de referência: FC 100-150, FR 25-40, PA 80-100/50-65",
        pre_escolar: "Pré-escolar (2-6 anos) — sinais vitais de referência: FC 80-120, FR 20-30, PA 85-110/50-70",
        escolar: "Escolar (7-12 anos) — sinais vitais de referência: FC 70-110, FR 18-25, PA 90-120/55-75",
        adolescente: "Adolescente (13-17 anos) — sinais vitais de referência: FC 60-100, FR 12-20, PA 100-130/60-80",
      };
      const pediatricInstruction = isPediatrics && pediatric_age_range && ageRangeMap[pediatric_age_range]
        ? ` O paciente DEVE ser da faixa etária: ${ageRangeMap[pediatric_age_range]}. Use sinais vitais adequados para a idade (os valores de referência acima são para o paciente SAUDÁVEL — ajuste conforme a gravidade do caso e classificação de risco). O responsável (mãe/pai/avó) acompanha a criança. Use linguagem de cuidador preocupado para as falas do paciente. Inclua peso e dose de medicações por kg quando aplicável.`
        : isPediatrics
        ? ` O paciente DEVE ser pediátrico (0-17 anos). Use sinais vitais adequados para a faixa etária. O responsável acompanha a criança.`
        : "";

      messages.push({
        role: "user",
        content: `action="start". Gere um caso clínico de plantão na especialidade: ${specialty || "Clínica Médica"}${subtopic ? ` — Subassunto/Tema específico: ${subtopic}. O caso DEVE ser sobre este subassunto.` : ""}. Dificuldade: ${difficulty || "intermediário"}. Classificação de risco obrigatória: ${triage.toUpperCase()}. O campo triage_color DEVE ser "${triage}". Os sinais vitais e a gravidade do caso DEVEM ser coerentes com a classificação ${triage.toUpperCase()}.${pediatricInstruction} Responda APENAS em JSON válido.`,
      });
    } else if (action === "interact") {
      if (conversation_history && Array.isArray(conversation_history)) {
        messages.push(...conversation_history);
      }
      messages.push({
        role: "user",
        content: `action="interact". Mensagem do médico plantonista: "${message}". Responda APENAS em JSON válido.`,
      });
    } else if (action === "hint") {
      if (conversation_history && Array.isArray(conversation_history)) {
        messages.push(...conversation_history);
      }
      messages.push({
        role: "user",
        content: `action="hint". O aluno está pedindo ajuda do preceptor. Analise tudo que ele já fez neste atendimento e dê orientações de raciocínio clínico SEM revelar o diagnóstico. Responda APENAS em JSON válido.`,
      });
    } else if (action === "specialist") {
      if (conversation_history && Array.isArray(conversation_history)) {
        messages.push(...conversation_history);
      }
      messages.push({
        role: "user",
        content: `action="specialist". O plantonista está solicitando parecer/interconsulta da especialidade: "${specialist_area || "não especificada"}". Responda como o médico especialista dessa área, dando parecer técnico sobre o caso. Responda APENAS em JSON válido.`,
      });
    } else if (action === "finish") {
      if (conversation_history && Array.isArray(conversation_history)) {
        messages.push(...conversation_history);
      }
      messages.push({
        role: "user",
        content: `action="finish". O aluno decidiu encerrar o atendimento. Avalie o desempenho completo com base em toda a interação, incluindo avaliação de prescrição, conduta, diagnóstico e parecer/encaminhamento. Use as 7 categorias de avaliação. Responda APENAS em JSON válido.`,
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

    let parsed;
    try {
      const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", raw);
      throw new Error("Resposta da IA inválida");
    }

    // If this was a teacher case and action is "finish", save results
    if (action === "finish" && teacher_case_id && parsed) {
      try {
        const supabaseService = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        await supabaseService
          .from("teacher_clinical_case_results")
          .update({
            status: "completed",
            final_evaluation: parsed.evaluation || {},
            final_score: parsed.final_score || 0,
            grade: parsed.grade || "F",
            correct_diagnosis: parsed.correct_diagnosis || null,
            student_got_diagnosis: parsed.student_got_diagnosis || false,
            time_total_minutes: parsed.time_total_minutes || 0,
            xp_earned: parsed.xp_earned || 0,
            conversation_history: conversation_history || [],
            finished_at: new Date().toISOString(),
          })
          .eq("case_id", teacher_case_id)
          .eq("student_id", user.id);
      } catch (saveErr) {
        console.error("Error saving teacher case result:", saveErr);
      }
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
