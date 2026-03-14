import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getDocument } from "https://esm.sh/pdfjs-serverless";
import { aiFetch } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NON_MEDICAL_CONTENT_REGEX = /(direito|jur[ií]d|penal|constitucional|processo penal|inquérito|inqu[eé]rito|stf|stj|delegad|advogad|pol[ií]cia federal|c[oó]digo penal|a[cç][aã]o penal|inform[aá]tica|tecnologia da informa[cç][aã]o|engenharia|contabilidade|economia|administra[cç][aã]o|programa[cç][aã]o)/i;
const MAX_PROCESS_FILE_BYTES = 20 * 1024 * 1024;
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

async function generateQuestionsFromText(
  text: string,
  _apiKey: string,
  topic: string
): Promise<Array<{ statement: string; options: string[]; correct_index: number; explanation: string; topic: string }>> {
  const allQuestions: Array<{ statement: string; options: string[]; correct_index: number; explanation: string; topic: string }> = [];

  // Process in chunks of ~8000 chars to get more questions
  const chunkSize = 8000;
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  // Process up to 5 chunks to avoid timeout
  const chunksToProcess = chunks.slice(0, 5);

  for (const chunk of chunksToProcess) {
    try {
      const response = await aiFetch({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Extraia questões de múltipla escolha do texto fornecido. Se o texto já contiver questões formatadas, converta-as para o formato JSON. Se for conteúdo teórico, gere questões baseadas no conteúdo.

IMPORTANTE: Gere o MÁXIMO de questões possível (10-20 por chunk).
Formato JSON PURO (sem markdown): 
{"questions": [{"statement": "enunciado completo com caso clínico", "options": ["A", "B", "C", "D", "E"], "correct_index": 0, "explanation": "explicação detalhada", "topic": "especialidade médica"}]}

Se não encontrar questões válidas, retorne {"questions": []}`
          },
          { role: "user", content: `Tema principal: ${topic}\n\nTexto:\n${chunk}` }
        ],
      });

      if (!response.ok) continue;

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      try {
        const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const questions = parsed.questions || [];
          for (const q of questions) {
            if (
              q.statement && 
              Array.isArray(q.options) && 
              q.options.length >= 4 &&
              typeof q.correct_index === "number" &&
              !NON_MEDICAL_CONTENT_REGEX.test(q.statement)
            ) {
              allQuestions.push({
                statement: String(q.statement).trim(),
                options: q.options.map(String),
                correct_index: q.correct_index,
                explanation: String(q.explanation || "").trim(),
                topic: String(q.topic || topic).trim(),
              });
            }
          }
        }
      } catch {
        // Skip unparseable chunks
      }
    } catch {
      // Skip failed chunks
    }
  }

  return allQuestions;
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
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { uploadId } = await req.json();
    if (!uploadId) throw new Error("uploadId is required");

    const { data: upload, error: uploadError } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", uploadId)
      .eq("user_id", userId)
      .maybeSingle();

    if (uploadError || !upload) {
      return new Response(JSON.stringify({ error: "Upload not found" }), { status: 404, headers: corsHeaders });
    }

    await supabase.from("uploads").update({ status: "processing" }).eq("id", uploadId);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("user-uploads")
      .download(upload.storage_path);

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: "Failed to download file" }), { status: 500, headers: corsHeaders });
    }

    if (fileData.size > MAX_PROCESS_FILE_BYTES) {
      await supabase.from("uploads").update({ status: "error" }).eq("id", uploadId);
      return new Response(JSON.stringify({
        error: "Arquivo muito grande para processamento (máx 20MB)."
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const fileType = (upload.file_type || "").toLowerCase();
    let extractedText = "";

    if (fileType === "txt") {
      extractedText = await fileData.text();
    } else if (fileType === "pdf" || fileType === "application/pdf") {
      extractedText = await extractPdfText(fileData);
    } else {
      await supabase.from("uploads").update({ status: "error" }).eq("id", uploadId);
      return new Response(JSON.stringify({
        error: "Formato não suportado no momento. Envie PDF ou TXT."
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const truncatedText = extractedText.slice(0, 40000);

    if (!truncatedText.trim()) {
      await supabase.from("uploads").update({ status: "error", extracted_text: "Sem texto extraído." }).eq("id", uploadId);
      return new Response(JSON.stringify({
        error: "Não foi possível extrair texto do arquivo. Se for PDF escaneado (imagem), envie uma versão com texto selecionável."
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Save full extracted text
    await supabase.from("uploads").update({ extracted_text: truncatedText.slice(0, 50000) }).eq("id", uploadId);

    // Validate medical content
    const validationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Analise o texto e determine se é relacionado a medicina/saúde. Responda APENAS com JSON: {"is_medicine": true/false, "reason": "breve explicação", "main_topic": "especialidade médica principal"}`
          },
          { role: "user", content: `Classifique:\n\n${truncatedText.slice(0, 3000)}` }
        ],
      }),
    });

    let detectedTopic = "Clínica Médica";

    if (validationResponse.ok) {
      const valData = await validationResponse.json();
      const valContent = valData.choices?.[0]?.message?.content || "";
      try {
        const cleaned = valContent.replace(/```json\n?/g, "").replace(/```/g, "").trim();
        const validation = JSON.parse(cleaned);
        if (!validation.is_medicine) {
          await supabaseAdmin.from("uploads").delete().eq("id", uploadId);
          await supabaseAdmin.storage.from("user-uploads").remove([upload.storage_path]);
          return new Response(JSON.stringify({
            error: `Conteúdo rejeitado: apenas materiais de medicina são permitidos. ${validation.reason || ""}`
          }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (validation.main_topic) detectedTopic = validation.main_topic;
      } catch {
        // If can't parse validation, proceed anyway
      }
    }

    // Infer topic from filename
    const fn = upload.filename.toLowerCase();
    if (fn.includes("car") || fn.includes("cardio")) detectedTopic = "Cardiologia";
    else if (fn.includes("ped")) detectedTopic = "Pediatria";
    else if (fn.includes("cir")) detectedTopic = "Cirurgia";
    else if (fn.includes("go") || fn.includes("ginec") || fn.includes("obst")) detectedTopic = "Ginecologia e Obstetrícia";
    else if (fn.includes("prev") || fn.includes("mps")) detectedTopic = "Medicina Preventiva";
    else if (fn.includes("neuro")) detectedTopic = "Neurologia";
    else if (fn.includes("pneumo")) detectedTopic = "Pneumologia";
    else if (fn.includes("nefro")) detectedTopic = "Nefrologia";
    else if (fn.includes("infecto")) detectedTopic = "Infectologia";

    const isGlobal = upload.is_global || false;
    const isBancoQuestoes = (upload.category || "").includes("banco-questoes") || fn.includes("questoes") || fn.includes("questao");

    let flashcardsCount = 0;
    let questionsCount = 0;

    // Generate flashcards
    try {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: `Crie flashcards educativos para Residência Médica a partir do texto.
Cada flashcard: question, answer, topic.
Gere 5-15 flashcards relevantes.
Responda APENAS com JSON: {"flashcards": [{"question": "...", "answer": "...", "topic": "..."}]}`
            },
            { role: "user", content: `Gere flashcards:\n\n${truncatedText.slice(0, 15000)}` }
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        let flashcards: Array<{ question: string; answer: string; topic: string }> = [];
        const content = aiData.choices?.[0]?.message?.content || "";

        try {
          const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
          flashcards = JSON.parse(cleaned).flashcards || [];
        } catch {}

        const finalFlashcards = flashcards
          .map((fc) => ({
            question: String(fc.question || "").trim(),
            answer: String(fc.answer || "").trim(),
            topic: String(fc.topic || detectedTopic).trim(),
          }))
          .filter((fc) => fc.question && fc.answer)
          .filter((fc) => !NON_MEDICAL_CONTENT_REGEX.test(`${fc.topic} ${fc.question} ${fc.answer}`));

        if (finalFlashcards.length > 0) {
          await supabase.from("flashcards").insert(
            finalFlashcards.map((fc) => ({ user_id: userId, question: fc.question, answer: fc.answer, topic: fc.topic }))
          );
          flashcardsCount = finalFlashcards.length;
        }
      }
    } catch (e) {
      console.error("Flashcard generation error:", e);
    }

    // Generate questions for questions_bank
    try {
      const questions = await generateQuestionsFromText(truncatedText, LOVABLE_API_KEY, detectedTopic);

      if (questions.length > 0) {
        const rows = questions.map((q) => ({
          user_id: userId,
          statement: q.statement,
          options: q.options,
          correct_index: q.correct_index,
          explanation: q.explanation,
          topic: q.topic,
          source: `upload:${upload.filename}`,
          is_global: isGlobal,
        }));

        // Insert in batches of 50
        for (let i = 0; i < rows.length; i += 50) {
          const batch = rows.slice(i, i + 50);
          const { error: insertError } = await supabaseAdmin.from("questions_bank").insert(batch);
          if (insertError) {
            console.error("Question insert error:", insertError);
          } else {
            questionsCount += batch.length;
          }
        }
      }
    } catch (e) {
      console.error("Question generation error:", e);
    }

    await supabase.from("uploads").update({
      status: "processed",
      extracted_json: {
        flashcards_count: flashcardsCount,
        questions_count: questionsCount,
        topics: [detectedTopic],
        main_topic: detectedTopic,
      }
    }).eq("id", uploadId);

    return new Response(JSON.stringify({
      message: `Processado! ${flashcardsCount} flashcards e ${questionsCount} questões geradas.`,
      flashcards_count: flashcardsCount,
      questions_count: questionsCount,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("process-upload error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
