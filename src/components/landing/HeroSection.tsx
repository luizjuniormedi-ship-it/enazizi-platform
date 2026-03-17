import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        src="/videos/enazizi_2.mp4"
      />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />

      <div className="container relative z-10 text-center py-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 mb-8 animate-fade-in">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm text-primary font-medium">Plataforma de ensino com IA para Residência Médica</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Sua aprovação em
          <br />
          <span className="gradient-text">Residência Médica</span>
          <br />
          começa aqui.
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Aulas completas, active recall, questões estilo prova, discussão clínica detalhada
          e análise de desempenho por especialidade — tudo guiado por IA.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Button size="lg" asChild className="text-lg px-8 py-6 glow">
            <Link to="/register">
              Começar grátis <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
            <a href="#features">Ver recursos</a>
          </Button>
        </div>

        <div className="flex items-center justify-center gap-8 mt-16 text-muted-foreground animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">10k+</div>
            <div className="text-sm">Alunos ativos</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">50k+</div>
            <div className="text-sm">Questões resolvidas</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">95%</div>
            <div className="text-sm">Aprovação</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
