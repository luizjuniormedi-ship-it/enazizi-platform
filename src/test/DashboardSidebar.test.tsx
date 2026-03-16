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
    }),
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
    expect(screen.getByText("🤖 Tutor IA (Principal)")).toBeInTheDocument();
  });

  it("renders all navigation items", async () => {
    const DashboardSidebar = (await import("@/components/layout/DashboardSidebar")).default;
    render(
      <MemoryRouter>
        <DashboardSidebar />
      </MemoryRouter>
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("🃏 Flashcards")).toBeInTheDocument();
    expect(screen.getByText("📝 Simulados")).toBeInTheDocument();
    expect(screen.getByText("📤 Uploads")).toBeInTheDocument();
    expect(screen.getByText("📊 Analytics")).toBeInTheDocument();
    expect(screen.getByText("Meu Perfil")).toBeInTheDocument();
    expect(screen.getByText("Sair")).toBeInTheDocument();
  });
});
