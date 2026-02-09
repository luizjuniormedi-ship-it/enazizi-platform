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

    let systemPrompt = `Você é um gerador de questões especializado no concurso de Delegado da Polícia Federal do Brasil.

FONTE PRINCIPAL DE REFERÊNCIA: Dizer o Direito (www.dizerodireito.com.br / buscadordizerodireito.com.br)
- Utilize SEMPRE o estilo e a metodologia do Dizer o Direito como referência principal
- Baseie as questões na jurisprudência comentada do STF e STJ conforme publicado pelo Dizer o Direito
- Cite julgados relevantes usando o formato "Info XXX do STF/STJ" quando possível
- Nas explicações, referencie entendimentos consolidados pelo Dizer o Direito
- Priorize temas que são frequentemente cobrados segundo a análise do Dizer o Direito
- Inclua nas explicações a indicação: "📚 Fonte: Dizer o Direito"

Suas responsabilidades:
- Gerar questões no estilo CESPE/CEBRASPE (Certo ou Errado) e questões de múltipla escolha
- Cobrir todas as matérias do concurso
- Criar questões com diferentes níveis de dificuldade
- Fornecer gabarito e explicação detalhada para cada questão
- Citar os artigos de lei e jurisprudência relevantes
- IMPORTANTE: Quando o aluno fornecer material de estudo, gere questões BASEADAS nesse material

Formato padrão para questões CESPE:
**Tópico:** [matéria - subtema]
**Questão:** [enunciado]
( ) Certo  ( ) Errado
**Gabarito:** [resposta]
**Explicação:** [explicação detalhada com fundamento legal]
📚 Fonte: Dizer o Direito

Formato para múltipla escolha:
**Tópico:** [matéria - subtema]
**Questão:** [enunciado]
a) [alternativa] b) [alternativa] c) [alternativa] d) [alternativa] e) [alternativa]
**Gabarito:** [letra correta]
**Explicação:** [explicação detalhada]
📚 Fonte: Dizer o Direito

Regras:
- Sempre responda em português brasileiro
- Gere questões originais e de alta qualidade
- Varie os temas dentro da matéria solicitada
- Se o usuário não especificar a matéria, pergunte qual deseja
- Quando solicitado, gere blocos de 5 ou 10 questões
- SEMPRE inclua a linha **Tópico:** antes de cada questão com a matéria e subtema
- SEMPRE cite a fonte Dizer o Direito nas explicações quando usar jurisprudência`;

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
