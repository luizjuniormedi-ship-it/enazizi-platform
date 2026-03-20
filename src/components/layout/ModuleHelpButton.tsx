import { useState, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ModuleHelpButtonProps {
  moduleKey: string;
  moduleName: string;
  steps: string[];
}

const ModuleHelpButton = ({ moduleKey, moduleName, steps }: ModuleHelpButtonProps) => {
  const storageKey = `help_seen_${moduleKey}`;
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) {
      setIsNew(true);
    }
  }, [storageKey]);

  const handleOpen = (open: boolean) => {
    if (open && isNew) {
      localStorage.setItem(storageKey, "true");
      setIsNew(false);
    }
  };

  return (
    <Popover onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button className="relative inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <HelpCircle className="h-3.5 w-3.5" />
          Como usar
          {isNew && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="px-4 pt-3 pb-2 border-b border-border/50">
          <p className="text-sm font-semibold">{moduleName}</p>
          <p className="text-xs text-muted-foreground">Passo a passo</p>
        </div>
        <div className="px-4 py-3 space-y-2.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ModuleHelpButton;
