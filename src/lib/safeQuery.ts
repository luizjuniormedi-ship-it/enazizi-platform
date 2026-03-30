/**
 * Global resilient query utility for ENAZIZI.
 * Wraps Supabase queries with try/catch, fallback, and silent logging.
 * 
 * Pattern: TENTAR → VALIDAR → FALLBACK → LOGAR → CONTINUAR
 */

type QueryFn<T> = () => PromiseLike<{ data: T | null; error: any }>;

/**
 * Execute a Supabase query safely. Never throws.
 * @param fn   - The query function
 * @param label - Human-readable label for logging
 * @param fallback - Default value if query fails (defaults to null)
 */
export async function safeQuery<T>(
  fn: QueryFn<T>,
  label: string,
  fallback: T | null = null
): Promise<T | null> {
  try {
    const { data, error } = await fn();
    if (error) {
      console.warn(`[SafeQuery] ${label}:`, error.message);
      return fallback;
    }
    return data;
  } catch (e: any) {
    console.warn(`[SafeQuery] ${label} falhou silenciosamente:`, e?.message || e);
    return fallback;
  }
}

/**
 * Execute multiple independent queries in parallel with individual fallbacks.
 * One failure never blocks others.
 */
export async function safeQueryAll<T extends readonly unknown[]>(
  queries: { [K in keyof T]: { fn: QueryFn<T[K]>; label: string; fallback?: T[K] | null } }
): Promise<{ [K in keyof T]: T[K] | null }> {
  const results = await Promise.all(
    queries.map((q) => safeQuery(q.fn, q.label, q.fallback ?? null))
  );
  return results as any;
}

/**
 * Wrap a component data-fetching function with resilient error handling.
 * Returns fallback data instead of crashing.
 */
export async function safeDataFetch<T>(
  fn: () => Promise<T>,
  label: string,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    console.warn(`[SafeData] ${label}:`, e?.message || e);
    return fallback;
  }
}
