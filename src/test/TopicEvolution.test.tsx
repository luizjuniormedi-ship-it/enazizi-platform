import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TopicEvolution from "@/components/dashboard/TopicEvolution";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "test-user-id" } }),
}));

let domainData: any[] = [];
let errorData: any[] = [];

// Key insight: supabase `.from().select().eq()` returns a PromiseLike (thenable).
// We need to return a real Promise so Promise.all works inside the component.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        eq: () => Promise.resolve({
          data: table === "medical_domain_map" ? [...domainData] : [...errorData],
          error: null,
        }),
      }),
    }),
  },
}));

const renderComponent = () =>
  render(
    <MemoryRouter>
      <TopicEvolution />
    </MemoryRouter>
  );

describe("TopicEvolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    domainData = [];
    errorData = [];
  });

  it("renders title and overall score", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Evolução por especialidade")).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("shows all 19 specialties as not studied when no domain data", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Tópicos ainda não estudados \(19\)/)).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText("Cardiologia")).toBeInTheDocument();
    expect(screen.getByText("Cirurgia")).toBeInTheDocument();
  });

  it("shows studied specialties with scores when domain data exists", async () => {
    domainData = [
      { specialty: "Cardiologia", domain_score: 75, questions_answered: 10, errors_count: 2 },
      { specialty: "Neurologia", domain_score: 30, questions_answered: 5, errors_count: 4 },
    ];
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("75%")).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText("30%")).toBeInTheDocument();
    expect(screen.getByText("2 erros")).toBeInTheDocument();
    expect(screen.getByText("4 erros")).toBeInTheDocument();
    expect(screen.getByText(/Tópicos ainda não estudados \(17\)/)).toBeInTheDocument();
  });

  it("shows top error topics from error_bank", async () => {
    errorData = [
      { tema: "Pneumologia", vezes_errado: 5 },
      { tema: "Cardiologia", vezes_errado: 3 },
    ];
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Temas com mais erros")).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText("5x")).toBeInTheDocument();
    expect(screen.getByText("3x")).toBeInTheDocument();
  });

  it("shows summary with studied, pending, and weak counts", async () => {
    domainData = [
      { specialty: "Cardiologia", domain_score: 80, questions_answered: 10, errors_count: 0 },
      { specialty: "Pediatria", domain_score: 35, questions_answered: 5, errors_count: 3 },
    ];
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("2 estudadas")).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText("17 pendentes")).toBeInTheDocument();
    expect(screen.getByText("1 fracas")).toBeInTheDocument();
  });

  it("navigates to Tutor IA when clicking Estudar button", async () => {
    domainData = [
      { specialty: "Cardiologia", domain_score: 60, questions_answered: 10, errors_count: 1 },
    ];
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("60%")).toBeInTheDocument();
    }, { timeout: 3000 });
    const estudarButtons = screen.getAllByText("Estudar");
    fireEvent.click(estudarButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/chatgpt", {
      state: {
        initialMessage: 'Quero estudar o tópico "Cardiologia". Me dê uma aula completa seguindo o protocolo ENAZIZI.',
        fromErrorBank: true,
      },
    });
  });

  it("navigates to Tutor IA when clicking not-studied topic badge", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Cardiologia")).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByText("Cardiologia"));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/chatgpt", {
      state: {
        initialMessage: 'Quero estudar o tópico "Cardiologia". Me dê uma aula completa seguindo o protocolo ENAZIZI.',
        fromErrorBank: true,
      },
    });
  });

  it("calculates overall score correctly", async () => {
    domainData = [
      { specialty: "Cardiologia", domain_score: 100, questions_answered: 20, errors_count: 0 },
      { specialty: "Neurologia", domain_score: 90, questions_answered: 15, errors_count: 0 },
    ];
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Domínio geral:")).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText("10%")).toBeInTheDocument();
  });

  it("has link to full domain map", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Ver mapa completo")).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
