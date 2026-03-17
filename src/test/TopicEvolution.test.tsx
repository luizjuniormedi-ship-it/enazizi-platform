import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import TopicEvolution from "@/components/dashboard/TopicEvolution";

// Mock useAuth  
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "test-user-id" } }),
}));

let domainData: any[] = [];
let errorData: any[] = [];

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
    <BrowserRouter>
      <TopicEvolution />
    </BrowserRouter>
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
    });
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("shows all 22 specialties as not studied when no domain data", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Tópicos ainda não estudados \(22\)/)).toBeInTheDocument();
    });
    expect(screen.getByText("Cardiologia")).toBeInTheDocument();
    expect(screen.getByText("Cirurgia")).toBeInTheDocument();
  });

  it("shows studied specialties with scores", async () => {
    domainData = [
      { specialty: "Cardiologia", domain_score: 75, questions_answered: 10, errors_count: 2 },
      { specialty: "Neurologia", domain_score: 30, questions_answered: 5, errors_count: 4 },
    ];
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("75%")).toBeInTheDocument();
    });
    expect(screen.getByText("30%")).toBeInTheDocument();
    expect(screen.getByText("2 erros")).toBeInTheDocument();
    expect(screen.getByText("4 erros")).toBeInTheDocument();
    expect(screen.getByText(/Tópicos ainda não estudados \(20\)/)).toBeInTheDocument();
  });

  it("shows top error topics from error_bank", async () => {
    errorData = [
      { tema: "Pneumologia", vezes_errado: 5 },
      { tema: "Cardiologia", vezes_errado: 3 },
    ];
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Temas com mais erros")).toBeInTheDocument();
    });
    expect(screen.getByText("5x")).toBeInTheDocument();
    expect(screen.getByText("3x")).toBeInTheDocument();
  });

  it("shows summary counts", async () => {
    domainData = [
      { specialty: "Cardiologia", domain_score: 80, questions_answered: 10, errors_count: 0 },
      { specialty: "Pediatria", domain_score: 35, questions_answered: 5, errors_count: 3 },
    ];
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("2 estudadas")).toBeInTheDocument();
    });
    expect(screen.getByText("20 pendentes")).toBeInTheDocument();
    expect(screen.getByText("1 fracas")).toBeInTheDocument();
  });

  it("calculates overall score correctly", async () => {
    domainData = [
      { specialty: "Cardiologia", domain_score: 100, questions_answered: 20, errors_count: 0 },
      { specialty: "Neurologia", domain_score: 90, questions_answered: 15, errors_count: 0 },
    ];
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Domínio geral:")).toBeInTheDocument();
    });
    // (100+90) / 22 specialties = ~9%
    expect(screen.getByText("9%")).toBeInTheDocument();
  });

  it("has link to full domain map", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Ver mapa completo")).toBeInTheDocument();
    });
  });

  it("renders Estudar buttons for studied topics", async () => {
    domainData = [
      { specialty: "Cardiologia", domain_score: 60, questions_answered: 10, errors_count: 1 },
    ];
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("60%")).toBeInTheDocument();
    });
    const estudarButtons = screen.getAllByText("Estudar");
    expect(estudarButtons.length).toBeGreaterThan(0);
  });
});
