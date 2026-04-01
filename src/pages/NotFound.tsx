import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-xl text-muted-foreground">Página não encontrada</p>
        <p className="text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <a
            href="https://enazizi.com"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Ir para enazizi.com
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
