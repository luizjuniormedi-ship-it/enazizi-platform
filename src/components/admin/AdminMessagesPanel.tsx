import { useState, useEffect } from "react";
import { Send, Users, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SentMessage {
  id: string;
  title: string;
  content: string;
  priority: string;
  recipient_id: string | null;
  created_at: string;
  read_count?: number;
}

const AdminMessagesPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [recipientId, setRecipientId] = useState("all");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<{ user_id: string; display_name: string | null; email: string | null }[]>([]);

  useEffect(() => {
    loadMessages();
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, email")
      .order("display_name");
    if (data) setProfiles(data);
  };

  const loadMessages = async () => {
    setLoading(true);
    const { data: msgs } = await supabase
      .from("admin_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (msgs) {
      // Get read counts
      const msgIds = msgs.map((m: any) => m.id);
      const { data: reads } = await supabase
        .from("admin_message_reads")
        .select("message_id")
        .in("message_id", msgIds);

      const readCounts: Record<string, number> = {};
      reads?.forEach((r: any) => {
        readCounts[r.message_id] = (readCounts[r.message_id] || 0) + 1;
      });

      setMessages(msgs.map((m: any) => ({ ...m, read_count: readCounts[m.id] || 0 })));
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!user || !title.trim() || !content.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from("admin_messages").insert({
        sender_id: user.id,
        recipient_id: recipientId === "all" ? null : recipientId,
        title: title.trim(),
        content: content.trim(),
        priority,
      });
      if (error) throw error;
      toast({ title: "Mensagem enviada!", description: recipientId === "all" ? "Enviada para todos os alunos." : "Enviada para o aluno selecionado." });
      setTitle("");
      setContent("");
      setPriority("normal");
      setRecipientId("all");
      loadMessages();
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    }
    setSending(false);
  };

  const priorityColor = (p: string) => {
    if (p === "urgent") return "destructive";
    if (p === "important") return "default";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      {/* Compose */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4" /> Nova Mensagem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Título da mensagem" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Conteúdo da mensagem..." value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">🟢 Normal</SelectItem>
                <SelectItem value="important">🟡 Importante</SelectItem>
                <SelectItem value="urgent">🔴 Urgente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={recipientId} onValueChange={setRecipientId}>
              <SelectTrigger>
                <SelectValue placeholder="Destinatário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Todos os alunos</span>
                </SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.user_id} value={p.user_id}>
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> {p.display_name || p.email || "Sem nome"}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSend} disabled={sending || !title.trim() || !content.trim()} className="w-full gap-2">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar Mensagem
          </Button>
        </CardContent>
      </Card>

      {/* Sent messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mensagens Enviadas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma mensagem enviada.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div key={m.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-medium truncate">{m.title}</h4>
                        <Badge variant={priorityColor(m.priority)} className="text-[10px] shrink-0">
                          {m.priority === "urgent" ? "Urgente" : m.priority === "important" ? "Importante" : "Normal"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{m.content}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>{new Date(m.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        <span>{m.recipient_id ? "📩 Direto" : "📢 Todos"}</span>
                        <span>👁 {m.read_count} leitura{m.read_count !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                  {i < messages.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMessagesPanel;
