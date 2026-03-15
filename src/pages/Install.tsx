import { useState, useEffect } from "react";
import { Download, Smartphone, CheckCircle, Share, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="flex justify-center">
            <img src="/pwa-icon-192.png" alt="ENAZIZI" className="w-24 h-24 rounded-2xl shadow-lg" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">ENAZIZI</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Plataforma de Estudos Médicos com IA
            </p>
          </div>

          {isInstalled ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="font-medium">App já instalado!</p>
              <p className="text-sm text-muted-foreground">
                Abra o ENAZIZI direto da sua tela inicial.
              </p>
            </div>
          ) : isIOS ? (
            <div className="space-y-4 text-left">
              <p className="font-medium text-center">Como instalar no iPhone/iPad:</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                    <Share className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">1. Toque em "Compartilhar"</p>
                    <p className="text-xs text-muted-foreground">
                      Ícone de compartilhar na barra inferior do Safari
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">2. "Adicionar à Tela de Início"</p>
                    <p className="text-xs text-muted-foreground">
                      Role para baixo e toque nesta opção
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">3. Toque em "Adicionar"</p>
                    <p className="text-xs text-muted-foreground">
                      O ENAZIZI aparecerá na sua tela inicial
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} size="lg" className="gap-2 w-full">
              <Download className="h-5 w-5" />
              Instalar ENAZIZI
            </Button>
          ) : (
            <div className="space-y-4 text-left">
              <p className="font-medium text-center">Como instalar no Android:</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                    <MoreVertical className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">1. Menu do navegador (⋮)</p>
                    <p className="text-xs text-muted-foreground">
                      Toque nos 3 pontinhos no canto superior
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">2. "Instalar app" ou "Adicionar à tela inicial"</p>
                    <p className="text-xs text-muted-foreground">
                      O ENAZIZI será instalado como um app nativo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Funciona offline • Atualizações automáticas • Sem precisar de loja
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
