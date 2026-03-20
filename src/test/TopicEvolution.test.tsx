import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

const renderComponent = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TopicEvolution />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe("TopicEvolution", () => {
  beforeEach(() => {
    domainData = [];
    errorData = [];
  });

  it("renders title and overall score", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Evolução por especialidade/)).toBeInTheDocument();
    });
  });

  it("shows all 22 specialties as not studied when no domain data", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Não estudadas/)).toBeInTheDocument();
    });
  });

  it("shows studied specialties with scores", async () => {
    domainData = [
      { specialty: "Cardiologia", domain_score: 80, questions_answered: 50, correct_answers: 40 },
    ];
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Cardiologia")).toBeInTheDocument();
    });
  });

  it("shows top error topics from error_bank", async () => {
    errorData = [
      { tema: "Infarto Agudo", vezes_errado: 5 },
    ];
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Mapa de Evolução")).toBeInTheDocument();
    });
  });

  it("shows summary counts", async () => {
    domainData = [
      { specialty: "Cardiologia", domain_score: 80, questions_answered: 50, correct_answers: 40 },
    ];
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Estudadas/)).toBeInTheDocument();
    });
  });

  it("calculates overall score correctly", async () => {
    domainData = [
      { specialty: "Cardiologia", domain_score: 80, questions_answered: 50, correct_answers: 40 },
      { specialty: "Neurologia", domain_score: 60, questions_answered: 30, correct_answers: 18 },
    ];
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Cardiologia")).toBeInTheDocument();
      expect(screen.getByText("Neurologia")).toBeInTheDocument();
    });
  });

  it("has link to full domain map", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Ver mapa completo/)).toBeInTheDocument();
    });
  });

  it("renders Estudar buttons for studied topics", async () => {
    domainData = [
      { specialty: "Cardiologia", domain_score: 80, questions_answered: 50, correct_answers: 40 },
    ];
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Cardiologia")).toBeInTheDocument();
    });
  });
});
