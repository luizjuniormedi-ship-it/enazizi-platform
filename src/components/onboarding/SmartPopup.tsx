import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface SmartPopupProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  ctaLabel?: string;
  onCta?: () => void;
  delayMs?: number;
}

export default function SmartPopup({
  id,
  title,
  description,
  icon,
  ctaLabel = "Entendi!",
  onCta,
  delayMs = 1000,
}: SmartPopupProps) {
  const storageKey = `enazizi_popup_${id}`;
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(storageKey) === "dismissed") return;
    const timer = setTimeout(() => setOpen(true), delayMs);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    if (dontShow) localStorage.setItem(storageKey, "dismissed");
    else localStorage.setItem(storageKey, "seen");
    setOpen(false);
    onCta?.();
  };

  // If already dismissed permanently, never render
  if (localStorage.getItem(storageKey) === "dismissed") return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-sm border-primary/20">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {icon}
            </div>
            <div>
              <DialogTitle className="text-base">{title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <DialogDescription className="text-sm">{description}</DialogDescription>
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id={`dont-show-${id}`}
            checked={dontShow}
            onCheckedChange={(v) => setDontShow(!!v)}
          />
          <label htmlFor={`dont-show-${id}`} className="text-xs text-muted-foreground cursor-pointer">
            Não mostrar novamente
          </label>
        </div>
        <Button onClick={handleClose} className="w-full mt-1">{ctaLabel}</Button>
      </DialogContent>
    </Dialog>
  );
}
