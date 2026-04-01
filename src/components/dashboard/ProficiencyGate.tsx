import { useNavigate, useLocation } from "react-router-dom";
import { usePendingProficiency } from "@/hooks/usePendingProficiency";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProficiencyGate = () => {
  const { isBlocked, pendingCount } = usePendingProficiency();
  const location = useLocation();
  const navigate = useNavigate();

  const onProficiencyPage = location.pathname === "/dashboard/proficiencia";

  if (!isBlocked || onProficiencyPage) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-8 text-center space-y-5 animate-fade-in">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Atividades Pendentes</h2>
        <p className="text-muted-foreground">
          Você tem <span className="font-semibold text-primary">{pendingCount}</span>{" "}
          {pendingCount === 1 ? "atividade pendente" : "atividades pendentes"} atribuída{pendingCount === 1 ? "" : "s"} pelo professor.
          Visite a aba <strong>Proficiência</strong> antes de continuar.
        </p>
        <Button onClick={() => navigate("/dashboard/proficiencia")} size="lg" className="w-full">
          Ir para Proficiência
        </Button>
      </div>
    </div>
  );
};

export default ProficiencyGate;
