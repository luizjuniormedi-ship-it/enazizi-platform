import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { aiFetch, parseAiJson } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, specialty } = await req.json();
    if (!topic) throw new Error("topic is required");

    const response = await aiFetch({
      model: "google/gemini-2.5-flash-lite",
      maxTokens: 1024,
      timeoutMs: 12000,
      maxRetries: 1,
      messages: [
        {
          role: "system",
          content: `Você é um gerador de micro-quiz médico. Retorne APENAS JSON válido, sem markdown.`,
        },
        {
          role: "user",
          content: `Gere 2 questões objetivas curtas sobre "${topic}"${specialty ? ` (${specialty})` : ""} para revisão rápida.

Formato JSON exato:
{"questions":[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]}

Regras:
- Enunciado direto, máx 2 frases, em pt-BR
- 4 alternativas curtas
- correctIndex = índice da correta (0-3)
- explanation = 1 frase explicando`,
        },
      ],
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI error:", response.status, err.slice(0, 200));
      throw new Error("AI_ERROR");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const parsed = parseAiJson(content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("micro-quiz error:", e);
    return new Response(JSON.stringify({ questions: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
