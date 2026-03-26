import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch, sanitizeAiContent } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRUSTED_DOMAINS = [
  // Governo / INEP
  "inep.gov.br", "gov.br", "saude.sp.gov.br", "saude.gov.br",
  // Universidades
  "usp.br", "unicamp.br", "unifesp.br", "fmusp.br", "fcm.unicamp.br",
  "ufpr.br", "ufrj.br", "ufmg.br", "ufrgs.br", "ufba.br", "ufpe.br",
  "ufsc.br", "unesp.br", "pucrs.br", "pucsp.br", "uel.br", "uem.br",
  // Bancas / organizadoras
  "fgv.br", "vunesp.com.br", "cesgranrio.org.br", "ibfc.org.br",
  "amrigs.org.br", "santacasasp.org.br", "upenet.com.br",
  // Portais de provas e questões
  "qconcursos.com.br", "pciconcursos.com.br", "questoesmedicas.com.br",
  "residenciamedicasp.com.br", "residenciamedica.com.br",
  // Educação médica
  "medway.com.br", "medcel.com.br", "estrategiamed.com.br",
  "medgrupo.com.br", "sanarmed.com", "editorasanar.com.br",
  "jaleko.com.br", "afya.com.br",
];

const CLINICAL_CONTENT_MARKERS = [
  /\b\d{1,3}\s*(anos?|meses?|dias?)\b/i,
  /\b(masculino|feminino|homem|mulher|paciente|gestante|idoso|criança|lactente)\b/i,
  /\b(PA|FC|FR|SpO2|temperatura|pressão arterial|frequência cardíaca)\b/i,
  /\b(exame físico|ao exame|ausculta|palpação|inspeção|percussão)\b/i,
  /\b(hemograma|glicemia|creatinina|ureia|PCR|VHS|TSH|ECG|tomografia|radiografia)\b/i,
  /\b(queixa|refere|relata|apresenta|evolui|procura|admitido|internado)\b/i,
];

function hasClinicalContent(text: string): boolean {
  let matches = 0;
  for (const marker of CLINICAL_CONTENT_MARKERS) {
    if (marker.test(text)) matches++;
    if (matches >= 2) return true;
  }
  return false;
}

function isDuplicate(statement: string, existingStatements: string[]): boolean {
  const prefix = statement.slice(0, 80).toLowerCase();
  return existingStatements.some(ex => ex.slice(0, 80).toLowerCase() === prefix);
}

function isTrustedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return TRUSTED_DOMAINS.some(d => hostname === d || hostname.endsWith("." + d));
  } catch {
    return false;
  }
}

async function searchAndScrape(
  specialty: string,
  banca: string | null,
  ano: number | null,
): Promise<{ url: string; markdown: string }[]> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

  // Build search queries - try multiple if needed
  const queries = banca
    ? [`"${banca}" ${specialty} questões alternativas gabarito`]
    : [
        `site:medway.com.br ${specialty} questões comentadas residência`,
        `"questão" "${specialty}" prova residência médica alternativas gabarito`,
        `site:sanarmed.com ${specialty} questões comentadas prova`,
      ];

  const allResults: { url: string; markdown: string }[] = [];
  const seenUrls = new Set<string>();
  // Skip scribd (paywall), youtube
  const blockedDomains = ["scribd.com", "youtube.com", "youtu.be"];

  for (const query of queries) {
    if (allResults.length >= 2) break;

    console.log("Firecrawl search query:", query);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          limit: 3,
          lang: "pt-br",
          country: "BR",
          scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!searchResp.ok) {
        console.error("Firecrawl search error:", searchResp.status, await searchResp.text());
        continue;
      }

      const searchData = await searchResp.json();

      for (const item of (searchData.data || [])) {
        const url = item.url || "";
        if (!url || seenUrls.has(url)) continue;
        seenUrls.add(url);

        if (blockedDomains.some(d => url.includes(d))) {
          console.log(`Skipping blocked domain: ${url}`);
          continue;
        }

        const markdown = item.markdown || "";
        if (markdown.length < 500) {
          console.log(`Skipping thin content (${markdown.length} chars) from: ${url}`);
          continue;
        }

        const hasAlternatives = /[A-E]\)\s/.test(markdown) || /alternativa/i.test(markdown) || /gabarito/i.test(markdown);
        if (!hasAlternatives) {
          console.log(`Skipping non-question content from: ${url}`);
          continue;
        }

        console.log(`✓ Found question content (${markdown.length} chars) from: ${url}`);
        // For large pages, skip header/menu and take the meatiest section
        let content = markdown;
        if (content.length > 15000) {
          content = content.slice(500, 12500);
        } else {
          content = content.slice(0, 12000);
        }
        allResults.push({ url, markdown: content });

        if (allResults.length >= 2) break;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        console.warn(`Firecrawl search timed out for query: ${query.slice(0, 50)}`);
      } else {
        console.warn("Search query failed:", e);
      }
    }
  }

  console.log(`Found ${allResults.length} results with question content`);
  return allResults;
}

