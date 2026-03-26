import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch, sanitizeAiContent } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRUSTED_DOMAINS = [
  // Governo / INEP / Provas oficiais
  "inep.gov.br", "gov.br", "saude.sp.gov.br", "saude.gov.br",
  "enare.org.br", "abmes.org.br",
  // Universidades federais
  "usp.br", "unicamp.br", "unifesp.br", "fmusp.br", "fcm.unicamp.br",
  "ufpr.br", "ufrj.br", "ufmg.br", "ufrgs.br", "ufba.br", "ufpe.br",
  "ufsc.br", "unesp.br", "uel.br", "uem.br", "ufg.br", "ufms.br",
  "ufpa.br", "ufma.br", "ufrn.br", "ufal.br", "ufes.br", "ufc.br",
  "ufpb.br", "ufpi.br", "ufmt.br", "unb.br", "ufam.br", "ufra.br",
  "ufcg.br", "ufscar.br", "ufsm.br", "furg.br", "ufla.br",
  // Universidades estaduais e privadas
  "pucrs.br", "pucsp.br", "pucminas.br", "pucpr.br", "puccamp.br",
  "mackenzie.br", "einstein.br", "hsl.org.br", "hospitalsiriolibanes.org.br",
  "santacasasp.org.br", "fcmsantacasasp.edu.br",
  // Bancas / organizadoras
  "fgv.br", "vunesp.com.br", "cesgranrio.org.br", "ibfc.org.br",
  "amrigs.org.br", "upenet.com.br", "fuvest.br", "comvest.unicamp.br",
  "famerp.br", "fmabc.br", "iamspe.sp.gov.br",
  // Portais de provas e questões
  "qconcursos.com.br", "pciconcursos.com.br", "questoesmedicas.com.br",
  "residenciamedicasp.com.br", "residenciamedica.com.br",
  "provamedicina.com.br", "residenciamedica.net",
  // Educação médica nacional
  "medway.com.br", "medcel.com.br", "estrategiamed.com.br",
  "medgrupo.com.br", "sanarmed.com", "editorasanar.com.br",
  "jaleko.com.br", "afya.com.br", "medblog.estrategiaeducacional.com.br",
  "med.estrategia.com",
  // Sites internacionais
  "amboss.com", "usmle.org", "nbme.org", "pubmed.ncbi.nlm.nih.gov",
  "medscape.com", "lecturio.com", "osmosis.org", "kenhub.com",
  "radiopaedia.org", "teachmemedicine.org", "geekymedics.com",
  "passmedicine.com", "bmj.com", "nejm.org", "thelancet.com",
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
  const prefix = statement.slice(0, 100).toLowerCase().replace(/\s+/g, " ");
  return existingStatements.some(ex => ex.slice(0, 100).toLowerCase().replace(/\s+/g, " ") === prefix);
}

/** Pre-filter: extract blocks that look like exam questions from raw markdown */
function extractQuestionBlocks(markdown: string, maxChars: number): string {
  // Split into paragraphs / sections
  const sections = markdown.split(/\n{2,}/);
  const questionBlocks: string[] = [];
  let totalLen = 0;

  const questionPattern = /(?:[A-E]\)\s|alternativa|gabarito|\bquestão\b|\d+\.\s)/i;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;

    // Check if this section or the next one contains question markers
    const nextSection = sections[i + 1]?.trim() || "";
    const combined = section + " " + nextSection;

    if (questionPattern.test(combined) || hasClinicalContent(section)) {
      // Grab this section and up to 2 surrounding sections for context
      const start = Math.max(0, i - 1);
      const end = Math.min(sections.length - 1, i + 2);
      const block = sections.slice(start, end + 1).join("\n\n");

      if (totalLen + block.length <= maxChars && !questionBlocks.includes(block)) {
        questionBlocks.push(block);
        totalLen += block.length;
      }

      if (totalLen >= maxChars) break;
      i = end; // skip ahead
    }
  }

  // If we found question blocks, use them; otherwise fall back to truncation
  if (questionBlocks.length > 0 && totalLen > 500) {
    return questionBlocks.join("\n\n---\n\n");
  }

  // Fallback: skip header (first 500 chars) and take up to maxChars
  return markdown.length > maxChars + 500
    ? markdown.slice(500, 500 + maxChars)
    : markdown.slice(0, maxChars);
}

