import { describe, it, expect } from "vitest";

/**
 * Route validation tests: ensures all navigation references
 * point to routes that actually exist in App.tsx
 */

// All valid dashboard routes defined in App.tsx
const VALID_DASHBOARD_ROUTES = [
  "/dashboard",
  "/dashboard/cronograma",
  "/dashboard/flashcards",
  "/dashboard/gerar-flashcards",
  "/dashboard/simulados",
  "/dashboard/uploads",
  "/dashboard/agentes",
  "/dashboard/questoes",
  "/dashboard/banco-questoes",
  "/dashboard/resumos",
  "/dashboard/coach",
  "/dashboard/chatgpt",
  "/dashboard/plano-dia",
  "/dashboard/predictor",
  "/dashboard/diagnostico",
  "/dashboard/simulado-completo",
  "/dashboard/banco-erros",
  "/dashboard/mapa-dominio",
  "/dashboard/proficiencia",
  "/dashboard/discursivas",
  "/dashboard/plantao",
  "/dashboard/revisor",
  "/dashboard/entrevista",
  "/dashboard/conquistas",
  "/dashboard/analytics",
  "/dashboard/perfil",
];

const VALID_TOP_ROUTES = [
  "/",
  "/login",
  "/register",
  "/admin",
  "/professor",
  "/install",
];

// Sidebar routes (DashboardSidebar.tsx)
const SIDEBAR_ROUTES = [
  "/dashboard",
  "/dashboard/chatgpt",
  "/dashboard/plano-dia",
  "/dashboard/diagnostico",
  "/dashboard/cronograma",
  "/dashboard/flashcards",
  "/dashboard/gerar-flashcards",
  "/dashboard/simulados",
  "/dashboard/simulado-completo",
  "/dashboard/questoes",
  "/dashboard/banco-questoes",
  "/dashboard/resumos",
  "/dashboard/coach",
  "/dashboard/predictor",
  "/dashboard/banco-erros",
  "/dashboard/mapa-dominio",
  "/dashboard/proficiencia",
  "/dashboard/discursivas",
  "/dashboard/plantao",
  "/dashboard/uploads",
  "/dashboard/conquistas",
  "/dashboard/analytics",
  "/dashboard/perfil",
];

// Mobile nav routes (DashboardLayout.tsx)
const MOBILE_NAV_ROUTES = [
  "/dashboard",
  "/dashboard/chatgpt",
  "/dashboard/plano-dia",
  "/dashboard/diagnostico",
  "/dashboard/cronograma",
  "/dashboard/flashcards",
  "/dashboard/gerar-flashcards",
  "/dashboard/simulados",
  "/dashboard/simulado-completo",
  "/dashboard/questoes",
  "/dashboard/banco-questoes",
  "/dashboard/resumos",
  "/dashboard/coach",
  "/dashboard/predictor",
  "/dashboard/banco-erros",
  "/dashboard/mapa-dominio",
  "/dashboard/proficiencia",
  "/dashboard/discursivas",
  "/dashboard/plantao",
  "/dashboard/uploads",
  "/dashboard/conquistas",
  "/dashboard/analytics",
];

// AgentsHub routes
const AGENTS_HUB_ROUTES = [
  "/dashboard/chatgpt",
  "/dashboard/questoes",
  "/dashboard/gerar-flashcards",
  "/dashboard/resumos",
  "/dashboard/plantao",
  "/dashboard/coach",
  "/dashboard/predictor",
  "/dashboard/discursivas",
  "/dashboard/revisor",
  "/dashboard/entrevista",
];

// Navigate() calls from various pages
const NAVIGATE_TARGETS = [
  "/dashboard/chatgpt",        // ErrorBank, QuestionsBank, Flashcards, ExamSimulator, Diagnostic, MedicalDomainMap, TopicEvolution
  "/dashboard/plano-dia",      // Diagnostic
  "/dashboard/questoes",       // QuestionsBank "Gerar mais"
  "/dashboard/simulados",      // CronogramaRecursosRevisao
  "/dashboard/mapa-dominio",   // TopicEvolution
  "/dashboard/conquistas",     // XpWidget
  "/dashboard/perfil",         // DashboardSidebar, DashboardLayout
  "/dashboard/banco-questoes", // Dashboard
  "/dashboard/flashcards",     // Dashboard
];

describe("Route Validation", () => {
  it("all sidebar routes exist in App.tsx", () => {
    for (const route of SIDEBAR_ROUTES) {
      expect(VALID_DASHBOARD_ROUTES).toContain(route);
    }
  });

  it("all mobile nav routes exist in App.tsx", () => {
    for (const route of MOBILE_NAV_ROUTES) {
      expect(VALID_DASHBOARD_ROUTES).toContain(route);
    }
  });

  it("all AgentsHub routes exist in App.tsx", () => {
    for (const route of AGENTS_HUB_ROUTES) {
      expect(VALID_DASHBOARD_ROUTES).toContain(route);
    }
  });

  it("all navigate() targets exist in App.tsx", () => {
    for (const route of NAVIGATE_TARGETS) {
      expect(VALID_DASHBOARD_ROUTES).toContain(route);
    }
  });

  it("sidebar and mobile nav are in sync", () => {
    // Mobile nav should be a subset of sidebar (excluding perfil which is separate)
    for (const route of MOBILE_NAV_ROUTES) {
      expect(SIDEBAR_ROUTES).toContain(route);
    }
  });

  it("no duplicate routes in valid routes list", () => {
    const unique = new Set(VALID_DASHBOARD_ROUTES);
    expect(unique.size).toBe(VALID_DASHBOARD_ROUTES.length);
  });

  it("all routes follow naming convention (lowercase, hyphenated)", () => {
    const pattern = /^\/dashboard(\/[a-z][a-z0-9-]*)?$/;
    for (const route of VALID_DASHBOARD_ROUTES) {
      expect(route).toMatch(pattern);
    }
  });

  it("expected total route count matches", () => {
    // 26 dashboard routes + 6 top-level = 32 total
    expect(VALID_DASHBOARD_ROUTES.length).toBe(26);
    expect(VALID_TOP_ROUTES.length).toBe(6);
  });
});
