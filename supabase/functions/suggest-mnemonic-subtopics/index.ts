import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic } = await req.json();
    if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
      return new Response(JSON.stringify({ subtopics: [], source: "none" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmed = topic.trim();

    // 1. Try structured DB first (curriculum_matrix)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Search curriculum_subtopics via topic name match
    const { data: topicRows } = await supabase
      .from("curriculum_topics")
      .select("id, nome")
      .ilike("nome", `%${trimmed}%`)
      .eq("ativo", true)
      .limit(3);

    if (topicRows && topicRows.length > 0) {
      const topicIds = topicRows.map(t => t.id);
      const { data: subtopicRows } = await supabase
        .from("curriculum_subtopics")
        .select("nome")
        .in("topic_id", topicIds)
        .eq("ativo", true)
        .order("prioridade_base", { ascending: false })
        .limit(6);

      if (subtopicRows && subtopicRows.length >= 2) {
        return new Response(JSON.stringify({
          subtopics: subtopicRows.map(s => s.nome),
          source: "curriculum",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Also try curriculum_matrix direct match
    const { data: matrixRows } = await supabase
      .from("curriculum_matrix")
      .select("subtema")
      .ilike("tema", `%${trimmed}%`)
      .eq("ativo", true)
      .limit(6);

    if (matrixRows && matrixRows.length >= 2) {
      const unique = [...new Set(matrixRows.map(r => r.subtema))].slice(0, 6);
      if (unique.length >= 2) {
        return new Response(JSON.stringify({
          subtopics: unique,
          source: "matrix",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // 2. Fallback: AI suggestion
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ subtopics: [], source: "none" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Você é um especialista em medicina para provas de residência médica.

Para o tema "${trimmed}", liste entre 4 e 6 subtemas mais cobrados em provas de residência.

REGRAS:
- Apenas subtemas objetivos e relevantes para prova
- Não incluir dosagens, posologias ou condutas perigosas
- Cada subtema deve ter no máximo 5 palavras
- Retorne APENAS um JSON válido

Responda em JSON: {"subtopics": ["subtema1", "subtema2", ...]}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!resp.ok) {
      console.warn("AI subtopic suggestion failed:", resp.status);
      return new Response(JSON.stringify({ subtopics: [], source: "none" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        const subtopics = Array.isArray(parsed.subtopics)
          ? parsed.subtopics.filter((s: any) => typeof s === "string" && s.trim()).slice(0, 6)
          : [];
        return new Response(JSON.stringify({ subtopics, source: "ai" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch { /* fall through */ }
    }

    return new Response(JSON.stringify({ subtopics: [], source: "none" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-mnemonic-subtopics error:", e);
    return new Response(JSON.stringify({ subtopics: [], source: "none", error: e instanceof Error ? e.message : "Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