/** Robust JSON extraction: handles truncated JSON, markdown blocks, partial objects */
function extractQuestionsFromJson(raw: string): any[] {
  // Remove markdown code blocks
  let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  // Remove control characters except newlines/tabs
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Try full parse first
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed?.questions && Array.isArray(parsed.questions)) return parsed.questions;
    if (Array.isArray(parsed)) return parsed;
  } catch { /* continue to recovery */ }

  // Try finding the questions array
  const arrMatch = cleaned.match(/"questions"\s*:\s*\[/);
  if (arrMatch && arrMatch.index !== undefined) {
    const startIdx = cleaned.indexOf("[", arrMatch.index);
    if (startIdx !== -1) {
      let substr = cleaned.slice(startIdx);
      // Try to find matching bracket
      let depth = 0;
      let endIdx = -1;
      for (let i = 0; i < substr.length; i++) {
        if (substr[i] === "[") depth++;
        else if (substr[i] === "]") { depth--; if (depth === 0) { endIdx = i; break; } }
      }
      if (endIdx !== -1) {
        try { return JSON.parse(substr.slice(0, endIdx + 1)); } catch { /* continue */ }
      }
      // Array was truncated — try to recover individual objects
      substr = substr.slice(1); // remove leading [
      return extractIndividualObjects(substr);
    }
  }

  // Last resort: extract individual JSON objects that look like questions
  return extractIndividualObjects(cleaned);
}

function extractIndividualObjects(text: string): any[] {
  const results: any[] = [];
  const objectRegex = /\{[^{}]*"statement"[^{}]*\}/g;
  let match;
  while ((match = objectRegex.exec(text)) !== null) {
    try {
      const obj = JSON.parse(match[0]);
      if (obj.statement) results.push(obj);
    } catch {
      // Try fixing common issues
      try {
        const fixed = match[0]
          .replace(/,\s*\}/g, "}")
          .replace(/,\s*\]/g, "]");
        const obj = JSON.parse(fixed);
        if (obj.statement) results.push(obj);
      } catch { /* skip */ }
    }
  }

  // Also try nested objects (with arrays inside)
  if (results.length === 0) {
    let depth = 0;
    let start = -1;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "{") { if (depth === 0) start = i; depth++; }
      else if (text[i] === "}") {
        depth--;
        if (depth === 0 && start !== -1) {
          const candidate = text.slice(start, i + 1);
          if (candidate.includes('"statement"')) {
            try {
              const obj = JSON.parse(candidate);
              if (obj.statement) results.push(obj);
            } catch {
              try {
                const fixed = candidate
                  .replace(/,\s*\}/g, "}")
                  .replace(/,\s*\]/g, "]")
                  .replace(/[\x00-\x1F\x7F]/g, "");
                const obj = JSON.parse(fixed);
                if (obj.statement) results.push(obj);
              } catch { /* skip */ }
            }
          }
          start = -1;
        }
      }
    }
  }

  return results;
}

function isTrustedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return TRUSTED_DOMAINS.some(d => hostname === d || hostname.endsWith("." + d));
  } catch {
    return false;
  }
}

async function getAlreadyScrapedUrls(supabaseAdmin: any, specialty: string): Promise<Set<string>> {
  const { data } = await supabaseAdmin
    .from("questions_bank")
    .select("explanation")
    .eq("topic", specialty)
    .eq("source", "web-scrape")
    .eq("is_global", true)
    .order("created_at", { ascending: false })
    .limit(100);

  const urls = new Set<string>();
  for (const row of (data || [])) {
    const match = String(row.explanation || "").match(/\[Fonte:\s*(https?:\/\/[^\s\]|]+)/);
    if (match) {
      try {
        const hostname = new URL(match[1]).hostname;
        const path = new URL(match[1]).pathname;
        urls.add(hostname + path);
      } catch { /* ignore */ }
    }
  }
  return urls;
}

