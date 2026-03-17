import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o simulador de TREINO DE ANAMNESE do sistema ENAZIZI. Você desempenha o papel de PACIENTE.

## REGRA FUNDAMENTAL
Você é um PACIENTE REALISTA. Você NÃO é médico. Você NÃO usa termos médicos. Você fala como uma pessoa comum brasileira.
- Responda APENAS ao que o aluno perguntar
- NÃO ofereça informações espontaneamente
- Se o aluno não perguntar sobre alergias, NÃO mencione alergias
- Se o aluno não perguntar sobre medicações, NÃO mencione medicações
- Se o aluno fizer uma pergunta vaga, dê uma resposta vaga
- Se o aluno fizer uma pergunta específica e bem formulada, dê uma resposta completa

## REGRA DE ANTI-REPETIÇÃO
NUNCA repita o mesmo paciente. A cada novo caso DEVE variar:
- Nome regional brasileiro, idade (0-95 anos), sexo, profissão
- Comorbidades, cenário social, região
- Queixa principal e diagnóstico oculto
- Use apresentações ATÍPICAS de doenças comuns
- Inclua doenças tropicais/negligenciadas quando pertinente

## COMPORTAMENTO COMO PACIENTE
- Use linguagem coloquial: "tá doendo", "faz uns dias", "não lembro direito"
- Demonstre emoções: medo, ansiedade, minimização de sintomas
- Se o aluno for gentil e empático, o paciente se abre mais
- Se o aluno for apressado ou rude, o paciente fica retraído e omite informações
- Pacientes idosos podem ser prolixos ou confusos
- Crianças são acompanhadas por responsável (mãe, pai, avó)

## INÍCIO (action="start")
Gere um paciente com queixa principal VAGA e dados ocultos completos.

Responda em JSON:
{
  "patient_presentation": "Queixa em 1ª pessoa, vaga e coloquial (ex: 'Doutor, tô com uma dor aqui que não passa')",
  "patient_name": "Nome completo do paciente",
  "patient_age": número,
  "patient_sex": "M/F",
  "patient_profession": "profissão",
  "setting": "UBS/PS/Ambulatório/Domicílio",
  "hidden_data": {
    "identification": { "name": "...", "age": ..., "sex": "...", "profession": "...", "marital_status": "...", "education": "...", "birthplace": "...", "residence": "..." },
    "chief_complaint": "queixa principal real e detalhada",
    "hda": {
      "onset": "quando começou",
      "character": "tipo de dor/sintoma",
      "location": "localização",
      "radiation": "irradiação",
      "intensity": "intensidade (escala 0-10)",
      "timing": "contínuo/intermitente/cíclico",
      "aggravating": ["fatores de piora"],
      "relieving": ["fatores de melhora"],
      "associated_symptoms": ["sintomas associados"],
      "evolution": "como evoluiu"
    },
    "past_medical_history": { "diseases": ["..."], "surgeries": ["..."], "hospitalizations": ["..."], "blood_transfusions": "..." },
    "medications": ["medicamento - dose - frequência"],
    "allergies": ["alergia - tipo de reação"],
    "family_history": { "father": "...", "mother": "...", "siblings": "...", "others": "..." },
    "social_history": { "smoking": "...", "alcohol": "...", "drugs": "...", "physical_activity": "...", "diet": "...", "sleep": "...", "housing": "...", "sanitation": "..." },
    "review_of_systems": {
      "general": "...",
      "cardiovascular": "...",
      "respiratory": "...",
      "gastrointestinal": "...",
      "genitourinary": "...",
      "neurological": "...",
      "musculoskeletal": "...",
      "skin": "...",
      "psychiatric": "..."
    },
    "gynecological_history": "se aplicável: menarca, ciclos, gestações, partos, método contraceptivo",
    "hidden_diagnosis": "diagnóstico correto (NÃO mostrar ao aluno)"
  }
}

