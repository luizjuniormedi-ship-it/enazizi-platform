import { useEffect, useState } from "react";
import { Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const ActiveVideoRoomBanner = () => {
  const { user } = useAuth();
  const [room, setRoom] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Get student's profile for filtering
      const { data: profile } = await supabase
        .from("profiles")
        .select("faculdade, periodo")
        .eq("user_id", user.id)
        .maybeSingle();

      // Find active rooms matching student's filters
      const { data: rooms } = await supabase
        .from("video_rooms")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!rooms || rooms.length === 0) return;

      // Filter rooms that match student's faculdade/periodo or have no filter
      const matching = rooms.find((r: any) => {
        const facMatch = !r.faculdade_filter || r.faculdade_filter === profile?.faculdade;
        const perMatch = !r.periodo_filter || r.periodo_filter === profile?.periodo;
        return facMatch && perMatch;
      });

      setRoom(matching || null);
    };

    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  if (!room) return null;

  const jitsiUrl = `https://meet.jit.si/${room.room_code}`;

  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 flex items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
          <Video className="h-5 w-5 text-red-500 animate-pulse" />
        </div>
        <div>
          <h4 className="font-semibold text-sm">📹 Aula ao vivo: {room.title}</h4>
          <p className="text-xs text-muted-foreground">Um professor iniciou uma chamada de vídeo</p>
        </div>
      </div>
      <Button size="sm" className="gap-1 bg-red-500 hover:bg-red-600" onClick={() => window.open(jitsiUrl, "_blank")}>
        <Video className="h-3.5 w-3.5" /> Entrar
      </Button>
    </div>
  );
};

export default ActiveVideoRoomBanner;
