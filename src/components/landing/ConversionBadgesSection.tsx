import { ShieldCheck, Zap, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const badges = [
  { icon: Zap, text: "Comece grátis em 30 segundos" },
  { icon: ShieldCheck, text: "Sem cartão de crédito" },
  { icon: Clock, text: "Plano de estudo em 1 minuto" },
  { icon: Users, text: "Milhares de questões geradas por IA" },
];

const ConversionBadgesSection = () => (
  <section className="py-16 sm:py-24 relative overflow-hidden">
    <div className="container relative z-10 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-6 sm:mb-8">
          Pronto para mudar sua preparação?
        </h2>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-10">
          {badges.map((b) => (
            <div
              key={b.text}
              className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/60 px-4 py-2 text-sm"
            >
              <b.icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-foreground/90">{b.text}</span>
            </div>
          ))}
        </div>

        <Button size="lg" asChild className="text-base sm:text-lg px-8 py-6 glow">
          <Link to="/register">
            Criar conta grátis <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  </section>
);

export default ConversionBadgesSection;