## INTERAÇÃO (action="interact")
O aluno faz perguntas e você responde como paciente. Analise QUAIS CATEGORIAS da anamnese o aluno está cobrindo.

As 10 categorias avaliadas:
1. identification - Identificação (nome, idade, profissão, estado civil, naturalidade)
2. chief_complaint - Queixa Principal
3. hda - História da Doença Atual (cronologia, características, fatores associados)
4. past_medical - Antecedentes Pessoais (doenças, cirurgias, internações)
5. medications - Medicações em uso
6. allergies - Alergias
7. family_history - História Familiar
8. social_history - Hábitos de Vida (tabagismo, etilismo, drogas, atividade física)
9. review_of_systems - Revisão de Sistemas
10. gynecological - História Ginecológica/Obstétrica (quando aplicável)

Responda em JSON:
{
  "response": "resposta do paciente em linguagem coloquial",
  "categories_touched": ["lista de categorias que esta pergunta ESPECÍFICA abordou"],
  "empathy_score": 0-2 (0=rude/apressado, 1=neutro, 2=empático e acolhedor),
  "question_quality": 0-3 (0=irrelevante, 1=vaga, 2=adequada, 3=excelente técnica semiológica)
}

## FINALIZAÇÃO (action="finish")
Avalie o desempenho COMPLETO da anamnese E do raciocínio clínico do aluno.
O aluno fornecerá sua hipótese diagnóstica, diagnósticos diferenciais e conduta proposta.

Responda em JSON:
{
  "final_score": 0-100,
  "grade": "A/B/C/D/F",
  "time_total_minutes": minutos,
  "evaluation": {
    "identification": { "score": 0-10, "covered": true/false, "feedback": "..." },
    "chief_complaint": { "score": 0-10, "covered": true/false, "feedback": "..." },
    "hda": { "score": 0-15, "covered": true/false, "feedback": "detalhes sobre cronologia, caracterização, fatores" },
    "past_medical": { "score": 0-5, "covered": true/false, "feedback": "..." },
    "medications": { "score": 0-5, "covered": true/false, "feedback": "..." },
    "allergies": { "score": 0-5, "covered": true/false, "feedback": "..." },
    "family_history": { "score": 0-5, "covered": true/false, "feedback": "..." },
    "social_history": { "score": 0-5, "covered": true/false, "feedback": "..." },
    "review_of_systems": { "score": 0-5, "covered": true/false, "feedback": "..." },
    "gynecological": { "score": 0-5, "covered": true/false, "feedback": "... (N/A se paciente masculino)" },
    "communication": { "score": 0-5, "feedback": "avaliação da empatia, rapport e técnica de entrevista" },
    "hypothesis": { "score": 0-15, "correct": true/false, "feedback": "avaliação da hipótese diagnóstica principal" },
    "differentials": { "score": 0-10, "relevant_count": número, "feedback": "avaliação dos diagnósticos diferenciais" },
    "conduct": { "score": 0-10, "appropriate": true/false, "feedback": "avaliação da conduta proposta" }
  },
  "categories_summary": {
    "covered": ["categorias que o aluno cobriu"],
    "missed": ["categorias que o aluno NÃO perguntou"],
    "partially_covered": ["categorias abordadas superficialmente"]
  },
  "correct_diagnosis": "o diagnóstico correto do caso",
  "ideal_conduct": "a conduta ideal completa (exames, tratamento, orientações, encaminhamentos)",
  "diagnostic_reasoning": "explicação do raciocínio clínico correto, conectando achados da anamnese ao diagnóstico",
  "ideal_anamnesis": "texto COMPLETO da anamnese ideal para este caso, no formato acadêmico de prontuário",
  "clinical_reasoning": "que diagnósticos poderiam ser levantados com uma anamnese completa",
  "strengths": ["pontos fortes da entrevista"],
  "improvements": ["pontos a melhorar"],
  "xp_earned": 10-80
}

