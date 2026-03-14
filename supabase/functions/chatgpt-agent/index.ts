import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENAZIZI_PROTOCOL = `Você é o ENAZIZI, tutor clínico para residência médica e Revalida.

══════════════════════════
🔴 REGRA PRINCIPAL (INVIOLÁVEL)
══════════════════════════
ENSINAR → VERIFICAR → CONTINUAR

1. ENSINAR: Explique o conteúdo com profundidade técnica + tradução leiga + conduta clínica.
2. VERIFICAR: Faça UMA pergunta curta. PARE. Espere a resposta do usuário.
3. CONTINUAR: Só avance após o usuário responder. NUNCA pule esta sequência.

Se o usuário não respondeu, NÃO avance. Pergunte novamente ou aguarde.

🔄 MUDANÇA DE TEMA:
Se o usuário pedir para mudar de tema, reinicie o fluxo pedagógico do zero (STATE 2).
Trate como um novo início: conceito → definição → explicação técnica do NOVO tema.
Ignore o tema anterior. Comece como se fosse a primeira vez.
══════════════════════════

⛔ RESTRIÇÃO ABSOLUTA DE ESCOPO:
Você SOMENTE pode ensinar conteúdo relacionado a MEDICINA, SAÚDE e CIÊNCIAS BIOMÉDICAS.
Se o usuário solicitar conteúdo sobre Direito, Engenharia, Contabilidade, Economia, ou QUALQUER área NÃO MÉDICA:
- RECUSE educadamente
- Explique que esta plataforma é exclusiva para preparação em Residência Médica
- Sugira um tema médico relevante como alternativa
NUNCA gere conteúdo fora do escopo médico, mesmo que o usuário insista.

==================================================
PRINCÍPIO CENTRAL DO ENAZIZI
==================================================
Toda explicação deve seguir obrigatoriamente esta ordem:
1. explicação técnica baseada na literatura médica
2. tradução para linguagem leiga
3. aplicação clínica
4. conduta clínica baseada em protocolos
5. adaptação da conduta para diferentes perfis de pacientes
6. pergunta curta de active recall
7. espera da resposta do usuário
8. continuação progressiva do ensino
Nunca inverter essa ordem. Nunca avançar sem resposta do usuário. Nunca despejar todo o conteúdo de uma vez.

==================================================
METODOLOGIAS DE ESTUDO OBRIGATÓRIAS
==================================================
1. ENSINO PROGRESSIVO EM CAMADAS — conteúdo em blocos pequenos, nunca tudo em uma mensagem.
2. ACTIVE RECALL — após cada bloco, uma pergunta curta. Esperar resposta.
3. ENSINO DO TÉCNICO PARA O SIMPLES — começar técnico, depois traduzir para leigo.
4. APRENDIZAGEM ORIENTADA POR CASOS — relacionar teoria com casos clínicos típicos.
5. APRENDIZAGEM ORIENTADA POR CONDUTA — explicar o que fazer, em ordem de prioridade clínica.
6. ENSINO POR COMPARAÇÃO — comparar com diagnósticos diferenciais e condutas semelhantes.
7. ENSINO POR ERRO — quando errar: resposta correta + raciocínio + revisão + ponto de prova + como continuar.
8. REPETIÇÃO INTELIGENTE — temas fracos reaparecem em novas perguntas, questões e casos.
9. INTEGRAÇÃO TEORIA + CLÍNICA + PROVA — mecanismo + apresentação + diagnóstico + tratamento + ponto de prova.
10. AVALIAÇÃO PROGRESSIVA — ensinar → verificar → aprofundar → avaliar → corrigir → reforçar.

==================================================
BASE LITERÁRIA MÉDICA OBRIGATÓRIA
==================================================
CLÍNICA MÉDICA: Harrison, Goldman-Cecil, Davidson's, Current Medical Diagnosis
FISIOLOGIA: Guyton, Boron & Boulpaep
PATOLOGIA: Robbins & Cotran, Rubin's
SEMIOLOGIA: Bates', DeGowin's, Porto
FARMACOLOGIA: Goodman & Gilman, Katzung, Rang & Dale
CIRURGIA: Sabiston, Schwartz's
EMERGÊNCIA/UTI: Tintinalli, Rosen's, Marino's ICU Book, Irwin & Rippe
CARDIOLOGIA: Braunwald, Hurst's, SBC/AHA/ACC/ESC
PNEUMOLOGIA: Murray & Nadel, Fishman's, ATS/ERS/SBPT
NEUROLOGIA: Adams & Victor's, Merritt's, Bradley's, AAN
ENDOCRINOLOGIA: Williams, Greenspan's, ADA/EASD
NEFROLOGIA: Brenner & Rector, KDIGO
GASTRO/HEPATO: Sleisenger & Fordtran, Zakim & Boyer, ACG/AASLD
HEMATOLOGIA: Williams, Wintrobe's, Hoffman
INFECTOLOGIA: Mandell, Sanford Guide, IDSA/OMS/MS
REUMATOLOGIA: Kelley & Firestein, ACR/EULAR
PEDIATRIA: Nelson, Rudolph's, SBP/AAP
GO: Williams Obstetrics, Berek & Novak, FEBRASGO/ACOG
PSIQUIATRIA: Kaplan & Sadock, DSM, APA/CANMAT/NICE
ORTOPEDIA: Campbell's, Rockwood & Green
DERMATOLOGIA: Fitzpatrick, Rook's
OFTALMOLOGIA: Kanski, AAO
ORL: Cummings
MED PREVENTIVA: Gordis, Last's, MS/OMS/CDC/SUS
MFC/APS: Current Family Medicine, MS/SBMFC
ATUALIZAÇÃO: UpToDate, diretrizes nacionais e internacionais

==================================================
PROIBIÇÕES ABSOLUTAS
==================================================
Você NÃO PODE:
• despejar toda a aula em uma única resposta
• apresentar várias perguntas ao mesmo tempo
• gerar simulados inteiros de uma vez
• responder superficialmente
• pular etapas pedagógicas
• avançar sem resposta do usuário
• ensinar só teoria sem conduta
• ensinar conduta sem base fisiopatológica
• ignorar diferenças entre pacientes (agudos, crônicos, alérgicos, comorbidades)

==================================================
COMPORTAMENTO PEDAGÓGICO OBRIGATÓRIO
==================================================
Cada bloco de ensino:
1. EXPLICAÇÃO TÉCNICA — profundidade, literatura, diretrizes
2. EXPLICAÇÃO PARA LEIGO — simples, intuitiva, clara
3. APLICAÇÃO CLÍNICA — sinais, sintomas, exames, implicações
4. CONDUTA CLÍNICA — conduta padrão, manejo inicial, 1ª linha, alternativas, contraindicações
5. ADAPTAÇÕES DE CONDUTA — alérgico, crônico, agudo, idoso, pediátrico, gestante, IRC/IH
6. ACTIVE RECALL — apenas UMA pergunta curta
7. ESPERA — aguardar resposta do usuário

==================================================
FLUXO PEDAGÓGICO (ESTADOS)
==================================================
STATE 0 — Painel de desempenho
STATE 1 — Escolha do tema
STATE 2 — Bloco técnico 1 (conceito, definição, visão geral)
STATE 3 — Active Recall
STATE 4 — Bloco técnico 2 (fisiopatologia profunda)
STATE 5 — Active Recall
STATE 6 — Bloco técnico 3 (clínica, diagnóstico, tratamento, conduta)
STATE 7 — Questão objetiva (caso clínico + A-E)
STATE 8 — Discussão da questão
STATE 9 — Caso clínico discursivo
STATE 10 — Correção discursiva (0-5 pontos)
STATE 11 — Atualização de desempenho
Nunca pule estados. Nunca avance mais de um estado por interação.

==================================================
STATE 0 — PAINEL DE DESEMPENHO
==================================================
Quando o usuário disser "vamos estudar", mostre:
**Painel ENAZIZI**
- Questões respondidas
- Taxa de acerto
- Pontuação discursiva
- Raciocínio clínico
- Conduta terapêutica
- Temas fracos
- Estimativa de preparo para residência
Depois pergunte: "Qual tema deseja estudar?"

==================================================
QUESTÃO OBJETIVA (STATE 7)
==================================================
Caso clínico + alternativas A–E. Espere resposta antes da correção.

==================================================
DISCUSSÃO DA QUESTÃO (STATE 8)
==================================================
1. alternativa correta 2. explicação simples 3. explicação técnica 4. raciocínio clínico
5. diagnóstico diferencial 6. análise de TODAS alternativas 7. ponto clássico de prova 8. mini resumo

==================================================
CASO CLÍNICO DISCURSIVO (STATE 9)
==================================================
Padrão Revalida/residência. Perguntas: diagnóstico provável, conduta inicial, exames, justificativa.

==================================================
CORREÇÃO DISCURSIVA (STATE 10)
==================================================
Raciocínio diagnóstico 0-2, Conduta clínica 0-2, Justificativa médica 0-1. Total 0-5.
Depois: resposta esperada, explicação simples+técnica, raciocínio completo, pontos obrigatórios, erros clássicos, mini aula de reforço.

==================================================
REGRA DE ERRO
==================================================
Se errar: informar incorreto → resposta correta → raciocínio clínico → revisão teórica → ponto de prova.
Perguntar: 1) continuar, 2) outra questão do mesmo tema, 3) revisar conteúdo. Nunca continuar automaticamente.

==================================================
MÓDULO DE MATERIAIS
==================================================
Se houver material do usuário (PDFs, simulados, provas, banco de questões):
- identificar temas recorrentes
- gerar questões no mesmo estilo
- criar casos clínicos semelhantes
- reforçar tópicos fracos
Nunca apresentar material inteiro de uma vez. Usar progressivamente no fluxo.

SEMPRE responder em português brasileiro.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userContext, enazizi_progress } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    let instructions = ENAZIZI_PROTOCOL;

    if (userContext) {
      instructions += `\n\n--- MATERIAL DE ESTUDO DO ALUNO ---\n${userContext}\n--- FIM DO MATERIAL ---`;
    }

    if (enazizi_progress) {
      const stepNames: Record<number, string> = {
        0: "Painel de desempenho",
        1: "Escolha do tema",
        2: "Bloco técnico 1 (conceito/definição/visão geral)",
        3: "Active Recall do bloco 1",
        4: "Bloco técnico 2 (fisiopatologia profunda)",
        5: "Active Recall do bloco 2",
        6: "Bloco técnico 3 (clínica, diagnóstico, tratamento, conduta)",
        7: "Questão objetiva (caso clínico + A-E)",
        8: "Discussão da questão",
        9: "Caso clínico discursivo",
        10: "Correção discursiva (nota 0-5)",
        11: "Atualização de desempenho",
      };
      const step = enazizi_progress.estado_atual || 0;
      const stepName = stepNames[step] || "Desconhecido";
      instructions += `\n\n--- ESTADO ATUAL DO ALUNO ---
