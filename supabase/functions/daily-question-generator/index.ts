import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch, sanitizeAiContent } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INVALID_CONTENT_REGEX = /(declara[cç][aã]o financeira|declara[cç][oõ]es de interesse|pagamento de qualquer esp[eé]cie|empresa farmac[eê]utica|ind[uú]stria farmac[eê]utica|honor[aá]rio|palestrante remunerado|conflito de interesse|relat[oó]rio de interesse)/i;

const SPECIALTIES = [
  "Cardiologia", "Pneumologia", "Neurologia", "Endocrinologia",
  "Gastroenterologia", "Pediatria", "Ginecologia e Obstetrícia",
  "Cirurgia Geral", "Medicina Preventiva", "Nefrologia",
  "Infectologia", "Hematologia", "Reumatologia", "Dermatologia",
  "Ortopedia", "Urologia", "Psiquiatria", "Oftalmologia",
  "Otorrinolaringologia", "Emergência", "Semiologia", "Anatomia", "Farmacologia",
  "Oncologia",
];

const TOPICS_BY_SPECIALTY: Record<string, string[]> = {
  "Cardiologia": ["Insuficiência Cardíaca", "IAM", "Arritmias", "Valvopatias", "Hipertensão Arterial", "Endocardite", "Pericardite", "Cardiopatias Congênitas", "Doença Coronariana", "Choque Cardiogênico", "Fibrilação Atrial", "Síndrome Coronariana Aguda", "Dissecção de Aorta", "Tromboembolismo Pulmonar", "Miocardiopatias"],
  "Pneumologia": ["Pneumonia", "DPOC", "Asma", "TEP", "Tuberculose", "Derrame Pleural", "Pneumotórax", "Fibrose Pulmonar", "SDRA", "Câncer de Pulmão", "Bronquiectasia", "Sarcoidose", "Apneia do Sono", "Insuficiência Respiratória"],
  "Neurologia": ["AVC Isquêmico", "AVC Hemorrágico", "Epilepsia", "Meningite", "Esclerose Múltipla", "Parkinson", "Alzheimer", "Cefaleia", "Neuropatias", "Tumores Cerebrais", "Miastenia Gravis", "Guillain-Barré", "Hipertensão Intracraniana", "Trauma Cranioencefálico"],
  "Endocrinologia": ["Diabetes Mellitus Tipo 1", "Diabetes Mellitus Tipo 2", "Hipotireoidismo", "Hipertireoidismo", "Síndrome de Cushing", "Insuficiência Adrenal", "Feocromocitoma", "Hiperparatireoidismo", "Osteoporose", "Cetoacidose Diabética", "Estado Hiperosmolar", "Tireoidite de Hashimoto", "Doença de Graves", "Nódulos Tireoidianos"],
  "Gastroenterologia": ["Doença do Refluxo", "Úlcera Péptica", "Doença de Crohn", "Retocolite Ulcerativa", "Cirrose Hepática", "Hepatites Virais", "Pancreatite Aguda", "Pancreatite Crônica", "Colelitíase", "Colecistite", "Hemorragia Digestiva", "Doença Celíaca", "Síndrome do Intestino Irritável", "Câncer Colorretal"],
  "Pediatria": ["Bronquiolite", "Desidratação", "IVAS", "Otite Média", "Imunização", "Crescimento e Desenvolvimento", "Alergia Alimentar", "Febre Reumática", "Meningite Neonatal", "Icterícia Neonatal", "Distúrbios do Crescimento", "Asma Infantil", "Pneumonia Infantil", "Convulsão Febril"],
  "Ginecologia e Obstetrícia": ["Pré-eclâmpsia", "Eclâmpsia", "Diabetes Gestacional", "Placenta Prévia", "DPP", "Gravidez Ectópica", "Endometriose", "SOP", "Mioma Uterino", "Câncer de Colo do Útero", "Câncer de Mama", "Infecções Vaginais", "Parto Normal vs Cesárea", "Hemorragia Pós-Parto"],
  "Cirurgia Geral": ["Apendicite", "Colecistite Aguda", "Obstrução Intestinal", "Hérnia Inguinal", "Abdome Agudo", "Trauma Abdominal", "Pancreatite Cirúrgica", "Diverticulite", "Câncer Gástrico", "Politraumatismo", "Queimaduras", "Choque Hipovolêmico", "Feridas Cirúrgicas", "Complicações Pós-Operatórias"],
  "Medicina Preventiva": ["Epidemiologia", "Vigilância em Saúde", "SUS", "Atenção Primária", "Rastreamento", "Saúde da Família", "Indicadores de Saúde", "Bioestatística", "Estudos Epidemiológicos", "Vacinação do Adulto", "Promoção da Saúde", "Saneamento Básico", "Doenças de Notificação Compulsória"],
  "Nefrologia": ["Insuficiência Renal Aguda", "Doença Renal Crônica", "Glomerulonefrites", "Síndrome Nefrótica", "Síndrome Nefrítica", "Distúrbios Hidroeletrolíticos", "Acidose e Alcalose", "Litíase Renal", "Infecção Urinária", "Transplante Renal", "Diálise", "Nefropatia Diabética"],
  "Infectologia": ["HIV/AIDS", "Dengue", "Malária", "Leishmaniose", "Tuberculose", "Hanseníase", "Hepatites Virais", "COVID-19", "Sepse", "Infecções Hospitalares", "Antibioticoterapia", "Febre Amarela", "Parasitoses Intestinais"],
  "Hematologia": ["Anemias", "Leucemias", "Linfomas", "Mieloma Múltiplo", "Coagulopatias", "Trombocitopenia", "Hemofilia", "CIVD", "Policitemia Vera", "Púrpura Trombocitopênica", "Anemia Falciforme", "Talassemias", "Hemotransfusão"],
  "Reumatologia": ["Artrite Reumatoide", "Lúpus Eritematoso", "Espondilite Anquilosante", "Gota", "Esclerodermia", "Síndrome de Sjögren", "Vasculites", "Fibromialgia", "Artrite Psoriásica", "Polimiosite", "Febre Reumática"],
  "Dermatologia": ["Psoríase", "Dermatite Atópica", "Urticária", "Melanoma", "Carcinoma Basocelular", "Hanseníase", "Micoses Superficiais", "Herpes Zoster", "Acne", "Pênfigo", "Lúpus Cutâneo"],
  "Ortopedia": ["Fraturas", "Luxações", "Osteomielite", "Artrose", "Lombalgia", "Hérnia de Disco", "Síndrome do Túnel do Carpo", "Lesões de Menisco", "Tendinites", "Osteoporose Ortopédica"],
  "Urologia": ["Hiperplasia Prostática", "Câncer de Próstata", "Litíase Urinária", "Infecção Urinária", "Câncer de Bexiga", "Torção Testicular", "Varicocele", "Fimose", "Incontinência Urinária"],
  "Psiquiatria": ["Depressão", "Transtorno Bipolar", "Esquizofrenia", "Transtorno de Ansiedade", "TOC", "TEPT", "Transtornos Alimentares", "Dependência Química", "Demência", "Psicofarmacologia"],
  "Emergência": ["PCR e RCP", "Choque", "Intoxicações", "Anafilaxia", "Politrauma", "ATLS", "Queimaduras", "Afogamento", "Cetoacidose Diabética", "Crise Hipertensiva"],
  "Oftalmologia": ["Glaucoma", "Catarata", "Descolamento de Retina", "Retinopatia Diabética", "Conjuntivite", "Uveíte", "Trauma Ocular"],
  "Otorrinolaringologia": ["Otite", "Sinusite", "Amigdalite", "Perda Auditiva", "Vertigem", "Epistaxe", "Câncer de Laringe"],
  "Semiologia": ["Anamnese", "Exame Físico Geral", "Semiologia Cardiovascular", "Semiologia Pulmonar", "Semiologia Abdominal", "Semiologia Neurológica", "Sinais Vitais"],
  "Anatomia": ["Anatomia do Tórax", "Anatomia Abdominal", "Anatomia do Pescoço", "Neuroanatomia", "Anatomia do Membro Superior", "Anatomia do Membro Inferior", "Anatomia Pélvica"],
  "Farmacologia": ["Farmacocinética (ADME)", "Farmacodinâmica e Receptores", "Antibioticoterapia", "Anti-hipertensivos", "Antiarrítmicos", "Anticoagulantes", "AINEs e Corticoides", "Psicofarmacologia"],
  "Oncologia": ["Câncer de Mama", "Câncer de Pulmão", "Câncer Colorretal", "Estadiamento TNM", "Síndromes Paraneoplásicas", "Marcadores Tumorais", "Quimioterapia", "Imunoterapia", "Cuidados Paliativos", "Emergências Oncológicas"],
};

