import { useState } from "react";
import { Brain, Eye, CheckCircle2, X, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markMnemonicShown, type PendingMnemonic } from "@/lib/mnemonicAdaptiveService";

interface Props {
  mnemonic: PendingMnemonic;
  onDismiss: () => void;
}

const REASON_LABELS: Record<string, string> = {
  post_error: "Reforço após erro",
  pre_session: "Preparação para o tema",
  spaced_review: "Revisão espaçada",
};

export const AdaptiveMnemonicCard = ({ mnemonic, onDismiss }: Props) => {
  const { asset, link, reason } = mnemonic;
  const [expanded, setExpanded] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const itemsMap = Array.isArray(asset.items_map_json) ? asset.items_map_json : [];

  const handleExpand = () => {
    if (!expanded) {
      setExpanded(true);
      markMnemonicShown(link.id);
    } else {
      setExpanded(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5 animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Mnemônico: {asset.topic}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {REASON_LABELS[reason] || reason}
            </Badge>
            <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Collapsed: show mnemonic word + phrase */}
        <div className="text-center">
          <p className="text-xl font-bold text-primary tracking-wider">{asset.mnemonic}</p>
          <p className="text-xs text-muted-foreground italic">"{asset.phrase}"</p>
        </div>

        <Button variant="ghost" size="sm" className="w-full gap-2" onClick={handleExpand}>
          <Lightbulb className="h-3 w-3" />
          {expanded ? "Ocultar detalhes" : "Ver mapeamento completo"}
        </Button>

        {expanded && (
          <div className="space-y-3 animate-fade-in">
            {/* Items map */}
            <div className="space-y-1.5">
              {itemsMap.map((item: any, i: number) => (
                <div key={i} className="flex items-start gap-2 p-1.5 rounded bg-secondary/50 text-xs">
                  <span className="font-bold text-primary w-5 text-center shrink-0">{item.letter}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{item.original_item}</span>
                    <span className="text-muted-foreground"> → {item.word}</span>
                    {item.symbol && <span className="text-muted-foreground"> | 🎨 {item.symbol}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Image */}
            {asset.image_url && (
              <div className="rounded-lg overflow-hidden border">
                <img
                  src={asset.image_url}
                  alt={`Mnemônico: ${asset.topic}`}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            )}

            {/* Self-test */}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => setShowReview(!showReview)}
            >
              <CheckCircle2 className="h-3 w-3" />
              {showReview ? "Ocultar teste" : "Auto-teste rápido"}
            </Button>
            {showReview && asset.review_question && (
              <div className="p-2 rounded bg-secondary/50 text-xs">
                <p className="font-medium">❓ {asset.review_question}</p>
                <p className="text-muted-foreground mt-1">Tente lembrar antes de conferir!</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Score: {asset.quality_score}/100</span>
          <span>Exibições: {link.times_shown}</span>
          {link.improvement_delta !== null && link.improvement_delta !== undefined && (
            <span className={Number(link.improvement_delta) > 0 ? "text-green-600" : "text-red-500"}>
              Δ {Number(link.improvement_delta) > 0 ? "+" : ""}{Number(link.improvement_delta).toFixed(0)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
