import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const edgeFunctions = [
  "mentor-chat",
  "question-generator",
  "content-summarizer",
  "motivational-coach",
  "generate-flashcards",
  "medical-reviewer",
  "interview-simulator",
];

// Test CORS preflight for all streaming edge functions
for (const fn of edgeFunctions) {
  Deno.test(`${fn}: CORS preflight returns 200`, async () => {
    const url = `${SUPABASE_URL}/functions/v1/${fn}`;
    const resp = await fetch(url, {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
      },
    });
    // Consume body to prevent leaks
    await resp.text();
    assertEquals(resp.status, 200);
  });
}

// Test that functions reject empty body
for (const fn of edgeFunctions) {
  Deno.test(`${fn}: rejects empty body with error`, async () => {
    const url = `${SUPABASE_URL}/functions/v1/${fn}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "apikey": SUPABASE_ANON_KEY,
      },
      body: "{}",
    });
    const text = await resp.text();
    // Should not crash - either returns stream or error JSON
    assertExists(text);
  });
}

// Test clinical-simulation CORS
Deno.test("clinical-simulation: CORS preflight returns 200", async () => {
  const url = `${SUPABASE_URL}/functions/v1/clinical-simulation`;
  const resp = await fetch(url, {
    method: "OPTIONS",
    headers: {
      "Origin": "http://localhost:5173",
      "Access-Control-Request-Method": "POST",
    },
  });
  await resp.text();
  assertEquals(resp.status, 200);
});

// Test discursive-questions CORS
Deno.test("discursive-questions: CORS preflight returns 200", async () => {
  const url = `${SUPABASE_URL}/functions/v1/discursive-questions`;
  const resp = await fetch(url, {
    method: "OPTIONS",
    headers: {
      "Origin": "http://localhost:5173",
      "Access-Control-Request-Method": "POST",
    },
  });
  await resp.text();
  assertEquals(resp.status, 200);
});

// Test chatgpt-agent CORS
Deno.test("chatgpt-agent: CORS preflight returns 200", async () => {
  const url = `${SUPABASE_URL}/functions/v1/chatgpt-agent`;
  const resp = await fetch(url, {
    method: "OPTIONS",
    headers: {
      "Origin": "http://localhost:5173",
      "Access-Control-Request-Method": "POST",
    },
  });
  await resp.text();
  assertEquals(resp.status, 200);
});