async function generateForSpecialty(
  specialty: string,
  topics: string[],
  userId: string,
  supabaseAdmin: any,
  existingStatements: string[],
): Promise<number> {
  const selectedTopics = topics.sort(() => Math.random() - 0.5).slice(0, 5);

  let antiRepetitionBlock = "";
  if (existingStatements.length > 0) {
    antiRepetitionBlock = `\n\n⛔ QUESTÕES JÁ EXISTENTES NESTA ESPECIALIDADE (NÃO REPETIR CENÁRIOS SIMILARES):\n${existingStatements.map((s, i) => `${i + 1}. ${s.slice(0, 100)}`).join("\n")}`;
  }

  const prompt = `Gere EXATAMENTE 10 questões de múltipla escolha de ${specialty} para Residência Médica.

TEMAS: ${selectedTopics.join(", ")}

CALIBRAÇÃO OBRIGATÓRIA REVALIDA/ENAMED:
- PROIBIDO: questões de definição pura ("O que é X?", "Defina Y", "Qual o conceito de Z")
- PROIBIDO: enunciados com menos de 150 caracteres sem caso clínico
- OBRIGATÓRIO: caso clínico com ≥3 dados clínicos relevantes (sinais vitais, exames, achados semiológicos)
- OBRIGATÓRIO: ≥2 etapas de raciocínio clínico (ex: diagnóstico → conduta, ou achado → interpretação → tratamento)
- OBRIGATÓRIO: pelo menos 2 distratores plausíveis baseados em diagnósticos diferenciais REAIS
- DIFICULDADE MÍNIMA: 3/5 (intermediário = padrão REVALIDA)

REGRAS:
- Nível de prova de residência médica real (REVALIDA INEP, ENAMED, ENARE, USP, UNICAMP)
- Casos clínicos realistas com anamnese completa (nome, idade, sexo, profissão), exame físico com achados positivos e negativos, sinais vitais completos (PA, FC, FR, Temp, SpO2), exames complementares com valores numéricos e unidades
- 4 alternativas (A, B, C, D), apenas 1 correta — todas clinicamente PLAUSÍVEIS
- Explicação detalhada com raciocínio clínico passo a passo e referência a guidelines 2024-2026
- Distribuição de dificuldade: 50% intermediário (padrão REVALIDA), 50% difícil (padrão ENAMED/ENARE com pegadinhas e apresentações atípicas)
- NUNCA repita perfil de paciente (nome, idade, sexo, cenário)
- Distribua subtópicos: diagnóstico, tratamento, fisiopatologia, epidemiologia, complicações
- Inclua apresentações ATÍPICAS de doenças comuns (ex: IAM sem dor em diabético, apendicite no idoso)
${antiRepetitionBlock}

⛔ CONTEÚDO PROIBIDO: NUNCA gere sobre declarações financeiras, conflitos de interesse, relações com indústria farmacêutica.

FORMATO JSON OBRIGATÓRIO (sem markdown):
{
  "questions": [
    {
      "statement": "Caso clínico completo com ≥150 caracteres...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_index": 0,
      "explanation": "Raciocínio clínico passo a passo...",
      "topic": "${specialty}",
      "difficulty": 3
    }
  ]
}`;

  try {
    const response = await aiFetch({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Você é um professor de medicina especialista em criar questões de residência médica. Responda APENAS com JSON válido, sem markdown." },
        { role: "user", content: prompt },
      ],
      timeoutMs: 90000,
      maxRetries: 1,
    });

    if (!response.ok) {
      console.error(`AI error for ${specialty}:`, await response.text());
      return 0;
    }

    const data = await response.json();
    const rawContent = sanitizeAiContent(data.choices?.[0]?.message?.content || "");
    const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```/g, "").trim();

    let parsed: any = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*"questions"[\s\S]*\}/);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]); } catch { return 0; }
      }
    }

    if (!parsed?.questions) return 0;

    const questions = parsed.questions.filter((q: any) =>
      q.statement && Array.isArray(q.options) && q.options.length >= 2 &&
      typeof q.correct_index === "number" &&
      String(q.statement).trim().length >= 150 &&
      (q.difficulty || 3) >= 3 &&
      !INVALID_CONTENT_REGEX.test(q.statement) &&
      !INVALID_CONTENT_REGEX.test(q.explanation || "")
    );

    if (questions.length === 0) return 0;

    const rows = questions.map((q: any) => ({
      user_id: userId,
      statement: String(q.statement).trim(),
      options: q.options.map(String),
      correct_index: q.correct_index,
      explanation: String(q.explanation || "").trim(),
      topic: specialty,
      difficulty: q.difficulty || 3,
      source: "daily-auto",
      is_global: true,
    }));

    const { error } = await supabaseAdmin.from("questions_bank").insert(rows);
    if (error) {
      console.error("Insert error:", error);
      return 0;
    }
    return rows.length;
  } catch (e) {
    console.error(`Error generating for ${specialty}:`, e);
    return 0;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get admin user_id for ownership
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
    const userId = adminRole?.user_id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "No admin user found" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Count questions per specialty to find the 4 with fewest
    // Count questions per specialty using ilike to aggregate subtopics
    const countBySpecialty: Record<string, number> = {};
    for (const spec of SPECIALTIES) {
      const { count } = await supabaseAdmin
        .from("questions_bank")
        .select("id", { count: "exact", head: true })
        .eq("is_global", true)
        .ilike("topic", `${spec}%`);
      countBySpecialty[spec] = count || 0;
    }

    const sorted = [...SPECIALTIES].sort((a, b) => countBySpecialty[a] - countBySpecialty[b]);
    const selected = sorted.slice(0, 2);

    console.log(`Daily generation starting for: ${selected.join(", ")}`);

    const results: Record<string, number> = {};
    let totalGenerated = 0;

    for (const spec of selected) {
      // Fetch last 50 statements for anti-repetition
      const { data: existing } = await supabaseAdmin
        .from("questions_bank")
        .select("statement")
        .eq("topic", spec)
        .eq("is_global", true)
        .order("created_at", { ascending: false })
        .limit(50);

      const existingStatements = (existing || []).map((r: any) => r.statement);
      const topics = TOPICS_BY_SPECIALTY[spec] || [spec];

      const count = await generateForSpecialty(spec, topics, userId, supabaseAdmin, existingStatements);
      results[spec] = count;
      totalGenerated += count;
      console.log(`${spec}: ${count} questions generated`);
    }

    // Log the run
    await supabaseAdmin.from("daily_generation_log").insert({
      run_date: new Date().toISOString().split("T")[0],
      specialties_processed: results,
      questions_generated: totalGenerated,
      status: totalGenerated > 0 ? "success" : "failed",
    });

    return new Response(JSON.stringify({
      message: `Geração diária concluída: ${totalGenerated} questões`,
      results,
      total_generated: totalGenerated,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("daily-question-generator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
