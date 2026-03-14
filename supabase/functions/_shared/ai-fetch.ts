// Shared AI fetch helper with OpenAI fallback when Lovable AI credits are exhausted

const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPENAI_API = "https://api.openai.com/v1/chat/completions";

// Model mapping: Lovable model -> OpenAI equivalent
const MODEL_MAP: Record<string, string> = {
  "google/gemini-3-flash-preview": "gpt-4o-mini",
  "google/gemini-2.5-flash": "gpt-4o-mini",
  "google/gemini-2.5-pro": "gpt-4o",
  "google/gemini-2.5-flash-lite": "gpt-4o-mini",
};

interface AiFetchOptions {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  tools?: any[];
  tool_choice?: any;
}

export async function aiFetch(options: AiFetchOptions): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  const lovableModel = options.model || "google/gemini-3-flash-preview";

  // Try Lovable AI first
  if (LOVABLE_API_KEY) {
    const body: any = {
      model: lovableModel,
      messages: options.messages,
    };
    if (options.stream !== undefined) body.stream = options.stream;
    if (options.tools) body.tools = options.tools;
    if (options.tool_choice) body.tool_choice = options.tool_choice;

    const response = await fetch(LOVABLE_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // If not a credit/rate issue, return as-is
    if (response.status !== 402 && response.status !== 429) {
      return response;
    }

    console.log(`Lovable AI returned ${response.status}, falling back to OpenAI...`);
  }

  // Fallback to OpenAI
  if (!OPENAI_API_KEY) {
    throw new Error("Créditos Lovable AI esgotados e OPENAI_API_KEY não configurada.");
  }

  const openaiModel = MODEL_MAP[lovableModel] || "gpt-4o-mini";
  
  const body: any = {
    model: openaiModel,
    messages: options.messages,
  };
  if (options.stream !== undefined) body.stream = options.stream;
  if (options.tools) body.tools = options.tools;
  if (options.tool_choice) body.tool_choice = options.tool_choice;

  const response = await fetch(OPENAI_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return response;
}
