import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, MessageSquareHeart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const LOGIN_COUNT_KEY_PREFIX = "enazizi_login_count_";
const FEEDBACK_GIVEN_KEY_PREFIX = "enazizi_feedback_given_";
const MIN_LOGINS = 3;

const MODULES = [
  { key: "simulados", label: "Simulados" },
  { key: "flashcards", label: "Flashcards" },
  { key: "cronograma", label: "Cronograma Inteligente" },
  { key: "simulacao_clinica", label: "Simulação Clínica" },
  { key: "banco_questoes", label: "Banco de Questões" },
  { key: "agentes_ia", label: "Agentes IA (Mentor, Coach, etc.)" },
  { key: "caderno_erros", label: "Caderno de Erros" },
  { key: "anamnese", label: "Treino de Anamnese" },
];

const StarRating = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              star <= (hover || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const FeedbackSurveyPopup = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const alreadyGiven = localStorage.getItem(`${FEEDBACK_GIVEN_KEY_PREFIX}${user.id}`);
    if (alreadyGiven === "true") return;

    const loginCount = parseInt(
      localStorage.getItem(`${LOGIN_COUNT_KEY_PREFIX}${user.id}`) || "0",
      10,
    );

    if (loginCount < MIN_LOGINS) return;

    // Also check DB in case they submitted from another device
    supabase
      .from("user_feedback")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          localStorage.setItem(`${FEEDBACK_GIVEN_KEY_PREFIX}${user.id}`, "true");
          return;
        }
        const timer = setTimeout(() => setOpen(true), 2000);
        return () => clearTimeout(timer);
      });
  }, [user]);

  const allRated = MODULES.every((m) => ratings[m.key] && ratings[m.key] > 0);
  const canSubmit = allRated && feedbackText.trim().length >= 5;

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("user_feedback").insert({
        user_id: user.id,
        ratings,
        feedback_text: feedbackText.trim(),
      });
      if (error) throw error;
      localStorage.setItem(`${FEEDBACK_GIVEN_KEY_PREFIX}${user.id}`, "true");
      toast.success("Obrigado pelo feedback! 💜");
      setOpen(false);
    } catch {
      toast.error("Erro ao enviar feedback. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (v) setOpen(true); }}>
      <DialogContent
        className="sm:max-w-md border-primary/20 [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquareHeart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Sua opinião importa! 💬</DialogTitle>
              <DialogDescription className="text-xs">
                Avalie os módulos e nos ajude a melhorar
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] pr-2">
          <div className="space-y-3 py-2">
            {MODULES.map((mod) => (
              <div
                key={mod.key}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5"
              >
                <span className="text-sm font-medium">{mod.label}</span>
                <StarRating
                  value={ratings[mod.key] || 0}
                  onChange={(v) =>
                    setRatings((prev) => ({ ...prev, [mod.key]: v }))
                  }
                />
              </div>
            ))}

            <div className="pt-2">
              <label className="text-sm font-medium mb-1.5 block">
                O que podemos melhorar? <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Escreva sua opinião, sugestões ou críticas..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="min-h-[80px] text-sm"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {feedbackText.length}/1000 caracteres (mínimo 5)
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="space-y-2 pt-1">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full"
          >
            {submitting ? "Enviando..." : "Enviar avaliação ⭐"}
          </Button>
          {!canSubmit && (
            <p className="text-xs text-center text-muted-foreground">
              {!allRated
                ? "Avalie todos os módulos para continuar"
                : "Escreva pelo menos 5 caracteres"}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackSurveyPopup;
