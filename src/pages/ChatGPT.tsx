import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Plus, History, Trash2, FileText, ChevronDown, Check, Sparkles, BookOpen, HelpCircle, Stethoscope, RefreshCw, BarChart3, GraduationCap, LogOut, AlertTriangle, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

interface Conversation { id: string; title: string; created_at: string; }
interface Upload { id: string; filename: string; category: string | null; extracted_text: string | null; }

interface StudyPerformance {
  tema_atual: string | null;
  questoes_respondidas: number;
  taxa_acerto: number;
  pontuacao_discursiva: number | null;
  temas_fracos: string[];
  historico_estudo: Array<{ tema: string; data: string; questoes: number; acerto: number; discursiva: number | null }>;
}

interface EnaziziProgress {
  estado_atual: number;
  tema_atual: string | null;
  questoes_respondidas: number;
  taxa_acerto: number;
  pontuacao_discursiva: number | null;
  temas_fracos: string[];
  historico_estudo: string[];
}

const ENAZIZI_STEPS = [
  { num: 1, label: "Painel", icon: "📊" },
  { num: 2, label: "Tema", icon: "📚" },
  { num: 3, label: "Técnico 1", icon: "🔬" },
  { num: 4, label: "Leigo 1", icon: "💡" },
  { num: 5, label: "Técnico 2", icon: "🔬" },
  { num: 6, label: "Leigo 2", icon: "💡" },
  { num: 7, label: "Técnico 3", icon: "🏥" },
  { num: 8, label: "Leigo 3", icon: "💡" },
  { num: 9, label: "Questão", icon: "❓" },
  { num: 10, label: "Discussão", icon: "💬" },
  { num: 11, label: "Discursivo", icon: "✍️" },
  { num: 12, label: "Correção", icon: "✅" },
  { num: 13, label: "Atualizar", icon: "📈" },
  { num: 14, label: "Consolidação", icon: "🔁" },
];

const FUNCTION_NAME = "chatgpt-agent";

