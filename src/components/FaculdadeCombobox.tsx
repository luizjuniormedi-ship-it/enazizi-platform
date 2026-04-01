import { useState } from "react";
import { Check, ChevronsUpDown, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FACULDADES } from "@/constants/faculdades";

interface FaculdadeComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

const FaculdadeCombobox = ({ value, onChange }: FaculdadeComboboxProps) => {
  const [open, setOpen] = useState(false);

  const displayLabel = value
    ? FACULDADES.find((f) => f === value) || value
    : "Selecione a faculdade...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-10 text-sm"
        >
          <span className="truncate">{value ? displayLabel.split(" – ")[0] : "Selecione..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(300px,90vw)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar faculdade..." />
          <CommandList className="max-h-[40vh] overflow-y-auto">
            <CommandEmpty>Nenhuma encontrada.</CommandEmpty>
            <CommandGroup>
              {FACULDADES.map((f) => (
                <CommandItem
                  key={f}
                  value={f}
                  onSelect={() => {
                    onChange(f);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === f ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{f}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default FaculdadeCombobox;
