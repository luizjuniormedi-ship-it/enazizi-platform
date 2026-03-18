import { useEffect, useState } from "react";
import { Video, ExternalLink } from "lucide-react";
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
  const [pulse, setPulse] = useState(true);

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

  // Pulse animation toggle
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setPulse((p) => !p), 1500);
    return () => clearInterval(interval);
  }, [open]);

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
      <DialogContent className="sm:max-w-lg border-2 border-destructive/50 shadow-[0_0_40px_rgba(239,68,68,0.3)] overflow-hidden p-0">
        {/* Animated top bar */}
        <div className="h-2 w-full bg-gradient-to-r from-destructive via-warning to-destructive animate-pulse" />

        <div className="p-6 pb-2">
          <DialogHeader className="items-center gap-3">
            <div
              className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center transition-all duration-500 ${
                pulse
                  ? "bg-destructive/20 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                  : "bg-destructive/10 scale-100 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
              }`}
            >
              <Video className="h-10 w-10 text-destructive animate-pulse" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold">
              🔴 AULA AO VIVO!
            </DialogTitle>
            <DialogDescription className="text-center text-base leading-relaxed">
              O professor iniciou a aula{" "}
              <strong className="text-foreground text-lg">{room?.title}</strong>
              <br />
              <span className="text-destructive font-semibold mt-1 inline-block animate-pulse">
                A aula está acontecendo AGORA!
              </span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="flex-col gap-3 p-6 pt-2">
          {meetLink && (
            <Button
              variant="destructive"
              onClick={handleJoin}
              className="w-full h-14 text-lg font-bold gap-3 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Video className="h-6 w-6" />
              Entrar na Aula Agora
              <ExternalLink className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="w-full text-muted-foreground text-sm"
          >
            Lembrar depois
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActiveVideoRoomPopup;
