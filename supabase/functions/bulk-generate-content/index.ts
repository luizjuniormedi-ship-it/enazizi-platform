import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch, sanitizeAiContent } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INVALID_CONTENT_REGEX = /(declara[cç][aã]o financeira|declara[cç][oõ]es de interesse|pagamento de qualquer esp[eé]cie|empresa farmac[eê]utica|ind[uú]stria farmac[eê]utica|honor[aá]rio|palestrante remunerado|conflito de interesse|relat[oó]rio de interesse)/i;

const BASIC_SCIENCES = [
  "Anatomia", "Bioquímica", "Embriologia", "Farmacologia", "Fisiologia",
  "Genética Médica", "Histologia", "Imunologia", "Microbiologia",
  "Parasitologia", "Patologia", "Semiologia",
];

const TARGET_CLINICAL = 250;
const TARGET_BASIC = 150;

const SPECIALTIES = [
  "Cardiologia", "Pneumologia", "Neurologia", "Endocrinologia",
  "Gastroenterologia", "Pediatria", "Ginecologia e Obstetrícia",
  "Cirurgia", "Medicina Preventiva", "Nefrologia",
  "Infectologia", "Hematologia", "Reumatologia", "Dermatologia",
  "Ortopedia", "Urologia", "Psiquiatria", "Oftalmologia",
  "Otorrinolaringologia", "Medicina de Emergência", "Semiologia", "Anatomia", "Farmacologia",
  "Oncologia", "Fisiologia", "Bioquímica", "Angiologia",
  "Histologia", "Embriologia", "Microbiologia", "Imunologia",
  "Parasitologia", "Genética Médica", "Patologia",
  "Terapia Intensiva",
];

