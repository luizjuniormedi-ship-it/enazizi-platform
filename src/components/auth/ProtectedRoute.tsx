import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);
  const [checkingBlock, setCheckingBlock] = useState(true);

  useEffect(() => {
    if (!user) { setCheckingBlock(false); return; }
    const check = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_blocked")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsBlocked(data?.is_blocked ?? false);
      setCheckingBlock(false);
    };
    check();
  }, [user]);

  if (loading || checkingBlock) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <div className="text-5xl">🚫</div>
          <h1 className="text-2xl font-bold text-destructive">Conta Bloqueada</h1>
          <p className="text-muted-foreground max-w-md">
            Sua conta foi bloqueada pelo administrador. Entre em contato com o suporte para mais informações.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
