import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      console.error("Auth error:", userError?.message);
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

    // Get upload record
    const { data: upload, error: uploadError } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", uploadId)
      .eq("user_id", userId)
      .maybeSingle();

    if (uploadError || !upload) {
      return new Response(JSON.stringify({ error: "Upload not found" }), { status: 404, headers: corsHeaders });
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("user-uploads")
      .download(upload.storage_path);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      return new Response(JSON.stringify({ error: "Failed to download file" }), { status: 500, headers: corsHeaders });
    }

    // Extract text from the file
    const text = await fileData.text();
    const truncatedText = text.slice(0, 15000); // Limit for AI context

    if (!truncatedText.trim()) {
      await supabase.from("uploads").update({ status: "error", extracted_text: "Não foi possível extrair texto do arquivo." }).eq("id", uploadId);
      return new Response(JSON.stringify({ error: "Could not extract text from file" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Save extracted text
    await supabase.from("uploads").update({ extracted_text: truncatedText, status: "processing" }).eq("id", uploadId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Step 1: Validate if content is medicine-related
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
            content: `Você é um classificador de conteúdo. Analise o texto e determine se é relacionado a medicina, saúde, ciências biomédicas, residência médica, ou áreas correlatas (anatomia, fisiologia, farmacologia, patologia, clínica médica, cirurgia, pediatria, ginecologia, medicina preventiva, saúde pública, bioquímica, etc).
Responda APENAS com JSON: {"is_medicine": true/false, "reason": "breve explicação"}`
          },
          { role: "user", content: `Classifique este conteúdo:\n\n${truncatedText.slice(0, 3000)}` }
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
          await supabase.storage.from("user-uploads").remove([upload.storage_path]);
          return new Response(JSON.stringify({ 
            error: `Conteúdo rejeitado: apenas materiais de medicina são permitidos. ${validation.reason || ""}` 
          }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      } catch (parseErr) {
        console.warn("Validation parse error, proceeding anyway:", parseErr);
      }
    }

    // Step 2: Generate flashcards with AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um assistente especializado em criar flashcards educativos para Residência Médica (ENARE, USP, UNIFESP).
Analise o texto fornecido e gere flashcards no formato JSON.
Cada flashcard deve ter: question (pergunta objetiva), answer (resposta concisa), topic (tema/matéria médica).
Gere entre 5 e 15 flashcards relevantes baseados no conteúdo.
Responda APENAS com o JSON, sem markdown ou texto adicional.
Formato: {"flashcards": [{"question": "...", "answer": "...", "topic": "..."}]}`
          },
          {
            role: "user",
            content: `Gere flashcards a partir do seguinte conteúdo:\n\n${truncatedText}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_flashcards",
              description: "Generate flashcards from study material",
              parameters: {
                type: "object",
                properties: {
                  flashcards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        answer: { type: "string" },
                        topic: { type: "string" }
                      },
                      required: ["question", "answer", "topic"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["flashcards"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_flashcards" } }
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de IA atingido. Tente novamente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await supabase.from("uploads").update({ status: "error" }).eq("id", uploadId);
      return new Response(JSON.stringify({ error: "AI processing failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    let flashcards: Array<{ question: string; answer: string; topic: string }> = [];

    // Extract from tool call response
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      flashcards = parsed.flashcards || [];
    }

    if (flashcards.length === 0) {
      await supabase.from("uploads").update({ status: "processed", extracted_json: { flashcards: [] } }).eq("id", uploadId);
      return new Response(JSON.stringify({ message: "No flashcards generated", flashcards: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Insert flashcards into database
    const flashcardRows = flashcards.map((fc) => ({
      user_id: userId,
      question: fc.question,
      answer: fc.answer,
      topic: fc.topic,
    }));

    const { error: insertError } = await supabase.from("flashcards").insert(flashcardRows);
    if (insertError) {
      console.error("Insert flashcards error:", insertError);
    }

    // Update upload status
    await supabase.from("uploads").update({
      status: "processed",
      extracted_json: { flashcards_count: flashcards.length, topics: [...new Set(flashcards.map(f => f.topic))] }
    }).eq("id", uploadId);

    return new Response(JSON.stringify({
      message: `${flashcards.length} flashcards gerados com sucesso!`,
      flashcards_count: flashcards.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("process-upload error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
