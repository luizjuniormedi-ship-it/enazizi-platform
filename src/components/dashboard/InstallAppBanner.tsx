import { useState, useEffect } from "react";
import { Download, X, Share, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "pwa-install-dismissed-at";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallAppBanner = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((navigator as any).standalone === true) return;

    // Check dismiss
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - parseInt(dismissed) < SEVEN_DAYS) return;

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      setShow(true);
    } else {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShow(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  };

  if (!show) return null;

  return (
    <Alert className="relative border-primary/30 bg-primary/5">
      <Download className="h-5 w-5 text-primary" />
      <AlertTitle className="text-sm font-semibold">Instale o app no seu celular!</AlertTitle>
      <AlertDescription className="text-xs text-muted-foreground mt-1">
        {isIOS ? (
          <div className="space-y-2">
            <p>Para instalar no iPhone/iPad:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Toque no botão <Share className="inline h-3.5 w-3.5 mx-0.5" /> <strong>Compartilhar</strong> na barra do Safari</li>
              <li>Role para baixo e toque em <Plus className="inline h-3.5 w-3.5 mx-0.5" /> <strong>Adicionar à Tela de Início</strong></li>
              <li>Confirme tocando em <strong>Adicionar</strong></li>
            </ol>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p>Acesse mais rápido direto da tela inicial do seu celular.</p>
            <Button size="sm" onClick={handleInstall} className="shrink-0 gap-1.5">
              <Download className="h-3.5 w-3.5" /> Instalar
            </Button>
          </div>
        )}
      </AlertDescription>
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
};

export default InstallAppBanner;