const TOPICS_BY_SPECIALTY: Record<string, string[]> = {
  "Cardiologia": ["Insuficiência Cardíaca", "IAM", "Arritmias", "Valvopatias", "Hipertensão Arterial", "Endocardite", "Pericardite", "Cardiopatias Congênitas", "Doença Coronariana", "Choque Cardiogênico", "Fibrilação Atrial", "Síndrome Coronariana Aguda", "Dissecção de Aorta", "Tromboembolismo Pulmonar", "Miocardiopatias"],
  "Pneumologia": ["Pneumonia", "DPOC", "Asma", "TEP", "Tuberculose", "Derrame Pleural", "Pneumotórax", "Fibrose Pulmonar", "SDRA", "Câncer de Pulmão", "Bronquiectasia", "Sarcoidose", "Apneia do Sono", "Insuficiência Respiratória"],
  "Neurologia": ["AVC Isquêmico", "AVC Hemorrágico", "Epilepsia", "Meningite", "Esclerose Múltipla", "Parkinson", "Alzheimer", "Cefaleia", "Neuropatias", "Tumores Cerebrais", "Miastenia Gravis", "Guillain-Barré", "Hipertensão Intracraniana", "Trauma Cranioencefálico"],
  "Endocrinologia": ["Diabetes Mellitus Tipo 1", "Diabetes Mellitus Tipo 2", "Hipotireoidismo", "Hipertireoidismo", "Síndrome de Cushing", "Insuficiência Adrenal", "Feocromocitoma", "Hiperparatireoidismo", "Osteoporose", "Cetoacidose Diabética", "Estado Hiperosmolar", "Tireoidite de Hashimoto", "Doença de Graves", "Nódulos Tireoidianos"],
  "Gastroenterologia": ["Doença do Refluxo", "Úlcera Péptica", "Doença de Crohn", "Retocolite Ulcerativa", "Cirrose Hepática", "Hepatites Virais", "Pancreatite Aguda", "Pancreatite Crônica", "Colelitíase", "Colecistite", "Hemorragia Digestiva", "Doença Celíaca", "Síndrome do Intestino Irritável", "Câncer Colorretal"],
  "Pediatria": ["Bronquiolite", "Desidratação", "IVAS", "Otite Média", "Imunização", "Crescimento e Desenvolvimento", "Alergia Alimentar", "Febre Reumática", "Meningite Neonatal", "Icterícia Neonatal", "Distúrbios do Crescimento", "Asma Infantil", "Pneumonia Infantil", "Convulsão Febril"],
  "Ginecologia e Obstetrícia": ["Pré-eclâmpsia", "Eclâmpsia", "Diabetes Gestacional", "Placenta Prévia", "DPP", "Gravidez Ectópica", "Endometriose", "SOP", "Mioma Uterino", "Câncer de Colo do Útero", "Câncer de Mama", "Infecções Vaginais", "Parto Normal vs Cesárea", "Hemorragia Pós-Parto"],
  "Cirurgia": ["Apendicite", "Colecistite Aguda", "Obstrução Intestinal", "Hérnia Inguinal", "Abdome Agudo", "Trauma Abdominal", "Pancreatite Cirúrgica", "Diverticulite", "Câncer Gástrico", "Politraumatismo", "Queimaduras", "Choque Hipovolêmico", "Feridas Cirúrgicas", "Complicações Pós-Operatórias"],
  "Medicina Preventiva": ["Epidemiologia", "Vigilância em Saúde", "SUS", "Atenção Primária", "Rastreamento", "Saúde da Família", "Indicadores de Saúde", "Bioestatística", "Estudos Epidemiológicos", "Vacinação do Adulto", "Promoção da Saúde", "Saneamento Básico", "Doenças de Notificação Compulsória"],
  "Nefrologia": ["Insuficiência Renal Aguda", "Doença Renal Crônica", "Glomerulonefrites", "Síndrome Nefrótica", "Síndrome Nefrítica", "Distúrbios Hidroeletrolíticos", "Acidose e Alcalose", "Litíase Renal", "Infecção Urinária", "Transplante Renal", "Diálise", "Nefropatia Diabética"],
  "Infectologia": ["HIV/AIDS", "Dengue", "Malária", "Leishmaniose", "Tuberculose", "Hanseníase", "Hepatites Virais", "COVID-19", "Sepse", "Infecções Hospitalares", "Antibioticoterapia", "Febre Amarela", "Parasitoses Intestinais"],
  "Hematologia": ["Anemias", "Leucemias", "Linfomas", "Mieloma Múltiplo", "Coagulopatias", "Trombocitopenia", "Hemofilia", "CIVD", "Policitemia Vera", "Púrpura Trombocitopênica", "Anemia Falciforme", "Talassemias", "Hemotransfusão"],
  "Reumatologia": ["Artrite Reumatoide", "Lúpus Eritematoso", "Espondilite Anquilosante", "Gota", "Esclerodermia", "Síndrome de Sjögren", "Vasculites", "Fibromialgia", "Artrite Psoriásica", "Polimiosite", "Febre Reumática"],
  "Dermatologia": ["Psoríase", "Dermatite Atópica", "Urticária", "Melanoma", "Carcinoma Basocelular", "Hanseníase", "Micoses Superficiais", "Herpes Zoster", "Acne", "Pênfigo", "Lúpus Cutâneo"],
  "Ortopedia": ["Fraturas", "Luxações", "Osteomielite", "Artrose", "Lombalgia", "Hérnia de Disco", "Síndrome do Túnel do Carpo", "Lesões de Menisco", "Tendinites", "Osteoporose Ortopédica"],
  "Urologia": ["Hiperplasia Prostática", "Câncer de Próstata", "Litíase Urinária", "Infecção Urinária", "Câncer de Bexiga", "Torção Testicular", "Varicocele", "Fimose", "Incontinência Urinária"],
  "Psiquiatria": ["Depressão", "Transtorno Bipolar", "Esquizofrenia", "Transtorno de Ansiedade", "TOC", "TEPT", "Transtornos Alimentares", "Dependência Química", "Demência", "Psicofarmacologia"],
  "Medicina de Emergência": ["PCR e RCP", "Choque", "Intoxicações", "Anafilaxia", "Politrauma", "ATLS", "Queimaduras", "Afogamento", "Cetoacidose Diabética", "Crise Hipertensiva"],
  "Oftalmologia": ["Glaucoma", "Catarata", "Descolamento de Retina", "Retinopatia Diabética", "Conjuntivite", "Uveíte", "Trauma Ocular"],
  "Otorrinolaringologia": ["Otite", "Sinusite", "Amigdalite", "Perda Auditiva", "Vertigem", "Epistaxe", "Câncer de Laringe"],
  "Semiologia": ["Anamnese", "Exame Físico Geral", "Semiologia Cardiovascular", "Semiologia Pulmonar", "Semiologia Abdominal", "Semiologia Neurológica", "Sinais Vitais", "Propedêutica Armada", "Semiologia Osteoarticular", "Semiologia Vascular", "Semiologia do Pescoço", "Sinais Semiológicos Clássicos"],
  "Anatomia": ["Anatomia do Tórax", "Anatomia Abdominal", "Anatomia do Pescoço", "Neuroanatomia", "Anatomia do Membro Superior", "Anatomia do Membro Inferior", "Anatomia Pélvica", "Anatomia Vascular", "Anatomia Cardíaca", "Anatomia do Sistema Nervoso Periférico", "Anatomia Topográfica Cirúrgica"],
  "Farmacologia": ["Farmacocinética (ADME)", "Farmacodinâmica e Receptores", "Antibioticoterapia e Mecanismos de Resistência", "Anti-hipertensivos e Vasodilatadores", "Antiarrítmicos", "Anticoagulantes e Antiplaquetários", "AINEs e Corticoides", "Analgésicos e Opioides", "Psicofarmacologia", "Quimioterápicos e Imunossupressores", "Farmacologia do SNA", "Interações Medicamentosas", "Anti-diabéticos Orais e Insulinoterapia", "Broncodilatadores e Anti-asmáticos"],
  "Oncologia": ["Câncer de Mama", "Câncer de Pulmão", "Câncer Colorretal", "Câncer de Próstata", "Câncer Gástrico", "Câncer de Colo Uterino", "Câncer de Pâncreas", "Melanoma", "Câncer de Tireoide", "Estadiamento TNM", "Síndromes Paraneoplásicas", "Marcadores Tumorais", "Quimioterapia e Toxicidade", "Imunoterapia e Terapia-Alvo", "Radioterapia", "Cuidados Paliativos", "Emergências Oncológicas", "Rastreamento Oncológico", "Tumores do SNC", "Câncer de Bexiga e Rim"],
  "Angiologia": ["Doença Arterial Periférica", "Aneurisma de Aorta", "Trombose Venosa Profunda", "Insuficiência Venosa Crônica", "Varizes", "Isquemia Crítica de Membro", "Pé Diabético Vascular", "Linfedema", "Claudicação Intermitente", "Endarterectomia de Carótida", "Dissecção de Aorta", "Síndrome Compartimental"],
  "Fisiologia": ["Fisiologia Cardiovascular", "Fisiologia Respiratória", "Fisiologia Renal", "Fisiologia Endócrina", "Fisiologia do Sistema Nervoso", "Fisiologia Gastrointestinal", "Fisiologia Muscular", "Equilíbrio Ácido-Base", "Fisiologia da Hemostasia", "Fisiologia da Reprodução"],
  "Bioquímica": ["Metabolismo de Carboidratos", "Metabolismo de Lipídios", "Metabolismo de Proteínas", "Bioquímica do Ciclo de Krebs", "Fosforilação Oxidativa", "Vitaminas e Coenzimas", "Bioquímica Hormonal", "Erros Inatos do Metabolismo", "Bioquímica do Fígado", "Bioquímica Renal"],
  "Histologia": ["Tecido Epitelial", "Tecido Conjuntivo", "Tecido Muscular", "Tecido Nervoso", "Histologia do Sistema Cardiovascular", "Histologia do Sistema Respiratório", "Histologia do TGI", "Histologia Renal", "Histologia do Sistema Endócrino", "Histologia da Pele"],
  "Embriologia": ["Embriologia do Coração", "Embriologia do Sistema Nervoso", "Embriologia do TGI", "Embriologia do Sistema Urogenital", "Embriologia do Sistema Respiratório", "Anomalias Congênitas", "Embriologia da Face e Pescoço", "Placenta e Membranas", "Teratogênese"],
  "Microbiologia": ["Bacteriologia Geral", "Virologia", "Micologia Médica", "Parasitologia Médica", "Mecanismos de Resistência Bacteriana", "Microbiota Humana", "Diagnóstico Microbiológico", "Esterilização e Desinfecção", "Infecções Hospitalares", "Bactérias Gram-positivas e Gram-negativas"],
  "Imunologia": ["Imunidade Inata", "Imunidade Adaptativa", "Hipersensibilidades", "Autoimunidade", "Imunodeficiências", "Imunologia dos Transplantes", "Vacinologia", "Citocinas e Quimiocinas", "Sistema Complemento", "Imunologia Tumoral"],
  "Parasitologia": ["Malária", "Doença de Chagas", "Leishmaniose Visceral", "Leishmaniose Tegumentar", "Esquistossomose", "Ascaridíase", "Ancilostomíase", "Teníase e Cisticercose", "Toxoplasmose", "Giardíase e Amebíase"],
  "Genética Médica": ["Herança Mendeliana", "Herança Ligada ao X", "Doenças Cromossômicas", "Síndrome de Down", "Genética do Câncer", "Aconselhamento Genético", "Erros Inatos do Metabolismo", "Farmacogenômica", "Epigenética", "Diagnóstico Pré-natal"],
  "Patologia": ["Inflamação Aguda e Crônica", "Neoplasias", "Distúrbios Hemodinâmicos", "Lesão e Morte Celular", "Adaptações Celulares", "Reparo Tecidual", "Patologia Vascular", "Imunopatologia", "Patologia do Sistema Nervoso", "Patologia Hepática"],
  "Terapia Intensiva": ["Ventilação Mecânica", "Sepse e Choque Séptico", "Monitorização Hemodinâmica", "Distúrbios Hidroeletrolíticos em UTI", "Sedação e Analgesia", "Nutrição em Terapia Intensiva", "SDRA", "Insuficiência Renal Aguda em UTI", "Neurointensivismo", "Cuidados Pós-PCR"],
};

