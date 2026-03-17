import { Check, Zap, Rocket, Crown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    icon: Zap,
    desc: "Para conhecer a plataforma",
    features: [
      "Cronograma básico de estudos",
      "50 questões IA por mês",
      "Flashcards limitados",
      "Mentor IA básico",
    ],
    cta: "Começar grátis",
    popular: false,
  },
  {
    name: "Pro",
    icon: Rocket,
    desc: "Para quem leva a sério",
    features: [
      "Upload ilimitado de materiais",
      "2.000 questões IA por mês",
      "Simulados personalizados",
      "Mentor IA completo",
      "Revisão espaçada inteligente",
      "Analytics de desempenho",
    ],
    cta: "Assinar Pro",
    popular: false,
  },
  {
    name: "Premium",
    icon: Crown,
    desc: "O plano mais completo",
    features: [
      "Tudo do Pro incluído",
      "8.000 questões IA por mês",
      "Simulação clínica avançada",
      "Gerador de conteúdo por IA",
      "Preditor de desempenho",
      "Suporte prioritário",
    ],
    cta: "Assinar Premium",
    popular: true,
  },
  {
    name: "Enterprise",
    icon: Building2,
    desc: "Para organizações e cursinhos",
    features: [
      "Tudo do Premium incluído",
      "Questões IA ilimitadas",
      "Painel administrativo",
      "Dashboard do professor",
      "Gestão de multiusuários",
      "Analytics institucional",
    ],
    cta: "Falar com vendas",
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Planos
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Conheça nossos <span className="gradient-text">planos</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolha o nível ideal para acelerar sua preparação e alcançar a aprovação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto items-stretch">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular
                    ? "border-primary/60 bg-primary/5 shadow-[0_0_40px_hsl(var(--primary)/0.12)]"
                    : "border-border/60 bg-card/80 hover:border-primary/30"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground tracking-wide uppercase">
                    Mais popular
                  </div>
                )}

                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 ${
                  plan.popular ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                        plan.popular ? "text-primary" : "text-primary/70"
                      }`} />
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={plan.popular ? "default" : "outline"}
                  className={`w-full font-semibold ${plan.popular ? "shadow-[0_4px_20px_hsl(var(--primary)/0.3)]" : ""}`}
                >
                  <Link to="/register">{plan.cta}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
