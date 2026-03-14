import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NON_MEDICAL_CONTENT_REGEX = /(direito|jur[ií]d|penal|constitucional|processo penal|inquérito|inqu[eé]rito|stf|stj|delegad|advogad|pol[ií]cia federal|c[oó]digo penal|a[cç][aã]o penal|inform[aá]tica|tecnologia da informa[cç][aã]o|engenharia|contabil|economia|administra[cç][aã]o)/i;
const MEDICAL_CONTENT_REGEX = /(medicin|sa[uú]de|paciente|diagn[oó]st|tratament|sintom|doen[cç]|fisiopat|farmac|anatom|cl[íi]nic|cirurg|pediatr|ginec|obstetr|preventiva|resid[eê]ncia|enare|revalida|protocolo|diretriz|sus)/i;

const isMedicalContent = (text: string) => MEDICAL_CONTENT_REGEX.test(text) && !NON_MEDICAL_CONTENT_REGEX.test(text);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { performanceData, examDate, dailyHours, completedTopics, weakAreas, flashcardsDue, recentErrors } = await req.json();
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const sanitizeTopicList = (value: unknown) => Array.isArray(value)
      ? value.map(String).filter((t) => isMedicalContent(t))
      : [];

    const safeCompletedTopics = sanitizeTopicList(completedTopics);
    const safeWeakAreas = sanitizeTopicList(weakAreas);
    const safeRecentErrors = sanitizeTopicList(recentErrors);

    const safePerformanceData = Object.fromEntries(
      Object.entries(performanceData || {}).filter(([k]) => isMedicalContent(k))
    );

    const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

    const systemPrompt = `Você é o Learning Optimization Agent, um agente de IA especializado em otimizar o estudo diário para Residência Médica.

⛔ RESTRIÇÃO ABSOLUTA DE ESCOPO:
Você SOMENTE pode gerar plano para MEDICINA, SAÚDE e CIÊNCIAS BIOMÉDICAS.
NUNCA inclua Direito, Engenharia, Informática ou áreas não médicas.

DATA DE HOJE: ${today}

Sua função é decidir EXATAMENTE o que o aluno deve estudar hoje, baseado em:
- Áreas fracas (erros recentes)
- Flashcards pendentes de revisão (SRS)
- Desempenho por área
- Tempo disponível
- Proximidade da prova

DADOS DO ALUNO:
- Data da prova: ${examDate || "Não definida"}
- Horas disponíveis hoje: ${dailyHours || 4}h
- Tópicos já estudados: ${JSON.stringify(safeCompletedTopics)}
- Áreas fracas: ${JSON.stringify(safeWeakAreas)}
- Flashcards pendentes: ${flashcardsDue || 0}
- Erros recentes: ${JSON.stringify(safeRecentErrors)}
- Desempenho geral: ${JSON.stringify(safePerformanceData)}

RETORNE um plano do dia estruturado em JSON com a seguinte estrutura:
{
  "greeting": "mensagem motivacional curta",
  "focus_areas": ["área1", "área2"],
  "blocks": [
    {
      "order": 1,
      "type": "study|review|practice|flashcards",
      "topic": "nome do tópico",
      "duration_minutes": 60,
      "description": "o que fazer neste bloco",
      "priority": "high|medium|low",
      "reason": "por que este bloco foi escolhido"
    }
  ],
  "total_minutes": 240,
  "tips": ["dica 1", "dica 2"],
  "review_reminder": "lembrete sobre revisões pendentes"
}

Regras:
- Priorize áreas com mais erros
- Inclua revisão SRS se houver flashcards pendentes
- Distribua entre teoria + prática
- Respeite o tempo disponível
- Se a prova está próxima (< 30 dias), foque em revisão e simulados
- Sempre em português brasileiro
- RETORNE APENAS O JSON, sem texto adicional`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Gere meu plano de estudo otimizado para hoje." },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse and sanitize JSON from response
    let plan: any;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse plan");
      plan = JSON.parse(jsonMatch[0]);
    } catch {
      return new Response(JSON.stringify({ error: "Falha ao processar plano diário gerado." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeFocusAreas = Array.isArray(plan?.focus_areas)
      ? plan.focus_areas.map(String).filter((t: string) => isMedicalContent(t))
      : [];

    const safeBlocks = Array.isArray(plan?.blocks)
      ? plan.blocks
          .map((b: any, i: number) => ({
            order: Number(b?.order ?? i + 1),
            type: String(b?.type || "study"),
            topic: String(b?.topic || "Revisão médica"),
            duration_minutes: Number(b?.duration_minutes || 30),
            description: String(b?.description || ""),
            priority: String(b?.priority || "medium"),
            reason: String(b?.reason || ""),
          }))
          .filter((b: any) => isMedicalContent(`${b.topic} ${b.description} ${b.reason}`))
      : [];

    if (safeBlocks.length === 0) {
      return new Response(JSON.stringify({ error: "A IA retornou um plano sem conteúdo médico válido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeTips = Array.isArray(plan?.tips)
      ? plan.tips.map(String).filter((tip: string) => !NON_MEDICAL_CONTENT_REGEX.test(tip))
      : [];

    const safePlan = {
      greeting: String(plan?.greeting || "Vamos focar na sua evolução médica hoje."),
      focus_areas: safeFocusAreas,
      blocks: safeBlocks,
      total_minutes: Number(plan?.total_minutes || safeBlocks.reduce((acc: number, b: any) => acc + b.duration_minutes, 0)),
      tips: safeTips,
      review_reminder: String(plan?.review_reminder || ""),
    };

    return new Response(JSON.stringify(safePlan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("learning-optimizer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