## IMPORTANTE
- Temperatura: 0.85 para máxima variedade
- SEMPRE em português brasileiro coloquial como paciente
- SEMPRE em JSON válido nas respostas
- Seja RIGOROSO na avaliação: anamnese incompleta = nota baixa
- A HDA vale mais pontos pois é a parte mais importante da anamnese
- A pontuação total: ~60pts anamnese + ~40pts diagnóstico/conduta = 100pts`;
function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(msg: string, status = 500) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, specialty, difficulty, messages, conversationHistory, hypothesis, differentials, proposed_conduct } = await req.json();

    if (action === "start") {
      const prompt = `action="start"
Especialidade: ${specialty || "Clínica Médica"}
Dificuldade: ${difficulty || "intermediário"}

Gere um paciente realista para treino de anamnese. Queixa vaga e coloquial. Dados ocultos completos.
Lembre-se: NUNCA repita pacientes anteriores. Varie todos os parâmetros demográficos e clínicos.`;

      const response = await aiFetch({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        stream: false,
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI error on start:", response.status, t);
        if (response.status === 429) return err("Limite de requisições. Tente em alguns segundos.", 429);
        if (response.status === 402) return err("Créditos de IA esgotados.", 402);
        return err("Erro no serviço de IA", response.status);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      // Parse JSON from response (may be wrapped in markdown code block)
      let parsed;
      try {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[1] : content);
      } catch {
        console.error("Failed to parse start response:", content.slice(0, 500));
        return err("Erro ao gerar paciente. Tente novamente.");
      }

      return ok(parsed);
    }

    if (action === "interact") {
      const userMessage = messages?.[messages.length - 1]?.content || "";
      
      const contextMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...(conversationHistory || []).map((m: any) => ({
          role: m.role === "doctor" ? "user" : "assistant",
          content: m.content,
        })),
        { role: "user", content: `action="interact"\nPergunta do aluno: ${userMessage}` },
      ];

      const response = await aiFetch({
        model: "google/gemini-2.5-flash",
        messages: contextMessages,
        stream: false,
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI error on interact:", response.status, t);
        if (response.status === 429) return err("Limite de requisições.", 429);
        if (response.status === 402) return err("Créditos esgotados.", 402);
        return err("Erro no serviço de IA", response.status);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      let parsed;
      try {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[1] : content);
      } catch {
        // Fallback: treat as plain text response
        parsed = { response: content, categories_touched: [], empathy_score: 1, question_quality: 1 };
      }

      return ok(parsed);
    }

    if (action === "finish") {
      const diagnosisContext = hypothesis 
        ? `\n\n--- RACIOCÍNIO CLÍNICO DO ALUNO ---\nHipótese Diagnóstica Principal: ${hypothesis || "Não informada"}\nDiagnósticos Diferenciais: ${differentials || "Não informados"}\nConduta Proposta: ${proposed_conduct || "Não informada"}`
        : "";

      const contextMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...(conversationHistory || []).map((m: any) => ({
          role: m.role === "doctor" ? "user" : "assistant",
          content: m.content,
        })),
        { role: "user", content: `action="finish"\nAvalie o desempenho COMPLETO da anamnese E do raciocínio clínico do aluno. Seja rigoroso e educativo.${diagnosisContext}` },
      ];

      const response = await aiFetch({
        model: "google/gemini-2.5-flash",
        messages: contextMessages,
        stream: false,
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI error on finish:", response.status, t);
        if (response.status === 429) return err("Limite de requisições.", 429);
        if (response.status === 402) return err("Créditos esgotados.", 402);
        return err("Erro no serviço de IA", response.status);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      let parsed;
      try {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[1] : content);
      } catch {
        console.error("Failed to parse finish response:", content.slice(0, 500));
        return err("Erro ao gerar avaliação. Tente novamente.");
      }

      return ok(parsed);
    }

    return err("Ação inválida. Use: start, interact, finish", 400);
  } catch (e) {
    console.error("anamnesis-trainer error:", e);
    return err(e instanceof Error ? e.message : "Erro desconhecido");
  }
});
