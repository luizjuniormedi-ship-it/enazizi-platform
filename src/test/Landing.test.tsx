import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    session: null,
    signOut: vi.fn(),
  }),
}));

describe("Landing Page Components", () => {
  it("renders Navbar with ENAZIZI branding", async () => {
    const Navbar = (await import("@/components/landing/Navbar")).default;
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    expect(screen.getByText("ENAZIZI")).toBeInTheDocument();
    expect(screen.getByText("Entrar")).toBeInTheDocument();
    expect(screen.getByText("Começar grátis")).toBeInTheDocument();
  });

  it("renders HeroSection with Residência Médica text", async () => {
    const HeroSection = (await import("@/components/landing/HeroSection")).default;
    render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>
    );
    expect(screen.getByText("Residência Médica")).toBeInTheDocument();
    expect(screen.getByText(/Sua aprovação em/)).toBeInTheDocument();
    expect(screen.getByText(/começa aqui/)).toBeInTheDocument();
  });

  it("renders FeaturesSection with ENAZIZI methodology", async () => {
    const FeaturesSection = (await import("@/components/landing/FeaturesSection")).default;
    render(
      <MemoryRouter>
        <FeaturesSection />
      </MemoryRouter>
    );
    expect(screen.getByText("Aulas Completas com IA")).toBeInTheDocument();
    expect(screen.getByText("Active Recall")).toBeInTheDocument();
    expect(screen.getByText("Questões Estilo Prova")).toBeInTheDocument();
    expect(screen.getByText("Discussão Clínica Detalhada")).toBeInTheDocument();
    expect(screen.getByText("Mapa de Domínio")).toBeInTheDocument();
    expect(screen.getByText("Repetição Inteligente")).toBeInTheDocument();
    expect(screen.getByText("Protocolo Pedagógico")).toBeInTheDocument();
  });
});
