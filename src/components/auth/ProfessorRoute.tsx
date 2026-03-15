import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfessorCheck } from "@/hooks/useProfessorCheck";
import { useAdminCheck } from "@/hooks/useAdminCheck";

const ProfessorRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isProfessor, loading: profLoading } = useProfessorCheck();
  const { isAdmin, loading: adminLoading } = useAdminCheck();

  if (authLoading || profLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isProfessor && !isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default ProfessorRoute;
