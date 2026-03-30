import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useInstitution } from "@/hooks/useInstitution";
import ProtectedRoute from "./ProtectedRoute";

const InstitutionalRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isStaff, loading: instLoading } = useInstitution();

  if (authLoading || instLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isStaff) return <Navigate to="/dashboard" replace />;

  return <ProtectedRoute>{children}</ProtectedRoute>;
};

export default InstitutionalRoute;
