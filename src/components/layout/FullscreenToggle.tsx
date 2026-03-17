import { useState, createContext, useContext, ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FullscreenContextType {
  isFullscreen: boolean;
  toggle: () => void;
}

const FullscreenContext = createContext<FullscreenContextType>({ isFullscreen: false, toggle: () => {} });

export const useFullscreen = () => useContext(FullscreenContext);

/** Button that toggles fullscreen mode */
export const FullscreenButton = ({ className = "" }: { className?: string }) => {
  const { isFullscreen, toggle } = useFullscreen();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      className={`gap-1 h-8 px-2 text-xs ${className}`}
      title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
    >
      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      <span className="hidden sm:inline">{isFullscreen ? "Sair" : "Tela cheia"}</span>
    </Button>
  );
};

/** Wrapper that provides fullscreen context and applies fullscreen styles */
export const FullscreenWrapper = ({
  children,
  defaultHeight = "h-[calc(100vh-7rem)] sm:h-[calc(100vh-4rem)]",
}: {
  children: ReactNode;
  defaultHeight?: string;
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <FullscreenContext.Provider value={{ isFullscreen, toggle: () => setIsFullscreen((v) => !v) }}>
      <div
        className={`flex flex-col animate-fade-in min-w-0 ${
          isFullscreen ? "fixed inset-0 z-50 bg-background p-2 sm:p-4 overflow-auto" : defaultHeight
        }`}
      >
        {children}
      </div>
    </FullscreenContext.Provider>
  );
};
