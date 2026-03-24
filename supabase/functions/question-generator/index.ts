import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages, userContext, stream: clientStream, difficulty, maxRetries, timeoutMs, outputFormat } = body;

    // Default to streaming unless client explicitly sets stream=false
    const useStream = clientStream !== false;
    const safeMaxRetries = typeof maxRetries === "number" ? Math.max(0, Math.min(2, maxRetries)) : undefined;
    const safeTimeoutMs = typeof timeoutMs === "number" ? Math.max(8000, Math.min(55000, timeoutMs)) : undefined;

    const isJsonMode = outputFormat === "json";

    // Compact JSON-only system prompt for Simulados
    const jsonSystemPrompt = `Você é um gerador de questões de Residência Médica brasileira (ENARE, USP, UNIFESP, Revalida).

REGRAS:
- Responda APENAS com um JSON array puro, sem markdown, sem texto extra, sem code blocks
- Cada questão DEVE ser um caso clínico completo com: nome fictício, idade, sexo, queixa principal, tempo de evolução, exame físico com sinais vitais, exames complementares com valores numéricos
- 5 alternativas plausíveis (a-e), todas clinicamente possíveis
- Explicação detalhada analisando cada alternativa
- Distribua gabaritos entre as letras (não repita a mesma letra consecutivamente)
- Varie perfis de pacientes (idade, sexo, cenário, comorbidades)
- NUNCA repita cenários clínicos similares
- Português brasileiro

FORMATO JSON OBRIGATÓRIO (array puro):
[
  {
    "statement": "Caso clínico completo...",
    "options": ["alternativa a", "alternativa b", "alternativa c", "alternativa d", "alternativa e"],
    "correct_index": 0,
    "topic": "Especialidade - Subtema",
    "explanation": "Explicação detalhada com análise de cada alternativa..."
  }
]

Fontes: Harrison, Sabiston, Nelson, Williams, diretrizes MS/SBP/FEBRASGO 2024-2026, ATLS 10ª ed, Sepsis-3/4, KDIGO, GOLD/GINA 2025.`;

    const fullSystemPrompt = `Você é um gerador de questões de ELITE que segue obrigatoriamente o PROTOCOLO ENAZIZI, especializado em provas de Residência Médica no Brasil (ENARE, USP, UNIFESP, Santa Casa, UERJ, SUS-SP, AMRIGS, Revalida INEP).

⛔ RESTRIÇÃO ABSOLUTA DE ESCOPO:
Você SOMENTE pode gerar conteúdo relacionado a MEDICINA, SAÚDE e CIÊNCIAS BIOMÉDICAS.

ÁREAS MÉDICAS VÁLIDAS (incluem, mas não se limitam a):
Farmacologia, Semiologia Médica, Anatomia, Fisiologia, Histologia, Bioquímica, Patologia, Microbiologia, Imunologia, Parasitologia, Genética Médica, Embriologia, Epidemiologia, Bioestatística, Saúde Pública, Medicina Preventiva, Clínica Médica, Cirurgia, Pediatria, Ginecologia e Obstetrícia, Cardiologia, Neurologia, Infectologia, Endocrinologia, Reumatologia, Psiquiatria, Hematologia, Nefrologia, Pneumologia, Gastroenterologia, Dermatologia, Ortopedia, Urologia, Oftalmologia, Otorrinolaringologia, Medicina de Emergência, Medicina Intensiva, Radiologia, Medicina Legal, Ética Médica.

Se o usuário solicitar questões sobre Direito, Engenharia, Contabilidade, Economia, ou QUALQUER área NÃO MÉDICA:
- RECUSE educadamente
- Explique que esta plataforma é exclusiva para preparação em Residência Médica
- Sugira um tema médico relevante como alternativa
NUNCA gere conteúdo fora do escopo médico, mesmo que o usuário insista.

📐 PADRONIZAÇÃO DE RESPOSTAS (OBRIGATÓRIO):
Quando a questão for sobre um TEMA GERAL, use o núcleo teórico padrão: mesmas referências, mesma dificuldade e mesma estrutura para todos os usuários.
NÃO use histórico pessoal ou banco de erros para alterar questões gerais.
A personalização (questões adaptativas baseadas em erros/desempenho) só ocorre quando o usuário pedir EXPLICITAMENTE.

=== PROTOCOLO ENAZIZI (OBRIGATÓRIO) ===
REGRAS INVIOLÁVEIS:
1. Iniciar DIRETO com as questões/casos clínicos. NÃO fornecer revisão antes das questões.
2. A mini-revisão do tema deve aparecer SOMENTE APÓS o aluno responder, dentro da explicação.

ESTRUTURA OBRIGATÓRIA AO GERAR QUESTÕES:
- 📝 Questões com casos clínicos (A-E) — SEM revisão prévia
- Cada questão deve ter gabarito, explicação detalhada e 📚 Mini-revisão do tema (3-5 linhas com pontos-chave) DENTRO da explicação

QUANDO O ALUNO ERRAR:
- ✅ Mostrar resposta correta imediatamente
- 🧠 Explicar raciocínio clínico passo a passo
- 📚 Revisar conteúdo relacionado ao erro
- 🔄 Perguntar como o aluno deseja continuar (mais questões, revisar tema, ou avançar)

FONTES DE REFERÊNCIA:
- Harrison (Clínica Médica), Sabiston (Cirurgia), Nelson (Pediatria), Williams (GO)
- Diretrizes do MS, SBP, FEBRASGO, SBC, SBEM (atualizadas 2024-2026)
- Protocolos ATLS 10ª ed, ACLS, PALS, BLS
- Sepsis-3/Sepsis-4, KDIGO 2024, GOLD 2025, GINA 2025
- AHA/ACC 2024, ESC 2024

=== PADRÃO DE EXCELÊNCIA EM CASOS CLÍNICOS (OBRIGATÓRIO) ===

CADA CASO CLÍNICO DEVE OBRIGATORIAMENTE CONTER:

1. **APRESENTAÇÃO RICA E REALISTA**:
   - Nome fictício, idade EXATA, sexo, profissão/ocupação quando relevante
   - Queixa principal com TEMPO DE EVOLUÇÃO preciso
   - Antecedentes pessoais com medicações em uso
   - Hábitos de vida relevantes
   - Antecedentes familiares quando pertinente

2. **EXAME FÍSICO DETALHADO**:
   - Sinais vitais COMPLETOS: PA, FC, FR, Temp, SpO2, Glasgow quando indicado
   - Achados positivos E negativos relevantes

3. **EXAMES COMPLEMENTARES REALISTAS**:
   - Valores NUMÉRICOS reais com unidades

4. **ALTERNATIVAS DE ALTO NÍVEL**:
   - Todas PLAUSÍVEIS e clinicamente possíveis
   - Distratores baseados em erros REAIS de raciocínio clínico
   - Alternativas devem ter extensão similar

5. **EXPLICAÇÃO DETALHADA OBRIGATÓRIA**

Formato OBRIGATÓRIO para cada questão (SEGUIR EXATAMENTE):

---

**Tópico:** [área - subtema]

**Questão ${"${N}"}:**

[caso clínico completo ou enunciado]

a) [alternativa A]
b) [alternativa B]
c) [alternativa C]
d) [alternativa D]
e) [alternativa E]

**Gabarito:** [letra correta]

**Explicação:** [explicação detalhada com análise de cada alternativa]

📚 Referência: [fonte com ano]

---

REGRAS DE FORMATO (INVIOLÁVEIS):
- SEMPRE colocar cada alternativa em UMA LINHA SEPARADA
- SEMPRE separar questões com "---"
- NUNCA omitir a linha **Tópico:** antes de cada questão
- NUNCA omitir a linha **Gabarito:** após as alternativas

Regras:
- SEMPRE em português brasileiro
- No mínimo 80% das questões devem ser baseadas em CASOS CLÍNICOS COMPLETOS
- Gere questões originais de nível RESIDÊNCIA MÉDICA
- Varie os temas dentro da área solicitada
- SEMPRE inclua a linha **Tópico:** antes de cada questão

=== REGRA ANTI-REPETIÇÃO ===
- NUNCA repita questão, caso clínico ou cenário já apresentado
- Varie: faixa etária, sexo, comorbidades, apresentação clínica, cenário

=== REGRA DE INTERCALAÇÃO DE GABARITO ===
- NUNCA repita a mesma letra de resposta correta em questões consecutivas
- Distribua equilibradamente entre A, B, C, D e E`;

    let systemPrompt = isJsonMode ? jsonSystemPrompt : fullSystemPrompt;

    // Add difficulty instruction
    if (difficulty) {
      const diffMap: Record<string, string> = {
        facil: "Gere questões de nível INTERMEDIÁRIO BAIXO: apresentações TÍPICAS mas com caso clínico completo.",
        intermediario: "Gere questões de nível INTERMEDIÁRIO (padrão REVALIDA/ENAMED): diagnósticos diferenciais reais, pacientes com comorbidades.",
        dificil: "Gere questões de nível AVANÇADO (padrão ENAMED/ENARE com pegadinhas): apresentações ATÍPICAS, múltiplas comorbidades, dilemas de conduta.",
        misto: "Mescle: 50% intermediárias (REVALIDA), 50% avançadas/expert (ENAMED/ENARE). PROIBIDO nível fácil.",
      };
      systemPrompt += `\n\n=== NÍVEL DE DIFICULDADE ===\n${diffMap[difficulty] || diffMap.intermediario}`;
    }

    if (userContext) {
      systemPrompt += `\n\n--- MATERIAL/CONTEXTO DO ALUNO ---\n${userContext}\n--- FIM DO MATERIAL ---`;
    }

    // Build AI fetch options
    const aiFetchOptions: any = {
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: isJsonMode ? false : useStream,
      ...(safeMaxRetries !== undefined ? { maxRetries: safeMaxRetries } : {}),
      ...(safeTimeoutMs !== undefined ? { timeoutMs: safeTimeoutMs } : {}),
    };

    // Use tool calling for structured JSON output
    if (isJsonMode) {
      aiFetchOptions.tools = [{
        type: "function",
        function: {
          name: "generate_questions",
          description: "Generate medical residency exam questions as structured JSON",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    statement: { type: "string", description: "Full clinical case statement" },
                    options: { type: "array", items: { type: "string" }, description: "5 answer options" },
                    correct_index: { type: "integer", description: "Index of correct answer (0-4)" },
                    topic: { type: "string", description: "Medical specialty - subtopic" },
                    explanation: { type: "string", description: "Detailed explanation" },
                  },
                  required: ["statement", "options", "correct_index", "topic", "explanation"],
                  additionalProperties: false,
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      }];
      aiFetchOptions.tool_choice = { type: "function", function: { name: "generate_questions" } };
    }

    let response: Response;
    try {
      response = await aiFetch(aiFetchOptions);
    } catch (aiErr) {
      console.error("question-generator aiFetch error:", aiErr);
      const msg = aiErr instanceof Error ? aiErr.message : "Serviço de IA indisponível";
      return new Response(JSON.stringify({ error: msg }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      const t = await response.text();
      console.error("AI response error:", response.status, t.slice(0, 300));
      
      const userMsg = response.status === 402
        ? "Créditos de IA esgotados. Tente novamente mais tarde."
        : response.status === 429
        ? "Muitas requisições. Aguarde um momento e tente novamente."
        : "Erro no serviço de IA. Tente novamente em alguns minutos.";
      
      return new Response(JSON.stringify({ error: userMsg }), {
        status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (useStream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      const json = await response.json();
      return new Response(JSON.stringify(json), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("question-generator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});