import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    desc: "Para conhecer a plataforma",
    features: ["Cronograma básico", "5 flashcards/mês", "Acesso limitado ao mentor IA"],
    cta: "Começar grátis",
    popular: false,
  },
  {
    name: "Pro",
    price: "R$ 97",
    period: "/mês",
    desc: "Para quem leva a sério",
    features: ["Upload ilimitado", "Flashcards ilimitados", "Simulados personalizados", "Mentor IA completo", "Revisão espaçada", "Analytics de desempenho"],
    cta: "Assinar Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "R$ 297",
    period: "/mês",
    desc: "Para organizações e cursinhos",
    features: ["Tudo do Pro", "Painel Admin", "Multiusuários", "Analytics avançados", "API personalizada", "Suporte prioritário"],
    cta: "Falar com vendas",
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Planos que <span className="gradient-text">cabem no seu bolso</span>
          </h2>
          <p className="text-muted-foreground text-lg">Escolha o plano ideal para a sua preparação.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass-card p-8 flex flex-col relative ${
                plan.popular ? "border-primary/50 glow scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  Mais popular
                </div>
              )}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.popular ? "default" : "outline"}
                className={`w-full ${plan.popular ? "glow" : ""}`}
              >
                <Link to="/register">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
