import { forwardRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = forwardRef<HTMLElement>((_, ref) => (
  <section className="py-16 sm:py-24 relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-3xl" />
    </div>

    <div className="container relative z-10 px-4">
      <div className="max-w-3xl mx-auto text-center rounded-3xl border border-primary/20 bg-card/80 backdrop-blur-sm p-8 sm:p-10 md:p-16 shadow-[0_0_60px_hsl(var(--primary)/0.08)]">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-5 sm:mb-6">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm text-primary font-medium">Comece agora — é grátis</span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4">
          Sua aprovação não pode esperar
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto">
          Cada dia sem treinar com IA é um dia que seus concorrentes ganham vantagem. Comece hoje e veja a diferença.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button size="lg" asChild className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 glow">
            <Link to="/register">
              Criar conta grátis <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
            <Link to="/login">Já tenho conta</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default CTASection;
