import { useState, useEffect } from "react";
import { Download, Smartphone, Share, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallAppBanner = () => {
  const [open, setOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

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
    if (outcome === "accepted") {
      setInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full group relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3 transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Baixar App</p>
            <p className="text-[11px] text-muted-foreground">Instale no celular para acesso rápido</p>
          </div>
          <Download className="h-4 w-4 text-primary/60 ml-auto shrink-0 group-hover:translate-y-0.5 transition-transform" />
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Instalar o App
            </DialogTitle>
            <DialogDescription>
              Instale o app direto no seu celular para acesso rápido, offline e notificações.
            </DialogDescription>
          </DialogHeader>

          {installed ? (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-700">App instalado com sucesso!</p>
                  <p className="text-xs text-muted-foreground">Procure o ícone na sua tela inicial.</p>
                </div>
              </CardContent>
            </Card>
          ) : isIOS ? (
            <div className="space-y-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-4">
                  <h3 className="text-sm font-semibold mb-3">📱 No iPhone/iPad (Safari):</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                      <span>Toque no botão <Share className="inline h-4 w-4 mx-0.5 text-primary" /> <strong>Compartilhar</strong> na barra inferior do Safari</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                      <span>Role para baixo e toque em <Plus className="inline h-4 w-4 mx-0.5 text-primary" /> <strong>Adicionar à Tela de Início</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                      <span>Confirme tocando em <strong>Adicionar</strong></span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground text-center">⚠️ Use o navegador <strong>Safari</strong>. O Chrome no iOS não suporta instalação.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-4">
                  <h3 className="text-sm font-semibold mb-3">📱 No Android (Chrome):</h3>
                  {deferredPrompt ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Clique no botão abaixo para instalar o app diretamente:</p>
                      <Button onClick={handleInstall} className="w-full gap-2">
                        <Download className="h-4 w-4" /> Instalar Agora
                      </Button>
                    </div>
                  ) : (
                    <ol className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                        <span>Abra este site no <strong>Google Chrome</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                        <span>Toque no menu <strong>⋮</strong> (3 pontinhos) no canto superior direito</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                        <span>Toque em <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar app"</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
                        <span>Confirme tocando em <strong>Instalar</strong></span>
                      </li>
                    </ol>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="border-t pt-3 mt-2">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">✨ Vantagens do app instalado:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>⚡ Acesso instantâneo pela tela inicial</li>
              <li>📶 Funciona offline (conteúdo em cache)</li>
              <li>🔔 Receba notificações de revisões e mensagens</li>
              <li>📱 Experiência em tela cheia, sem barra do navegador</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallAppBanner;
