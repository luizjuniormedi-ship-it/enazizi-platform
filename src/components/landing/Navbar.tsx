import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import enazizi from "@/assets/enazizi-mascot.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 glow">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold">ENAZIZI</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</a>
          <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild className="glow">
            <Link to="/register">Começar grátis</Link>
          </Button>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl p-4 space-y-3">
          <a href="#features" className="block text-sm text-muted-foreground py-2">Recursos</a>
          <a href="#pricing" className="block text-sm text-muted-foreground py-2">Planos</a>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" asChild className="flex-1"><Link to="/login">Entrar</Link></Button>
            <Button asChild className="flex-1"><Link to="/register">Começar grátis</Link></Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
