import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Send, Bot, User, Loader2, Plus, History, Trash2, BookOpen, Maximize2, Minimize2 } from "lucide-react";
import ModuleHelpButton from "@/components/layout/ModuleHelpButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import InteractiveQuestionRenderer from "@/components/agents/InteractiveQuestionRenderer";

type Msg = { role: "user" | "assistant"; content: string };
interface Conversation { id: string; title: string; created_at: string; }

const SPECIALTIES = [
  "Clínica Médica", "Cirurgia", "Pediatria", "Ginecologia e Obstetrícia",
  "Medicina Preventiva", "Urgência e Emergência", "Cardiologia", "Neurologia",
  "Infectologia", "Pneumologia", "Gastroenterologia", "Ortopedia",
  "Dermatologia", "Hematologia", "Oncologia", "Reumatologia",
  "Urologia", "Psiquiatria", "Medicina de Emergência", "Terapia Intensiva",
];

const DIFFICULTIES = [
  { value: "intermediario", label: "🟡 Intermediário" },
  { value: "avancado", label: "🟠 Avançado" },
  { value: "expert", label: "🔴 Expert" },
];

const AGENT_TYPE = "medical-chronicle";
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medical-chronicle`;

const MedicalChronicles = () => {
  const { user } = useAuth();
  const [specialty, setSpecialty] = useState("Clínica Médica");
  const [subtopic, setSubtopic] = useState("");
  const [difficulty, setDifficulty] = useState("avancado");
  const [studyStarted, setStudyStarted] = useState(false);
  const [currentTopic, setCurrentTopic] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_conversations")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .eq("agent_type", AGENT_TYPE)
      .order("updated_at", { ascending: false })
      .limit(20);
    setConversations(data || []);
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

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

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("chat_conversations").delete().eq("id", convId);
    if (activeConversationId === convId) startNewSession();
    loadConversations();
  };

  const startNewSession = () => {
    setActiveConversationId(null);
    setMessages([]);
    setStudyStarted(false);
    setCurrentTopic("");
    setSubtopic("");
    setShowHistory(false);
  };

  const streamResponse = async (body: Record<string, any>, allMessages: Msg[]) => {
    setIsLoading(true);
    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        toast({ title: "Erro", description: errData.error || `Erro ${resp.status}`, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      const appendChunk = (content: string) => {
        if (!content) return;
        assistantSoFar += content;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      const processSseLine = (rawLine: string): "ok" | "done" | "incomplete" => {
        let line = rawLine;
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") return "ok";
        if (!line.startsWith("data: ")) return "ok";
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") return "done";
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) appendChunk(content);
          return "ok";
        } catch {
          return "incomplete";
        }
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = textBuffer.indexOf("\n")) !== -1) {
          const line = textBuffer.slice(0, idx);
          textBuffer = textBuffer.slice(idx + 1);
          const result = processSseLine(line);
          if (result === "done") { streamDone = true; break; }
          if (result === "incomplete") { textBuffer = `${line}\n${textBuffer}`; break; }
        }
      }

      textBuffer += decoder.decode();
      if (textBuffer.trim()) {
        for (const line of textBuffer.split("\n")) {
          if (!line) continue;
          const result = processSseLine(line);
          if (result === "done") break;
        }
      }

      // Save to DB
      if (user && assistantSoFar) {
        let convId = activeConversationId;
        if (!convId) {
          const title = currentTopic ? `Crônica: ${currentTopic}` : "Crônica Médica";
          const { data: newConv } = await supabase
            .from("chat_conversations")
            .insert({ user_id: user.id, agent_type: AGENT_TYPE, title: title.slice(0, 60) })
            .select("id")
            .single();
          if (newConv) {
            convId = newConv.id;
            setActiveConversationId(convId);
          }
        }
        if (convId) {
          // Save user message if it was a follow-up
          const lastUserMsg = allMessages[allMessages.length - 1];
          if (lastUserMsg?.role === "user") {
            await supabase.from("chat_messages").insert({
              conversation_id: convId, user_id: user.id, role: "user", content: lastUserMsg.content,
            });
          }
          await supabase.from("chat_messages").insert({
            conversation_id: convId, user_id: user.id, role: "assistant", content: assistantSoFar,
          });
          await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
          loadConversations();
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Erro", description: "Falha ao gerar crônica.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChronicle = () => {
    const topicLabel = subtopic.trim() ? `${specialty} — ${subtopic.trim()}` : specialty;
    setStudyStarted(true);
    setCurrentTopic(topicLabel);

    const userMsg: Msg = { role: "user", content: `Crie uma Crônica Médica sobre **${topicLabel}** (nível ${difficulty})` };
    setMessages([userMsg]);

    streamResponse(
      { specialty, subtopic: subtopic.trim() || undefined, difficulty },
      [userMsg],
    );
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !user) return;
    const userMsg: Msg = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");

    streamResponse(
      { messages: allMessages.map(m => ({ role: m.role, content: m.content })) },
      allMessages,
    );
  };

  const QUICK_ACTIONS = [
    { label: "🔥 Nível Extremo", prompt: "Agora evolua para nível extremo: adicione complicações graves (choque, arritmia, insuficiência respiratória). Crie uma nova crônica com armadilhas múltiplas e decisão sob pressão máxima." },
    { label: "❓ Mais Questões", prompt: "Gere mais 3 questões de prova sobre o tema desta crônica, estilo USP/ENARE, com gabarito comentado." },
    { label: "🔬 Aprofundar", prompt: "Aprofunde a fisiopatologia do caso desta crônica. Explique os mecanismos moleculares e celulares envolvidos." },
    { label: "⚖️ Diferenciais", prompt: "Faça uma discussão completa dos diagnósticos diferenciais deste caso, com tabela comparativa detalhada." },
    { label: "📖 Nova Crônica", prompt: "Crie uma nova crônica médica completa sobre um tema diferente da mesma especialidade, mantendo o nível de dificuldade." },
  ];

  const content = (
    <div className={`flex flex-col animate-fade-in min-w-0 ${isFullscreen ? "fixed inset-0 z-[100] bg-background p-2 sm:p-4" : "h-[calc(100vh-7rem)] sm:h-[calc(100vh-4rem)]"}`}>
      {/* Header */}
      <div className="mb-2 sm:mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2 truncate">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <span className="truncate">Crônicas Médicas</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">Aprenda medicina através de narrativas clínicas imersivas</p>
        </div>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0 flex-wrap justify-end items-center">
          <ModuleHelpButton moduleKey="cronicas" moduleName="Crônicas Médicas" steps={[
            "Escolha a especialidade, subtema e nível de dificuldade",
            "A IA gera uma crônica imersiva onde VOCÊ é o médico no plantão",
            "Acompanhe o raciocínio clínico, armadilhas e decisões",
            "Responda a questão de prova ao final da crônica",
            "Use os botões rápidos para aprofundar, pedir questões extras ou nova crônica",
            "Converse livremente para tirar dúvidas sobre o caso",
          ]} />
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)} className="gap-1 h-8 px-2 text-xs" title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{isFullscreen ? "Sair" : "Tela cheia"}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={startNewSession} className="gap-1 h-8 px-2 text-xs">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nova</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="gap-1 h-8 px-2 text-xs">
            <History className="h-4 w-4" /> <span className="hidden sm:inline">Histórico</span>
          </Button>
        </div>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="glass-card p-3 mb-4 max-h-48 overflow-y-auto space-y-1">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">Nenhuma crônica salva.</p>
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

      {/* Topic Selection */}
      {!studyStarted && (
        <div className="glass-card p-4 sm:p-6 mb-3 sm:mb-4 text-center space-y-4">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Escolha o tema da crônica</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Você será imerso em um caso clínico cinematográfico — como se estivesse no plantão
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Especialidade</label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger className="bg-secondary border-border text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Subtema (opcional)</label>
              <Input
                placeholder="Ex: IAM, Dengue, Meningite..."
                value={subtopic}
                onChange={e => setSubtopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleStartChronicle()}
                className="bg-secondary border-border text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Dificuldade</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="bg-secondary border-border text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleStartChronicle} className="glow gap-2 px-6" size="lg">
            <BookOpen className="h-5 w-5" />
            Gerar Crônica
          </Button>
        </div>
      )}

      {/* Chat area */}
      {studyStarted && (
        <>
          {/* Topic indicator */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium truncate max-w-[60%]">
              📖 {currentTopic}
            </span>
          </div>

          {/* Quick action buttons */}
          {messages.length >= 2 && !isLoading && (
            <div className="flex flex-wrap gap-1.5 mb-2 overflow-x-auto">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 flex-shrink-0"
                  onClick={() => sendMessage(action.prompt)}
                  disabled={isLoading}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 glass-card p-2 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 mb-2 sm:mb-4 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 sm:gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                )}
                <div className={`rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm leading-relaxed ${
                  msg.role === "user" ? "max-w-[85%] sm:max-w-[75%] bg-primary text-primary-foreground" : "w-full bg-secondary text-secondary-foreground"
                }`}>
                  {msg.role === "assistant" ? (
                    <InteractiveQuestionRenderer content={msg.content} />
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-2 sm:gap-3">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </div>
                <div className="rounded-xl px-4 py-3 bg-secondary">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Pergunte sobre o caso, peça aprofundamento..."
              className="bg-secondary border-border text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              disabled={isLoading}
            />
            <Button onClick={() => sendMessage(input)} size="icon" className="glow flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  if (isFullscreen) return createPortal(content, document.body);
  return content;
};

export default MedicalChronicles;
