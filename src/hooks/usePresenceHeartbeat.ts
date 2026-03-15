import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";

const HEARTBEAT_INTERVAL = 60_000; // 1 minute

export function usePresenceHeartbeat() {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    const sendHeartbeat = async () => {
      await supabase.from("user_presence" as any).upsert(
        {
          user_id: user.id,
          last_seen_at: new Date().toISOString(),
          current_page: location.pathname,
        } as any,
        { onConflict: "user_id" }
      );
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [user, location.pathname]);
}
