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
  it("renders Navbar with MedStudy AI branding", async () => {
    const Navbar = (await import("@/components/landing/Navbar")).default;
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    expect(screen.getByText("MedStudy AI")).toBeInTheDocument();
    // There are two "Entrar" buttons (desktop + mobile), use getAllByText
    expect(screen.getAllByText("Entrar").length).toBeGreaterThanOrEqual(1);
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

  it("renders FeaturesSection with MedStudy AI methodology", async () => {
    const FeaturesSection = (await import("@/components/landing/FeaturesSection")).default;
    render(
      <MemoryRouter>
        <FeaturesSection />
      </MemoryRouter>
    );
    expect(screen.getByText("Ensino Profundo com IA")).toBeInTheDocument();
    expect(screen.getByText("Protocolo MedStudy")).toBeInTheDocument();
  });
});
