import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

interface ModuleEmptyStateProps {
  icon: string;
  title: string;
  description: string;
  steps: string[];
  actionLabel: string;
  actionPath?: string;
  onAction?: () => void;
}

const ModuleEmptyState = ({ icon, title, description, steps, actionLabel, actionPath, onAction }: ModuleEmptyStateProps) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) return onAction();
    if (actionPath) navigate(actionPath);
  };

  return (
    <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <CardContent className="p-8 flex flex-col items-center text-center space-y-5">
        <span className="text-5xl">{icon}</span>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-md">{description}</p>
        </div>

        <div className="w-full max-w-sm text-left space-y-2.5 bg-muted/30 rounded-lg p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Como começar</p>
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        <Button onClick={handleAction} size="lg" className="gap-2 mt-2">
          <Sparkles className="h-4 w-4" />
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ModuleEmptyState;
