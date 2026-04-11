import { useState, useCallback } from "react";
import { Brain, Sparkles, AlertTriangle, CheckCircle2, Lightbulb, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { generateOrReuseMnemonicForUser, type MnemonicResult } from "@/lib/mnemonicUnifiedService";
import { useSubtopicSuggestions } from "@/hooks/useSubtopicSuggestions";
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

const MnemonicGenerator = () => {
  const [topic, setTopic] = useState("");
  const [subtopic, setSubtopic] = useState("");
  const [contentType, setContentType] = useState("criterios");
  const [itemsText, setItemsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MnemonicResult | null>(null);
  const [showReview, setShowReview] = useState(false);

  const { suggestions, loading: loadingSuggestions } = useSubtopicSuggestions(topic);

  const items = itemsText
    .split("\n")
    .map((l) => l.replace(/^\d+[\.\)\-]\s*/, "").trim())
    .filter(Boolean);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return toast.error("Informe o tema.");
    if (items.length < 3) return toast.error("Informe pelo menos 3 itens (um por linha).");
    if (items.length > 7) return toast.error("Máximo de 7 itens para mnemônico visual.");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Faça login para gerar mnemônicos.");

    setLoading(true);
    setResult(null);
    setShowReview(false);

    try {
      const response = await generateOrReuseMnemonicForUser({
        userId: user.id,
        topic: topic.trim(),
        contentType,
        items,
        source: "manual",
      });

      if (!response.success) {
        toast.error(response.error || "Erro ao gerar mnemônico.");
        return;
      }

      setResult(response.result!);
      toast.success(response.result?.cached ? "Mnemônico recuperado do cache! 🧠" : "Mnemônico gerado com sucesso! 🧠");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar mnemônico.");
    } finally {
      setLoading(false);
    }
  }, [topic, items, contentType]);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-20">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          Mnemônico Visual
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Gere mnemônicos com imagem para memorizar listas médicas de prova.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
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
            <label className="text-sm font-medium">Itens (um por linha, 3-7 itens)</label>
            <Textarea
              placeholder={`Ex:\nFebre\nArtrite\nCardite\nCoreia\nNódulos subcutâneos`}
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              rows={6}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {items.length} item(ns) detectado(s)
              {items.length > 0 && items.length < 3 && " — mínimo 3"}
              {items.length > 7 && " — máximo 7"}
            </p>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleGenerate}
            disabled={loading || items.length < 3 || items.length > 7 || !topic.trim()}
          >
            {loading ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                Gerando mnemônico (auditoria dupla)...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                Gerar Mnemônico Visual
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <MnemonicResultDisplay result={result} items={items} showReview={showReview} setShowReview={setShowReview} />
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════
// RESULT DISPLAY (extracted component)
// ══════════════════════════════════════════════════

function MnemonicResultDisplay({
  result, items, showReview, setShowReview,
}: {
  result: MnemonicResult;
  items: string[];
  showReview: boolean;
  setShowReview: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      {result.warning && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <span>{result.warning}</span>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              {result.topic}
            </span>
            <div className="flex items-center gap-2">
              {result.cached && <Badge variant="outline" className="text-xs">Cache</Badge>}
              <Badge variant={result.quality_score >= 80 ? "default" : "destructive"} className="text-xs">
                Score: {result.quality_score}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <p className="text-2xl font-bold text-primary tracking-wider">{result.mnemonic}</p>
            <p className="text-sm text-muted-foreground mt-1 italic">"{result.phrase}"</p>
          </div>

          <div className="space-y-2">
            {result.items_map.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-secondary/50">
                <span className="font-bold text-primary text-lg w-6 text-center shrink-0">{item.letter}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.original_item}</p>
                  <p className="text-xs text-muted-foreground">
                    → {item.word}
                    {item.symbol && (
                      <span className="ml-2">| 🎨 {item.symbol}
                        {item.symbol_reason && <span className="italic"> ({item.symbol_reason})</span>}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {result.image_url && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Cena Visual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">{result.scene_description}</p>
            <div className="rounded-lg overflow-hidden border">
              <img src={result.image_url} alt={`Mnemônico visual: ${result.topic}`} className="w-full h-auto" loading="lazy" />
            </div>
          </CardContent>
        </Card>
      )}

      {result.audit && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">🔍 Auditoria Dupla</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                <p className="text-xs font-medium">🩺 Auditor Médico</p>
                <p className="text-lg font-bold">{result.audit.medical_score}/100</p>
                <p className="text-xs text-muted-foreground">{result.audit.medical_summary}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                <p className="text-xs font-medium">📚 Auditor Pedagógico</p>
                <p className="text-lg font-bold">{result.audit.pedagogical_score}/100</p>
                <p className="text-xs text-muted-foreground">{result.audit.pedagogical_summary}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant={result.audit.verdict === "approve" ? "default" : "destructive"}>
                {result.audit.verdict === "approve" ? "✅ Aprovado" : "❌ Rejeitado"}
              </Badge>
              <span className="text-muted-foreground">Score combinado: {result.quality_score}/100</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">📋 Lista textual de referência:</p>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            {items.map((it, i) => <li key={i}>{it}</li>)}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <Button variant="outline" className="w-full gap-2" onClick={() => setShowReview(!showReview)}>
            <CheckCircle2 className="h-4 w-4" />
            {showReview ? "Ocultar auto-teste" : "Auto-teste: você lembra?"}
          </Button>
          {showReview && (
            <div className="p-3 rounded-lg bg-secondary/50 text-sm">
              <p className="font-medium mb-2">❓ {result.review_question}</p>
              <p className="text-xs text-muted-foreground">Tente lembrar todos os itens antes de rolar para cima e conferir!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MnemonicGenerator;
