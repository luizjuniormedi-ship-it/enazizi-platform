import { useState, useEffect, useRef } from "react";
import { Mail, AlertTriangle, Bell, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface AdminMessage {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_at: string;
}

const AdminMessagesBanner = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: msgs } = await supabase
        .from("admin_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      const { data: reads } = await supabase
        .from("admin_message_reads")
        .select("message_id")
        .eq("user_id", user.id);

      if (msgs) setMessages(msgs);
      if (reads) setReadIds(new Set(reads.map((r: any) => r.message_id)));

      // Show toast alert for unread messages
      if (msgs && reads && !hasNotifiedRef.current) {
        const readSet = new Set(reads?.map((r: any) => r.message_id) || []);
        const unread = msgs.filter((m: any) => !readSet.has(m.id));
        if (unread.length > 0) {
          hasNotifiedRef.current = true;
          const urgent = unread.find((m: any) => m.priority === "urgent");
          toast(urgent ? `🔴 ${urgent.title}` : `📬 Você tem ${unread.length} mensagem(ns) nova(s)`, {
            description: urgent ? urgent.content.slice(0, 80) + "..." : "Toque para ver suas mensagens.",
            duration: 8000,
            action: {
              label: "Ver",
              onClick: () => setOpen(true),
            },
          });
        }
      }
    };
    load();
  }, [user]);

  const unreadMessages = messages.filter((m) => !readIds.has(m.id));
  const urgentUnread = unreadMessages.filter((m) => m.priority === "urgent");

  const markAsRead = async (msgId: string) => {
    if (!user || readIds.has(msgId)) return;
    await supabase.from("admin_message_reads").insert({ message_id: msgId, user_id: user.id });
    setReadIds((prev) => new Set([...prev, msgId]));
  };

  const handleOpen = () => {
    setOpen(true);
    unreadMessages.forEach((m) => markAsRead(m.id));
  };

  const priorityColor = (p: string) => {
    if (p === "urgent") return "destructive";
    if (p === "important") return "default";
    return "secondary";
  };

  const priorityLabel = (p: string) => {
    if (p === "urgent") return "Urgente";
    if (p === "important") return "Importante";
    return "Normal";
  };

  if (messages.length === 0) return null;

  return (
    <>
      {/* Urgent messages as top alert */}
      {urgentUnread.map((m) => (
        <Alert key={m.id} variant="destructive" className="cursor-pointer animate-pulse" onClick={handleOpen}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">{m.title}</AlertTitle>
          <AlertDescription className="text-xs line-clamp-1">{m.content}</AlertDescription>
        </Alert>
      ))}

      {/* Inbox button with notification indicator */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className={`gap-2 w-full justify-start ${unreadMessages.length > 0 ? "border-primary/50 bg-primary/5" : "border-dashed"}`}
      >
        <div className="relative">
          <Mail className="h-4 w-4 text-primary" />
          {unreadMessages.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 rounded-full bg-destructive animate-ping" />
          )}
        </div>
        <span>Mensagens do Sistema</span>
        {unreadMessages.length > 0 && (
          <Badge variant="destructive" className="ml-auto text-xs animate-bounce">
            {unreadMessages.length} nova{unreadMessages.length > 1 ? "s" : ""}
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> Mensagens
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-2">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma mensagem.</p>
              )}
              {messages.map((m, i) => (
                <div key={m.id}>
                  <div className={`p-3 rounded-lg ${readIds.has(m.id) ? "bg-muted/30" : "bg-primary/5 border border-primary/20"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold">{m.title}</h4>
                      <Badge variant={priorityColor(m.priority)} className="text-[10px]">
                        {priorityLabel(m.priority)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{m.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {new Date(m.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                  {i < messages.length - 1 && <Separator className="my-1" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminMessagesBanner;
