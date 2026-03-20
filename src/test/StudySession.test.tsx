import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "test@test.com" },
    session: { access_token: "test-token" },
    signOut: vi.fn(),
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [] }),
          }),
          not: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [] }),
            }),
          }),
        }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

describe("StudySession Page", () => {
  it("renders the start screen with topic input", async () => {
    const StudySession = (await import("@/pages/StudySession")).default;
    render(
      <MemoryRouter>
        <StudySession />
      </MemoryRouter>
    );
    expect(screen.getByText("Vamos estudar! 🎯")).toBeInTheDocument();
    expect(screen.getByText("MedStudy AI")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Digite o tema/)).toBeInTheDocument();
  });

  it("renders suggested topic buttons", async () => {
    const StudySession = (await import("@/pages/StudySession")).default;
    render(
      <MemoryRouter>
        <StudySession />
      </MemoryRouter>
    );
    expect(screen.getByText("Insuficiência Cardíaca")).toBeInTheDocument();
    expect(screen.getByText("TEP")).toBeInTheDocument();
    expect(screen.getByText("AVC")).toBeInTheDocument();
    expect(screen.getByText("Diabetes Mellitus")).toBeInTheDocument();
    expect(screen.getByText("Pneumonia")).toBeInTheDocument();
    expect(screen.getByText("Sepse")).toBeInTheDocument();
  });

  it("updates topic input when suggestion is clicked", async () => {
    const StudySession = (await import("@/pages/StudySession")).default;
    render(
      <MemoryRouter>
        <StudySession />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("TEP"));
    const input = screen.getByPlaceholderText(/Digite o tema/) as HTMLInputElement;
    expect(input.value).toBe("TEP");
  });

  it("disables estudar button when no topic entered", async () => {
    const StudySession = (await import("@/pages/StudySession")).default;
    render(
      <MemoryRouter>
        <StudySession />
      </MemoryRouter>
    );
    const button = screen.getByText("Estudar").closest("button");
    expect(button).toBeDisabled();
  });

  it("enables estudar button when topic is entered", async () => {
    const StudySession = (await import("@/pages/StudySession")).default;
    render(
      <MemoryRouter>
        <StudySession />
      </MemoryRouter>
    );
    const input = screen.getByPlaceholderText(/Digite o tema/);
    fireEvent.change(input, { target: { value: "Asma" } });
    const button = screen.getByText("Estudar").closest("button");
    expect(button).not.toBeDisabled();
  });

  it("renders performance panel sidebar", async () => {
    const StudySession = (await import("@/pages/StudySession")).default;
    render(
      <MemoryRouter>
        <StudySession />
      </MemoryRouter>
    );
    expect(screen.getByText("Painel de Desempenho")).toBeInTheDocument();
    expect(screen.getByText("Domínio por Especialidade")).toBeInTheDocument();
    expect(screen.getByText("Temas Fracos")).toBeInTheDocument();
    expect(screen.getByText("Temas Estudados")).toBeInTheDocument();
  });

  it("shows all specialties in the performance panel", async () => {
    const StudySession = (await import("@/pages/StudySession")).default;
    render(
      <MemoryRouter>
        <StudySession />
      </MemoryRouter>
    );
    expect(screen.getByText("Cardiologia")).toBeInTheDocument();
    expect(screen.getByText("Pneumologia")).toBeInTheDocument();
    expect(screen.getByText("Neurologia")).toBeInTheDocument();
    expect(screen.getByText("Endocrinologia")).toBeInTheDocument();
    expect(screen.getByText("Pediatria")).toBeInTheDocument();
    expect(screen.getByText("Cirurgia")).toBeInTheDocument();
    expect(screen.getByText("Medicina Preventiva")).toBeInTheDocument();
  });

  it("shows protocol phases in the flow description", async () => {
    const StudySession = (await import("@/pages/StudySession")).default;
    render(
      <MemoryRouter>
        <StudySession />
      </MemoryRouter>
    );
    expect(screen.getByText("📊 Painel")).toBeInTheDocument();
    expect(screen.getByText("📚 Aula")).toBeInTheDocument();
    expect(screen.getByText("🧠 Recall")).toBeInTheDocument();
    expect(screen.getByText("📝 Questões")).toBeInTheDocument();
  });
});
