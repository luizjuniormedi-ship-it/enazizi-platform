import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import TopicEvolution from "@/components/dashboard/TopicEvolution";

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "test-user-id" } }),
}));

// Mock supabase
const mockDomainData: any[] = [];
const mockErrorData: any[] = [];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      const data = table === "medical_domain_map" ? mockDomainData : mockErrorData;
      const makeChain = (): any => {
        const p = Promise.resolve({ data: [...data], error: null });
        const handler: any = {
          select: () => handler,
          eq: () => handler,
          not: () => handler,
          order: () => handler,
          limit: () => handler,
          gte: () => handler,
          then: (onFulfilled: any, onRejected?: any) => p.then(onFulfilled, onRejected),
          catch: (onRejected: any) => p.catch(onRejected),
        };
        return handler;
      };
      return makeChain();
    },
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
    mockDomainData.length = 0;
    mockErrorData.length = 0;
  });

  it("renders title and overall score", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Evolução por especialidade")).toBeInTheDocument();
    });
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("shows all 19 specialties as not studied when no domain data", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Tópicos ainda não estudados \(19\)/)).toBeInTheDocument();
    });
    expect(screen.getByText("Cardiologia")).toBeInTheDocument();
    expect(screen.getByText("Cirurgia")).toBeInTheDocument();
  });

  it("shows studied specialties with scores when domain data exists", async () => {
    mockDomainData.push(
      { specialty: "Cardiologia", domain_score: 75, questions_answered: 10, errors_count: 2 },
      { specialty: "Neurologia", domain_score: 30, questions_answered: 5, errors_count: 4 },
    );

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("75%")).toBeInTheDocument();
    });
    expect(screen.getByText("30%")).toBeInTheDocument();
    expect(screen.getByText("2 erros")).toBeInTheDocument();
    expect(screen.getByText("4 erros")).toBeInTheDocument();
    // 17 not studied
    expect(screen.getByText(/Tópicos ainda não estudados \(17\)/)).toBeInTheDocument();
  });

  it("shows top error topics from error_bank", async () => {
    mockErrorData.push(
      { tema: "Pneumologia", vezes_errado: 5 },
      { tema: "Cardiologia", vezes_errado: 3 },
    );

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Temas com mais erros")).toBeInTheDocument();
    });
    expect(screen.getByText("5x")).toBeInTheDocument();
    expect(screen.getByText("3x")).toBeInTheDocument();
  });

  it("shows summary with studied, pending, and weak counts", async () => {
    mockDomainData.push(
      { specialty: "Cardiologia", domain_score: 80, questions_answered: 10, errors_count: 0 },
      { specialty: "Pediatria", domain_score: 35, questions_answered: 5, errors_count: 3 },
    );

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("2 estudadas")).toBeInTheDocument();
    });
    expect(screen.getByText("17 pendentes")).toBeInTheDocument();
    expect(screen.getByText("1 fracas")).toBeInTheDocument();
  });

  it("navigates to Tutor IA when clicking Estudar button on studied topic", async () => {
    mockDomainData.push(
      { specialty: "Cardiologia", domain_score: 60, questions_answered: 10, errors_count: 1 },
    );

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("60%")).toBeInTheDocument();
    });

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
    });

    fireEvent.click(screen.getByText("Cardiologia"));

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/chatgpt", {
      state: {
        initialMessage: 'Quero estudar o tópico "Cardiologia". Me dê uma aula completa seguindo o protocolo ENAZIZI.',
        fromErrorBank: true,
      },
    });
  });

  it("calculates overall score correctly", async () => {
    mockDomainData.push(
      { specialty: "Cardiologia", domain_score: 100, questions_answered: 20, errors_count: 0 },
      { specialty: "Neurologia", domain_score: 90, questions_answered: 15, errors_count: 0 },
    );
    // Overall = (100 + 90) / 19 specialties = 10

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Domínio geral:")).toBeInTheDocument();
    });
    expect(screen.getByText("10%")).toBeInTheDocument();
  });

  it("has link to full domain map", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Ver mapa completo")).toBeInTheDocument();
    });
  });
});