function buildQueryPool(specialty: string, banca: string | null): string[] {
  if (banca) {
    return [
      `"${banca}" ${specialty} questões alternativas gabarito`,
      `"${banca}" ${specialty} prova comentada residência médica`,
      `"${banca}" ${specialty} prova gabarito oficial`,
    ];
  }

  // Massive diverse pool — the function will skip already-scraped URLs
  return [
    // Portais de questões nacionais
    `site:medway.com.br ${specialty} questões comentadas residência`,
    `site:sanarmed.com ${specialty} questões comentadas prova`,
    `site:qconcursos.com.br ${specialty} questões residência médica`,
    `site:estrategiamed.com.br ${specialty} questões comentadas`,
    `site:medcel.com.br ${specialty} questões comentadas`,
    `site:med.estrategia.com ${specialty} questões gabarito residência`,
    // Provas oficiais e PDFs
    `"${specialty}" prova residência médica gabarito oficial PDF`,
    `REVALIDA INEP ${specialty} prova questões gabarito`,
    `ENARE ${specialty} questões prova residência`,
    `SUS-SP ${specialty} prova residência médica gabarito`,
    // Universidades
    `USP ${specialty} prova residência questões comentadas`,
    `UNICAMP ${specialty} prova residência médica gabarito`,
    `UNIFESP ${specialty} questões prova residência`,
    `Santa Casa ${specialty} prova residência médica questões`,
    `UFRJ UFMG ${specialty} prova residência gabarito`,
    // Buscas genéricas diversificadas
    `"questão" "${specialty}" prova residência médica alternativas gabarito`,
    `${specialty} prova residência médica questões gabarito comentado`,
    `${specialty} questões objetivas residência médica 2024 2025 2026`,
    `"residência médica" "${specialty}" questões resolvidas alternativas`,
    `${specialty} simulado residência médica questões com gabarito`,
    // Sites internacionais (traduzidos)
    `site:amboss.com ${specialty} multiple choice questions`,
    `site:radiopaedia.org ${specialty} quiz cases`,
    `site:geekymedics.com ${specialty} questions answers`,
    `site:lecturio.com ${specialty} board review questions`,
    `${specialty} USMLE step 2 questions explanations`,
    `${specialty} medical residency exam MCQ answers`,
    // Provas estaduais
    `${specialty} prova residência AMRIGS questões gabarito`,
    `${specialty} prova residência FAMERP questões comentadas`,
    `${specialty} concurso residência médica questões 2025`,
  ];
}

async function searchAndScrape(
  specialty: string,
  banca: string | null,
  ano: number | null,
  alreadyScrapedKeys: Set<string>,
): Promise<{ url: string; markdown: string }[]> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

  const queries = buildQueryPool(specialty, banca);
  // Shuffle queries to vary across executions
  for (let i = queries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queries[i], queries[j]] = [queries[j], queries[i]];
  }

  const allResults: { url: string; markdown: string }[] = [];
  const seenUrls = new Set<string>();
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
          limit: 5,
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

        // Skip URLs we already scraped before
        try {
          const urlKey = new URL(url).hostname + new URL(url).pathname;
          if (alreadyScrapedKeys.has(urlKey)) {
            console.log(`Skipping already-scraped URL: ${url}`);
            continue;
          }
        } catch { /* ignore parse errors */ }

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

    // Auto-generate flashcards from inserted questions
    const flashcardRows = validQuestions.map((q: any, i: number) => {
      const correctOption = String(q.options[q.correct_index] || "").replace(/^[A-E]\)\s*/, "");
      const explanation = String(q.explanation || "").trim();
      // Extract core clinical question (first 200 chars of statement)
      const statementSummary = String(q.statement).trim().slice(0, 300);
      
      return {
        user_id: userId,
        question: statementSummary.length < String(q.statement).trim().length
          ? statementSummary + "... Qual a conduta/diagnóstico correto?"
          : statementSummary,
        answer: `✅ ${correctOption}\n\n${explanation ? `📖 ${explanation}` : ""}`,
        topic: specialty,
        is_global: true,
      };
    });

    if (flashcardRows.length > 0) {
      const { error: fcError } = await supabaseAdmin.from("flashcards").insert(flashcardRows);
      if (fcError) {
        console.error("Insert flashcards from web-scrape error:", fcError);
      } else {
        console.log(`Created ${flashcardRows.length} flashcards from web-scrape questions`);
      }
    }

    return { inserted: rows.length, sources: [...sources] };
  } catch (e) {
    console.error("Error structuring scraped questions:", e);
    return { inserted: 0, sources: [] };
  }
}

const SPECIALTIES_POOL = [
  "Angiologia", "Cardiologia", "Cirurgia Geral", "Dermatologia",
  "Endocrinologia", "Gastroenterologia", "Ginecologia e Obstetrícia",
  "Hematologia", "Infectologia", "Medicina Preventiva", "Nefrologia",
  "Neurologia", "Oftalmologia", "Oncologia", "Ortopedia",
  "Otorrinolaringologia", "Pediatria", "Pneumologia", "Psiquiatria",
  "Reumatologia", "Urologia",
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

    // Get already-scraped URLs to skip them
    const alreadyScrapedKeys = await getAlreadyScrapedUrls(supabaseAdmin, specialty);
    console.log(`Already scraped ${alreadyScrapedKeys.size} unique URLs for ${specialty}`);

    // Step 1: Search and scrape (skipping already-scraped sources)
    const scrapedContent = await searchAndScrape(specialty, banca, ano, alreadyScrapedKeys);

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
