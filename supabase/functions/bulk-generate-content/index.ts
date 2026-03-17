import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SPECIALTIES = [
  "Cardiologia", "Pneumologia", "Neurologia", "Endocrinologia",
  "Gastroenterologia", "Pediatria", "Ginecologia e Obstetrícia",
  "Cirurgia Geral", "Medicina Preventiva", "Nefrologia",
  "Infectologia", "Hematologia", "Reumatologia", "Dermatologia",
  "Ortopedia", "Urologia", "Psiquiatria", "Oftalmologia",
  "Otorrinolaringologia", "Emergência", "Semiologia", "Anatomia", "Farmacologia",
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
  "Semiologia": ["Anamnese", "Exame Físico Geral", "Semiologia Cardiovascular", "Semiologia Pulmonar", "Semiologia Abdominal", "Semiologia Neurológica", "Sinais Vitais", "Propedêutica Armada", "Semiologia Osteoarticular", "Semiologia Vascular", "Semiologia do Pescoço", "Sinais Semiológicos Clássicos"],
  "Anatomia": ["Anatomia do Tórax", "Anatomia Abdominal", "Anatomia do Pescoço", "Neuroanatomia", "Anatomia do Membro Superior", "Anatomia do Membro Inferior", "Anatomia Pélvica", "Anatomia Vascular", "Anatomia Cardíaca", "Anatomia do Sistema Nervoso Periférico", "Anatomia Topográfica Cirúrgica"],
  "Farmacologia": ["Farmacocinética (ADME)", "Farmacodinâmica e Receptores", "Antibioticoterapia e Mecanismos de Resistência", "Anti-hipertensivos e Vasodilatadores", "Antiarrítmicos", "Anticoagulantes e Antiplaquetários", "AINEs e Corticoides", "Analgésicos e Opioides", "Psicofarmacologia", "Quimioterápicos e Imunossupressores", "Farmacologia do SNA", "Interações Medicamentosas", "Anti-diabéticos Orais e Insulinoterapia", "Broncodilatadores e Anti-asmáticos"],
};

async function generateBatch(specialty: string, topics: string[], userId: string, supabaseAdmin: any): Promise<{ questions: number; flashcards: number }> {
  const selectedTopics = topics.sort(() => Math.random() - 0.5).slice(0, 5);
  
  const prompt = `Gere EXATAMENTE 25 questões de múltipla escolha e 15 flashcards para Residência Médica.

ESPECIALIDADE: ${specialty}
TEMAS: ${selectedTopics.join(", ")}

REGRAS PARA QUESTÕES:
- Nível de prova de residência médica (ENARE, USP, UNICAMP, FMUSP)
- Casos clínicos realistas com dados de anamnese, exame físico e exames complementares
- 4 alternativas (A, B, C, D) sendo apenas 1 correta
- Explicação detalhada com raciocínio clínico
- Varie a dificuldade: 40% fácil, 40% médio, 20% difícil
- Distribua entre os temas fornecidos

REGRAS PARA FLASHCARDS:
- Baseados em conceitos-chave dos mesmos temas
- Pergunta objetiva e resposta completa mas concisa
- Foco em: definições, diagnóstico diferencial, condutas, farmacologia

FORMATO JSON OBRIGATÓRIO:
{
  "questions": [
    {
      "statement": "Caso clínico completo...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
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
        { role: "system", content: "Você é um professor de medicina especialista em criar questões de residência médica. Responda APENAS com JSON válido, sem markdown." },
        { role: "user", content: prompt },
      ],
    });

    if (!response.ok) {
      console.error(`AI error for ${specialty}:`, await response.text());
      return { questions: 0, flashcards: 0 };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    
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

    // Insert questions
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
        source: "bulk-ai-generated",
        is_global: true,
      }));

      const { error } = await supabaseAdmin.from("questions_bank").insert(rows);
      if (!error) qCount = rows.length;
      else console.error("Q insert error:", error);
    }

    // Insert flashcards
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
      else console.error("F insert error:", error);
    }

    return { questions: qCount, flashcards: fCount };
  } catch (e) {
    console.error(`Error generating for ${specialty}:`, e);
    return { questions: 0, flashcards: 0 };
  }
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
    const batchCount = body.batches || 3; // how many specialties per call
    const targetQuestions = body.target || 5000;

    // Check current count
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

    // Pick specialties that need more questions
    const { data: topicCounts } = await supabaseAdmin
      .from("questions_bank")
      .select("topic")
      .eq("is_global", true);
    
    const countByTopic: Record<string, number> = {};
    (topicCounts || []).forEach((r: any) => {
      const t = r.topic || "Geral";
      countByTopic[t] = (countByTopic[t] || 0) + 1;
    });

    // Sort specialties by least questions first
    const sorted = SPECIALTIES.sort((a, b) => (countByTopic[a] || 0) - (countByTopic[b] || 0));
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