async function structureQuestions(
  scrapedContent: { url: string; markdown: string }[],
  specialty: string,
  existingStatements: string[],
  supabaseAdmin: any,
  userId: string,
): Promise<{ inserted: number; sources: string[] }> {
  if (scrapedContent.length === 0) return { inserted: 0, sources: [] };

  // Combine scraped content, limit total to 20000 chars
  let contentBlock = scrapedContent
    .map((s, i) => `--- FONTE ${i + 1}: ${s.url} ---\n${s.markdown}`)
    .join("\n\n");
  contentBlock = contentBlock.slice(0, 20000);

  const prompt = `Você é um especialista em extrair questões de provas de residência médica a partir de conteúdo web.

CONTEÚDO EXTRAÍDO DA WEB (fontes reais de provas):
${contentBlock}

TAREFA: Extraia TODAS as questões de múltipla escolha encontradas no conteúdo acima que sejam de ${specialty} ou áreas correlatas.

REGRAS:
1. Extraia APENAS questões que realmente existem no texto — NÃO invente questões
2. Preserve o enunciado original o mais fielmente possível
3. Preserve as alternativas originais
4. Identifique a alternativa correta (se o gabarito estiver disponível)
5. Se não houver gabarito, tente identificar a resposta correta pelo contexto
6. Indique a fonte URL de onde a questão foi extraída
7. Mínimo 200 caracteres no enunciado para ser considerada válida
8. Ignore questões sobre declarações financeiras ou conflitos de interesse

FORMATO JSON OBRIGATÓRIO:
{
  "questions": [
    {
      "statement": "Enunciado original completo da questão...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_index": 0,
      "explanation": "Explicação do gabarito se disponível...",
      "topic": "${specialty}",
      "difficulty": 4,
      "source_url": "URL de onde foi extraída",
      "exam_info": "Nome da prova e ano se identificável"
    }
  ]
}

Se não encontrar questões válidas de ${specialty}, retorne: {"questions": []}`;

  try {
    const response = await aiFetch({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Você extrai questões de provas de residência médica a partir de conteúdo web. Responda APENAS com JSON válido." },
        { role: "user", content: prompt },
      ],
      timeoutMs: 45000,
      maxRetries: 1,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI structuring error:", errText);
      return { inserted: 0, sources: [] };
    }

    const data = await response.json();
    const rawContent = sanitizeAiContent(data.choices?.[0]?.message?.content || "");
    const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```/g, "").trim();

    console.log("AI raw response length:", rawContent.length, "cleaned length:", cleaned.length);

    let parsed: any = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*"questions"[\s\S]*\}/);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]); } catch {
          console.error("Failed to parse AI JSON response, first 500 chars:", cleaned.slice(0, 500));
          return { inserted: 0, sources: [] };
        }
      } else {
        console.error("No JSON found in AI response, first 500 chars:", cleaned.slice(0, 500));
        return { inserted: 0, sources: [] };
      }
    }

    if (!parsed?.questions || !Array.isArray(parsed.questions)) {
      console.error("No questions array in parsed response");
      return { inserted: 0, sources: [] };
    }

    console.log(`AI returned ${parsed.questions.length} raw questions`);

    // Normalize and filter valid questions
    const validQuestions = parsed.questions.filter((q: any) => {
      if (!q.statement) { console.log("Rejected: no statement"); return false; }
      if (!Array.isArray(q.options) || q.options.length < 2) { console.log("Rejected: bad options"); return false; }
      // Accept correct_index as number or string, default to 0
      if (q.correct_index === undefined || q.correct_index === null) {
        if (q.correct_answer !== undefined) {
          // Try to map letter answer to index
          const letterMap: Record<string, number> = { "A": 0, "B": 1, "C": 2, "D": 3, "E": 4 };
          q.correct_index = letterMap[String(q.correct_answer).toUpperCase().trim()] ?? 0;
        } else {
          q.correct_index = 0;
        }
        console.log(`Fixed missing correct_index, set to ${q.correct_index}`);
      }
      q.correct_index = Number(q.correct_index);
      if (isNaN(q.correct_index)) q.correct_index = 0;
      const len = String(q.statement).trim().length;
      if (len < 150) { console.log(`Rejected: too short (${len} chars)`); return false; }
      if (isDuplicate(q.statement, existingStatements)) { console.log("Rejected: duplicate"); return false; }
      return true;
    });

    console.log(`${validQuestions.length} questions passed validation`);

    if (validQuestions.length === 0) return { inserted: 0, sources: [] };

    const sources = new Set<string>();
    const rows = validQuestions.map((q: any) => {
      const sourceUrl = String(q.source_url || "").trim();
      if (sourceUrl) sources.add(sourceUrl);
      const examInfo = String(q.exam_info || "").trim();

      return {
        user_id: userId,
        statement: String(q.statement).trim(),
        options: q.options.map(String),
        correct_index: q.correct_index,
        explanation: `[Fonte: ${sourceUrl || "web-scrape"}${examInfo ? ` | ${examInfo}` : ""}]\n\n${String(q.explanation || "").trim()}`,
        topic: specialty,
        difficulty: Math.max(3, q.difficulty || 3),
        source: "web-scrape",
        is_global: true,
        review_status: "approved",
      };
    });

    const { error } = await supabaseAdmin.from("questions_bank").insert(rows);
    if (error) {
      console.error("Insert web-scrape questions error:", error);
      return { inserted: 0, sources: [] };
    }

    rows.forEach((r: any) => existingStatements.push(r.statement));

    return { inserted: rows.length, sources: [...sources] };
  } catch (e) {
    console.error("Error structuring scraped questions:", e);
    return { inserted: 0, sources: [] };
  }
}

const SPECIALTIES_POOL = [
  "Cardiologia", "Pneumologia", "Neurologia", "Endocrinologia",
  "Gastroenterologia", "Pediatria", "Ginecologia e Obstetrícia",
  "Cirurgia Geral", "Medicina Preventiva", "Nefrologia",
  "Infectologia", "Hematologia", "Reumatologia", "Dermatologia",
];

async function pickSpecialtyWithFewest(supabaseAdmin: any): Promise<string> {
  // Pick the specialty with fewest global web-scrape questions
  const counts: { specialty: string; count: number }[] = [];
  for (const sp of SPECIALTIES_POOL) {
    const { count } = await supabaseAdmin
      .from("questions_bank")
      .select("id", { count: "exact", head: true })
      .eq("topic", sp)
      .eq("is_global", true)
      .eq("source", "web-scrape");
    counts.push({ specialty: sp, count: count || 0 });
  }
  counts.sort((a, b) => a.count - b.count);
  // Pick randomly from the 3 lowest to add variety
  const bottom = counts.slice(0, 3);
  return bottom[Math.floor(Math.random() * bottom.length)].specialty;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Parse request
    const body = await req.json().catch(() => ({}));
    const autoMode = body.auto === true;
    const banca = body.banca || null;
    const ano = body.ano || null;

    // In auto mode, pick the specialty with fewest web-scrape questions
    const specialty = autoMode
      ? await pickSpecialtyWithFewest(supabaseAdmin)
      : (body.specialty || "Cardiologia");

    console.log(`search-real-questions: specialty=${specialty}, auto=${autoMode}, banca=${banca}, ano=${ano}`);

    // Get admin user_id for ownership
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
    const userId = adminRole?.user_id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "No admin user found" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch existing statements for dedup
    const { data: existing } = await supabaseAdmin
      .from("questions_bank")
      .select("statement")
      .eq("topic", specialty)
      .eq("is_global", true)
      .order("created_at", { ascending: false })
      .limit(30);
    const existingStatements = (existing || []).map((r: any) => r.statement);

    // Step 1: Search and scrape
    const scrapedContent = await searchAndScrape(specialty, banca, ano);

    // Step 2: Structure questions via AI
    const result = await structureQuestions(scrapedContent, specialty, existingStatements, supabaseAdmin, userId);

    console.log(`search-real-questions result: ${result.inserted} questions from ${result.sources.length} sources`);

    return new Response(JSON.stringify({
      success: true,
      specialty,
      auto: autoMode,
      questions_inserted: result.inserted,
      sources_used: result.sources,
      pages_scraped: scrapedContent.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("search-real-questions error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
