import { useState, useRef, useCallback, useEffect } from "react";
import { MessageSquare, Send, Copy, Loader2, RefreshCw, Phone, AlertTriangle, CheckCircle, PlayCircle, StopCircle, Download, Plug, PlugZap, Monitor, History, PauseCircle, SkipForward, RotateCcw, Clock, Eye, PenLine, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  user_id: string;
  display_name: string | null;
  phone: string;
  message: string;
  revisoes_count: number;
  urgentes_count: number;
  ai_generated: boolean;
  already_sent_today: boolean;
}

interface ExecutionItem {
  id: string;
  target_user_id: string;
  message_text: string;
  delivery_status: string;
  attempts: number;
  error_message: string | null;
  sent_at: string | null;
  display_name: string;
  phone: string;
}

interface Execution {
  id: string;
  admin_user_id: string;
  execution_date: string;
  mode: string;
  status: string;
  total_items: number;
  total_sent: number;
  total_error: number;
  total_skipped: number;
  started_at: string;
  finished_at: string | null;
  created_at: string;
}

interface WhatsAppPanelProps {
  session: { access_token: string } | null;
}

const cleanPhone = (phone: string) => phone.replace(/\D/g, "");
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const EXTENSION_ID_KEY = "enazizi_ext_id";

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  sent: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  skipped: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  cancelled: "bg-muted text-muted-foreground line-through",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  processing: "Processando",
  sent: "Enviado",
  error: "Erro",
  skipped: "Pulado",
  cancelled: "Cancelado",
  running: "Em execução",
  paused: "Pausado",
  stopped: "Parado",
  completed: "Concluído",
};

