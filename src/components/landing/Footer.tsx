import { Brain } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border/50 py-12">
    <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        <span className="font-bold">ENAZIZI</span>
      </div>
      <p className="text-sm text-muted-foreground">
        © 2026 ENAZIZI. Todos os direitos reservados.
      </p>
    </div>
  </footer>
);

export default Footer;
