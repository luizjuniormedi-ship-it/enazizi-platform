import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import ENAZIZI_PROMPT from "../_shared/enazizi-prompt.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getPhasePrompt(phase: string, topic: string, performanceData: unknown): string {
  const base = ENAZIZI_PROMPT;

  switch (phase) {
    case "performance":
      return `${base}
FASE ATUAL: STATE 0 — PAINEL DE DESEMPENHO

Dados do aluno:
${JSON.stringify(performanceData || {}, null, 2)}

Mostre o painel organizado:
## 📊 Painel ENAZIZI
- Questões respondidas, Taxa de acerto, Pontuação discursiva
- Raciocínio clínico, Conduta terapêutica
- Nível estimado, Estimativa de preparo para residência
## 🧠 Domínio por Especialidade
## ⚠️ Temas Fracos
## 📈 Recomendação
Se não houver dados, informe e sugira começar.`;

    case "lesson":
      return `${base}
FASE ATUAL: BLOCOS TÉCNICOS (STATES 2-6)
Tema: "${topic || "solicitado pelo aluno"}"

ENSINE seguindo RIGOROSAMENTE o MARCADOR DE BLOCO.
NUNCA faça perguntas nesta fase até o final do bloco (active recall).

REGRA DE REPETIÇÃO ESPAÇADA (PRIORIDADE MÁXIMA):
- PODE repetir o mesmo tema/conceito, desde que haja pelo menos 2 blocos de INTERVALO
- Quando repetir, OBRIGATORIAMENTE use um ENFOQUE DIFERENTE (diagnóstico → tratamento → complicações)
- NUNCA repita o mesmo conceito em blocos CONSECUTIVOS
- QUANDO O ALUNO ERRAR: retome o tema com enfoque diferente nos próximos 3-5 blocos para REFORÇO AUTOMÁTICO
- Varie exemplos clínicos: NUNCA repita perfil de paciente (idade/sexo/cenário) em exemplos diferentes

Ao final: "Quando estiver pronto, avance para o Active Recall!"`;

    case "active-recall":
      return `${base}
FASE ATUAL: ACTIVE RECALL (STATES 3/5)
Tema: "${topic}"

Faça 5-7 perguntas CURTAS de recuperação ativa da memória.
Apresente TODAS numeradas. O aluno responderá e você corrigirá.
Foque em: mecanismos, diagnósticos, condutas, pontos de prova.
Se o aluno errar: resposta correta + raciocínio + revisão + ponto de prova.

⛔ REGRA ANTI-REPETIÇÃO (PRIORIDADE MÁXIMA):
- Cada pergunta DEVE abordar um conceito DIFERENTE (nunca 2 perguntas sobre o mesmo mecanismo/conduta)
- Distribua entre: fisiopatologia, diagnóstico, tratamento, complicações, epidemiologia, semiologia
- VERIFICAÇÃO: antes de finalizar, confirme que nenhuma pergunta testa o mesmo conhecimento que outra`;

    case "questions":
      return `${base}
FASE ATUAL: QUESTÃO OBJETIVA (STATE 7)
Tema: "${topic}"

Crie UM caso clínico COMPLETO E DETALHADO com questão de múltipla escolha (A-E).
Nível residência médica/Revalida. Apenas UMA questão. NÃO revele a resposta.

O CASO DEVE OBRIGATORIAMENTE CONTER:
- Paciente com nome fictício, idade exata, sexo, profissão
- Queixa principal com tempo de evolução preciso
- Antecedentes pessoais e medicações em uso (nome e dose)
- Sinais vitais COMPLETOS: PA, FC, FR, Temp, SpO2
- Exame físico DETALHADO com achados positivos E negativos relevantes
- Exames complementares com VALORES NUMÉRICOS reais quando indicado
- Alternativas TODAS plausíveis (nenhuma absurda), com distratores baseados em diagnósticos diferenciais legítimos
- Priorize apresentações ATÍPICAS ou casos que exijam raciocínio em múltiplas etapas

ANAMNESE ÚNICA (REGRA ABSOLUTA):
- NUNCA repita perfil de paciente já usado em questões anteriores da sessão
- Variar: nomes regionais brasileiros, idades de 0 a 95 anos, profissões diversas
- Alternar cenários: PS, enfermaria, UTI, UBS, SAMU, ambulatório, domicílio
- Variar comorbidades: DM, HAS, IRC, HIV, tabagismo, etilismo, gestante, imunossuprimido
- PROIBIDO: repetir perfil demográfico de paciente já apresentado

Diga: "Qual sua resposta? (A, B, C, D ou E)"`;

    case "discussion":
      return `${base}
FASE ATUAL: DISCUSSÃO DA QUESTÃO (STATE 8)
Tema: "${topic}"

Analise com TODOS estes elementos: alternativa correta, explicação simples, explicação técnica,
raciocínio clínico, diagnóstico diferencial, análise de CADA alternativa, ponto clássico de prova.
Se errou: informar incorreto → corrigir → revisar.
Perguntar: 1) continuar, 2) outra questão, 3) revisar conteúdo.`;

    case "discursive":
      return `${base}
FASE ATUAL: CASO CLÍNICO DISCURSIVO (STATE 9)
Tema: "${topic}"

Apresente caso clínico COMPLETO e de ALTO NÍVEL com:
- Paciente com nome, idade, sexo, profissão e contexto social
- História detalhada com tempo de evolução, fatores de melhora/piora
- Antecedentes pessoais com comorbidades e medicações (nome, dose)
- Sinais vitais completos + exame físico detalhado (achados positivos E negativos)
- Exames laboratoriais com valores numéricos reais e unidades
- Exames de imagem descritos quando pertinente

O caso deve ter complexidade suficiente para exigir raciocínio clínico em etapas.
Inclua pelo menos uma "armadilha" diagnóstica (apresentação atípica ou comorbidade que confunde).

⛔ REGRA ANTI-REPETIÇÃO (PRIORIDADE MÁXIMA):
- NUNCA repita perfil de paciente já usado em casos anteriores da sessão
- Varie: nome, idade, sexo, profissão, cenário clínico, comorbidades
- Aborde um SUBTÓPICO ou APRESENTAÇÃO CLÍNICA diferente dos casos anteriores
- VERIFICAÇÃO: antes de finalizar, confirme que este caso NÃO repete conceitos já explorados

Pergunte:
1. Qual o diagnóstico mais provável? Justifique com base nos achados.
2. Quais os principais diagnósticos diferenciais e como descartá-los?
3. Que exames complementares adicionais você solicitaria?
4. Qual a conduta terapêutica inicial? (medicações com dose, via e posologia)
Aguarde a resposta. Depois corrija com nota 0-5 por critério.`;

    case "scoring":
      return `${base}
FASE ATUAL: CORREÇÃO DISCURSIVA + ATUALIZAÇÃO (STATES 10-11)
Tema: "${topic}"

Dados da sessão:
${JSON.stringify(performanceData || {}, null, 2)}

Correção: diagnóstico 0-2, conduta 0-2, justificativa 0-1. Total X/5.
Depois: resposta esperada, explicação, raciocínio, erros clássicos, reforço.
Mostrar desempenho atualizado + temas fracos + próximo passo + mensagem motivacional.`;

    default:
      return `${base}
Siga o fluxo pedagógico dos STATES 0-12.
REGRA: NUNCA comece com questões. Sempre ensine primeiro. Nunca pule estados.`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, phase, topic, userContext, performanceData } = await req.json();

    let systemPrompt = getPhasePrompt(phase, topic, performanceData);
    if (userContext) {
      systemPrompt += `\n\n--- MATERIAL DE ESTUDO DO ALUNO ---\n${userContext}\n--- FIM DO MATERIAL ---`;
    }

    const response = await aiFetch({
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("study-session error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
