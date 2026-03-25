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

const createChainMock = () => {
  const chain: any = {};
  const methods = ["select", "eq", "not", "order", "limit", "maybeSingle", "insert", "delete", "update", "gte", "single"];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (resolve: any) => resolve({ data: null, error: null });
  return chain;
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => createChainMock(),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

describe("DashboardSidebar", () => {
  it("renders ENAZIZI branding", async () => {
    const DashboardSidebar = (await import("@/components/layout/DashboardSidebar")).default;
    render(
      <MemoryRouter>
        <DashboardSidebar />
      </MemoryRouter>
    );
    expect(screen.getByText("ENAZIZI")).toBeInTheDocument();
  });

  it("renders tutor IA link as priority item", async () => {
    const DashboardSidebar = (await import("@/components/layout/DashboardSidebar")).default;
    render(
      <MemoryRouter>
        <DashboardSidebar />
      </MemoryRouter>
    );
    expect(screen.getByText("🤖 TutorZizi")).toBeInTheDocument();
  });

  it("renders core navigation items", async () => {
    const DashboardSidebar = (await import("@/components/layout/DashboardSidebar")).default;
    render(
      <MemoryRouter>
        <DashboardSidebar />
      </MemoryRouter>
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Meu Perfil")).toBeInTheDocument();
    expect(screen.getByText("Sair")).toBeInTheDocument();
  });
});