function getTarget(specialty: string): number {
  return BASIC_SCIENCES.includes(specialty) ? TARGET_BASIC : TARGET_CLINICAL;
}

async function generateBatch(specialty: string, topics: string[], userId: string, supabaseAdmin: any, questionCount = 25): Promise<{ questions: number; flashcards: number }> {
  const selectedTopics = topics.sort(() => Math.random() - 0.5).slice(0, 5);
  const fcCount = Math.max(5, Math.round(questionCount * 0.6));
  
  const prompt = `Gere EXATAMENTE ${questionCount} questões de múltipla escolha e ${fcCount} flashcards para Residência Médica.

ESPECIALIDADE: ${specialty}
TEMAS: ${selectedTopics.join(", ")}

REGRAS PARA QUESTÕES:
- Nível de prova de residência médica (ENARE, USP, UNICAMP, FMUSP)
- Casos clínicos realistas com dados de anamnese, exame físico e exames complementares
- EXATAMENTE 5 alternativas (A, B, C, D, E) sendo apenas 1 correta
- Explicação detalhada com raciocínio clínico
- Varie a dificuldade: 40% fácil, 40% médio, 20% difícil
- Distribua entre os temas fornecidos

ANAMNESE ÚNICA POR QUESTÃO (REGRA ABSOLUTA):
- NUNCA repita nome, idade, sexo ou perfil de paciente entre questões
- Cada questão DEVE ter um paciente COMPLETAMENTE DIFERENTE
- Variar: nomes regionais brasileiros, idades de 0 a 95 anos, profissões diversas
- Alternar cenários: PS, enfermaria, UTI, UBS, SAMU, ambulatório, domicílio
- Variar comorbidades de base: DM, HAS, IRC, HIV, tabagismo, etilismo, gestante
- Variar queixa principal e tempo de evolução (horas, dias, semanas, meses)
- Incluir pacientes: idosos frágeis, gestantes, crianças, imunossuprimidos, trabalhadores rurais
- PROIBIDO: dois pacientes com mesmo perfil demográfico no mesmo bloco

REGRA DE REPETIÇÃO ESPAÇADA (PRIORIDADE MÁXIMA):
- PODE repetir o mesmo tema/doença, desde que haja pelo menos 2 itens de INTERVALO entre eles
- Quando repetir, OBRIGATORIAMENTE use ENFOQUE DIFERENTE (ex: Q2=diagnóstico, Q5=tratamento, Q8=complicações)
- NUNCA coloque dois itens do MESMO TEMA em posições CONSECUTIVAS
- Distribua subtópicos: diagnóstico, tratamento, fisiopatologia, epidemiologia, complicações, prognóstico, prevenção
- VERIFICAÇÃO PRÉ-ENVIO:
  1. Algum tema aparece em posições CONSECUTIVAS? → Intercale com outro tema
  2. Algum perfil de paciente se repete? → Diversifique obrigatoriamente
  3. Os itens cobrem pelo menos 5 subtópicos DIFERENTES do tema? → Se não, redistribua

REGRAS PARA FLASHCARDS:
- Baseados em conceitos-chave dos mesmos temas
- Pergunta objetiva e resposta completa mas concisa
- Foco em: definições, diagnóstico diferencial, condutas, farmacologia

FORMATO JSON OBRIGATÓRIO:
{
  "questions": [
    {
      "statement": "Caso clínico completo...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
      "correct_index": 0,
      "explanation": "Explicação detalhada...",
      "topic": "${specialty}",
      "difficulty": 3
    }
  ],
  "flashcards": [
    {
      "question": "Pergunta do flashcard?",
      "answer": "Resposta completa...",
      "topic": "${specialty}"
    }
  ]
}`;

  try {
    const response = await aiFetch({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Você é um professor de medicina especialista em criar questões de residência médica. Responda APENAS com JSON válido, sem markdown.\n\nIDIOMA OBRIGATÓRIO: TUDO em PORTUGUÊS BRASILEIRO (pt-BR). NUNCA gere questões, alternativas, explicações ou flashcards em inglês. Inglês permitido APENAS em nomes de artigos/guidelines.\n\n⛔ CONTEÚDO PROIBIDO: NUNCA gere questões ou flashcards sobre declarações financeiras, conflitos de interesse, relações com empresas/indústrias farmacêuticas, honorários, pagamentos de palestrantes, vínculos empregatícios com laboratórios. Foque EXCLUSIVAMENTE em conteúdo clínico-científico para estudo médico." },
        { role: "user", content: prompt },
      ],
    });

    if (!response.ok) {
      console.error(`AI error for ${specialty}:`, await response.text());
      return { questions: 0, flashcards: 0 };
    }

    const data = await response.json();
    const rawContent = sanitizeAiContent(data.choices?.[0]?.message?.content || "");
    const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    
    let parsed: any = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*"questions"[\s\S]*"flashcards"[\s\S]*\}/);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]); } catch { console.error("JSON parse failed for", specialty); return { questions: 0, flashcards: 0 }; }
      }
    }

    if (!parsed) return { questions: 0, flashcards: 0 };

    const IMAGE_REF_PATTERN = /\b(imagem abaixo|figura abaixo|observe a imagem|na imagem|na figura|texto abaixo|radiografia abaixo|fotografia|ECG abaixo|tomografia abaixo|observe o gráfico|observe a figura|observe a foto|imagem a seguir|figura a seguir)\b/i;
    const ENGLISH_PATTERN = /\b(the patient|which of the following|a \d+-year-old|presents with|physical examination|most likely|treatment of choice|year-old male|year-old female)\b/i;
    const questions = (parsed.questions || []).filter((q: any) =>
      q.statement && Array.isArray(q.options) && q.options.length >= 4 && q.options.length <= 5 && typeof q.correct_index === "number" &&
      !INVALID_CONTENT_REGEX.test(q.statement) && !INVALID_CONTENT_REGEX.test(q.explanation || "") &&
      !ENGLISH_PATTERN.test(q.statement) && !IMAGE_REF_PATTERN.test(q.statement)
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
        source: "bulk-ai-generated",
        is_global: true,
        review_status: "pending",
      }));

      const { error } = await supabaseAdmin.from("questions_bank").insert(rows);
      if (!error) qCount = rows.length;
      else console.error("Q insert error:", error);
    }

    const flashcards = (parsed.flashcards || []).filter((f: any) => f.question && f.answer && !INVALID_CONTENT_REGEX.test(f.question) && !INVALID_CONTENT_REGEX.test(f.answer));
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
      else console.error("F insert error:", error);
    }

    return { questions: qCount, flashcards: fCount };
  } catch (e) {
    console.error(`Error generating for ${specialty}:`, e);
    return { questions: 0, flashcards: 0 };
  }
}

