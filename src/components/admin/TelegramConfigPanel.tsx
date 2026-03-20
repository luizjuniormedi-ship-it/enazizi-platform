import { useState, useEffect } from "react";
import { Send, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TelegramConfigPanel = () => {
  const { toast } = useToast();
  const [chatId, setChatId] = useState("");
  const [groupLink, setGroupLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("platform_config" as any)
      .select("telegram_chat_id, telegram_group_link")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setChatId((data as any).telegram_chat_id || "");
          setGroupLink((data as any).telegram_group_link || "");
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("platform_config" as any)
        .update({
          telegram_chat_id: chatId.trim() || null,
          telegram_group_link: groupLink.trim() || null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", 1);
      if (error) throw error;
      toast({ title: "Configuração salva!", description: "Chat ID e Link do grupo atualizados." });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Send className="h-5 w-5 text-primary" />
          Configuração do Telegram
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configure o grupo do Telegram onde o bot MedStudy AI enviará notificações de aulas ao vivo. Esses dados serão usados automaticamente por todos os professores.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Chat ID do Grupo</Label>
            <Input
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Ex: -1001234567890"
            />
            <p className="text-xs text-muted-foreground">
              ID numérico do grupo (começa com -100 para supergrupos)
            </p>
          </div>
          <div className="space-y-2">
            <Label>Link do Grupo</Label>
            <Input
              value={groupLink}
              onChange={(e) => setGroupLink(e.target.value)}
              placeholder="Ex: https://t.me/+abc123"
            />
            <p className="text-xs text-muted-foreground">
              Link de convite que os alunos usarão para entrar
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Configuração
        </Button>
      </CardContent>
    </Card>
  );
};

export default TelegramConfigPanel;
