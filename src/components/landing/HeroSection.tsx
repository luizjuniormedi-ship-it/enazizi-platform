import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Volume2, VolumeX, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <section className="relative min-h-[90vh] sm:min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Video background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="absolute inset-0 w-full h-full object-contain object-center"
        src="/videos/enazizi_2.mp4"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Gradient overlay (brand) */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        aria-label={isMuted ? "Ativar som" : "Desativar som"}
        className="absolute bottom-6 right-6 z-20 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full p-3 text-white transition-colors"
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      {/* Content */}
      <div className="container relative z-10 text-center py-12 sm:py-20 px-4">
        <div
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 mb-6 sm:mb-8 animate-fade-in"
        >
          <Sparkles className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-primary" />
          <span className="text-xs sm:text-sm text-primary font-medium">
            Plataforma inteligente para Residência Médica
          </span>
        </div>

        <h1
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-4 sm:mb-6 text-white drop-shadow-lg animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          Estude com direção.
          <br />
          <span className="gradient-text">Não com tentativa e erro.</span>
        </h1>

        <p
          className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-white/85 mb-8 sm:mb-10 animate-fade-in drop-shadow leading-relaxed"
          style={{ animationDelay: "0.2s" }}
        >
          O ENAZIZI cria um plano diário inteligente com base no seu desempenho,
          seus erros e a prova que você vai fazer.
        </p>

        <div
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <Button size="lg" asChild className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 glow">
            <Link to="/register">
              Começar agora <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-white/30 text-white hover:bg-white/10"
          >
            <a href="#como-funciona">Ver como funciona</a>
          </Button>
        </div>

        <div
          className="mt-6 animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-white font-semibold text-base sm:text-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30 transition-all"
          >
            Já tem conta? <span className="text-primary font-bold">Entrar</span>
          </Link>
        </div>

        {/* Scroll hint */}
        <div className="mt-10 sm:mt-14 animate-bounce">
          <ChevronDown className="h-6 w-6 text-white/40 mx-auto" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
