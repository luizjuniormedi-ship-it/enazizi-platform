import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENAMED_THEMES = [
  { specialty: "Clínica Médica", topics: ["IAM e SCA", "Insuficiência Cardíaca", "DPOC e Asma", "Pneumonia Comunitária", "TEP", "AVC Isquêmico e Hemorrágico", "Diabetes Mellitus", "Cetoacidose Diabética", "Hipotireoidismo e Hipertireoidismo", "Sepse e Choque Séptico", "Insuficiência Renal Aguda", "Doença Renal Crônica", "Distúrbios Hidroeletrolíticos", "Cirrose e Hepatopatias", "Anemia Falciforme", "Lúpus Eritematoso Sistêmico", "Artrite Reumatoide", "Meningite Bacteriana", "HIV/AIDS", "Tuberculose Pulmonar e Extrapulmonar"] },
  { specialty: "Cirurgia", topics: ["Abdome Agudo", "Apendicite Aguda", "Colecistite e Colelitíase", "Obstrução Intestinal", "Trauma Abdominal (FAST/Lavado)", "Politrauma e ATLS", "Hérnia Inguinal", "Pancreatite Aguda", "Hemorragia Digestiva Alta e Baixa", "Queimaduras", "Choque Hipovolêmico", "Diverticulite", "Câncer Gástrico e Colorretal", "Trauma Torácico", "Nódulo Tireoidiano"] },
  { specialty: "Pediatria", topics: ["IVAS e Otite Média", "Bronquiolite", "Pneumonia na Infância", "Asma Infantil", "Desidratação e TRO", "Convulsão Febril", "Icterícia Neonatal", "Crescimento e Desenvolvimento", "Calendário Vacinal", "Febre Reumática", "Doenças Exantemáticas", "Infecção Urinária na Infância", "Meningite Neonatal", "Desnutrição e Raquitismo", "Aleitamento Materno"] },
  { specialty: "Ginecologia e Obstetrícia", topics: ["Pré-eclâmpsia e Eclâmpsia", "Diabetes Gestacional", "Placenta Prévia e DPP", "Gravidez Ectópica", "Hemorragias da 1ª e 2ª Metade", "Pré-natal de Alto Risco", "Trabalho de Parto", "Indicações de Cesárea", "Infecções na Gestação (TORCH)", "Câncer de Colo Uterino e Rastreamento", "Câncer de Mama", "Endometriose", "SOP", "Mioma Uterino", "Anticoncepção e Planejamento Familiar"] },
  { specialty: "Medicina Preventiva e Saúde Coletiva", topics: ["Princípios do SUS", "Atenção Primária e ESF", "Vigilância Epidemiológica", "Doenças de Notificação Compulsória", "Epidemiologia Descritiva e Analítica", "Estudos Epidemiológicos (Coorte, Caso-Controle)", "Indicadores de Saúde", "Bioestatística (Sensibilidade, Especificidade, VPP, VPN)", "Rastreamento Populacional", "Política Nacional de Humanização", "NASF e CAPS", "Determinantes Sociais da Saúde", "Saúde do Trabalhador", "Ética Médica e Bioética"] },
];

