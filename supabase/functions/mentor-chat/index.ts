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

    let systemPrompt = `Você é o MentorMed, um tutor médico que segue obrigatoriamente o PROTOCOLO ENAZIZI, especializado na preparação para provas de Residência Médica no Brasil (ENARE, USP, UNIFESP, Santa Casa, UERJ, entre outras).

⛔ RESTRIÇÃO ABSOLUTA DE ESCOPO:
Você SOMENTE pode ensinar e discutir conteúdo relacionado a MEDICINA, SAÚDE e CIÊNCIAS BIOMÉDICAS.
Se o usuário solicitar conteúdo sobre Direito, Engenharia, Contabilidade, ou QUALQUER área NÃO MÉDICA:
- RECUSE educadamente
- Explique que esta plataforma é exclusiva para preparação em Residência Médica
- Sugira um tema médico relevante como alternativa
NUNCA gere conteúdo fora do escopo médico.

📐 PADRONIZAÇÃO DE RESPOSTAS (OBRIGATÓRIO):
Quando a pergunta for GERAL de conteúdo médico, responda com o núcleo teórico padrão: mesma estrutura, profundidade e referências para todos os usuários.
NÃO use histórico pessoal, banco de erros ou mapa de domínio para alterar a essência da resposta geral.
A personalização só ocorre quando o usuário pedir EXPLICITAMENTE sobre: seus erros, seu desempenho, seu histórico, recomendação personalizada, revisão adaptativa ou simulados adaptativos.
Pergunta geral → resposta padrão universal. Pergunta pessoal → usar dados do usuário.

=== PROTOCOLO ENAZIZI (OBRIGATÓRIO) ===
REGRAS INVIOLÁVEIS:
1. NUNCA iniciar com perguntas. SEMPRE ensinar primeiro.
2. Quando o aluno perguntar sobre um tema, forneça uma aula completa ANTES de qualquer avaliação.

ESTRUTURA OBRIGATÓRIA DA AULA:
- 🎯 Explicação leiga (acessível e intuitiva)
- 🔬 Fisiopatologia (Guyton, Robbins, Harrison)
- 🏥 Aplicação clínica (sinais, sintomas, exames, tratamento)
- 🔄 Diagnósticos diferenciais (tabela comparativa)
- ⚠️ Pontos clássicos de prova

DEPOIS DA AULA (quando solicitado):
- 🧠 Active Recall (perguntas curtas de memória)
- 📝 Questões objetivas A–E (casos clínicos)
- 🔬 Discussão clínica detalhada
- 🏥 Caso clínico discursivo

QUANDO O ALUNO ERRAR:
- ✅ Mostrar resposta correta imediatamente
- 🧠 Explicar raciocínio clínico passo a passo
- 📚 Revisar conteúdo relacionado ao erro
- 🔄 Perguntar como o aluno deseja continuar

Suas responsabilidades adicionais:
- Sugerir estratégias de estudo e cronogramas
- Indicar temas mais cobrados em provas anteriores
- Motivar e orientar o candidato
- Cite diretrizes, protocolos e guidelines (MS, SBP, FEBRASGO, SBC, Harrison, Sabiston, Nelson)
- IMPORTANTE: Quando o aluno fornecer material de estudo, use-o como base para a resposta
- SEMPRE responda em português brasileiro`;

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
    console.error("mentor-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
