import { useState, useEffect, useCallback } from "react";
import { Video, VideoOff, Copy, Users, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const FACULDADES = ["UNIG", "Estácio", "Outra"];

const VideoRoom = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("Sala de Aula");
  const [faculdade, setFaculdade] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");

  const loadRooms = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("video_rooms")
      .select("*")
      .eq("professor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setRooms(data || []);
    const active = (data || []).find((r: any) => r.status === "active");
    setActiveRoom(active || null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setDisplayName(data?.display_name || "Professor"));
  }, [user]);

  const createRoom = async () => {
    if (!user) return;
    setCreating(true);
    const roomCode = `enazizi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    try {
      const { data, error } = await supabase.from("video_rooms").insert({
        professor_id: user.id,
        room_code: roomCode,
        title: title.trim() || "Sala de Aula",
        faculdade_filter: faculdade && faculdade !== "all" ? faculdade : null,
        periodo_filter: periodo && periodo !== "all" ? parseInt(periodo) : null,
      }).select().single();
      if (error) throw error;
      setActiveRoom(data);
      toast({ title: "Sala criada!", description: "Compartilhe o link com seus alunos." });
      loadRooms();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const endRoom = async (roomId: string) => {
    await supabase
      .from("video_rooms")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", roomId);
    setActiveRoom(null);
    toast({ title: "Sala encerrada" });
    loadRooms();
  };

  const copyLink = (roomCode: string) => {
    const jitsiUrl = `https://meet.jit.si/${roomCode}`;
    navigator.clipboard.writeText(jitsiUrl);
    toast({ title: "Link copiado!", description: jitsiUrl });
  };

  const jitsiUrl = activeRoom
    ? `https://meet.jit.si/${activeRoom.room_code}#userInfo.displayName="${encodeURIComponent(displayName)}"`
    : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeRoom ? (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-500 text-white animate-pulse">● AO VIVO</Badge>
              <h3 className="font-semibold">{activeRoom.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => copyLink(activeRoom.room_code)} className="gap-1">
                <Copy className="h-3.5 w-3.5" /> Copiar Link
              </Button>
              <Button variant="destructive" size="sm" onClick={() => endRoom(activeRoom.id)} className="gap-1">
                <VideoOff className="h-3.5 w-3.5" /> Encerrar
              </Button>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden border border-border" style={{ height: "70vh" }}>
            <iframe
              src={jitsiUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
              className="w-full h-full"
              title="Video Call"
            />
          </div>
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Video className="h-5 w-5 text-primary" />
                Criar Nova Sala de Vídeo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Nome da Sala</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Revisão de Cardiologia" />
                </div>
                <div className="space-y-2">
                  <Label>Faculdade (filtro)</Label>
                  <Select value={faculdade} onValueChange={setFaculdade}>
                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {FACULDADES.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Período (filtro)</Label>
                  <Select value={periodo} onValueChange={setPeriodo}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (
                        <SelectItem key={p} value={String(p)}>{p}º período</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={createRoom} disabled={creating} className="gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Criar Sala e Iniciar
              </Button>
            </CardContent>
          </Card>

          {rooms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Histórico de Salas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rooms.slice(0, 10).map((room) => (
                    <div key={room.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{room.title}</span>
                        <Badge variant={room.status === "active" ? "default" : "secondary"} className="text-[10px]">
                          {room.status === "active" ? "Ativa" : "Encerrada"}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(room.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default VideoRoom;
