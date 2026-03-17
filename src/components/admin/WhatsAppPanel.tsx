import { useState, useRef, useCallback } from "react";
import { MessageSquare, Send, Copy, Loader2, RefreshCw, Phone, AlertTriangle, CheckCircle, PlayCircle, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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

interface WhatsAppPanelProps {
  session: { access_token: string } | null;
}

const cleanPhone = (phone: string) => phone.replace(/\D/g, "");

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  const generateMessages = async () => {
    if (!session) return;
    setLoading(true);
    setSentUsers(new Set());
    setEditedMessages({});
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ app_url: window.location.origin }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Erro ao gerar mensagens");
      setStudents(data.students || []);
      const total = (data.students || []).length;
      const alreadySent = (data.students || []).filter((s: Student) => s.already_sent_today).length;
      if (total === 0) {
        toast({ title: "Nenhum aluno", description: data.message || "Nenhum aluno com telefone cadastrado." });
      } else {
        toast({
          title: "Mensagens geradas!",
          description: `${total} mensagem(ns) prontas. ${alreadySent > 0 ? `${alreadySent} já receberam hoje.` : ""}`,
        });
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
    const msg = encodeURIComponent(getMessage(s));
    return `https://wa.me/${fullPhone}?text=${msg}`;
  };

  const logAndSend = async (s: Student) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("whatsapp_message_log" as any).insert({
          admin_user_id: user.id,
          target_user_id: s.user_id,
          message_text: getMessage(s),
        } as any);
      }
    } catch { /* continue even if log fails */ }
    window.open(getWhatsAppUrl(s), "_blank");
    setSentUsers((prev) => new Set(prev).add(s.user_id));
  };

  const handleSend = async (s: Student) => {
    setSavingLog(s.user_id);
    await logAndSend(s);
    setSavingLog(null);
  };

  const handleCopy = (s: Student) => {
    navigator.clipboard.writeText(getMessage(s));
    toast({ title: "Copiado!", description: "Mensagem copiada para a área de transferência." });
  };

  const handleBulkSend = useCallback(async () => {
    const pending = students.filter((s) => !sentUsers.has(s.user_id) && !s.already_sent_today);
    if (pending.length === 0) {
      toast({ title: "Nenhum pendente", description: "Todos já foram enviados ou já receberam hoje." });
      return;
    }

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

      // Wait with countdown between sends (except last one)
      if (i < pending.length - 1 && !cancelRef.current) {
        const waitSec = Math.floor(Math.random() * 8) + 8; // 8-15s
        for (let sec = waitSec; sec > 0; sec--) {
          if (cancelRef.current) break;
          setBulkCountdown(sec);
          await delay(1000);
        }
        setBulkCountdown(0);
      }
    }

    setBulkSending(false);
    setBulkCurrentName("");
    setBulkCountdown(0);

    if (cancelRef.current) {
      toast({ title: "Envio cancelado", description: `${bulkProgress} de ${pending.length} enviado(s).` });
    } else {
      toast({ title: "Envio concluído! ✅", description: `${pending.length} mensagem(ns) enviada(s).` });
    }
  }, [students, sentUsers, toast]);

  const handleCancelBulk = () => {
    cancelRef.current = true;
  };

  const sentCount = sentUsers.size;
  const unsentCount = students.filter((s) => !sentUsers.has(s.user_id) && !s.already_sent_today).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Mensagens WhatsApp
          </h2>
          <p className="text-sm text-muted-foreground">
            Gere mensagens únicas por IA e envie todas com um clique. Cada aluno recebe no máximo 1 por dia.
          </p>
        </div>
        <Button onClick={generateMessages} disabled={loading || bulkSending} className="gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Gerar mensagens do dia
        </Button>
      </div>

      {students.length > 0 && (
        <>
          {/* Summary bar + bulk send */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <Badge variant="outline" className="gap-1">
                <Phone className="h-3 w-3" /> {students.length} aluno(s)
              </Badge>
              {sentCount > 0 && (
                <Badge variant="outline" className="gap-1 text-primary border-primary/30">
                  <CheckCircle className="h-3 w-3" /> {sentCount} enviado(s)
                </Badge>
              )}
              {unsentCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  {unsentCount} pendente(s)
                </Badge>
              )}
              {students.filter((s) => s.already_sent_today).length > 0 && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  ⚠️ {students.filter((s) => s.already_sent_today).length} já recebeu hoje
                </Badge>
              )}
            </div>

            {!bulkSending ? (
              <Button onClick={handleBulkSend} disabled={unsentCount === 0} className="gap-1.5">
                <PlayCircle className="h-4 w-4" />
                Enviar todos ({unsentCount})
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleCancelBulk} className="gap-1.5">
                <StopCircle className="h-4 w-4" />
                Cancelar envio
              </Button>
            )}
          </div>

          {/* Bulk progress bar */}
          {bulkSending && (
            <div className="space-y-2 p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  📤 Enviando para {bulkCurrentName}... ({bulkProgress}/{bulkTotal})
                </span>
                {bulkCountdown > 0 && (
                  <span className="text-muted-foreground text-xs">
                    ⏳ Próximo em {bulkCountdown}s (anti-bloqueio)
                  </span>
                )}
              </div>
              <Progress value={(bulkProgress / bulkTotal) * 100} className="h-2" />
            </div>
          )}

          {/* Student list */}
          <div className="space-y-3">
            {students.map((s) => {
              const isSent = sentUsers.has(s.user_id);
              const isAlreadySentToday = s.already_sent_today;
              return (
                <div
                  key={s.user_id}
                  className={`rounded-lg border p-4 space-y-3 transition-colors ${
                    isSent ? "bg-primary/5 border-primary/20" : isAlreadySentToday ? "bg-muted/50 border-muted opacity-60" : "bg-secondary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {(s.display_name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{s.display_name || "Sem nome"}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {s.phone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.urgentes_count > 0 && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertTriangle className="h-3 w-3" /> {s.urgentes_count} urgente(s)
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {s.revisoes_count} revisão(ões)
                      </Badge>
                      {!s.ai_generated && (
                        <Badge variant="secondary" className="text-xs">Fallback</Badge>
                      )}
                      {isAlreadySentToday && !isSent && (
                        <Badge variant="secondary" className="text-xs">Já enviado hoje</Badge>
                      )}
                      {isSent && (
                        <Badge className="gap-1 text-xs bg-primary/10 text-primary border-primary/30">
                          <CheckCircle className="h-3 w-3" /> Enviado
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Textarea
                    value={getMessage(s)}
                    onChange={(e) => setEditedMessages((prev) => ({ ...prev, [s.user_id]: e.target.value }))}
                    rows={4}
                    className="text-sm resize-none"
                    disabled={isAlreadySentToday && !isSent}
                  />

                  <div className="flex items-center gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleCopy(s)} className="gap-1.5">
                      <Copy className="h-3.5 w-3.5" /> Copiar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSend(s)}
                      disabled={savingLog === s.user_id || (isAlreadySentToday && !isSent) || bulkSending}
                      className="gap-1.5"
                    >
                      {savingLog === s.user_id ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Abrindo...</>
                      ) : (
                        <><Send className="h-3.5 w-3.5" /> Enviar via WhatsApp</>
                      )}
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
    </div>
  );
};

export default WhatsAppPanel;
