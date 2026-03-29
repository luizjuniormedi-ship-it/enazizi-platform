import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Sparkles } from "lucide-react";

/**
 * Shows a confirmation popup after exam setup is completed.
 * Reinforces the user's decision with positive framing.
 */
export default function ExamSetupConfirmation() {
  const storageKey = "enazizi_exam_setup_confirmed";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(storageKey) === "shown") return;
    if (localStorage.getItem("enazizi_exam_just_configured") === "true") {
      localStorage.removeItem("enazizi_exam_just_configured");
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(storageKey, "shown");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-sm border-primary/20">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-base">Modo aprovação ativado ✅</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-sm">
          Agora seu plano, revisões e simulados estão calibrados para a sua prova.
          O sistema vai guiar cada passo até a aprovação.
        </DialogDescription>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Alunos no modo personalizado têm até 3x mais evolução
        </div>
        <Button onClick={handleClose} className="w-full mt-2">Vamos começar!</Button>
      </DialogContent>
    </Dialog>
  );
}