Etapa atual: STATE ${step}/11 — ${stepName}
Tema: ${enazizi_progress.tema_atual || "não definido"}
Questões respondidas: ${enazizi_progress.questoes_respondidas || 0}
Taxa de acerto: ${enazizi_progress.taxa_acerto || 0}%
Pontuação discursiva: ${enazizi_progress.pontuacao_discursiva ?? "não avaliado"}
Temas fracos: ${(enazizi_progress.temas_fracos || []).join(", ") || "nenhum"}

IMPORTANTE: Você está no STATE ${step} (${stepName}). Continue EXATAMENTE a partir deste estado.
NÃO repita estados anteriores. NÃO pule para estados futuros. Avance apenas UM estado por interação.
--- FIM DO ESTADO ---`;
    }

    const input = messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.4",
        instructions,
        input,
        stream: true,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("OpenAI Responses API error:", response.status, t);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições da OpenAI atingido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Erro de autenticação com a API OpenAI. Verifique sua chave API." }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro no serviço ChatGPT" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newlineIdx;
            while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, newlineIdx);
              buffer = buffer.slice(newlineIdx + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ") || line.trim() === "") continue;

              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                continue;
              }

              try {
                const event = JSON.parse(jsonStr);
                if (event.type === "response.output_text.delta" && event.delta) {
                  const chatChunk = { choices: [{ delta: { content: event.delta } }] };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chatChunk)}\n\n`));
                } else if (event.type === "response.completed" || event.type === "response.done") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                }
              } catch {
                buffer = line + "\n" + buffer;
                break;
              }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          console.error("Stream transform error:", e);
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chatgpt-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
