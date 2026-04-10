/**
 * Componente de questão com imagem médica.
 * Suporta zoom, expand, skeleton loading, responsivo.
 */
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ZoomIn, ZoomOut, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ImageQuestionViewerProps {
  imageUrl: string;
  imageType?: string;
  altText?: string;
}

const IMAGE_TYPE_LABELS: Record<string, string> = {
  ecg: "ECG",
  xray: "Raio-X",
  ct: "Tomografia",
  mri: "Ressonância",
  us: "Ultrassom",
  dermatology: "Dermatologia",
  pathology: "Patologia",
  ophthalmology: "Oftalmologia",
  endoscopy: "Endoscopia",
  obstetric_trace: "Cardiotocografia",
};

const ImageQuestionViewer = ({ imageUrl, imageType, altText }: ImageQuestionViewerProps) => {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [tooSmall, setTooSmall] = useState(false);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Reject tiny images (thumbnails/placeholders/avatars disguised as clinical)
    if (img.naturalWidth < 200 || img.naturalHeight < 200) {
      console.warn(`[ImageQuestion] Imagem muito pequena (${img.naturalWidth}x${img.naturalHeight}), exibindo fallback`);
      setTooSmall(true);
      return;
    }
    setLoaded(true);
  };

  const typeLabel = imageType ? IMAGE_TYPE_LABELS[imageType] || imageType : "Imagem";

  // If no valid URL or error loading
  if (!imageUrl || hasError || tooSmall) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Badge variant="secondary" className="text-xs font-medium">{typeLabel}</Badge>
        <span className="text-sm">📷 Imagem indisponível para esta questão</span>
        {(hasError || tooSmall) && (
          <Button variant="ghost" size="sm" onClick={() => { setHasError(false); setTooSmall(false); setLoaded(false); }}>
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="relative rounded-lg border border-border bg-muted/30 overflow-hidden">
        {/* Badge do tipo */}
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="secondary" className="text-xs font-medium">
            {typeLabel}
          </Badge>
        </div>

        {/* Botão expandir */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 h-8 w-8 bg-background/80 hover:bg-background"
          onClick={() => setExpanded(true)}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>

        {/* Skeleton enquanto carrega */}
        {!loaded && (
          <Skeleton className="w-full aspect-[4/3]" />
        )}

        {/* Imagem */}
        <img
          src={imageUrl}
          alt={altText || `Imagem médica - ${typeLabel}`}
          className={`w-full object-contain max-h-[300px] md:max-h-[400px] cursor-pointer transition-opacity ${loaded ? "opacity-100" : "opacity-0 absolute"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
          onClick={() => setExpanded(true)}
          loading="lazy"
        />
      </div>

      {/* Modal de imagem expandida */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 md:p-4">
          <div className="relative flex flex-col items-center gap-2">
            {/* Controles de zoom */}
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-4 w-4 mr-1" /> -
              </Button>
              <span className="text-sm font-mono min-w-[4ch] text-center">{Math.round(zoom * 100)}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-4 w-4 mr-1" /> +
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(1)}
              >
                100%
              </Button>
            </div>

            {/* Imagem expandida com zoom */}
            <div className="overflow-auto max-h-[80vh] w-full flex justify-center">
              <img
                src={imageUrl}
                alt={altText || `Imagem médica - ${typeLabel}`}
                style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                className="max-w-none transition-transform"
              />
            </div>

            <Badge variant="secondary" className="mt-2">{typeLabel}</Badge>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageQuestionViewer;
