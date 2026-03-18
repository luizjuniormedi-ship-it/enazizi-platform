import { useEffect, useState } from "react";
import { Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const ActiveVideoRoomPopup = () => {
  const { user } = useAuth();
  const [room, setRoom] = useState<any>(null);
  const [meetLink, setMeetLink] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("faculdade, periodo")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: rooms } = await supabase
        .from("video_rooms")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!rooms || rooms.length === 0) return;

      const matching = rooms.find((r: any) => {
        const invited: string[] = r.invited_students || [];
        if (invited.length > 0) return invited.includes(user.id);
        const facMatch = !r.faculdade_filter || r.faculdade_filter === profile?.faculdade;
        const perMatch = !r.periodo_filter || r.periodo_filter === profile?.periodo;
        return facMatch && perMatch;
      });

      if (!matching) return;

      const dismissedKey = `popup_dismissed_${matching.id}`;
      if (sessionStorage.getItem(dismissedKey)) return;

      setRoom(matching);
      setMeetLink((matching as any).meet_link || null);
      setOpen(true);
    };

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleDismiss = () => {
    if (room) sessionStorage.setItem(`popup_dismissed_${room.id}`, "1");
    setOpen(false);
  };

  const handleJoin = () => {
    if (meetLink) window.open(meetLink, "_blank");
    handleDismiss();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <Video className="h-7 w-7 text-destructive animate-pulse" />
          </div>
          <DialogTitle className="text-center">📹 Aula ao Vivo!</DialogTitle>
          <DialogDescription className="text-center">
            O professor iniciou a aula <strong className="text-foreground">{room?.title}</strong>.
            Clique abaixo para entrar no Google Meet.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleDismiss} className="w-full sm:w-auto">
            Depois
          </Button>
          {meetLink && (
            <Button variant="destructive" onClick={handleJoin} className="w-full sm:w-auto gap-2">
              <Video className="h-4 w-4" /> Entrar na Aula
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActiveVideoRoomPopup;
