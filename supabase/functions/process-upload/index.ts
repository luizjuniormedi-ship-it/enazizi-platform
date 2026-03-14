import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NON_MEDICAL_CONTENT_REGEX = /(direito|jur[ií]d|penal|constitucional|processo penal|inquérito|inqu[eé]rito|stf|stj|delegad|advogad|pol[ií]cia federal|c[oó]digo penal|a[cç][aã]o penal|inform[aá]tica|tecnologia da informa[cç][aã]o|engenharia|contabilidade|economia|administra[cç][aã]o|programa[cç][aã]o)/i;

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const fileType = (upload.file_type || "").toLowerCase();
    let extractedText = "";

    if (fileType === "txt") {
      // TXT files can be read directly - small memory footprint
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("user-uploads")
        .download(upload.storage_path);
      if (downloadError || !fileData) {
        return new Response(JSON.stringify({ error: "Failed to download file" }), { status: 500, headers: corsHeaders });
      }
      extractedText = await fileData.text();
    } else {
      // For PDF/DOCX: create a signed URL and pass it to Gemini
      const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
        .from("user-uploads")
        .createSignedUrl(upload.storage_path, 600); // 10 min expiry

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error("Signed URL error:", signedUrlError);
        return new Response(JSON.stringify({ error: "Failed to generate file access URL" }), { status: 500, headers: corsHeaders });
      }

      // Use Gemini to extract text from the PDF via URL
      const extractionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: "Você é um extrator de texto de documentos médicos. Extraia TODO o conteúdo textual do documento. Retorne APENAS o texto extraído, sem comentários seus. Se contiver questões médicas, mantenha a estrutura (enunciado, alternativas). Extraia o máximo de conteúdo possível de forma organizada."
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: signedUrlData.signedUrl
                  }
                },
                {
                  type: "text",
                  text: "Extraia todo o conteúdo textual deste documento médico. Retorne apenas o texto."
                }
              ]
            }
          ],
        }),
      });

      if (!extractionResponse.ok) {
        const errText = await extractionResponse.text();
        console.error("Text extraction error:", extractionResponse.status, errText);
        await supabase.from("uploads").update({ status: "error" }).eq("id", uploadId);
        return new Response(JSON.stringify({
          error: "Não foi possível extrair o conteúdo do PDF. Tente um arquivo menor ou com texto selecionável."
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const extractionData = await extractionResponse.json();
      extractedText = extractionData.choices?.[0]?.message?.content || "";
    }

    const truncatedText = extractedText.slice(0, 15000);

    if (!truncatedText.trim()) {
      await supabase.from("uploads").update({ status: "error", extracted_text: "Sem texto extraído." }).eq("id", uploadId);
      return new Response(JSON.stringify({ error: "Não foi possível extrair texto do arquivo." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Save extracted text
    await supabase.from("uploads").update({ extracted_text: truncatedText }).eq("id", uploadId);

    // Validate if content is medicine-related
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
            content: `Analise o texto e determine se é relacionado a medicina/saúde. Responda APENAS com JSON: {"is_medicine": true/false, "reason": "breve explicação"}`
          },
          { role: "user", content: `Classifique:\n\n${truncatedText.slice(0, 3000)}` }
        ],
      }),
    });

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
      } catch {
        // If can't parse validation, proceed anyway
      }
    }

    // Generate flashcards
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
          {
            role: "user",
            content: `Gere flashcards:\n\n${truncatedText}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de IA atingido. Tente novamente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      await supabase.from("uploads").update({ status: "error" }).eq("id", uploadId);
      return new Response(JSON.stringify({ error: "Falha no processamento com IA." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    let flashcards: Array<{ question: string; answer: string; topic: string }> = [];

    const content = aiData.choices?.[0]?.message?.content || "";
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      try {
        flashcards = JSON.parse(toolCall.function.arguments).flashcards || [];
      } catch {}
    }
    
    if (flashcards.length === 0 && content) {
      try {
        const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
        flashcards = JSON.parse(cleaned).flashcards || [];
      } catch {}
    }

    const finalFlashcards = flashcards
      .map((fc) => ({
        question: String(fc.question || "").trim(),
        answer: String(fc.answer || "").trim(),
        topic: String(fc.topic || "Geral").trim(),
      }))
      .filter((fc) => fc.question && fc.answer)
      .filter((fc) => {
        const blob = `${fc.topic} ${fc.question} ${fc.answer}`;
        return !NON_MEDICAL_CONTENT_REGEX.test(blob);
      });

    if (finalFlashcards.length === 0) {
      await supabase.from("uploads").update({ status: "error" }).eq("id", uploadId);
      return new Response(JSON.stringify({
        error: "Não foi possível gerar flashcards. Tente um material com mais conteúdo médico legível."
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { error: insertError } = await supabase.from("flashcards").insert(
      finalFlashcards.map((fc) => ({ user_id: userId, question: fc.question, answer: fc.answer, topic: fc.topic }))
    );

    if (insertError) {
      console.error("Insert error:", insertError);
      await supabase.from("uploads").update({ status: "error" }).eq("id", uploadId);
      return new Response(JSON.stringify({ error: "Falha ao salvar flashcards." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("uploads").update({
      status: "processed",
      extracted_json: {
        flashcards_count: finalFlashcards.length,
        topics: [...new Set(finalFlashcards.map((f) => f.topic))],
      }
    }).eq("id", uploadId);

    return new Response(JSON.stringify({
      message: `${finalFlashcards.length} flashcards médicos gerados com sucesso!`,
      flashcards_count: finalFlashcards.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("process-upload error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
