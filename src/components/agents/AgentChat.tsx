import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Plus, History, Trash2, FileText, ChevronDown, Check } from "lucide-react";
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

interface AgentChatProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  welcomeMessage: string;
  placeholder: string;
  functionName: string;
}

const AgentChat = ({ title, subtitle, icon, welcomeMessage, placeholder, functionName }: AgentChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [availableUploads, setAvailableUploads] = useState<Upload[]>([]);
  const [selectedUploadIds, setSelectedUploadIds] = useState<Set<string>>(new Set());
  const [showUploads, setShowUploads] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;

  // Load user uploads
  useEffect(() => {
    if (!user) return;
    const loadUploads = async () => {
      const { data } = await supabase
        .from("uploads")
        .select("id, filename, extracted_text, category")
        .eq("user_id", user.id)
        .eq("status", "processed")
        .not("extracted_text", "is", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data && data.length > 0) {
        setAvailableUploads(data);
        // Select all by default
        setSelectedUploadIds(new Set(data.map((u) => u.id)));
      }
    };
    loadUploads();
  }, [user]);

  // Build context from selected uploads
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

  const toggleAll = () => {
    if (selectedUploadIds.size === availableUploads.length) {
      setSelectedUploadIds(new Set());
    } else {
      setSelectedUploadIds(new Set(availableUploads.map((u) => u.id)));
    }
  };

  // Load conversation list
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_conversations")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .eq("agent_type", functionName)
      .order("updated_at", { ascending: false })
      .limit(20);
    setConversations(data || []);
  }, [user, functionName]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadConversation = async (convId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data && data.length > 0) {
      setMessages(data.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
    } else {
      setMessages([{ role: "assistant", content: welcomeMessage }]);
    }
    setActiveConversationId(convId);
    setShowHistory(false);
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([{ role: "assistant", content: welcomeMessage }]);
    setShowHistory(false);
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("chat_conversations").delete().eq("id", convId);
    if (activeConversationId === convId) startNewConversation();
    loadConversations();
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMsg: Msg = { role: "user", content: input };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let convId = activeConversationId;
    if (!convId) {
      const convTitle = input.slice(0, 60);
      const { data: newConv } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id, agent_type: functionName, title: convTitle })
        .select("id")
        .single();
      if (newConv) {
        convId = newConv.id;
        setActiveConversationId(convId);
        await supabase.from("chat_messages").insert({
          conversation_id: convId, user_id: user.id, role: "assistant", content: welcomeMessage,
        });
      }
    }

    if (convId) {
      await supabase.from("chat_messages").insert({
        conversation_id: convId, user_id: user.id, role: "user", content: input,
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
        toast({ title: "Erro", description: errData.error || "Erro ao conectar com o agente IA", variant: "destructive" });
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
      toast({ title: "Erro", description: "Falha ao conectar com o agente IA.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCount = selectedUploadIds.size;
  const totalUploads = availableUploads.length;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {icon}
            {title}
          </h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={startNewConversation} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nova
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="gap-1.5">
            <History className="h-4 w-4" /> Histórico
          </Button>
        </div>
      </div>

      {/* Context indicator */}
      <div className="mb-3">
        <button
          onClick={() => totalUploads > 0 && setShowUploads(!showUploads)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full ${
            totalUploads > 0
              ? selectedCount > 0
                ? "bg-primary/10 text-primary hover:bg-primary/15"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <FileText className="h-3.5 w-3.5 flex-shrink-0" />
          {totalUploads === 0 ? (
            <span>Nenhum material disponível — faça upload para enriquecer as respostas</span>
          ) : (
            <>
              <span>{selectedCount} de {totalUploads} {totalUploads === 1 ? "material" : "materiais"} como contexto</span>
              <ChevronDown className={`h-3.5 w-3.5 ml-auto transition-transform ${showUploads ? "rotate-180" : ""}`} />
            </>
          )}
        </button>

        {showUploads && totalUploads > 0 && (
          <div className="glass-card p-3 mt-2 max-h-40 overflow-y-auto space-y-1">
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <Checkbox
                checked={selectedCount === totalUploads}
                className="h-3.5 w-3.5"
                onCheckedChange={toggleAll}
              />
              {selectedCount === totalUploads ? "Desmarcar todos" : "Selecionar todos"}
            </button>
            {availableUploads.map((u) => (
              <label
                key={u.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary cursor-pointer text-xs"
              >
                <Checkbox
                  checked={selectedUploadIds.has(u.id)}
                  onCheckedChange={() => toggleUpload(u.id)}
                  className="h-3.5 w-3.5"
                />
                <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{u.filename}</span>
                {u.category && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">
                    {u.category}
                  </span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

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
                <span className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </span>
                <button onClick={(e) => deleteConversation(c.id, e)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 glass-card p-4 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
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
          placeholder={placeholder}
          className="bg-secondary border-border"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isLoading}
        />
        <Button onClick={handleSend} size="icon" className="glow flex-shrink-0" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default AgentChat;