const WhatsAppPanel = ({ session }: WhatsAppPanelProps) => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [editedMessages, setEditedMessages] = useState<Record<string, string>>({});
  const [sentUsers, setSentUsers] = useState<Set<string>>(new Set());
  const [savingLog, setSavingLog] = useState<string | null>(null);

  // Bulk send state
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkCurrentName, setBulkCurrentName] = useState("");
  const [bulkCountdown, setBulkCountdown] = useState(0);
  const cancelRef = useRef(false);

  // Extension state
  const [extensionDetected, setExtensionDetected] = useState(false);
  const [extensionVersion, setExtensionVersion] = useState("");
  const [extensionOutdated, setExtensionOutdated] = useState(false);
  const [extensionSending, setExtensionSending] = useState(false);
  const [latestVersion, setLatestVersion] = useState("");

  // Desktop execution state
  const [activeExecution, setActiveExecution] = useState<Execution | null>(null);
  const [executionItems, setExecutionItems] = useState<ExecutionItem[]>([]);
  const [executionLoading, setExecutionLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExecutionItem | null>(null);

  // History state
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Opt-out state
  const [optOutCount, setOptOutCount] = useState(0);

  // Custom message state
  const [useCustomMessage, setUseCustomMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  // Fetch opt-out count
  useEffect(() => {
    const fetchOptOut = async () => {
      const { count } = await supabase
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("whatsapp_opt_out", true);
      setOptOutCount(count || 0);
    };
    fetchOptOut();
  }, [students]);

  // ─── Extension detection ──────────────────────────────────
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data?.type) return;
      const { type } = event.data;
      if (type === "ENAZIZI_PONG") {
        setExtensionDetected(true);
        setExtensionVersion(event.data.version || "?");
      }
      if (type === "ENAZIZI_SENDING") {
        setBulkCurrentName(event.data.name || "Aluno");
        setBulkProgress(event.data.index + 1);
        setBulkTotal(event.data.total);
      }
      if (type === "ENAZIZI_SEND_STATUS") {
        if (event.data.success && event.data.userId) {
          setSentUsers((prev) => new Set(prev).add(event.data.userId));
        }
      }
      if (type === "ENAZIZI_COUNTDOWN") {
        let sec = event.data.seconds;
        setBulkCountdown(sec);
        const iv = setInterval(() => { sec--; setBulkCountdown(sec); if (sec <= 0) clearInterval(iv); }, 1000);
      }
      if (type === "ENAZIZI_QUEUE_DONE") {
        setExtensionSending(false);
        setBulkSending(false);
        setBulkCountdown(0);
        toast({ title: "Envio concluído! ✅", description: `${event.data.sent} mensagem(ns) enviada(s) via extensão.` });
      }
    };
    window.addEventListener("message", handler);
    window.postMessage({ type: "ENAZIZI_PING" }, "*");
    fetch("/extension-meta.json?_=" + Date.now()).then((r) => r.json()).then((meta) => setLatestVersion(meta.version || "")).catch(() => {});
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (extensionVersion && latestVersion) {
      const pa = latestVersion.split(".").map(Number);
      const pb = extensionVersion.split(".").map(Number);
      let outdated = false;
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        if ((pa[i] || 0) > (pb[i] || 0)) { outdated = true; break; }
        if ((pa[i] || 0) < (pb[i] || 0)) break;
      }
      setExtensionOutdated(outdated);
    }
  }, [extensionVersion, latestVersion]);

  const downloadExtension = () => {
    fetch("/enazizi-whatsapp-extension.zip")
      .then((res) => { if (!res.ok) throw new Error(`Download failed: ${res.status}`); return res.blob(); })
      .then((blob) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "enazizi-whatsapp-extension.zip"; a.click(); URL.revokeObjectURL(a.href); })
      .catch((err) => toast({ title: "Erro no download", description: err.message, variant: "destructive" }));
  };

  // ─── Generate messages ────────────────────────────────────
  const generateMessages = async () => {
    if (!session) return;
    setLoading(true);
    setSentUsers(new Set());
    setEditedMessages({});
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ app_url: "https://enazizi.com" }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Erro ao gerar mensagens");

      let generatedStudents: Student[] = data.students || [];

      // If custom message mode, override each student's message
      if (useCustomMessage && customMessage.trim()) {
        generatedStudents = generatedStudents.map((s: Student) => {
          const firstName = (s.display_name || "Aluno").split(" ")[0];
          let personalizedMsg = customMessage;
          if (/\{nome\}/i.test(customMessage)) {
            personalizedMsg = customMessage.replace(/\{nome\}/gi, firstName);
          } else {
            personalizedMsg = `Olá ${firstName}! ${customMessage}`;
          }
          personalizedMsg += "\n\nResponda SAIR para não receber mais.";
          return { ...s, message: personalizedMsg };
        });
      }

      setStudents(generatedStudents);
      // When custom message is on and students are selected, filter to only those
      const finalStudents = (useCustomMessage && selectedStudents.size > 0)
        ? generatedStudents.filter((s: Student) => selectedStudents.has(s.user_id))
        : generatedStudents;
      const total = finalStudents.length;
      const alreadySent = generatedStudents.filter((s: Student) => s.already_sent_today).length;

      if (total === 0) {
        toast({ title: "Nenhum aluno", description: data.message || "Nenhum aluno com telefone cadastrado." });
      } else {
        toast({ title: "Mensagens geradas!", description: `${total} mensagem(ns) prontas. ${alreadySent > 0 ? `${alreadySent} já receberam hoje.` : ""}` });

        const { data: { user } } = await supabase.auth.getUser();
        const queueCandidates = finalStudents.filter((s: Student) => !s.already_sent_today && s.phone);

        if (user && queueCandidates.length > 0) {
          const rows = queueCandidates.map((s: Student) => ({
            admin_user_id: user.id,
            target_user_id: s.user_id,
            message_text: s.message,
            delivery_status: "pending",
            execution_mode: "desktop",
          }));

          const { error: insertError } = await supabase
            .from("whatsapp_message_log")
            .insert(rows as any);

          if (insertError) throw insertError;

          toast({ title: "Fila criada", description: `${queueCandidates.length} mensagens inseridas na fila desktop.` });
          await handleStartDesktopExecution();
        }
      }
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getMessage = (s: Student) => editedMessages[s.user_id] ?? s.message;
  const getWhatsAppUrl = (s: Student) => {
    const phone = cleanPhone(s.phone);
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(getMessage(s))}`;
  };

  const logAndSend = async (s: Student) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("whatsapp_message_log" as any).insert({
          admin_user_id: user.id, target_user_id: s.user_id, message_text: getMessage(s),
        } as any);
      }
    } catch { /* continue */ }
    window.open(getWhatsAppUrl(s), "_blank");
    setSentUsers((prev) => new Set(prev).add(s.user_id));
  };

  const handleSend = async (s: Student) => { setSavingLog(s.user_id); await logAndSend(s); setSavingLog(null); };
  const handleCopy = (s: Student) => {
    navigator.clipboard.writeText(getMessage(s));
    toast({ title: "Copiado!", description: "Mensagem copiada para a área de transferência." });
  };

  // ─── Bulk send (manual wa.me) ─────────────────────────────
  const handleBulkSend = useCallback(async () => {
    const pending = students.filter((s) => !sentUsers.has(s.user_id) && !s.already_sent_today);
    if (pending.length === 0) { toast({ title: "Nenhum pendente" }); return; }
    cancelRef.current = false;
    setBulkSending(true);
    setBulkTotal(pending.length);
    setBulkProgress(0);
    for (let i = 0; i < pending.length; i++) {
      if (cancelRef.current) break;
      const s = pending[i];
      setBulkCurrentName(s.display_name || "Aluno");
      setBulkProgress(i + 1);
      await logAndSend(s);
      if (i < pending.length - 1 && !cancelRef.current) {
        const waitSec = Math.floor(Math.random() * 8) + 8;
        for (let sec = waitSec; sec > 0; sec--) { if (cancelRef.current) break; setBulkCountdown(sec); await delay(1000); }
        setBulkCountdown(0);
      }
    }
    setBulkSending(false);
    setBulkCurrentName("");
    setBulkCountdown(0);
    toast({ title: cancelRef.current ? "Envio cancelado" : "Envio concluído! ✅" });
  }, [students, sentUsers, toast]);

  const handleExtensionSend = useCallback(() => {
    const pending = students.filter((s) => !sentUsers.has(s.user_id) && !s.already_sent_today);
    if (pending.length === 0) { toast({ title: "Nenhum pendente" }); return; }
    const payload = pending.map((s) => ({ user_id: s.user_id, display_name: s.display_name, phone: s.phone, message: getMessage(s) }));
    setExtensionSending(true);
    setBulkSending(true);
    setBulkTotal(pending.length);
    setBulkProgress(0);
    window.postMessage({ type: "ENAZIZI_SEND_QUEUE", payload }, "*");
    toast({ title: "Fila enviada para extensão", description: `${pending.length} mensagem(ns) na fila.` });
  }, [students, sentUsers, editedMessages, toast]);

  const handleCancelBulk = () => {
    cancelRef.current = true;
    if (extensionSending) { window.postMessage({ type: "ENAZIZI_CANCEL" }, "*"); setExtensionSending(false); setBulkSending(false); }
  };

  // ─── Desktop Execution API calls ─────────────────────────
  const callQueue = async (action: string, body: any = {}) => {
    if (!session) return null;
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-queue?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
    if (resp.status === 401) {
      toast({ title: "Sessão expirada", description: "Faça login novamente.", variant: "destructive" });
      await supabase.auth.signOut();
      window.location.assign("/login");
      return null;
    }
    if (!resp.ok) {
      const errData = await resp.json().catch(() => null);
      if (errData) return errData;
      throw new Error(`HTTP ${resp.status}`);
    }
    return resp.json();
  };

  const fetchExecutionStatus = async (execId?: string) => {
    const data = await callQueue("execution_status", execId ? { execution_id: execId } : {});
    if (data?.execution) {
      setActiveExecution(data.execution);
      setExecutionItems(data.items || []);
    } else {
      setActiveExecution(null);
      setExecutionItems([]);
    }
    return data;
  };

  const handleStartDesktopExecution = async () => {
    setExecutionLoading(true);
    try {
      const data = await callQueue("start_execution");

      if (data?.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
      } else {
        const label = data.reused ? "Execução reutilizada!" : "Execução iniciada!";
        toast({ title: label, description: `${data.total_items} itens na fila.` });
        await fetchExecutionStatus(data.execution_id);
      }
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    } finally {
      setExecutionLoading(false);
    }
  };

  const handlePauseExecution = async () => {
    if (!activeExecution) return;
    await callQueue("pause_execution", { execution_id: activeExecution.id });
    toast({ title: "Execução pausada" });
    await fetchExecutionStatus(activeExecution.id);
  };

  const handleResumeExecution = async () => {
    if (!activeExecution) return;
    await callQueue("resume_execution", { execution_id: activeExecution.id });
    toast({ title: "Execução retomada" });
    await fetchExecutionStatus(activeExecution.id);
  };

  const handleStopExecution = async () => {
    if (!activeExecution) return;
    await callQueue("stop_execution", { execution_id: activeExecution.id });
    toast({ title: "Execução parada" });
    setActiveExecution(null);
    setExecutionItems([]);
  };

  const handleResetQueue = async () => {
    if (!window.confirm("Limpar toda a fila pendente? Mensagens já enviadas não serão afetadas.")) return;
    try {
      const data = await callQueue("reset_queue", { execution_id: activeExecution?.id });
      toast({ title: "Fila limpa ✅", description: `${data?.cancelled || 0} mensagem(ns) cancelada(s).` });
      setActiveExecution(null);
      setExecutionItems([]);
      setStudents([]);
    } catch (e) {
      toast({ title: "Erro ao limpar fila", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    }
  };

  const handleDeleteGenerated = async () => {
    if (!window.confirm("Excluir todas as mensagens pendentes do dia? Esta ação não pode ser desfeita.")) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase
        .from("whatsapp_message_log")
        .delete()
        .eq("delivery_status", "pending")
        .gte("created_at", `${today}T00:00:00`)
        .lt("created_at", `${today}T23:59:59.999`);
      if (error) throw error;

      if (activeExecution) {
        await callQueue("stop_execution", { execution_id: activeExecution.id });
        setActiveExecution(null);
        setExecutionItems([]);
      }

      setStudents([]);
      setEditedMessages({});
      setSentUsers(new Set());
      toast({ title: "Mensagens excluídas", description: "Todas as mensagens pendentes do dia foram removidas." });
    } catch (e) {
      toast({ title: "Erro ao excluir", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    }
  };

  const handleReprocessErrors = async () => {
    if (!activeExecution) return;
    const data = await callQueue("reprocess_errors", { execution_id: activeExecution.id });
    toast({ title: "Erros reprocessados", description: `${data?.reprocessed || 0} itens voltaram para a fila.` });
    await fetchExecutionStatus(activeExecution.id);
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    const data = await callQueue("list_executions");
    setExecutions(data?.executions || []);
    setHistoryLoading(false);
  };

  // Polling for active execution
  useEffect(() => {
    if (!activeExecution || activeExecution.status !== "running") return;
    const interval = setInterval(() => fetchExecutionStatus(activeExecution.id), 5000);
    return () => clearInterval(interval);
  }, [activeExecution?.id, activeExecution?.status]);

  // Load execution status on tab switch
  const handleTabChange = (tab: string) => {
    if (tab === "desktop") fetchExecutionStatus();
    if (tab === "history") fetchHistory();
  };

  const sentCount = sentUsers.size;
  const unsentCount = students.filter((s) => !sentUsers.has(s.user_id) && !s.already_sent_today).length;

  const executionProgress = activeExecution
    ? ((activeExecution.total_sent + activeExecution.total_error + activeExecution.total_skipped) / Math.max(activeExecution.total_items, 1)) * 100
    : 0;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="messages" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages" className="gap-1.5"><MessageSquare className="h-4 w-4" /> Mensagens</TabsTrigger>
          <TabsTrigger value="desktop" className="gap-1.5"><Monitor className="h-4 w-4" /> Execução Desktop</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><History className="h-4 w-4" /> Histórico</TabsTrigger>
        </TabsList>

        {/* ─── TAB: Mensagens (existing) ─── */}
        <TabsContent value="messages" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> Mensagens WhatsApp
              </h2>
              <p className="text-sm text-muted-foreground">Gere mensagens únicas por IA e envie todas com um clique.</p>
              {optOutCount > 0 && <Badge variant="secondary" className="text-xs mt-1">🚫 {optOutCount} aluno(s) optaram por não receber</Badge>}
            </div>
            <div className="flex items-center gap-2">
              {students.length > 0 && (
                <Button variant="destructive" onClick={handleDeleteGenerated} disabled={loading || bulkSending} className="gap-1.5">
                  <Trash2 className="h-4 w-4" /> Excluir pendentes
                </Button>
              )}
              <Button onClick={generateMessages} disabled={loading || bulkSending || (useCustomMessage && !customMessage.trim())} className="gap-1.5">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Gerar mensagens do dia
              </Button>
            </div>
          </div>

          {/* Custom message toggle */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenLine className="h-4 w-4 text-primary" />
                <Label htmlFor="custom-msg-toggle" className="font-medium cursor-pointer">Usar mensagem personalizada</Label>
              </div>
              <Switch id="custom-msg-toggle" checked={useCustomMessage} onCheckedChange={setUseCustomMessage} />
            </div>
            {useCustomMessage && (
              <div className="space-y-2">
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Sua mensagem aqui... (use {nome} para inserir o nome do aluno)"
                  className="min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground">
                  Use <code className="bg-muted px-1 rounded">{"{nome}"}</code> para personalizar. Se não usar, o nome será adicionado automaticamente no início (ex: "Olá João! sua mensagem").
                </p>
                <p className="text-xs text-muted-foreground">
                  💡 Após gerar, use os checkboxes ao lado de cada aluno para escolher quem receberá. Se nenhum for selecionado, todos recebem.
                </p>
              </div>
            )}
          </div>

          {/* Extension status banner */}
          <div className={`flex items-center justify-between p-3 rounded-lg border text-sm ${extensionDetected ? extensionOutdated ? "bg-destructive/10 border-destructive/30" : "bg-primary/5 border-primary/20" : "bg-muted/50 border-muted"}`}>
            <div className="flex items-center gap-2">
              {extensionDetected ? (
                <>
                  <PlugZap className="h-4 w-4 text-primary" />
                  <span className="font-medium">Extensão conectada</span>
                  <Badge variant="outline" className="text-xs">v{extensionVersion}</Badge>
                  {extensionOutdated && <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" /> Desatualizada</Badge>}
                </>
              ) : (
                <><Plug className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Extensão não detectada</span></>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!extensionDetected && <Button variant="outline" size="sm" onClick={downloadExtension} className="gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Baixar extensão</Button>}
              {extensionOutdated && <Button variant="destructive" size="sm" onClick={downloadExtension} className="gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Atualizar</Button>}
            </div>
          </div>

          {students.length > 0 && (
            <>
              <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  <Badge variant="outline" className="gap-1"><Phone className="h-3 w-3" /> {students.length} aluno(s)</Badge>
                  {sentCount > 0 && <Badge variant="outline" className="gap-1 text-primary border-primary/30"><CheckCircle className="h-3 w-3" /> {sentCount} enviado(s)</Badge>}
                  {unsentCount > 0 && <Badge variant="outline" className="gap-1">{unsentCount} pendente(s)</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  {!bulkSending ? (
                    <>
                      {extensionDetected && <Button onClick={handleExtensionSend} disabled={unsentCount === 0} className="gap-1.5"><PlugZap className="h-4 w-4" /> Enviar via Extensão ({unsentCount})</Button>}
                      <Button onClick={handleBulkSend} disabled={unsentCount === 0} variant={extensionDetected ? "outline" : "default"} className="gap-1.5">
                        <PlayCircle className="h-4 w-4" /> {extensionDetected ? "wa.me" : "Enviar todos"} ({unsentCount})
                      </Button>
                    </>
                  ) : (
                    <Button variant="destructive" onClick={handleCancelBulk} className="gap-1.5"><StopCircle className="h-4 w-4" /> Cancelar</Button>
                  )}
                </div>
              </div>

              {bulkSending && (
                <div className="space-y-2 p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">📤 {extensionSending ? "Extensão enviando para" : "Enviando para"} {bulkCurrentName}... ({bulkProgress}/{bulkTotal})</span>
                    {bulkCountdown > 0 && <span className="text-muted-foreground text-xs">⏳ Próximo em {bulkCountdown}s</span>}
                  </div>
                  <Progress value={(bulkProgress / bulkTotal) * 100} className="h-2" />
                </div>
              )}

              {useCustomMessage && (
                <div className="flex items-center gap-3 px-1">
                  <Checkbox
                    checked={selectedStudents.size === students.length && students.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStudents(new Set(students.map(s => s.user_id)));
                      } else {
                        setSelectedStudents(new Set());
                      }
                    }}
                  />
                  <span className="text-sm font-medium">
                    Selecionar todos ({selectedStudents.size}/{students.length})
                  </span>
                </div>
              )}

              <div className="space-y-3">
                {students.map((s) => {
                  const isSent = sentUsers.has(s.user_id);
                  const isAlreadySentToday = s.already_sent_today;
                  const isSelected = selectedStudents.has(s.user_id);
                  return (
                    <div key={s.user_id} className={`rounded-lg border p-4 space-y-3 transition-colors ${isSent ? "bg-primary/5 border-primary/20" : isAlreadySentToday ? "bg-muted/50 border-muted opacity-60" : "bg-secondary/30"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {useCustomMessage && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                setSelectedStudents(prev => {
                                  const next = new Set(prev);
                                  if (checked) next.add(s.user_id);
                                  else next.delete(s.user_id);
                                  return next;
                                });
                              }}
                            />
                          )}
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{(s.display_name || "?")[0].toUpperCase()}</div>
                          <div>
                            <div className="font-medium text-sm">{s.display_name || "Sem nome"}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phone}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.urgentes_count > 0 && <Badge variant="destructive" className="gap-1 text-xs"><AlertTriangle className="h-3 w-3" /> {s.urgentes_count} urgente(s)</Badge>}
                          <Badge variant="outline" className="text-xs">{s.revisoes_count} revisão(ões)</Badge>
                          {!s.ai_generated && <Badge variant="secondary" className="text-xs">Fallback</Badge>}
                          {isAlreadySentToday && !isSent && <Badge variant="secondary" className="text-xs">Já enviado hoje</Badge>}
                          {isSent && <Badge className="gap-1 text-xs bg-primary/10 text-primary border-primary/30"><CheckCircle className="h-3 w-3" /> Enviado</Badge>}
                        </div>
                      </div>
                      <Textarea value={getMessage(s)} onChange={(e) => setEditedMessages((prev) => ({ ...prev, [s.user_id]: e.target.value }))} rows={4} className="text-sm resize-none" disabled={isAlreadySentToday && !isSent} />
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleCopy(s)} className="gap-1.5"><Copy className="h-3.5 w-3.5" /> Copiar</Button>
                        <Button size="sm" onClick={() => handleSend(s)} disabled={savingLog === s.user_id || (isAlreadySentToday && !isSent) || bulkSending} className="gap-1.5">
                          {savingLog === s.user_id ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Abrindo...</> : <><Send className="h-3.5 w-3.5" /> Enviar via WhatsApp</>}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {!loading && students.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma mensagem gerada ainda</p>
              <p className="text-sm mt-1">Clique em "Gerar mensagens do dia" para começar.</p>
            </div>
          )}
        </TabsContent>

        {/* ─── TAB: Desktop Execution ─── */}
        <TabsContent value="desktop" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2"><Monitor className="h-5 w-5 text-primary" /> Execução Desktop</h2>
              <p className="text-sm text-muted-foreground">Controle a fila de envios pelo agente local Windows.</p>
            </div>
            <div className="flex items-center gap-2">
              {!activeExecution && (
                <Button onClick={handleStartDesktopExecution} disabled={executionLoading} className="gap-1.5">
                  {executionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                  Iniciar execução desktop
                </Button>
              )}
              {activeExecution?.status === "running" && (
                <Button variant="outline" onClick={handlePauseExecution} className="gap-1.5"><PauseCircle className="h-4 w-4" /> Pausar</Button>
              )}
              {activeExecution?.status === "paused" && (
                <Button onClick={handleResumeExecution} className="gap-1.5"><PlayCircle className="h-4 w-4" /> Continuar</Button>
              )}
              {activeExecution && activeExecution.status !== "stopped" && (
                <Button variant="destructive" onClick={handleStopExecution} className="gap-1.5"><StopCircle className="h-4 w-4" /> Parar</Button>
              )}
              {activeExecution && (
                <>
                  <Button variant="outline" onClick={handleReprocessErrors} className="gap-1.5"><RotateCcw className="h-4 w-4" /> Reprocessar erros</Button>
                  <Button variant="outline" onClick={handleResetQueue} className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"><Trash2 className="h-4 w-4" /> Limpar fila</Button>
                </>
              )}
            </div>
          </div>

          {activeExecution ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-bold">{activeExecution.total_items}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-bold text-muted-foreground">{activeExecution.total_items - activeExecution.total_sent - activeExecution.total_error - activeExecution.total_skipped}</div>
                  <div className="text-xs text-muted-foreground">Pendentes</div>
                </div>
                <div className="rounded-lg border p-3 text-center border-green-200 dark:border-green-900">
                  <div className="text-2xl font-bold text-green-600">{activeExecution.total_sent}</div>
                  <div className="text-xs text-muted-foreground">Enviados</div>
                </div>
                <div className="rounded-lg border p-3 text-center border-red-200 dark:border-red-900">
                  <div className="text-2xl font-bold text-red-600">{activeExecution.total_error}</div>
                  <div className="text-xs text-muted-foreground">Erros</div>
                </div>
                <div className="rounded-lg border p-3 text-center border-yellow-200 dark:border-yellow-900">
                  <div className="text-2xl font-bold text-yellow-600">{activeExecution.total_skipped}</div>
                  <div className="text-xs text-muted-foreground">Pulados</div>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium flex items-center gap-1.5">
                    <Badge className={statusColors[activeExecution.status] || ""}>{statusLabels[activeExecution.status] || activeExecution.status}</Badge>
                  </span>
                  <span className="text-muted-foreground">{Math.round(executionProgress)}%</span>
                </div>
                <Progress value={executionProgress} className="h-2" />
              </div>

              {/* Items list */}
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Aluno</th>
                      <th className="text-left p-3 font-medium">Telefone</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Tentativas</th>
                      <th className="text-left p-3 font-medium">Erro</th>
                      <th className="text-left p-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executionItems.map((item) => (
                      <tr key={item.id} className="border-t hover:bg-muted/30">
                        <td className="p-3">{item.display_name}</td>
                        <td className="p-3 font-mono text-xs">{item.phone}</td>
                        <td className="p-3"><Badge className={`text-xs ${statusColors[item.delivery_status] || ""}`}>{statusLabels[item.delivery_status] || item.delivery_status}</Badge></td>
                        <td className="p-3">{item.attempts}</td>
                        <td className="p-3 text-xs text-red-500 max-w-[200px] truncate">{item.error_message || "—"}</td>
                        <td className="p-3">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedItem(item)} className="gap-1"><Eye className="h-3.5 w-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                    {executionItems.length === 0 && (
                      <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum item na fila</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {/* Agent download + setup */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2"><Download className="h-4 w-4 text-primary" /> Agente WhatsApp Desktop</h3>
                    <p className="text-sm text-muted-foreground mt-1">Baixe e instale o agente Python no seu Windows para envio automático.</p>
                  </div>
                  <Button onClick={() => {
                    fetch("/enazizi-whatsapp-agent.zip")
                      .then(r => { if (!r.ok) throw new Error("Download falhou"); return r.blob(); })
                      .then(b => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "enazizi-whatsapp-agent.zip"; a.click(); URL.revokeObjectURL(a.href); })
                      .catch(err => toast({ title: "Erro", description: err.message, variant: "destructive" }));
                  }} className="gap-1.5">
                    <Download className="h-4 w-4" /> Baixar Agente Windows
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
                  {[
                    { step: "1", text: "Instale o Python 3.10+" },
                    { step: "2", text: "Baixe o agente (ZIP)" },
                    { step: "3", text: "Extraia em C:\\enazizi-whatsapp-agent\\" },
                    { step: "4", text: "py -m pip install -r requirements.txt" },
                    { step: "5", text: "py agent.py" },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-start gap-2 p-2 rounded bg-background border">
                      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{step}</span>
                      <span className="text-xs leading-tight mt-0.5">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center py-8 text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhuma execução ativa</p>
                <p className="text-sm mt-1">Gere as mensagens na aba "Mensagens", depois inicie uma execução desktop.</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── TAB: History ─── */}
        <TabsContent value="history" className="space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Histórico de Execuções</h2>
          {historyLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : executions.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Data</th>
                    <th className="text-left p-3 font-medium">Modo</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Total</th>
                    <th className="text-left p-3 font-medium">Enviados</th>
                    <th className="text-left p-3 font-medium">Erros</th>
                    <th className="text-left p-3 font-medium">Pulados</th>
                    <th className="text-left p-3 font-medium">Duração</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((exec) => {
                    const duration = exec.started_at && exec.finished_at
                      ? Math.round((new Date(exec.finished_at).getTime() - new Date(exec.started_at).getTime()) / 60000)
                      : null;
                    return (
                      <tr key={exec.id} className="border-t hover:bg-muted/30">
                        <td className="p-3">{new Date(exec.execution_date).toLocaleDateString("pt-BR")}</td>
                        <td className="p-3"><Badge variant="outline" className="text-xs">{exec.mode}</Badge></td>
                        <td className="p-3"><Badge className={`text-xs ${statusColors[exec.status] || ""}`}>{statusLabels[exec.status] || exec.status}</Badge></td>
                        <td className="p-3">{exec.total_items}</td>
                        <td className="p-3 text-green-600">{exec.total_sent}</td>
                        <td className="p-3 text-red-600">{exec.total_error}</td>
                        <td className="p-3 text-yellow-600">{exec.total_skipped}</td>
                        <td className="p-3 flex items-center gap-1"><Clock className="h-3 w-3" />{duration != null ? `${duration}min` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma execução registrada</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Item detail dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Envio</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Aluno:</span> <span className="font-medium">{selectedItem.display_name}</span></div>
                <div><span className="text-muted-foreground">Telefone:</span> <span className="font-mono">{selectedItem.phone}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={`text-xs ${statusColors[selectedItem.delivery_status] || ""}`}>{statusLabels[selectedItem.delivery_status] || selectedItem.delivery_status}</Badge></div>
                <div><span className="text-muted-foreground">Tentativas:</span> {selectedItem.attempts}</div>
                {selectedItem.sent_at && <div><span className="text-muted-foreground">Enviado em:</span> {new Date(selectedItem.sent_at).toLocaleString("pt-BR")}</div>}
                {selectedItem.error_message && <div className="col-span-2"><span className="text-muted-foreground">Erro:</span> <span className="text-red-500">{selectedItem.error_message}</span></div>}
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Mensagem completa:</span>
                <div className="mt-1 p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">{selectedItem.message_text}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppPanel;
