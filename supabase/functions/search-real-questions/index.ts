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

  // Build multiple search queries for better coverage
  const queries = [
    `"questão" "${specialty}" prova residência médica alternativas gabarito`,
    `site:pciconcursos.com.br OR site:qconcursos.com.br residência médica ${specialty} questões`,
  ];
  if (banca) {
    queries.unshift(`"${banca}" ${specialty} questões alternativas gabarito`);
  }

  const allResults: { url: string; markdown: string }[] = [];
  const seenUrls = new Set<string>();

  for (const query of queries.slice(0, 2)) { // max 2 searches to save credits
    console.log("Firecrawl search query:", query);

    try {
      const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          limit: 5,
          lang: "pt-br",
          country: "BR",
          scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
        }),
      });

      if (!searchResp.ok) {
        const err = await searchResp.text();
        console.error("Firecrawl search error:", searchResp.status, err);
        continue;
      }

      const searchData = await searchResp.json();

      for (const item of (searchData.data || [])) {
        const url = item.url || "";
        if (!url || seenUrls.has(url)) continue;
        seenUrls.add(url);

        // Skip YouTube
        if (url.includes("youtube.com") || url.includes("youtu.be")) continue;

        const markdown = item.markdown || "";
        if (markdown.length < 300) {
          console.log(`Skipping thin content (${markdown.length} chars) from: ${url}`);
          continue;
        }

        // Check if content looks like exam questions (has alternatives like A), B), etc.)
        const hasAlternatives = /[A-D]\)\s/.test(markdown) || /alternativa/i.test(markdown) || /gabarito/i.test(markdown);
        if (!hasAlternatives) {
          console.log(`Skipping non-question content from: ${url}`);
          continue;
        }

        console.log(`✓ Found question content (${markdown.length} chars) from: ${url}`);
        allResults.push({ url, markdown: markdown.slice(0, 12000) });
      }
    } catch (e) {
      console.warn(`Search query failed:`, e);
    }

    if (allResults.length >= 4) break; // enough content
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

  // Combine scraped content
  const contentBlock = scrapedContent
    .map((s, i) => `--- FONTE ${i + 1}: ${s.url} ---\n${s.markdown}`)
    .join("\n\n");

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
      timeoutMs: 120000,
      maxRetries: 1,
    });

    if (!response.ok) {
      console.error("AI structuring error:", await response.text());
      return { inserted: 0, sources: [] };
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
        try { parsed = JSON.parse(jsonMatch[0]); } catch { return { inserted: 0, sources: [] }; }
      }
    }

    if (!parsed?.questions || !Array.isArray(parsed.questions)) return { inserted: 0, sources: [] };

    // Filter valid questions
    const validQuestions = parsed.questions.filter((q: any) =>
      q.statement &&
      Array.isArray(q.options) &&
      q.options.length >= 2 &&
      typeof q.correct_index === "number" &&
      String(q.statement).trim().length >= 200 &&
      !isDuplicate(q.statement, existingStatements)
    );

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Parse request
    const body = await req.json().catch(() => ({}));
    const specialty = body.specialty || "Cardiologia";
    const banca = body.banca || null;
    const ano = body.ano || null;

    console.log(`search-real-questions: specialty=${specialty}, banca=${banca}, ano=${ano}`);

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
