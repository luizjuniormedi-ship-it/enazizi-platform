import { useState, useRef } from "react";
import { MessageSquare, Send, Copy, Loader2, RefreshCw, Phone, AlertTriangle, CheckCircle, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface Student {
  user_id: string;
  display_name: string | null;
  phone: string;
  message: string;
  revisoes_count: number;
  urgentes_count: number;
  ai_generated: boolean;
}

interface WhatsAppPanelProps {
  session: { access_token: string } | null;
}

const cleanPhone = (phone: string) => phone.replace(/\D/g, "");

const WhatsAppPanel = ({ session }: WhatsAppPanelProps) => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [editedMessages, setEditedMessages] = useState<Record<string, string>>({});
  const [dispatching, setDispatching] = useState(false);
  const [dispatchIndex, setDispatchIndex] = useState(0);
  const [sentUsers, setSentUsers] = useState<Set<string>>(new Set());
  const abortRef = useRef(false);

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
      if ((data.students || []).length === 0) {
        toast({ title: "Nenhum aluno", description: data.message || "Nenhum aluno com telefone cadastrado." });
      } else {
        toast({ title: "Mensagens geradas!", description: `${data.students.length} mensagem(ns) prontas para envio.` });
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

  const handleSend = (s: Student) => {
    window.open(getWhatsAppUrl(s), "_blank");
    setSentUsers((prev) => new Set(prev).add(s.user_id));
  };

  const handleCopy = (s: Student) => {
    navigator.clipboard.writeText(getMessage(s));
    toast({ title: "Copiado!", description: "Mensagem copiada para a área de transferência." });
  };

  // Random delay between 8-15 seconds to avoid WhatsApp blocking
  const randomDelay = () => 8000 + Math.floor(Math.random() * 7000);

  const handleSequentialDispatch = async () => {
    if (dispatching) {
      abortRef.current = true;
      setDispatching(false);
      return;
    }

    abortRef.current = false;
    setDispatching(true);
    setDispatchIndex(0);

    const unsent = students.filter((s) => !sentUsers.has(s.user_id));
    for (let i = 0; i < unsent.length; i++) {
      if (abortRef.current) break;
      setDispatchIndex(i);
      handleSend(unsent[i]);
      if (i < unsent.length - 1) {
        const delay = randomDelay();
        setCurrentDelay(delay);
        await new Promise((r) => setTimeout(r, delay));
        setCurrentDelay(0);
      }
    }
    setDispatching(false);
    if (!abortRef.current) {
      toast({ title: "Disparo concluído!", description: `${unsent.length} mensagem(ns) enviada(s).` });
    }
  };

  const unsentCount = students.filter((s) => !sentUsers.has(s.user_id)).length;
  const sentCount = sentUsers.size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            Disparar Mensagens WhatsApp
          </h2>
          <p className="text-sm text-muted-foreground">
            Gere mensagens personalizadas por IA e envie via WhatsApp Web.
          </p>
        </div>
        <Button onClick={generateMessages} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Gerar mensagens do dia
        </Button>
      </div>

      {students.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline" className="gap-1">
                  <Phone className="h-3 w-3" /> {students.length} aluno(s)
                </Badge>
                <Badge variant="outline" className="gap-1 text-green-600 border-green-500/30">
                  <CheckCircle className="h-3 w-3" /> {sentCount} enviado(s)
                </Badge>
                {unsentCount > 0 && (
                  <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/30">
                    {unsentCount} pendente(s)
                  </Badge>
                )}
              </div>
              {dispatching && (
                <Progress value={((dispatchIndex + 1) / unsentCount) * 100} className="h-2" />
              )}
            </div>
            <Button
              onClick={handleSequentialDispatch}
              variant={dispatching ? "destructive" : "default"}
              disabled={unsentCount === 0 && !dispatching}
              className="gap-1.5"
            >
              {dispatching ? (
                <><Square className="h-4 w-4" /> Parar</>
              ) : (
                <><Play className="h-4 w-4" /> Disparar todos ({unsentCount})</>
              )}
            </Button>
          </div>

          {/* Student list */}
          <div className="space-y-3">
            {students.map((s) => {
              const isSent = sentUsers.has(s.user_id);
              return (
                <div
                  key={s.user_id}
                  className={`rounded-lg border p-4 space-y-3 transition-colors ${
                    isSent ? "bg-green-500/5 border-green-500/20" : "bg-secondary/30"
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
                      {isSent && (
                        <Badge className="gap-1 text-xs bg-green-500/10 text-green-600 border-green-500/30">
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
                  />

                  <div className="flex items-center gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleCopy(s)} className="gap-1.5">
                      <Copy className="h-3.5 w-3.5" /> Copiar
                    </Button>
                    <Button size="sm" onClick={() => handleSend(s)} className="gap-1.5 bg-green-600 hover:bg-green-700">
                      <Send className="h-3.5 w-3.5" /> Enviar via WhatsApp
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
