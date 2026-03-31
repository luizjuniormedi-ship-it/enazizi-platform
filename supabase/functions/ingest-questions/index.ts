import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMAGE_REF_PATTERN = /\b(imagem abaixo|figura abaixo|observe a imagem|na imagem|na figura|texto abaixo|radiografia abaixo|fotografia|ECG abaixo|tomografia abaixo|observe o gráfico|observe a figura|observe a foto|imagem a seguir|figura a seguir)\b/i;
const ENGLISH_PATTERN = /\b(the patient|which of the following|a \d+-year-old|presents with|physical examination|most likely|treatment of choice|year-old male|year-old female)\b/i;

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[^a-záàâãéèêíìóòôõúùûç0-9]/g, "").slice(0, 200);
}

function hashStatement(s: string): string {
  const norm = normalizeText(s);
  let h = 0;
  for (let i = 0; i < norm.length; i++) {
    h = ((h << 5) - h + norm.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function isValidQuestion(q: { statement?: string; options?: string[]; correct_index?: number }): boolean {
  if (!q.statement || !Array.isArray(q.options) || typeof q.correct_index !== "number") return false;
  if (q.options.length < 4 || q.options.length > 5) return false;
  if (q.statement.length < 100) return false;
  if (IMAGE_REF_PATTERN.test(q.statement)) return false;
  if (ENGLISH_PATTERN.test(q.statement)) return false;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
          const { data: roleData } = await supabase
            .from("user_roles").select("role")
            .eq("user_id", user.id).eq("role", "admin").maybeSingle();
          if (!roleData) {
            return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: corsHeaders });
          }
        }
      } catch { /* allow service calls */ }
    }

    const body = await req.json();
    const { mode, url, upload_id, banca, year, source_type = "unknown", permission_type = "unknown" } = body;

    if (!mode) {
      return new Response(JSON.stringify({ error: "mode is required" }), { status: 400, headers: corsHeaders });
    }

    // MODE: web_navigate — just scan page for exam links
    if (mode === "web_navigate") {
      if (!url) {
        return new Response(JSON.stringify({ error: "url required for web_navigate" }), { status: 400, headers: corsHeaders });
      }

      const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
      let pageText = "";

      if (firecrawlKey) {
        try {
          const fcResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${firecrawlKey}` },
            body: JSON.stringify({ url, formats: ["markdown"] }),
          });
          const fcData = await fcResp.json();
          pageText = fcData?.data?.markdown || "";
        } catch { /* fallback below */ }
      }

      if (!pageText) {
        try {
          const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
          pageText = await resp.text();
        } catch (e) {
          return new Response(JSON.stringify({ error: `Failed to fetch: ${e}` }), { status: 500, headers: corsHeaders });
        }
      }

      // Extract PDF links and exam references
      const pdfLinks: { name: string; url: string; year?: number }[] = [];
      const pdfRegex = /https?:\/\/[^\s"'<>]+\.pdf/gi;
      const matches = pageText.match(pdfRegex) || [];
      for (const m of matches) {
        const yearMatch = m.match(/(20\d{2})/);
        pdfLinks.push({ name: m.split("/").pop() || "prova.pdf", url: m, year: yearMatch ? parseInt(yearMatch[1]) : undefined });
      }

      // Log the navigation
      await supabase.from("ingestion_log").insert({
        source_name: `Web: ${url}`,
        source_url: url,
        source_type: "indexed_external",
        permission_type: "indexed_external",
        questions_found: 0,
        status: "navigated",
        created_by: userId,
      });

      return new Response(JSON.stringify({ pdf_links: pdfLinks, page_length: pageText.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // MODE: index_only — just save reference
    if (mode === "index_only") {
      const { data: log } = await supabase.from("ingestion_log").insert({
        source_name: body.source_name || `Indexed: ${url || "unknown"}`,
        source_url: url,
        source_type,
        permission_type,
        banca,
        year,
        questions_found: 0,
        status: "indexed",
        created_by: userId,
      }).select().single();

      return new Response(JSON.stringify({ success: true, log }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // MODE: pdf_url or upload — extract questions
    let fullText = "";
    let sourceName = "";
    let sourceUrl = url || "";

    if (mode === "pdf_url" && url) {
      sourceName = `PDF: ${url.split("/").pop()}`;

      // Use AI to extract text from PDF
      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      if (lovableKey) {
        try {
          const aiResp = await fetch("https://ai.lovable.dev/api/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}` },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{
                role: "user",
                content: `Extraia TODAS as questões deste PDF de prova de residência médica.
URL do PDF: ${url}

Para cada questão, retorne em JSON:
{ "questions": [{ "statement": "...", "options": ["A) ...", "B) ...", ...], "correct_index": 0, "topic": "...", "explanation": "..." }] }

Regras:
- Mantenha o português original EXATAMENTE como no PDF
- Mínimo 4 alternativas (A-E preferencialmente)
- NÃO invente questões
- Se houver gabarito, use-o para correct_index
- topic deve ser a especialidade médica`
              }],
              temperature: 0.1,
            }),
          });
          const aiData = await aiResp.json();
          fullText = aiData.choices?.[0]?.message?.content || "";
        } catch (e) {
          console.error("AI extraction failed:", e);
        }
      }

      // Try direct PDF fetch as fallback
      if (!fullText) {
        try {
          const pdfResp = await fetch(url);
          fullText = await pdfResp.text();
        } catch { /* ignore */ }
      }
    } else if (mode === "upload" && upload_id) {
      const { data: upload } = await supabase.from("uploads")
        .select("storage_path, extracted_text, filename").eq("id", upload_id).single();
      if (!upload) {
        return new Response(JSON.stringify({ error: "Upload not found" }), { status: 404, headers: corsHeaders });
      }
      sourceName = `Upload: ${upload.filename}`;
      if (upload.storage_path) {
        const { data: fileData } = await supabase.storage.from("user-uploads").download(upload.storage_path);
        if (fileData) fullText = await fileData.text();
      }
      if (!fullText && upload.extracted_text) fullText = upload.extracted_text;
    }

    if (!fullText) {
      return new Response(JSON.stringify({ error: "No content extracted" }), { status: 400, headers: corsHeaders });
    }

    // Parse questions from AI JSON response or raw text
    let questions: any[] = [];

    // Try to parse JSON from AI response
    const jsonMatch = fullText.match(/\{[\s\S]*"questions"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        questions = parsed.questions || [];
      } catch { /* fallback to text parsing */ }
    }

    // Fallback: regex-based text parsing
    if (questions.length === 0) {
      const qBlocks = fullText.split(/(?=\d+[\.\)]\s|Questão\s+\d+)/i);
      for (const block of qBlocks) {
        if (block.trim().length < 100) continue;
        const optMatch = block.match(/[A-E][\.\)]\s*.+/g);
        if (!optMatch || optMatch.length < 4) continue;
        const stmtEnd = block.indexOf(optMatch[0]);
        const statement = block.slice(0, stmtEnd).replace(/^\d+[\.\)]\s*/, "").trim();
        if (statement.length < 100) continue;
        const options = optMatch.map((o: string) => o.replace(/^[A-E][\.\)]\s*/, "").trim());
        questions.push({ statement, options, correct_index: -1, topic: banca || "Geral" });
      }
    }

    // Validate and deduplicate
    let inserted = 0, updated = 0, skipped = 0, errors = 0;

    // Get existing hashes for dedup
    const { data: existing } = await supabase.from("questions_bank")
      .select("id, statement").limit(1000);
    const existingMap = new Map<string, { id: string; statement: string }>();
    for (const e of (existing || [])) {
      existingMap.set(normalizeText(e.statement).slice(0, 80), e);
    }

    const adminUserId = userId || "00000000-0000-0000-0000-000000000000";

    for (const q of questions) {
      if (!isValidQuestion(q)) { errors++; continue; }

      const normKey = normalizeText(q.statement).slice(0, 80);
      const match = existingMap.get(normKey);

      if (match) {
        // Duplicate — skip or update if we have new info
        if (q.correct_index >= 0 && q.explanation) {
          await supabase.from("questions_bank").update({
            explanation: q.explanation,
            source_type,
            permission_type,
            source_url: sourceUrl,
          }).eq("id", match.id);
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Pad options to 5 if needed
        const opts = [...q.options];
        while (opts.length < 5) opts.push(`Alternativa ${String.fromCharCode(65 + opts.length)}`);
        if (opts.length > 5) opts.splice(5);

        const { error: insErr } = await supabase.from("questions_bank").insert({
          statement: q.statement,
          options: opts,
          correct_index: q.correct_index >= 0 ? q.correct_index : 0,
          topic: q.topic || banca || "Geral",
          explanation: q.explanation || "",
          source: `${banca || "external"}_${year || "unknown"}`,
          source_type,
          permission_type,
          source_url: sourceUrl,
          user_id: adminUserId,
          is_global: true,
          difficulty: 3,
          review_status: "pending",
        });

        if (insErr) { errors++; console.error("Insert error:", insErr); }
        else { inserted++; existingMap.set(normKey, { id: "new", statement: q.statement }); }
      }
    }

    // Log the ingestion
    await supabase.from("ingestion_log").insert({
      source_name: sourceName,
      source_url: sourceUrl,
      source_type,
      permission_type,
      banca,
      year,
      questions_found: questions.length,
      questions_inserted: inserted,
      questions_updated: updated,
      duplicates_skipped: skipped,
      errors,
      status: "completed",
      created_by: userId,
    });

    return new Response(JSON.stringify({
      success: true,
      questions_found: questions.length,
      questions_inserted: inserted,
      questions_updated: updated,
      duplicates_skipped: skipped,
      errors,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("Ingest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: corsHeaders });
  }
});
