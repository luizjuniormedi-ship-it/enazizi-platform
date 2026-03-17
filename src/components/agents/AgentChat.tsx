import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Plus, History, Trash2, FileText, ChevronDown, Check, Save, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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

interface QuickAction {
  label: string;
  prompt: string;
  icon?: string;
}

interface AgentChatProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  welcomeMessage: string;
  welcomeMessageWithUploads?: string;
  placeholder: string;
  functionName: string;
  onSaveMessage?: (content: string) => Promise<number>;
  quickActions?: QuickAction[];
  renderAssistantMessage?: (content: string) => React.ReactNode;
  showUploadButton?: boolean;
}

const AgentChat = ({ title, subtitle, icon, welcomeMessage, welcomeMessageWithUploads, placeholder, functionName, onSaveMessage, quickActions, renderAssistantMessage, showUploadButton }: AgentChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [hasShownUploadWelcome, setHasShownUploadWelcome] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [availableUploads, setAvailableUploads] = useState<Upload[]>([]);
  const [selectedUploadIds, setSelectedUploadIds] = useState<Set<string>>(new Set());
  const [showUploads, setShowUploads] = useState(false);
  const [savingMsgIdx, setSavingMsgIdx] = useState<number | null>(null);
  const [savedMsgIdxs, setSavedMsgIdxs] = useState<Set<number>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;

  // Load user uploads
  useEffect(() => {
    if (!user) return;
    const loadUploads = async () => {
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
    loadUploads();
  }, [user]);

  // Update welcome message when uploads are detected
  useEffect(() => {
    if (hasShownUploadWelcome || !welcomeMessageWithUploads) return;
    if (availableUploads.length > 0 && selectedUploadIds.size > 0 && messages.length === 1 && messages[0].role === "assistant") {
      const materialNames = availableUploads
        .filter(u => selectedUploadIds.has(u.id))
        .map(u => u.filename)
        .slice(0, 3)
        .join(", ");
      const suffix = availableUploads.length > 3 ? ` e mais ${availableUploads.length - 3}` : "";
      const contextMsg = welcomeMessageWithUploads
        .replace("{materiais}", materialNames + suffix)
        .replace("{count}", String(selectedUploadIds.size));
      setMessages([{ role: "assistant", content: contextMsg }]);
      setHasShownUploadWelcome(true);
    }
  }, [availableUploads, selectedUploadIds, hasShownUploadWelcome, welcomeMessageWithUploads, messages]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = "";

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "txt"].includes(ext || "")) {
      toast({ title: "Formato inválido", description: "Apenas PDF e TXT são suportados.", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo de 20MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);
    setUploadStep("Enviando arquivo...");

    try {
      const storagePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: storageError } = await supabase.storage.from("user-uploads").upload(storagePath, file);
      if (storageError) throw storageError;

      setUploadProgress(20);
      setUploadStep("Registrando...");

      const { data: uploadRow, error: insertError } = await supabase.from("uploads").insert({
        user_id: user.id,
        filename: file.name,
        file_type: ext || "pdf",
        storage_path: storagePath,
        status: "pending",
        is_global: false,
      }).select("id").single();
      if (insertError || !uploadRow) throw insertError || new Error("Falha ao registrar upload");

      setUploadProgress(30);
      setUploadStep("Processando...");

      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke("process-upload", {
        body: { uploadId: uploadRow.id },
      });

      // Poll for completion
      const pollInterval = setInterval(async () => {
        const { data: status } = await supabase
          .from("uploads")
          .select("status, extracted_text, extracted_json, filename, category")
          .eq("id", uploadRow.id)
          .single();

        if (!status) return;

        const json = status.extracted_json as Record<string, any> | null;
        const progress = json?.progress || 30;
        const step = json?.step || "processing";

        const stepLabels: Record<string, string> = {
          downloading: "Baixando arquivo...",
          extracting_text: "Extraindo texto...",
          validating: "Validando conteúdo...",
          generating_flashcards: "Gerando flashcards...",
          generating_questions: "Gerando questões...",
          done: "Concluído!",
          error: "Erro no processamento",
        };

        setUploadProgress(Math.min(progress, 95));
        setUploadStep(stepLabels[step] || "Processando...");

        if (status.status === "processed" || status.status === "error") {
          clearInterval(pollInterval);
          setUploadProgress(100);

          if (status.status === "processed" && status.extracted_text) {
            const newUpload: Upload = {
              id: uploadRow.id,
              filename: status.filename,
              category: status.category,
              extracted_text: status.extracted_text,
            };
            setAvailableUploads(prev => [newUpload, ...prev]);
            setSelectedUploadIds(prev => new Set(prev).add(uploadRow.id));
            toast({ title: "✅ Material processado!", description: `${status.filename} está pronto para uso como contexto.` });
          } else {
            toast({ title: "Erro", description: "Falha ao processar o arquivo.", variant: "destructive" });
          }

          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
            setUploadStep("");
          }, 1000);
        }
      }, 3000);

      // Safety timeout after 3 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isUploading) {
          setIsUploading(false);
          toast({ title: "Timeout", description: "O processamento demorou demais. Verifique na página de Uploads.", variant: "destructive" });
        }
      }, 180000);

    } catch (err) {
      console.error("Upload error:", err);
      toast({ title: "Erro no upload", description: err instanceof Error ? err.message : "Falha ao enviar arquivo.", variant: "destructive" });
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStep("");
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
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          userContext: contextToSend || undefined,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        const errorMessages: Record<number, string> = {
          429: "Limite de requisições atingido. Aguarde alguns segundos e tente novamente.",
          402: "Créditos de IA esgotados. Adicione créditos no seu workspace para continuar.",
          401: "Sessão expirada. Faça login novamente.",
          500: "Erro interno do servidor. Tente novamente.",
        };
        const description = errData.error || errorMessages[resp.status] || "Erro ao conectar com o agente IA";
        toast({ title: "Erro", description, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      const appendAssistantChunk = (content: string) => {
        if (!content) return;
        assistantSoFar += content;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
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
          if (content) appendAssistantChunk(content);
          return "ok";
        } catch {
          return "incomplete";
        }
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          const line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          const result = processSseLine(line);
          if (result === "done") {
            streamDone = true;
            break;
          }
          if (result === "incomplete") {
            textBuffer = `${line}\n${textBuffer}`;
            break;
          }
        }
      }

      // Flush final UTF-8 bytes + remaining buffered lines
      textBuffer += decoder.decode();

      if (textBuffer.trim()) {
        const remainingLines = textBuffer.split("\n");
        for (const line of remainingLines) {
          if (!line) continue;
          const result = processSseLine(line);
          if (result === "done") break;
        }
      }

      if (convId && assistantSoFar) {
        await supabase.from("chat_messages").insert({
          conversation_id: convId, user_id: user.id, role: "assistant", content: assistantSoFar,
        });
        loadConversations();
      }

      // Auto-save flashcards/questions after streaming completes
      if (onSaveMessage && assistantSoFar) {
        try {
          const count = await onSaveMessage(assistantSoFar);
          if (count > 0) {
            const lastIdx = messages.length; // index of the assistant message just added
            setSavedMsgIdxs((prev) => new Set(prev).add(lastIdx));
            toast({ title: "✅ Salvo automaticamente!", description: `${count} flashcard(s) salvo(s) no seu banco.` });
          }
        } catch {
          // Silent fail for auto-save - user can still save manually
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Erro", description: "Falha ao conectar com o agente IA.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMessage = async (idx: number, content: string) => {
    if (!onSaveMessage || savingMsgIdx !== null) return;
    setSavingMsgIdx(idx);
    try {
      const count = await onSaveMessage(content);
      setSavedMsgIdxs((prev) => new Set(prev).add(idx));
      toast({ title: "Salvo!", description: `${count} questão(ões) salva(s) no seu banco.` });
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro ao salvar questões.", variant: "destructive" });
    } finally {
      setSavingMsgIdx(null);
    }
  };

  const selectedCount = selectedUploadIds.size;
  const totalUploads = availableUploads.length;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] sm:h-[calc(100vh-8rem)] animate-fade-in min-w-0">
      <div className="mb-2 sm:mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2 truncate">
            {icon}
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={startNewConversation} className="gap-1 h-8 px-2 sm:px-3 text-xs sm:text-sm">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nova</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="gap-1 h-8 px-2 sm:px-3 text-xs sm:text-sm">
            <History className="h-4 w-4" /> <span className="hidden sm:inline">Histórico</span>
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.txt"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Upload progress indicator */}
      {isUploading && (
        <div className="mb-3 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 text-xs font-medium text-primary mb-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>{uploadStep}</span>
          </div>
          <Progress value={uploadProgress} className="h-1.5" />
        </div>
      )}

      {/* Context indicator */}
      <div className="mb-3">
        <div className="flex gap-2">
          <button
            onClick={() => totalUploads > 0 && setShowUploads(!showUploads)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex-1 ${
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

      <div ref={scrollRef} className="flex-1 glass-card p-2 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 mb-2 sm:mb-4 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 sm:gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
            )}
            <div
              className={`rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "max-w-[85%] sm:max-w-[75%] bg-primary text-primary-foreground"
                  : "max-w-full bg-secondary text-secondary-foreground"
              }`}
            >
              {msg.role === "assistant" ? (
                renderAssistantMessage ? (
                  renderAssistantMessage(msg.content)
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-p:my-3 prose-headings:mt-5 prose-headings:mb-2 prose-ul:my-3 prose-ol:my-3 prose-li:my-1 [&>p+p]:mt-4 [&_strong]:text-foreground [&_hr]:my-4 [&_blockquote]:my-3">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
              {msg.role === "assistant" && onSaveMessage && i > 0 && !isLoading && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    disabled={savingMsgIdx === i || savedMsgIdxs.has(i)}
                    onClick={() => handleSaveMessage(i, msg.content)}
                  >
                    {savedMsgIdxs.has(i) ? (
                      <><Check className="h-3.5 w-3.5 text-green-500" /> Salvo</>
                    ) : savingMsgIdx === i ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando...</>
                    ) : (
                      <><Save className="h-3.5 w-3.5" /> Salvar questões</>
                    )}
                  </Button>
                </div>
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

      {/* Quick action buttons */}
      {quickActions && quickActions.length > 0 && messages.length <= 2 && !isLoading && (
        <div className="flex flex-wrap gap-2 mb-2">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(action.prompt);
              }}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
            >
              {action.icon && <span className="mr-1">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}

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
