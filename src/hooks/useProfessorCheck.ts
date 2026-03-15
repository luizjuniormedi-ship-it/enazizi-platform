import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useProfessorCheck = () => {
  const { user } = useAuth();
  const [isProfessor, setIsProfessor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsProfessor(false);
      setLoading(false);
      return;
    }
    const check = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "professor")
        .maybeSingle();
      setIsProfessor(!!data);
      setLoading(false);
    };
    check();
  }, [user]);

  return { isProfessor, loading };
};
