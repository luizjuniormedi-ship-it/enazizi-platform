import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface SafeCtaOptions {
  /** Async action to execute before navigating */
  action?: () => Promise<void> | void;
  /** Route to navigate to after success */
  nextStep?: string;
  /** Error message shown on failure */
  errorMessage?: string;
}

/**
 * Standardised CTA handler:
 *   showLoading → execute(action) → navigate(nextStep) → catch → showError
 *
 * For sync-only navigation, just use `navigate()` directly.
 */
export function useSafeCta() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async ({ action, nextStep, errorMessage }: SafeCtaOptions) => {
      setLoading(true);
      try {
        if (action) await action();
        if (nextStep) navigate(nextStep);
      } catch (err) {
        console.error("[SafeCTA]", err);
        toast({
          title: "Erro",
          description:
            errorMessage || "Não foi possível executar essa ação. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [navigate, toast],
  );

  return { loading, execute };
}
