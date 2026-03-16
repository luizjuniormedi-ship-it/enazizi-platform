import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "test@test.com" },
    session: { access_token: "test-token" },
    signOut: vi.fn(),
  }),
}));

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              maybeSingle: () => Promise.resolve({ data: null }),
            }),
          }),
          not: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [] }),
            }),
          }),
          gte: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [] }),
            }),
          }),
        }),
        count: "exact",
        head: true,
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

describe("AgentsHub Page", () => {
  it("renders all agent cards", async () => {
    const AgentsHub = (await import("@/pages/AgentsHub")).default;
    render(
      <MemoryRouter>
        <AgentsHub />
      </MemoryRouter>
    );
    expect(screen.getByText("Agentes IA")).toBeInTheDocument();
    expect(screen.getByText(/Tutor IA/)).toBeInTheDocument();
    expect(screen.getByText(/Gerador de Questões/)).toBeInTheDocument();
    expect(screen.getByText(/Gerador de Flashcards/)).toBeInTheDocument();
    expect(screen.getByText(/Resumidor de Conteúdo/)).toBeInTheDocument();
    expect(screen.getByText(/Revisor de Redação Médica/)).toBeInTheDocument();
    expect(screen.getByText(/Simulador de Entrevista/)).toBeInTheDocument();
    expect(screen.getByText(/Modo Plantão/)).toBeInTheDocument();
    expect(screen.getByText(/Coach Motivacional/)).toBeInTheDocument();
    expect(screen.getByText(/Otimizador de Estudo/)).toBeInTheDocument();
    expect(screen.getByText(/Previsão de Desempenho/)).toBeInTheDocument();
    expect(screen.getByText(/Diagnóstico Inicial/)).toBeInTheDocument();
  });

  it("has correct number of agents (8)", async () => {
    const AgentsHub = (await import("@/pages/AgentsHub")).default;
    render(
      <MemoryRouter>
        <AgentsHub />
      </MemoryRouter>
    );
    const links = screen.getAllByText("Acessar");
    expect(links.length).toBe(11);
  });

  it("displays residência médica subtitle", async () => {
    const AgentsHub = (await import("@/pages/AgentsHub")).default;
    render(
      <MemoryRouter>
        <AgentsHub />
      </MemoryRouter>
    );
    expect(screen.getByText(/Residência Médica e Revalida/)).toBeInTheDocument();
  });
});