const ChatGPT = () => {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [studyStarted, setStudyStarted] = useState(false);
  const [currentTopic, setCurrentTopic] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [availableUploads, setAvailableUploads] = useState<Upload[]>([]);
  const [selectedUploadIds, setSelectedUploadIds] = useState<Set<string>>(new Set());
  const [showUploads, setShowUploads] = useState(false);
  const [performance, setPerformance] = useState<StudyPerformance>({
    tema_atual: null,
    questoes_respondidas: 0,
    taxa_acerto: 0,
    pontuacao_discursiva: null,
    temas_fracos: [],
    historico_estudo: [],
  });
  const [sessionQuestions, setSessionQuestions] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [enaziziStep, setEnaziziStep] = useState(1);
  const [changingTopic, setChangingTopic] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`;

  // Load performance + enazizi progress from DB
  useEffect(() => {
    if (!user) return;
    const loadPerformance = async () => {
      const { data } = await supabase
        .from("study_performance")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setPerformance({
          tema_atual: data.tema_atual,
          questoes_respondidas: data.questoes_respondidas,
          taxa_acerto: Number(data.taxa_acerto),
          pontuacao_discursiva: data.pontuacao_discursiva != null ? Number(data.pontuacao_discursiva) : null,
          temas_fracos: (data.temas_fracos as string[]) || [],
          historico_estudo: (data.historico_estudo as StudyPerformance["historico_estudo"]) || [],
        });
      }
      // Load enazizi step
      const { data: progress } = await supabase
        .from("enazizi_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (progress) {
        setEnaziziStep(progress.estado_atual || 1);
        if (progress.tema_atual && progress.estado_atual > 2) {
          // Resume session
          setCurrentTopic(progress.tema_atual);
        }
      }
    };
    loadPerformance();
  }, [user]);

  // Load uploads
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("uploads")
        .select("id, filename, extracted_text, category")
        .eq("status", "processed")
        .not("extracted_text", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data && data.length > 0) {
        setAvailableUploads(data);
        setSelectedUploadIds(new Set(data.map((u) => u.id)));
      }
    };
    load();
  }, [user]);

  // Load questions from bank for context
  const [bankQuestions, setBankQuestions] = useState<Array<{ statement: string; options: any; correct_index: number | null; explanation: string | null; topic: string | null }>>([]);

  useEffect(() => {
    if (!user || !currentTopic) { setBankQuestions([]); return; }
    const loadQuestions = async () => {
      const { data } = await supabase
        .from("questions_bank")
        .select("statement, options, correct_index, explanation, topic")
        .or(`user_id.eq.${user.id},is_global.eq.true`)
        .ilike("topic", `%${currentTopic}%`)
        .order("created_at", { ascending: false })
        .limit(10);
      setBankQuestions(data || []);
    };
    loadQuestions();
  }, [user, currentTopic]);

  const buildUserContext = useCallback(() => {
    let ctx = "";

    // Add uploaded materials
    for (const upload of availableUploads) {
      if (!selectedUploadIds.has(upload.id)) continue;
      const snippet = upload.extracted_text?.slice(0, 2000) || "";
      if (ctx.length + snippet.length > 6000) break;
      ctx += `\n\n📄 ${upload.filename} (${upload.category || "material"}):\n${snippet}`;
    }

    // Add questions bank
    if (bankQuestions.length > 0) {
      ctx += `\n\n📋 BANCO DE QUESTÕES DO ALUNO (${bankQuestions.length} questões sobre "${currentTopic}"):\n`;
      bankQuestions.slice(0, 5).forEach((q, i) => {
        ctx += `\nQ${i + 1}: ${q.statement.slice(0, 300)}`;
        if (q.options && Array.isArray(q.options)) {
          (q.options as string[]).forEach((opt: string, j: number) => {
            ctx += `\n  ${String.fromCharCode(65 + j)}) ${opt}`;
          });
        }
        if (q.correct_index != null) ctx += `\n  Gabarito: ${String.fromCharCode(65 + q.correct_index)}`;
        if (q.explanation) ctx += `\n  Explicação: ${q.explanation.slice(0, 200)}`;
      });
      ctx += `\n\nUSE estas questões como referência para o estilo, dificuldade e temas. Priorize CASOS CLÍNICOS.`;
    }

    return ctx.trim();
  }, [availableUploads, selectedUploadIds, bankQuestions, currentTopic]);

  const toggleUpload = (id: string) => {
    setSelectedUploadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_conversations")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .eq("agent_type", FUNCTION_NAME)
      .order("updated_at", { ascending: false })
      .limit(20);
    setConversations(data || []);
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadConversation = async (convId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data && data.length > 0) {
      setMessages(data.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
      setStudyStarted(true);
      setCurrentTopic("Sessão anterior");
    }
    setActiveConversationId(convId);
    setShowHistory(false);
  };

  const savePerformance = async (updates: Partial<StudyPerformance>) => {
    if (!user) return;
    const newPerf = { ...performance, ...updates };
    setPerformance(newPerf);

    const dbData = {
      user_id: user.id,
      tema_atual: newPerf.tema_atual,
      questoes_respondidas: newPerf.questoes_respondidas,
      taxa_acerto: newPerf.taxa_acerto,
      pontuacao_discursiva: newPerf.pontuacao_discursiva,
      temas_fracos: newPerf.temas_fracos as any,
      historico_estudo: newPerf.historico_estudo as any,
    };

    const { data: existing } = await supabase
      .from("study_performance")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("study_performance").update(dbData).eq("user_id", user.id);
    } else {
      await supabase.from("study_performance").insert(dbData);
    }
  };

  const saveEnaziziStep = async (step: number, tema?: string | null) => {
    if (!user) return;
    setEnaziziStep(step);
    const dbData = {
      user_id: user.id,
      estado_atual: step,
      tema_atual: tema !== undefined ? tema : currentTopic || null,
      questoes_respondidas: performance.questoes_respondidas + sessionQuestions,
      taxa_acerto: performance.taxa_acerto,
      pontuacao_discursiva: performance.pontuacao_discursiva,
      temas_fracos: performance.temas_fracos as any,
      historico_estudo: [] as any,
      ultima_interacao: new Date().toISOString(),
    };
    const { data: existing } = await supabase
      .from("enazizi_progress")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) {
      await supabase.from("enazizi_progress").update(dbData).eq("user_id", user.id);
    } else {
      await supabase.from("enazizi_progress").insert(dbData);
    }
  };

  const handleFinishSession = async () => {
    const totalQuestions = performance.questoes_respondidas + sessionQuestions;
    const totalCorrect = Math.round((performance.taxa_acerto / 100) * performance.questoes_respondidas) + sessionCorrect;
    const newAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    const sessionEntry = {
      tema: currentTopic,
      data: new Date().toISOString(),
      questoes: sessionQuestions,
      acerto: sessionQuestions > 0 ? Math.round((sessionCorrect / sessionQuestions) * 100) : 0,
      discursiva: null as number | null,
    };

    const newHistory = [...performance.historico_estudo, sessionEntry].slice(-50);

    await savePerformance({
      tema_atual: null,
      questoes_respondidas: totalQuestions,
      taxa_acerto: newAccuracy,
      historico_estudo: newHistory,
    });

    setSessionQuestions(0);
    setSessionCorrect(0);
    setStudyStarted(false);
    setCurrentTopic("");
    setMessages([]);
    setActiveConversationId(null);
    setEnaziziStep(1);
    await saveEnaziziStep(1, null);
    toast({ title: "Sessão finalizada!", description: `Dados salvos. ${sessionQuestions} questões nesta sessão.` });
  };

  const startNewSession = () => {
    setActiveConversationId(null);
    setMessages([]);
    setStudyStarted(false);
    setCurrentTopic("");
    setTopic("");
    setShowHistory(false);
    setSessionQuestions(0);
    setSessionCorrect(0);
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("chat_conversations").delete().eq("id", convId);
    if (activeConversationId === convId) startNewSession();
    loadConversations();
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !user) return;

    // Auto-detect topic change from chat input
    const topicChangeMatch = text.match(/(?:quero estudar|vamos estudar|mudar (?:tema|assunto) (?:para)?|agora (?:quero|vamos) (?:estudar)?)\s+(.+)/i);
    if (topicChangeMatch && studyStarted) {
      const detectedTopic = topicChangeMatch[1].replace(/[.!?]+$/, "").trim();
      if (detectedTopic && detectedTopic.toLowerCase() !== currentTopic.toLowerCase()) {
        setCurrentTopic(detectedTopic);
        setEnaziziStep(3);
        setChangingTopic(false);
        saveEnaziziStep(3, detectedTopic);
        savePerformance({ tema_atual: detectedTopic });
      }
    }

    const userMsg: Msg = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let convId = activeConversationId;
    if (!convId) {
      const convTitle = text.slice(0, 60);
      const { data: newConv } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id, agent_type: FUNCTION_NAME, title: convTitle })
        .select("id")
        .single();
      if (newConv) {
        convId = newConv.id;
        setActiveConversationId(convId);
      }
    }

    if (convId) {
      await supabase.from("chat_messages").insert({
        conversation_id: convId, user_id: user.id, role: "user", content: text,
      });
      await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
    }

    let assistantSoFar = "";
    const contextToSend = buildUserContext();

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          userContext: contextToSend || undefined,
          enazizi_progress: {
            estado_atual: enaziziStep,
            tema_atual: currentTopic || null,
            questoes_respondidas: performance.questoes_respondidas + sessionQuestions,
            taxa_acerto: performance.taxa_acerto,
            pontuacao_discursiva: performance.pontuacao_discursiva,
            temas_fracos: performance.temas_fracos,
          },
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        toast({ title: "Erro", description: errData.error || "Erro ao conectar com o ChatGPT", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m)));
            }
          } catch { /* ignore */ }
        }
      }

      if (convId && assistantSoFar) {
        await supabase.from("chat_messages").insert({
          conversation_id: convId, user_id: user.id, role: "assistant", content: assistantSoFar,
        });
        loadConversations();
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Erro", description: "Falha ao conectar com o ChatGPT.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const NON_MEDICAL_KEYWORDS = /\b(direito|jurídic|advocacia|contabil|engenharia|arquitetura|economia|finanças|marketing|administração de empresas|programação|software|TI\b|informática|matemática pura|filosofia|sociologia|letras|pedagogia)\b/i;

  const handleStartStudy = (overrideTopic?: string) => {
    const t = overrideTopic || topic;
    if (!t.trim()) return;
    if (NON_MEDICAL_KEYWORDS.test(t)) {
      toast({
        title: "⛔ Tema não médico",
        description: "Esta plataforma é exclusiva para Residência Médica. Por favor, escolha um tema de medicina.",
        variant: "destructive",
      });
      return;
    }
    setStudyStarted(true);
    setCurrentTopic(t);
    setSessionQuestions(0);
    setSessionCorrect(0);
    setEnaziziStep(3);
    savePerformance({ tema_atual: t });
    saveEnaziziStep(3, t);
    sendMessage(`Quero estudar o tema: ${t}. Comece com o Bloco Técnico 1 (conceito e definição — explicação técnica baseada na literatura). Estou na etapa 3/13 do Protocolo ENAZIZI.`);
  };


  const handleChangeTopic = () => {
    if (!newTopic.trim()) return;
    if (NON_MEDICAL_KEYWORDS.test(newTopic)) {
      toast({
        title: "⛔ Tema não médico",
        description: "Esta plataforma é exclusiva para Residência Médica.",
        variant: "destructive",
      });
      return;
    }
    setChangingTopic(false);
    setTopic(newTopic);
    // Reset flow to STATE 2 (concept) with new topic
    setMessages((prev) => [
      ...prev,
      { role: "user" as const, content: `--- MUDANÇA DE TEMA ---\nNovo tema: ${newTopic}` },
    ]);
    setCurrentTopic(newTopic);
    setEnaziziStep(3);
    saveEnaziziStep(3, newTopic);
    savePerformance({ tema_atual: newTopic });
    sendMessage(`MUDANÇA DE TEMA: Quero mudar para o tema "${newTopic}". Reinicie o fluxo pedagógico. Comece do STATE 2 — Bloco Técnico 1 (conceito e definição) sobre ${newTopic}.`);
    setNewTopic("");
  };

  const handlePhaseAction = (phase: string) => {
    const phaseMap: Record<string, { prompt: string; step: number }> = {
      "leigo1": {
        prompt: `Agora traduza o bloco técnico 1 sobre ${currentTopic} para linguagem leiga e faça UMA pergunta curta de active recall.`,
        step: 4,
      },
      "tecnico2": {
        prompt: `Agora avance para o Bloco Técnico 2 (fisiopatologia) sobre ${currentTopic}. Base: Guyton, Robbins, Harrison. Explicação técnica profunda.`,
        step: 5,
      },
      "leigo2": {
        prompt: `Agora traduza o bloco técnico 2 (fisiopatologia) sobre ${currentTopic} para linguagem leiga e faça UMA pergunta curta.`,
        step: 6,
      },
      "tecnico3": {
        prompt: `Agora avance para o Bloco Técnico 3 (aplicação clínica) sobre ${currentTopic}. Sinais, sintomas, exames, tratamento, diagnósticos diferenciais. Explicação técnica.`,
        step: 7,
      },
      "leigo3": {
        prompt: `Agora traduza o bloco técnico 3 (aplicação clínica) sobre ${currentTopic} para linguagem leiga e faça UMA pergunta curta.`,
        step: 8,
      },
      "questions": {
        prompt: `Agora crie 1 questão objetiva estilo prova médica com caso clínico e alternativas A–E sobre ${currentTopic}. Não revele a resposta, espere eu responder.`,
        step: 9,
      },
      "discussion": {
        prompt: `Agora faça a discussão completa da questão sobre ${currentTopic}: alternativa correta, explicação simples+técnica, raciocínio clínico, diferenciais, análise de todas alternativas, ponto de prova, mini resumo.`,
        step: 10,
      },
      "discursive": {
        prompt: `Agora crie um caso clínico discursivo sobre ${currentTopic}. Pergunte: diagnóstico provável, conduta inicial, exames necessários, justificativa clínica.`,
        step: 11,
      },
      "correction": {
        prompt: `Corrija minha resposta discursiva com nota de 0-5 (Diagnóstico 0-2, Conduta 0-2, Justificativa 0-1). Depois apresente: resposta esperada, explicação simples+técnica, raciocínio clínico completo, pontos obrigatórios, erros clássicos, mini aula de reforço.`,
        step: 12,
      },
      "update": {
        prompt: `Atualize meu painel de desempenho com base nesta sessão sobre ${currentTopic}. Mostre: questões respondidas, taxa de acerto, temas fracos, desempenho clínico e discursivo.`,
        step: 13,
      },
      "consolidation": {
        prompt: `Agora inicie o BLOCO DE CONSOLIDAÇÃO sobre ${currentTopic}. Gere 5 questões objetivas sequenciais (uma por vez, espere minha resposta antes de enviar a próxima). Cada questão deve ter caso clínico curto + alternativas A–E. Após cada resposta, diga se acertou ou errou com breve explicação. Ao final das 5, apresente um resumo: acertos/erros, taxa, pontos fracos detectados e recomendação de próximo tema.`,
        step: 14,
      },
    };
    const action = phaseMap[phase];
    if (action) {
      setEnaziziStep(action.step);
      saveEnaziziStep(action.step);
      sendMessage(action.prompt);
    }
  };

  const recentHistory = performance.historico_estudo.slice(-5).reverse();

  return (
    <div className={`flex flex-col animate-fade-in ${isFullscreen ? "fixed inset-0 z-50 bg-background p-4" : "h-[calc(100vh-4rem)]"}`}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            ChatGPT Médico
          </h1>
          <p className="text-muted-foreground">Agente principal — Protocolo ENAZIZI com GPT-4o</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)} className="gap-1.5" title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullscreen ? "Sair" : "Tela cheia"}
          </Button>
          {studyStarted && (
            <Button variant="destructive" size="sm" onClick={handleFinishSession} className="gap-1.5">
              <LogOut className="h-4 w-4" /> Finalizar Sessão
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={startNewSession} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nova
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="gap-1.5">
            <History className="h-4 w-4" /> Histórico
          </Button>
        </div>
      </div>

      {/* Performance Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Questões</p>
            <p className="text-lg font-bold">{performance.questoes_respondidas}</p>
          </div>
        </div>
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Check className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Taxa de Acerto</p>
            <p className="text-lg font-bold">{performance.taxa_acerto}%</p>
          </div>
        </div>
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nota Discursiva</p>
            <p className="text-lg font-bold">{performance.pontuacao_discursiva != null ? `${performance.pontuacao_discursiva}/10` : "—"}</p>
          </div>
        </div>
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sessões</p>
            <p className="text-lg font-bold">{performance.historico_estudo.length}</p>
          </div>
        </div>
      </div>

      {/* Weak topics & recent history (only on start screen) */}
      {!studyStarted && (performance.temas_fracos.length > 0 || recentHistory.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {performance.temas_fracos.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Temas Fracos
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {performance.temas_fracos.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setTopic(t)}
                    className="px-2.5 py-1 rounded-full text-xs bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
          {recentHistory.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                <History className="h-4 w-4 text-muted-foreground" />
                Últimas Sessões
              </h3>
              <div className="space-y-1.5">
                {recentHistory.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <button
                      onClick={() => setTopic(h.tema)}
                      className="text-foreground hover:text-primary transition-colors truncate mr-2"
                    >
                      {h.tema}
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-muted-foreground">{new Date(h.data).toLocaleDateString("pt-BR")}</span>
                      <span className={`font-medium ${h.acerto >= 70 ? "text-emerald-500" : h.acerto >= 50 ? "text-amber-500" : "text-destructive"}`}>
                        {h.acerto}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Topic Input */}
      {!studyStarted && (
        <div className="glass-card p-6 mb-4 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">O que você quer estudar?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Digite o tema e o ChatGPT seguirá o Protocolo ENAZIZI completo
            </p>
          </div>
          <div className="flex gap-2 max-w-lg mx-auto">
            <Input
              placeholder="Ex: Sepse, IAM, Pneumonia, TEP..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStartStudy()}
              className="bg-secondary border-border text-base"
            />
            <Button onClick={() => handleStartStudy()} className="glow gap-2 px-6" disabled={!topic.trim()}>
              <GraduationCap className="h-4 w-4" />
              Vamos estudar
            </Button>
          </div>

          <button
            onClick={() => availableUploads.length > 0 && setShowUploads(!showUploads)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors mx-auto ${
              availableUploads.length > 0
                ? selectedUploadIds.size > 0
                  ? "bg-primary/10 text-primary hover:bg-primary/15"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            {availableUploads.length === 0 ? (
              <span>Nenhum material disponível</span>
            ) : (
              <>
                <span>{selectedUploadIds.size} de {availableUploads.length} materiais como contexto</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showUploads ? "rotate-180" : ""}`} />
              </>
            )}
          </button>

          {showUploads && availableUploads.length > 0 && (
            <div className="glass-card p-3 max-h-40 overflow-y-auto space-y-1 max-w-lg mx-auto text-left">
              {availableUploads.map((u) => (
                <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary cursor-pointer text-xs">
                  <Checkbox checked={selectedUploadIds.has(u.id)} onCheckedChange={() => toggleUpload(u.id)} className="h-3.5 w-3.5" />
                  <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{u.filename}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History panel */}
      {showHistory && (
        <div className="glass-card p-3 mb-4 max-h-48 overflow-y-auto space-y-1">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">Nenhuma conversa salva.</p>
          ) : conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => loadConversation(c.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                activeConversationId === c.id ? "bg-primary/10 text-primary" : "hover:bg-secondary"
              }`}
            >
              <span className="truncate flex-1 mr-2">{c.title}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</span>
                <button onClick={(e) => deleteConversation(c.id, e)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat area */}
      {studyStarted && (
        <>
          {/* Step Progress Indicator */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                📚 {currentTopic}
              </span>
              <span className="px-3 py-1 rounded-full bg-secondary text-muted-foreground text-xs">
                Etapa {enaziziStep}/13
              </span>
              {sessionQuestions > 0 && (
                <span className="px-3 py-1 rounded-full bg-secondary text-muted-foreground text-xs">
                  {sessionQuestions}Q • {Math.round((sessionCorrect / sessionQuestions) * 100)}%
                </span>
              )}
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 ml-auto" onClick={() => setChangingTopic(!changingTopic)} disabled={isLoading}>
                <RefreshCw className="h-3 w-3" /> Mudar Tema
              </Button>
            </div>
            {changingTopic && (
              <div className="flex gap-2 mb-2 max-w-md">
                <Input
                  placeholder="Novo tema médico..."
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChangeTopic()}
                  className="bg-secondary border-border text-sm h-8"
                  autoFocus
                />
                <Button size="sm" className="h-8 text-xs" onClick={handleChangeTopic} disabled={!newTopic.trim()}>
                  Iniciar
                </Button>
              </div>
            )}
            <div className="flex gap-0.5">
              {ENAZIZI_STEPS.map((s) => (
                <div
                  key={s.num}
                  title={`${s.num}. ${s.label}`}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    s.num < enaziziStep
                      ? "bg-primary"
                      : s.num === enaziziStep
                      ? "bg-primary/60 animate-pulse"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {ENAZIZI_STEPS.map((s) => (
                <span
                  key={s.num}
                  className={`text-[9px] ${
                    s.num === enaziziStep ? "text-primary font-bold" : "text-muted-foreground"
                  }`}
                >
                  {s.icon}
                </span>
              ))}
            </div>
          </div>

          {/* Phase action buttons — show next logical step */}
          <div className="flex flex-wrap gap-2 mb-3">
            {enaziziStep === 3 && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handlePhaseAction("leigo1")} disabled={isLoading}>
                <BookOpen className="h-3.5 w-3.5" /> 💡 Tradução Leiga + Pergunta
              </Button>
            )}
            {enaziziStep === 4 && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handlePhaseAction("tecnico2")} disabled={isLoading}>
                <BookOpen className="h-3.5 w-3.5" /> 🔬 Bloco Técnico 2 — Fisiopatologia
              </Button>
            )}
            {enaziziStep === 5 && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handlePhaseAction("leigo2")} disabled={isLoading}>
                <BookOpen className="h-3.5 w-3.5" /> 💡 Tradução Leiga 2 + Pergunta
              </Button>
            )}
            {enaziziStep === 6 && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handlePhaseAction("tecnico3")} disabled={isLoading}>
                <BookOpen className="h-3.5 w-3.5" /> 🏥 Bloco Técnico 3 — Clínica
              </Button>
            )}
            {enaziziStep === 7 && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handlePhaseAction("leigo3")} disabled={isLoading}>
                <BookOpen className="h-3.5 w-3.5" /> 💡 Tradução Leiga 3 + Pergunta
              </Button>
            )}
            {enaziziStep === 8 && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handlePhaseAction("questions")} disabled={isLoading}>
                <HelpCircle className="h-3.5 w-3.5" /> ❓ Questão Objetiva
              </Button>
            )}
            {enaziziStep === 9 && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handlePhaseAction("discussion")} disabled={isLoading}>
                <HelpCircle className="h-3.5 w-3.5" /> 💬 Discussão
              </Button>
            )}
            {enaziziStep === 10 && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handlePhaseAction("discursive")} disabled={isLoading}>
                <Stethoscope className="h-3.5 w-3.5" /> ✍️ Caso Discursivo
              </Button>
            )}
            {enaziziStep === 11 && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handlePhaseAction("correction")} disabled={isLoading}>
                <Check className="h-3.5 w-3.5" /> ✅ Correção
              </Button>
            )}
            {enaziziStep === 12 && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handlePhaseAction("update")} disabled={isLoading}>
                <BarChart3 className="h-3.5 w-3.5" /> 📈 Atualizar Desempenho
              </Button>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 glass-card p-4 overflow-y-auto space-y-4 mb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user" ? "max-w-[75%] bg-primary text-primary-foreground" : "w-full bg-secondary text-secondary-foreground"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-accent" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-xl px-4 py-3 bg-secondary">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Digite sua resposta ou dúvida..."
              className="bg-secondary border-border"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              disabled={isLoading}
            />
            <Button onClick={() => sendMessage(input)} size="icon" className="glow flex-shrink-0" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatGPT;
