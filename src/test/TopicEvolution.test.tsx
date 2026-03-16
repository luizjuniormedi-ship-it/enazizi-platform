import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

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

vi.mock("@/integrations/supabase/client", () => {
  return {
    supabase: {
      from: (table: string) => {
        const getData = () => table === "medical_domain_map" ? [...domainData] : [...errorData];
        return {
          select: () => ({
            eq: () => {
              let _resolve: any;
              const p = new Promise((r) => { _resolve = r; });
              // Resolve synchronously in microtask
              queueMicrotask(() => _resolve({ data: getData(), error: null }));
              return p;
            },
          }),
        };
      },
    },
  };
});

let TopicEvolution: any;

beforeEach(async () => {
  vi.clearAllMocks();
  domainData = [];
  errorData = [];
  const mod = await import("@/components/dashboard/TopicEvolution");
  TopicEvolution = mod.default;
});

const renderAndWait = async () => {
  await act(async () => {
    render(
      <BrowserRouter>
        <TopicEvolution />
      </BrowserRouter>
    );
    // Flush microtasks
    await new Promise((r) => setTimeout(r, 50));
  });
};

describe("TopicEvolution", () => {
  it("renders title and overall score", async () => {
    await renderAndWait();
    expect(screen.getByText("Evolução por especialidade")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("shows all 19 specialties as not studied when no domain data", async () => {
    await renderAndWait();
    expect(screen.getByText(/Tópicos ainda não estudados \(19\)/)).toBeInTheDocument();
    expect(screen.getByText("Cardiologia")).toBeInTheDocument();
    expect(screen.getByText("Cirurgia")).toBeInTheDocument();
  });

  it("shows studied specialties with scores when domain data exists", async () => {
    domainData = [
      { specialty: "Cardiologia", domain_score: 75, questions_answered: 10, errors_count: 2 },
      { specialty: "Neurologia", domain_score: 30, questions_answered: 5, errors_count: 4 },
    ];
    await renderAndWait();
    expect(screen.getByText("75%")).toBeInTheDocument();
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
    await renderAndWait();
    expect(screen.getByText("Temas com mais erros")).toBeInTheDocument();
    expect(screen.getByText("5x")).toBeInTheDocument();
    expect(screen.getByText("3x")).toBeInTheDocument();
  });

  it("shows summary with studied, pending, and weak counts", async () => {
    domainData = [
      { specialty: "Cardiologia", domain_score: 80, questions_answered: 10, errors_count: 0 },
      { specialty: "Pediatria", domain_score: 35, questions_answered: 5, errors_count: 3 },
    ];
    await renderAndWait();
    expect(screen.getByText("2 estudadas")).toBeInTheDocument();
    expect(screen.getByText("17 pendentes")).toBeInTheDocument();
    expect(screen.getByText("1 fracas")).toBeInTheDocument();
  });

  it("navigates to Tutor IA when clicking Estudar button", async () => {
    domainData = [
      { specialty: "Cardiologia", domain_score: 60, questions_answered: 10, errors_count: 1 },
    ];
    await renderAndWait();
    expect(screen.getByText("60%")).toBeInTheDocument();
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
    await renderAndWait();
    expect(screen.getByText("Cardiologia")).toBeInTheDocument();
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
    await renderAndWait();
    expect(screen.getByText("Domínio geral:")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
  });

  it("has link to full domain map", async () => {
    await renderAndWait();
    expect(screen.getByText("Ver mapa completo")).toBeInTheDocument();
  });
});
