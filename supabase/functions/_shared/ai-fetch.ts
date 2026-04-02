// Shared AI fetch helper with retry, backoff, and OpenAI fallback

const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPENAI_API = "https://api.openai.com/v1/chat/completions";

const OPENAI_MAX_TOKENS: Record<string, number> = {
  "gpt-4o-mini": 16384,
  "gpt-4o": 16384,
};

const MODEL_MAP: Record<string, string> = {
  "google/gemini-3-flash-preview": "gpt-4o-mini",
  "google/gemini-2.5-flash": "gpt-4o-mini",
  "google/gemini-2.5-pro": "gpt-4o",
  "google/gemini-2.5-flash-lite": "gpt-4o-mini",
};

// Retryable status codes (transient errors)
const RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);

interface AiFetchOptions {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  tools?: any[];
  tool_choice?: any;
  maxRetries?: number;
  timeoutMs?: number;
  maxTokens?: number;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries: number,
  timeoutMs: number,
  label: string,
): Promise<Response> {
  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, init, timeoutMs);

      // Non-retryable status → return immediately
      if (!RETRYABLE_STATUSES.has(response.status)) {
        return response;
      }

      // Retryable status → consume body, log, and retry
      const errBody = await response.text();
      console.warn(`[${label}] Attempt ${attempt + 1}/${maxRetries + 1} got ${response.status}: ${errBody.slice(0, 200)}`);
      lastResponse = response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isTimeout = lastError.name === "AbortError";
      console.warn(`[${label}] Attempt ${attempt + 1}/${maxRetries + 1} failed: ${isTimeout ? "TIMEOUT" : lastError.message}`);
    }

    // Exponential backoff: 1s, 2s, 4s
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  // All retries exhausted
  if (lastError) throw lastError;
  throw new Error(`[${label}] All ${maxRetries + 1} attempts failed with status ${lastResponse?.status}`);
}

export async function aiFetch(options: AiFetchOptions): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  const lovableModel = options.model || "google/gemini-3-flash-preview";
  const maxRetries = options.maxRetries ?? 2;
  const timeoutMs = options.timeoutMs ?? 45000;

  const buildBody = (model: string, isOpenAI = false) => {
    let maxTokens = options.maxTokens ?? 16384;
    if (isOpenAI) {
      const modelMax = OPENAI_MAX_TOKENS[model] || 16384;
      maxTokens = Math.min(maxTokens, modelMax);
    }
    const body: any = { model, messages: options.messages, max_tokens: maxTokens };
    if (options.stream !== undefined) body.stream = options.stream;
    if (options.tools) body.tools = options.tools;
    if (options.tool_choice) body.tool_choice = options.tool_choice;
    return JSON.stringify(body);
  };

  // Try Lovable AI first
  if (LOVABLE_API_KEY) {
    try {
      const response = await fetchWithRetry(
        LOVABLE_GATEWAY,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: buildBody(lovableModel),
        },
        maxRetries,
        timeoutMs,
        "LovableAI",
      );

      // If not a credit/rate issue, return as-is
      if (response.status !== 402 && response.status !== 429) {
        return response;
      }

      const errorBody = await response.text();
      console.warn(`Lovable AI returned ${response.status}, falling back to OpenAI. Body: ${errorBody.slice(0, 200)}`);
    } catch (fetchErr) {
      console.error("Lovable AI all retries failed:", fetchErr);
    }
  }

  // Fallback to OpenAI
  if (!OPENAI_API_KEY) {
    throw new Error("AI_CREDITS_EXHAUSTED");
  }

  const openaiModel = MODEL_MAP[lovableModel] || "gpt-4o-mini";

  try {
    const response = await fetchWithRetry(
      OPENAI_API,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: buildBody(openaiModel),
      },
      maxRetries,
      timeoutMs,
      "OpenAI",
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`OpenAI fallback failed (${response.status}):`, errText.slice(0, 300));

      if (response.status === 429) throw new Error("AI_RATE_LIMITED");
      if (response.status === 402) throw new Error("AI_CREDITS_EXHAUSTED");
      throw new Error("AI_SERVICE_UNAVAILABLE");
    }

    return response;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("AI_")) throw err;
    console.error("OpenAI all retries failed:", err);
    throw new Error("AI_SERVICE_UNAVAILABLE");
  }
}

// Helper: map error codes to user-friendly Portuguese messages
export function getAiErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg === "AI_CREDITS_EXHAUSTED") return "Créditos de IA esgotados. Tente novamente mais tarde.";
  if (msg === "AI_RATE_LIMITED") return "Muitas requisições simultâneas. Aguarde um momento e tente novamente.";
  if (msg === "AI_SERVICE_UNAVAILABLE") return "Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos.";
  return "Erro inesperado no serviço de IA. Tente novamente.";
}

/**
 * Sanitize AI response content by removing control characters that break JSON.parse.
 * Preserves newlines, carriage returns, and tabs.
 */
export function sanitizeAiContent(raw: string): string {
  return raw.replace(/[\x00-\x1F\x7F]/g, (ch: string) =>
    ch === '\n' || ch === '\r' || ch === '\t' ? ch : ' '
  );
}

/**
 * Extract and parse JSON from AI response content.
 * Handles markdown code blocks and control character sanitization.
 */
export function parseAiJson(rawContent: string): any {
  const content = sanitizeAiContent(rawContent);
  
  // Try markdown code block first
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1].trim());
  }
  
  // Try extracting JSON object
  const objMatch = content.match(/\{[\s\S]*\}/);
  if (objMatch) return JSON.parse(objMatch[0]);
  
  // Try extracting JSON array
  const arrMatch = content.match(/\[[\s\S]*\]/);
  if (arrMatch) return JSON.parse(arrMatch[0]);
  
  throw new Error("No valid JSON found in AI response");
}
