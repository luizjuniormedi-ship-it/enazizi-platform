import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getDocument } from "https://esm.sh/pdfjs-serverless";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_PDF_PAGES_TO_PARSE = 120;

async function extractPdfText(fileData: Blob): Promise<string> {
  const data = new Uint8Array(await fileData.arrayBuffer());
  const document = await getDocument({ data, useSystemFonts: true }).promise;
  const totalPages = Math.min(document.numPages, MAX_PDF_PAGES_TO_PARSE);
  const pages: string[] = [];
  for (let i = 1; i <= totalPages; i++) {
    const page = await document.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item: unknown) => (typeof item === "object" && item !== null && "str" in item ? String((item as { str: string }).str) : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) pages.push(text);
  }
  return pages.join("\n\n");
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

    // Verify admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: corsHeaders });
    }

    const { uploadId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Get upload
    const { data: upload } = await supabaseAdmin
      .from("uploads")
      .select("*")
      .eq("id", uploadId)
      .maybeSingle();

    if (!upload || !upload.storage_path) {
      return new Response(JSON.stringify({ error: "Upload not found" }), { status: 404, headers: corsHeaders });
    }

    // Download and extract PDF
    const { data: fileData } = await supabaseAdmin.storage
      .from("user-uploads")
      .download(upload.storage_path);

    if (!fileData) {
      return new Response(JSON.stringify({ error: "File not found in storage" }), { status: 404, headers: corsHeaders });
    }

    let fullText = "";
    const fileType = (upload.file_type || "").toLowerCase();
    if (fileType === "txt") {
      fullText = await fileData.text();
    } else {
      fullText = await extractPdfText(fileData);
    }

    if (!fullText.trim()) {
      return new Response(JSON.stringify({ error: "No text extracted" }), { status: 400, headers: corsHeaders });
    }

    // Save full extracted text
    await supabaseAdmin.from("uploads").update({ 
      extracted_text: fullText.slice(0, 50000) 
    }).eq("id", uploadId);

    // Infer topic from filename
    const fn = upload.filename.toLowerCase();
    let topic = "Clínica Médica";
    if (fn.includes("car") || fn.includes("cardio")) topic = "Cardiologia";
    else if (fn.includes("ped")) topic = "Pediatria";
    else if (fn.includes("cir")) topic = "Cirurgia";
    else if (fn.includes("go") || fn.includes("ginec")) topic = "Ginecologia e Obstetrícia";
    else if (fn.includes("prev")) topic = "Medicina Preventiva";
    else if (fn.includes("neuro")) topic = "Neurologia";
    else if (fn.includes("pneumo")) topic = "Pneumologia";

    // Process in chunks
    const chunkSize = 10000;
    const chunks: string[] = [];
    for (let i = 0; i < fullText.length; i += chunkSize) {
      chunks.push(fullText.slice(i, i + chunkSize));
    }

    let totalQuestions = 0;
    // Process up to 8 chunks
    for (const chunk of chunks.slice(0, 8)) {
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `Extraia TODAS as questões de múltipla escolha do texto. Se encontrar questões já formatadas, converta para JSON. Se for texto teórico, gere questões baseadas no conteúdo.

GERE O MÁXIMO POSSÍVEL (10-30 por bloco).
Formato JSON PURO: {"questions": [{"statement": "enunciado completo", "options": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."], "correct_index": 0, "explanation": "explicação", "topic": "especialidade"}]}
Se não encontrar questões, retorne {"questions": []}`
              },
              { role: "user", content: `Tema: ${topic}\n\n${chunk}` }
            ],
          }),
        });

        if (!response.ok) continue;

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const questions = (parsed.questions || []).filter((q: any) =>
            q.statement && Array.isArray(q.options) && q.options.length >= 4 && typeof q.correct_index === "number"
          );

          if (questions.length > 0) {
            const rows = questions.map((q: any) => ({
              user_id: user.id,
              statement: String(q.statement).trim(),
              options: q.options.map(String),
              correct_index: q.correct_index,
              explanation: String(q.explanation || "").trim(),
              topic: String(q.topic || topic).trim(),
              source: `upload:${upload.filename}`,
              is_global: true,
            }));

            const { error } = await supabaseAdmin.from("questions_bank").insert(rows);
            if (!error) totalQuestions += rows.length;
            else console.error("Insert error:", error);
          }
        }
      } catch (e) {
        console.error("Chunk error:", e);
      }
    }

    // Update upload metadata
    await supabaseAdmin.from("uploads").update({
      extracted_json: {
        ...(upload.extracted_json as any || {}),
        questions_count: totalQuestions,
        main_topic: topic,
        repopulated_at: new Date().toISOString(),
      }
    }).eq("id", uploadId);

    return new Response(JSON.stringify({
      message: `${totalQuestions} questões extraídas de ${upload.filename}`,
      questions_count: totalQuestions,
      topic,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("populate-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
