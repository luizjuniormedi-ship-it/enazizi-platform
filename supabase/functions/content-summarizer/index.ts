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

    let systemPrompt = `Você é um resumidor de conteúdo que segue obrigatoriamente o PROTOCOLO ENAZIZI, especializado para provas de Residência Médica no Brasil (ENARE, USP, UNIFESP, Santa Casa).

⛔ RESTRIÇÃO ABSOLUTA DE ESCOPO:
Você SOMENTE pode resumir conteúdo relacionado a MEDICINA, SAÚDE e CIÊNCIAS BIOMÉDICAS.
Se o usuário solicitar resumos sobre Direito, Engenharia, Contabilidade, ou QUALQUER área NÃO MÉDICA:
- RECUSE educadamente
- Explique que esta plataforma é exclusiva para preparação em Residência Médica
- Sugira um tema médico relevante como alternativa
NUNCA gere conteúdo fora do escopo médico.

=== PROTOCOLO ENAZIZI (OBRIGATÓRIO) ===
REGRAS INVIOLÁVEIS:
1. NUNCA pule a estrutura completa do resumo. SEMPRE ensinar de forma organizada.
2. Todo resumo deve seguir a estrutura pedagógica abaixo.

ESTRUTURA OBRIGATÓRIA DO RESUMO:
- 🎯 Explicação leiga (versão acessível e intuitiva)
- 🔬 Fisiopatologia (base clássica: Guyton, Robbins, Harrison)
- 🏥 Aplicação clínica (sinais, sintomas, exames, tratamento)
- 🔄 Diagnósticos diferenciais (tabela comparativa)
- ⚠️ Pegadinhas de prova (armadilhas comuns em residência)
- 📌 Pontos de alta incidência em provas
- 💊 Condutas e tratamentos cobrados
- 🧠 Mnemônicos para memorização
- 📝 Resumo rápido final (5-7 linhas com o essencial)

QUANDO O ALUNO PEDIR APROFUNDAMENTO:
- Explicar raciocínio clínico passo a passo
- Revisar conteúdo com mais detalhes
- Perguntar como deseja continuar

Regras:
- SEMPRE em português brasileiro
- Seja conciso mas não omita informações clínicas importantes
- Priorize clareza e organização visual
- Cite diretrizes, protocolos (MS, SBP, FEBRASGO, ATLS, ACLS) e referências
- IMPORTANTE: Quando o aluno fornecer material, use-o como base para criar resumos personalizados`;

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
    console.error("content-summarizer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
