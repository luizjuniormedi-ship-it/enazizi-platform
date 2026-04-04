import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import enazizi from "@/assets/enazizi-mascot.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/95 md:bg-background/80 backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={enazizi} alt="ENAZIZI" className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg object-cover" />
          <span className="text-base sm:text-lg font-bold">ENAZIZI</span>
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

        <div className="md:hidden flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-10 min-w-[72px] border-primary/40 text-foreground">
            <Link to="/login">Entrar</Link>
          </Button>
          <button className="text-foreground p-1" onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl p-4 space-y-3">
          <a href="#features" className="block text-sm text-muted-foreground py-2" onClick={() => setOpen(false)}>Recursos</a>
          <a href="#pricing" className="block text-sm text-muted-foreground py-2" onClick={() => setOpen(false)}>Planos</a>
          <a href="#faq" className="block text-sm text-muted-foreground py-2" onClick={() => setOpen(false)}>FAQ</a>
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
