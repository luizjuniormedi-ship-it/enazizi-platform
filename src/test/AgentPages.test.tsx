import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "test@test.com" },
    session: { access_token: "test-token" },
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

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

describe("Agent Pages render correctly", () => {
  it("AIMentor renders with correct branding", async () => {
    const AIMentor = (await import("@/pages/AIMentor")).default;
    render(
      <MemoryRouter>
        <AIMentor />
      </MemoryRouter>
    );
    expect(screen.getByText("MentorMed")).toBeInTheDocument();
    expect(screen.getByText(/Residência Médica e Revalida/)).toBeInTheDocument();
  });

  it("QuestionGenerator renders with correct branding", async () => {
    const QuestionGenerator = (await import("@/pages/QuestionGenerator")).default;
    render(
      <MemoryRouter>
        <QuestionGenerator />
      </MemoryRouter>
    );
    expect(screen.getByText("Gerador de Questões")).toBeInTheDocument();
    expect(screen.getByText(/ENARE, USP e UNIFESP/)).toBeInTheDocument();
  });

  it("ContentSummarizer renders with correct branding", async () => {
    const ContentSummarizer = (await import("@/pages/ContentSummarizer")).default;
    render(
      <MemoryRouter>
        <ContentSummarizer />
      </MemoryRouter>
    );
    expect(screen.getByText("Resumidor de Conteúdo")).toBeInTheDocument();
    expect(screen.getByText(/mnemônicos e pontos de prova/)).toBeInTheDocument();
  });

  it("MotivationalCoach renders with correct branding", async () => {
    const MotivationalCoach = (await import("@/pages/MotivationalCoach")).default;
    render(
      <MemoryRouter>
        <MotivationalCoach />
      </MemoryRouter>
    );
    expect(screen.getByText("Coach Motivacional")).toBeInTheDocument();
    expect(screen.getByText(/preparação/)).toBeInTheDocument();
  });
});
