import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Plus, History, Trash2, FileText, ChevronDown, Check, Save, Sparkles, BookOpen, HelpCircle, Stethoscope, RefreshCw, BarChart3, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface Upload {
  id: string;
  filename: string;
  category: string | null;
  extracted_text: string | null;
}

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
  const [stats, setStats] = useState({ questionsAnswered: 0, correctAnswers: 0, sessionsCompleted: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`;

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

  // Load stats
  useEffect(() => {
    if (!user) return;
    const loadStats = async () => {
      const { count: attempts } = await supabase
        .from("practice_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      const { count: correct } = await supabase
        .from("practice_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("correct", true);
      const { count: sessions } = await supabase
        .from("chat_conversations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("agent_type", FUNCTION_NAME);
      setStats({
        questionsAnswered: attempts || 0,
        correctAnswers: correct || 0,
        sessionsCompleted: sessions || 0,
      });
    };
    loadStats();
  }, [user]);

  const buildUserContext = useCallback(() => {
    if (selectedUploadIds.size === 0) return "";
    let ctx = "";
    for (const upload of availableUploads) {
      if (!selectedUploadIds.has(upload.id)) continue;
      const snippet = upload.extracted_text?.slice(0, 2000) || "";
      if (ctx.length + snippet.length > 8000) break;
      ctx += `\n\n📄 ${upload.filename} (${upload.category || "material"}):\n${snippet}`;
    }
    return ctx.trim();
  }, [availableUploads, selectedUploadIds]);

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

  const startNewSession = () => {
    setActiveConversationId(null);
    setMessages([]);
    setStudyStarted(false);
    setCurrentTopic("");
    setTopic("");
    setShowHistory(false);
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

      // Final flush
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

  const handleStartStudy = () => {
    if (!topic.trim()) return;
    setStudyStarted(true);
    setCurrentTopic(topic);
    sendMessage(`Quero estudar o tema: ${topic}. Comece com a aula completa seguindo o Protocolo ENAZIZI.`);
  };

  const handlePhaseAction = (phase: string) => {
    const prompts: Record<string, string> = {
      "active-recall": `Agora faça o Active Recall sobre ${currentTopic}. Faça 5-7 perguntas curtas de memória ativa.`,
      "questions": `Agora crie uma questão de múltipla escolha (A-E) com caso clínico sobre ${currentTopic}. Não revele a resposta, espere eu responder.`,
      "discursive": `Agora crie um caso clínico discursivo sobre ${currentTopic}. Sem alternativas. Depois corrija com nota de 0 a 10.`,
      "review": `Revise o conteúdo de ${currentTopic}. Faça um resumo com os pontos principais, pegadinhas de prova e mnemônicos.`,
    };
    if (prompts[phase]) sendMessage(prompts[phase]);
  };

  const accuracyRate = stats.questionsAnswered > 0
    ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)
    : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
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
          <Button variant="outline" size="sm" onClick={startNewSession} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nova Sessão
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="gap-1.5">
            <History className="h-4 w-4" /> Histórico
          </Button>
        </div>
      </div>

      {/* Performance Panel */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Questões</p>
            <p className="text-lg font-bold">{stats.questionsAnswered}</p>
          </div>
        </div>
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Check className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Taxa de Acerto</p>
            <p className="text-lg font-bold">{accuracyRate}%</p>
          </div>
        </div>
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sessões</p>
            <p className="text-lg font-bold">{stats.sessionsCompleted}</p>
          </div>
        </div>
      </div>

      {/* Topic Input (shown when no study started) */}
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
            <Button onClick={handleStartStudy} className="glow gap-2 px-6" disabled={!topic.trim()}>
              <GraduationCap className="h-4 w-4" />
              Vamos estudar
            </Button>
          </div>

          {/* Upload context indicator */}
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

      {/* Chat area (shown when study started) */}
      {studyStarted && (
        <>
          {/* Current topic badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              📚 Estudando: {currentTopic}
            </span>
          </div>

          {/* Phase action buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
              onClick={() => handlePhaseAction("active-recall")}
              disabled={isLoading}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Active Recall
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
              onClick={() => handlePhaseAction("questions")}
              disabled={isLoading}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Questões A-E
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-violet-500/30 text-violet-500 hover:bg-violet-500/10"
              onClick={() => handlePhaseAction("discursive")}
              disabled={isLoading}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              Caso Discursivo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
              onClick={() => handlePhaseAction("review")}
              disabled={isLoading}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Revisar Conteúdo
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 glass-card p-4 overflow-y-auto space-y-4 mb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
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

          {/* Chat input */}
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