async function generateENAMEDQuestions(
  specialty: string,
  topics: string[],
  userId: string,
  supabaseAdmin: any,
  source: string,
): Promise<{ questions: number; flashcards: number }> {
  const selectedTopics = topics.sort(() => Math.random() - 0.5).slice(0, 6);

  const prompt = `Você é um elaborador de questões de ELITE das provas ENAMED, REVALIDA INEP, USP, UNIFESP, UNICAMP e ENARE.

GERE EXATAMENTE 30 questões de múltipla escolha no padrão ENAMED/REVALIDA e 20 flashcards.

ESPECIALIDADE: ${specialty}
TEMAS OBRIGATÓRIOS: ${selectedTopics.join(", ")}

=== PADRÃO DE EXCELÊNCIA PARA CASOS CLÍNICOS ===

CADA QUESTÃO DEVE OBRIGATORIAMENTE:

1. **CASO CLÍNICO COMPLETO** (mínimo 80% das questões):
   - Nome fictício, idade EXATA, sexo, profissão quando relevante
   - Queixa principal com TEMPO DE EVOLUÇÃO preciso
   - Antecedentes: comorbidades + medicações em uso (nome, dose)
   - Hábitos: tabagismo (maços/ano), etilismo, drogas
   - Sinais vitais COMPLETOS: PA, FC, FR, Temp, SpO2
   - Exame físico com achados POSITIVOS e NEGATIVOS relevantes
   - Exames laboratoriais com VALORES NUMÉRICOS reais e unidades
   - Laudos de imagem descritivos quando pertinente

2. **ALTERNATIVAS DE ALTO NÍVEL**:
   - Todas devem ser clinicamente PLAUSÍVEIS (nenhuma absurda)
   - Distratores baseados em diagnósticos diferenciais LEGÍTIMOS
   - Uma alternativa "quase correta" que testa nuance clínica
   - Extensão similar entre alternativas

3. **EXPLICAÇÃO COMPLETA**:
   - Raciocínio clínico passo a passo
   - Por que cada alternativa está certa ou errada
   - Conduta terapêutica atualizada (guidelines 2024-2026)
   - Referência a diretrizes brasileiras (MS, SBC, SBP, FEBRASGO, Sepsis-3)

4. **VARIAÇÃO OBRIGATÓRIA**:
   - Alternar faixas etárias, sexo, comorbidades, cenários (PS, UTI, UBS, SAMU)
   - Incluir apresentações ATÍPICAS (ex: IAM sem dor em diabético, apendicite no idoso)
   - Priorizar doenças tropicais/negligenciadas quando pertinente
   - 40% intermediário, 40% difícil, 20% expert

PADRÃO DOS FLASHCARDS:
- Pergunta direta sobre conceito-chave para residência
- Resposta concisa mas completa, citando conduta, critérios diagnósticos e fonte

FORMATO JSON PURO (sem markdown):
{
  "questions": [
    {"statement":"Caso clínico completo com sinais vitais e exames...","options":["A) ...","B) ...","C) ...","D) ..."],"correct_index":0,"explanation":"Raciocínio clínico + análise de cada alternativa + diretriz...","topic":"${specialty}","difficulty":3}
  ],
  "flashcards": [
    {"question":"Pergunta?","answer":"Resposta completa com fonte.","topic":"${specialty}"}
  ]
}`;

  try {
    const response = await aiFetch({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Responda EXCLUSIVAMENTE com JSON válido. Sem markdown, sem comentários." },
        { role: "user", content: prompt },
      ],
    });

    if (!response.ok) {
      console.error(`AI error for ${specialty}:`, response.status);
      return { questions: 0, flashcards: 0 };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();

    let parsed: any = null;
    try { parsed = JSON.parse(cleaned); } catch {
      const m = cleaned.match(/\{[\s\S]*"questions"[\s\S]*\}/);
      if (m) try { parsed = JSON.parse(m[0]); } catch {}
    }
    if (!parsed) return { questions: 0, flashcards: 0 };

    const questions = (parsed.questions || []).filter((q: any) =>
      q.statement && Array.isArray(q.options) && q.options.length >= 2 && typeof q.correct_index === "number"
    );

    let qCount = 0;
    if (questions.length > 0) {
      const rows = questions.map((q: any) => ({
        user_id: userId,
        statement: String(q.statement).trim(),
        options: q.options.map(String),
        correct_index: q.correct_index,
        explanation: String(q.explanation || "").trim(),
        topic: String(q.topic || specialty).trim(),
        difficulty: q.difficulty || 3,
        source,
        is_global: true,
      }));
      const { error } = await supabaseAdmin.from("questions_bank").insert(rows);
      if (!error) qCount = rows.length;
      else console.error("Insert Q error:", error);
    }

    const flashcards = (parsed.flashcards || []).filter((f: any) => f.question && f.answer);
    let fCount = 0;
    if (flashcards.length > 0) {
      const fRows = flashcards.map((f: any) => ({
        user_id: userId,
        question: String(f.question).trim(),
        answer: String(f.answer).trim(),
        topic: String(f.topic || specialty).trim(),
        is_global: true,
      }));
      const { error } = await supabaseAdmin.from("flashcards").insert(fRows);
      if (!error) fCount = fRows.length;
      else console.error("Insert F error:", error);
    }

    return { questions: qCount, flashcards: fCount };
  } catch (e) {
    console.error(`Error ${specialty}:`, e);
    return { questions: 0, flashcards: 0 };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get admin user
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
    const userId = adminRole?.user_id || "a845ec5d-7afb-4cb9-8aa8-95ae2ea9d023";

    const body = await req.json().catch(() => ({}));
    const rounds = body.rounds || 1;
    const source = body.source || "enamed-revalida-ai";

    let totalQ = 0, totalF = 0;
    const processed: string[] = [];

    for (let r = 0; r < rounds; r++) {
      for (const theme of ENAMED_THEMES) {
        console.log(`[R${r + 1}] Generating ${theme.specialty}...`);
        const result = await generateENAMEDQuestions(theme.specialty, theme.topics, userId, supabaseAdmin, source);
        totalQ += result.questions;
        totalF += result.flashcards;
        processed.push(`${theme.specialty}: ${result.questions}Q, ${result.flashcards}F`);
        console.log(`${theme.specialty}: ${result.questions}Q, ${result.flashcards}F`);
      }
    }

    const { count: qTotal } = await supabaseAdmin.from("questions_bank").select("*", { count: "exact", head: true }).eq("is_global", true);
    const { count: fTotal } = await supabaseAdmin.from("flashcards").select("*", { count: "exact", head: true }).eq("is_global", true);

    return new Response(JSON.stringify({
      message: `Geradas ${totalQ} questões ENAMED/REVALIDA e ${totalF} flashcards`,
      questions_added: totalQ,
      flashcards_added: totalF,
      total_questions: qTotal,
      total_flashcards: fTotal,
      details: processed,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("enamed-generator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
