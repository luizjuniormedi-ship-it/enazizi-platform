import { Component, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Friendly name for logging */
  name?: string;
  /** What to show if this card crashes */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * SafeCard — wraps individual Dashboard cards/sections.
 * If a child component crashes, shows a small fallback instead of
 * killing the entire Dashboard.
 */
class SafeCard extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn(`[SafeCard:${this.props.name || "unknown"}] Erro capturado:`, error.message);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <Card className="border-dashed border-muted-foreground/20">
          <CardContent className="p-4 flex items-center gap-2 text-muted-foreground text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Sem dados suficientes ainda.</span>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

export default SafeCard;
