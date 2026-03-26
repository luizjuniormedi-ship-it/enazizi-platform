import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SelfAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: string;
  onSubmit: (confidence: number) => void;
}

const labels = ["Não entendi", "Preciso revisar", "Razoável", "Bom domínio", "Domino bem"];

const SelfAssessmentDialog = ({ open, onOpenChange, topic, onSubmit }: SelfAssessmentDialogProps) => {
  const [rating, setRating] = useState(0);
  const [hovering, setHovering] = useState(0);

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating);
      setRating(0);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Como você se sente sobre este tema?</DialogTitle>
          <DialogDescription>
            Avalie sua confiança em <span className="font-semibold text-foreground">{topic}</span> após o estudo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform hover:scale-110 active:scale-95"
                onMouseEnter={() => setHovering(star)}
                onMouseLeave={() => setHovering(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= (hovering || rating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground h-5">
            {(hovering || rating) > 0 ? labels[(hovering || rating) - 1] : "Selecione de 1 a 5"}
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Pular</Button>
          <Button onClick={handleSubmit} disabled={rating === 0}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SelfAssessmentDialog;