async function importRealExamQuestions(specialty: string, supabaseAdmin: any, userId: string, limit: number): Promise<number> {
  // Find real_exam_questions for this topic not yet in questions_bank
  const { data: realQs } = await supabaseAdmin
    .from("real_exam_questions")
    .select("*")
    .eq("topic", specialty)
    .eq("is_active", true)
    .limit(limit);

  if (!realQs || realQs.length === 0) return 0;

  // Get existing statement hashes to avoid duplicates
  const { data: existing } = await supabaseAdmin
    .from("questions_bank")
    .select("statement")
    .eq("topic", specialty)
    .eq("is_global", true)
    .limit(1000);

  const existingSet = new Set((existing || []).map((e: any) => 
    String(e.statement || "").trim().substring(0, 80).toLowerCase()
  ));

  const toInsert = realQs.filter((q: any) => {
    const key = String(q.statement || "").trim().substring(0, 80).toLowerCase();
    return !existingSet.has(key);
  }).slice(0, limit);

  if (toInsert.length === 0) return 0;

  const rows = toInsert.map((q: any) => ({
    user_id: userId,
    statement: q.statement,
    options: q.options,
    correct_index: q.correct_index,
    explanation: q.explanation || "",
    topic: specialty,
    subtopic: q.subtopic || null,
    difficulty: q.difficulty || 4,
    source: "real_exam_import",
    source_url: q.source_url,
    is_global: true,
    review_status: "pending",
  }));

  const { error } = await supabaseAdmin.from("questions_bank").insert(rows);
  if (error) {
    console.error("Real exam import error:", error);
    return 0;
  }
  return rows.length;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    let userId: string;
    
    if (token === serviceRoleKey) {
      const { data: adminRole } = await supabaseAdmin
        .from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
      userId = adminRole?.user_id || "92736dea-6422-48ff-8330-de9f0d1094e9";
    } else {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      
      const { data: roleData } = await supabaseAdmin
        .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!roleData) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: corsHeaders });
      userId = user.id;
    }

    const body = await req.json().catch(() => ({}));

    // ===== EQUALIZE MODE =====
    if (body.equalize) {
      // Get counts per topic
      const { data: topicCounts } = await supabaseAdmin
        .from("questions_bank")
        .select("topic")
        .eq("is_global", true);

      const countByTopic: Record<string, number> = {};
      (topicCounts || []).forEach((r: any) => {
        const t = r.topic || "Geral";
        countByTopic[t] = (countByTopic[t] || 0) + 1;
      });

      // Calculate deficits
      const deficits: { specialty: string; current: number; target: number; deficit: number }[] = [];
      for (const spec of SPECIALTIES) {
        const current = countByTopic[spec] || 0;
        const target = getTarget(spec);
        const deficit = target - current;
        if (deficit > 0) {
          deficits.push({ specialty: spec, current, target, deficit });
        }
      }

      // Sort by largest deficit first
      deficits.sort((a, b) => b.deficit - a.deficit);
      const toProcess = deficits.slice(0, 5);

      if (toProcess.length === 0) {
        return new Response(JSON.stringify({
          message: "Todas as especialidades já atingiram o alvo!",
          deficits: [],
          total_deficit: 0,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let totalQ = 0, totalF = 0, totalImported = 0;
      const results: any[] = [];

      for (const item of toProcess) {
        // 1. Try importing real exam questions first
        const importLimit = Math.min(item.deficit, 50);
        const imported = await importRealExamQuestions(item.specialty, supabaseAdmin, userId, importLimit);
        totalImported += imported;
        
        const remainingDeficit = item.deficit - imported;
        
        // 2. Generate via AI only if still deficit
        let genQ = 0, genF = 0;
        if (remainingDeficit > 0) {
          const topics = TOPICS_BY_SPECIALTY[item.specialty] || [item.specialty];
          const batchSize = Math.min(25, remainingDeficit);
          const result = await generateBatch(item.specialty, topics, userId, supabaseAdmin, batchSize);
          genQ = result.questions;
          genF = result.flashcards;
          totalQ += genQ;
          totalF += genF;
        }

        results.push({
          specialty: item.specialty,
          previous: item.current,
          target: item.target,
          deficit: item.deficit,
          imported,
          generated: genQ,
          flashcards: genF,
        });

        console.log(`Equalize ${item.specialty}: imported=${imported}, generated=${genQ}, deficit_was=${item.deficit}`);
      }

      // Recalculate remaining deficits
      const remainingDeficits = deficits
        .filter(d => !toProcess.find(p => p.specialty === d.specialty))
        .map(d => ({ specialty: d.specialty, deficit: d.deficit }));

      return new Response(JSON.stringify({
        message: `Equalização: ${totalImported} importadas, ${totalQ} geradas por IA, ${totalF} flashcards`,
        results,
        remaining_deficits: remainingDeficits,
        total_imported: totalImported,
        total_generated: totalQ,
        total_flashcards: totalF,
        batches_remaining: remainingDeficits.length,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ===== NORMAL MODE =====
    const batchCount = body.batches || 3;
    const targetQuestions = body.target || 5000;

    const { count: currentCount } = await supabaseAdmin
      .from("questions_bank").select("*", { count: "exact", head: true }).eq("is_global", true);
    
    const remaining = targetQuestions - (currentCount || 0);
    if (remaining <= 0) {
      return new Response(JSON.stringify({ 
        message: `Já atingimos ${currentCount} questões globais!`,
        current_questions: currentCount,
        target: targetQuestions,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: topicCounts } = await supabaseAdmin
      .from("questions_bank")
      .select("topic")
      .eq("is_global", true);
    
    const countByTopic: Record<string, number> = {};
    (topicCounts || []).forEach((r: any) => {
      const t = r.topic || "Geral";
      countByTopic[t] = (countByTopic[t] || 0) + 1;
    });

    const sorted = [...SPECIALTIES].sort((a, b) => (countByTopic[a] || 0) - (countByTopic[b] || 0));
    const selected = sorted.slice(0, batchCount);

    let totalQ = 0, totalF = 0;
    for (const spec of selected) {
      const topics = TOPICS_BY_SPECIALTY[spec] || [spec];
      console.log(`Generating for ${spec}...`);
      const result = await generateBatch(spec, topics, userId, supabaseAdmin);
      totalQ += result.questions;
      totalF += result.flashcards;
      console.log(`${spec}: ${result.questions}Q, ${result.flashcards}F`);
    }

    const { count: newCount } = await supabaseAdmin
      .from("questions_bank").select("*", { count: "exact", head: true }).eq("is_global", true);
    const { count: flashcardCount } = await supabaseAdmin
      .from("flashcards").select("*", { count: "exact", head: true }).eq("is_global", true);

    return new Response(JSON.stringify({
      message: `Geradas ${totalQ} questões e ${totalF} flashcards`,
      questions_added: totalQ,
      flashcards_added: totalF,
      total_questions: newCount,
      total_flashcards: flashcardCount,
      specialties_processed: selected,
      target: targetQuestions,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("bulk-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
