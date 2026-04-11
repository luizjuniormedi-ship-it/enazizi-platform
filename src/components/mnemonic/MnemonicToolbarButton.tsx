import { useState } from "react";
import { Brain, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { generateOrReuseMnemonicForUser, type MnemonicResult } from "@/lib/mnemonicUnifiedService";
import { AdaptiveMnemonicCard } from "./AdaptiveMnemonicCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CONTENT_TYPES = [
  { value: "criterios", label: "Critérios diagnósticos" },
  { value: "causas", label: "Causas / Etiologias" },
  { value: "sinais_classicos", label: "Sinais clássicos" },
  { value: "classificacao", label: "Classificação" },
  { value: "efeitos_adversos", label: "Efeitos adversos" },
  { value: "fatores_de_risco", label: "Fatores de risco" },
  { value: "lista", label: "Lista geral" },
  { value: "componentes", label: "Componentes / Elementos" },
];

export const MnemonicToolbarButton = () => {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("criterios");
  const [itemsText, setItemsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MnemonicResult | null>(null);

  const items = itemsText
    .split("\n")
    .map((l) => l.replace(/^\d+[\.\)\-]\s*/, "").trim())
    .filter(Boolean);

  const handleGenerate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Faça login para gerar mnemônicos.");
      return;
    }

    setLoading(true);
    setResult(null);

    const response = await generateOrReuseMnemonicForUser({
      userId: user.id,
      topic: topic.trim(),
      contentType,
      items,
      source: "manual",
    });

    setLoading(false);

    if (!response.success) {
      toast.error(response.error || "Erro ao gerar mnemônico.");
      return;
    }

    setResult(response.result!);
    toast.success(response.result?.cached ? "Mnemônico recuperado do cache! 🧠" : "Mnemônico gerado com sucesso! 🧠");
  };

  const handleClose = () => {
    setOpen(false);
    setResult(null);
    setTopic("");
    setItemsText("");
  };

  const canGenerate = !loading && items.length >= 3 && items.length <= 7 && topic.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Brain className="h-4 w-4" />
          <span className="hidden sm:inline">Mnemônico</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Gerar Mnemônico Visual
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tema</label>
              <Input
                placeholder="Ex: Critérios de Jones, Sinais de Ranson..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de conteúdo</label>
              <Select value={contentType} onValueChange={setContentType} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>
                      {ct.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Itens (um por linha, 3-7)</label>
              <Textarea
                placeholder={`Ex:\nFebre\nArtrite\nCardite\nCoreia\nNódulos subcutâneos`}
                value={itemsText}
                onChange={(e) => setItemsText(e.target.value)}
                rows={5}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {items.length} item(ns)
                {items.length > 0 && items.length < 3 && " — mínimo 3"}
                {items.length > 7 && " — máximo 7"}
              </p>
            </div>

            <Button className="w-full gap-2" onClick={handleGenerate} disabled={!canGenerate}>
              {loading ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Gerando (auditoria dupla)...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Gerar Mnemônico
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show result using shared card layout */}
            <div className="text-center py-3">
              <p className="text-2xl font-bold text-primary tracking-wider">{result.mnemonic}</p>
              <p className="text-sm text-muted-foreground italic">"{result.phrase}"</p>
              {result.cached && <Badge variant="outline" className="mt-1 text-xs">Cache hit</Badge>}
            </div>

            {result.warning && (
              <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{result.warning}</p>
            )}

            <div className="space-y-1.5">
              {result.items_map.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded bg-secondary/50 text-sm">
                  <span className="font-bold text-primary w-6 text-center shrink-0">{item.letter}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{item.original_item}</span>
                    <span className="text-muted-foreground text-xs"> → {item.word}</span>
                    {item.symbol && <span className="text-muted-foreground text-xs"> | 🎨 {item.symbol}</span>}
                  </div>
                </div>
              ))}
            </div>

            {result.image_url && (
              <div className="rounded-lg overflow-hidden border">
                <img src={result.image_url} alt={`Mnemônico: ${result.topic}`} className="w-full h-auto" loading="lazy" />
              </div>
            )}

            {result.audit && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-secondary/50">
                  <p className="font-medium">🩺 Médico: {result.audit.medical_score}/100</p>
                </div>
                <div className="p-2 rounded bg-secondary/50">
                  <p className="font-medium">📚 Pedagógico: {result.audit.pedagogical_score}/100</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setResult(null)}>
                Gerar outro
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
