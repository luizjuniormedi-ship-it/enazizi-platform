import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Syringe, Plus, Trash2 } from "lucide-react";

interface PrescriptionItem {
  medication: string;
  dose: string;
  route: string;
  frequency: string;
}

interface PrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (prescription: string) => void;
  disabled?: boolean;
}

const ROUTES = ["VO (Via Oral)", "IV (Intravenosa)", "IM (Intramuscular)", "SC (Subcutânea)", "Inalatória", "Tópica", "Retal", "SL (Sublingual)"];
const FREQUENCIES = ["1x/dia", "2x/dia (12/12h)", "3x/dia (8/8h)", "4x/dia (6/6h)", "Dose única", "Se necessário (SOS)", "Contínuo (BIC)", "De hora em hora"];

const emptyItem: PrescriptionItem = { medication: "", dose: "", route: "VO (Via Oral)", frequency: "3x/dia (8/8h)" };

const PrescriptionDialog = ({ open, onOpenChange, onSubmit, disabled }: PrescriptionDialogProps) => {
  const [items, setItems] = useState<PrescriptionItem[]>([{ ...emptyItem }]);

  const updateItem = (index: number, field: keyof PrescriptionItem, value: string) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = () => {
    const validItems = items.filter((item) => item.medication.trim());
    if (validItems.length === 0) return;

    const prescriptionText = validItems.map((item, i) =>
      `${i + 1}) ${item.medication} ${item.dose} — ${item.route} — ${item.frequency}`
    ).join("\n");

    onSubmit(`PRESCRIÇÃO MÉDICA:\n${prescriptionText}`);
    setItems([{ ...emptyItem }]);
    onOpenChange(false);
  };

  const hasValidItem = items.some((item) => item.medication.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-blue-500" />
            Prescrição Médica
          </DialogTitle>
          <DialogDescription>
            Preencha os campos para cada medicamento. A prescrição será enviada ao paciente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-2.5 relative">
              {items.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}

              <div className="space-y-1">
                <Label className="text-xs">Medicamento *</Label>
                <Input
                  value={item.medication}
                  onChange={(e) => updateItem(index, "medication", e.target.value)}
                  placeholder="Ex: Dipirona, Omeprazol, Ceftriaxona..."
                  className="text-sm h-8"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Dose</Label>
                  <Input
                    value={item.dose}
                    onChange={(e) => updateItem(index, "dose", e.target.value)}
                    placeholder="Ex: 500mg, 1g, 40mg"
                    className="text-sm h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Via</Label>
                  <select
                    value={item.route}
                    onChange={(e) => updateItem(index, "route", e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs h-8"
                  >
                    {ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Posologia</Label>
                  <select
                    value={item.frequency}
                    onChange={(e) => updateItem(index, "frequency", e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs h-8"
                  >
                    {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addItem} className="w-full text-xs gap-1.5">
            <Plus className="h-3 w-3" /> Adicionar Medicamento
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!hasValidItem || disabled} className="gap-1.5">
            <Syringe className="h-4 w-4" />
            Enviar Prescrição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrescriptionDialog;
