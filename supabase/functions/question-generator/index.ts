import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = `Você é um gerador de questões especializado em provas de Residência Médica no Brasil (ENARE, USP, UNIFESP, Santa Casa, UERJ, SUS-SP, AMRIGS, entre outras).

FONTES DE REFERÊNCIA:
- Harrison (Clínica Médica), Sabiston (Cirurgia), Nelson (Pediatria), Williams (Ginecologia e Obstetrícia)
- Diretrizes do Ministério da Saúde, SBP, FEBRASGO, SBC, SBEM
- Protocolos ATLS, ACLS, PALS, BLS
- Provas anteriores do ENARE, USP, UNIFESP, Santa Casa

Suas responsabilidades:
- Gerar questões no estilo das principais bancas de residência médica (múltipla escolha com 4 ou 5 alternativas e questões de caso clínico)
- Cobrir as grandes áreas: Clínica Médica, Cirurgia, Pediatria, Ginecologia e Obstetrícia, Medicina Preventiva e Saúde Coletiva
- Criar questões com diferentes níveis de dificuldade
- Fornecer gabarito e explicação detalhada para cada questão
- Citar guidelines, protocolos e referências relevantes
- IMPORTANTE: Quando o aluno fornecer material de estudo, gere questões BASEADAS nesse material

Formato padrão para questões:
**Tópico:** [área - subtema]
**Questão:** [caso clínico ou enunciado direto]
a) [alternativa] b) [alternativa] c) [alternativa] d) [alternativa] e) [alternativa]
**Gabarito:** [letra correta]
**Explicação:** [explicação detalhada com fundamento em guidelines/protocolos]
📚 Referência: [fonte relevante]

Formato para Certo/Errado (estilo ENARE):
**Tópico:** [área - subtema]
**Questão:** [afirmação]
( ) Certo  ( ) Errado
**Gabarito:** [resposta]
**Explicação:** [explicação detalhada]
📚 Referência: [fonte relevante]

Regras:
- Sempre responda em português brasileiro
- Gere questões originais e de alta qualidade, priorizando casos clínicos
- Varie os temas dentro da área solicitada
- Se o usuário não especificar a área, pergunte qual deseja
- Quando solicitado, gere blocos de 5 ou 10 questões
- SEMPRE inclua a linha **Tópico:** antes de cada questão com a área e subtema
- Inclua diagnósticos diferenciais nas explicações quando pertinente
- Cite condutas e tratamentos atualizados conforme guidelines vigentes`;

    if (userContext) {
      systemPrompt += `\n\n--- MATERIAL DE ESTUDO DO ALUNO ---\n${userContext}\n--- FIM DO MATERIAL ---`;
    }

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
          ...messages,
        ],
        stream: true,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("question-generator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
