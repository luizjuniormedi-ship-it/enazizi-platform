import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const LAZY_RETRY_PREFIX = "enazizi_lazy_retry";

export const isChunkLoadError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");

  return /Importing a module script failed|Failed to fetch dynamically imported module|Loading chunk [\d]+ failed|error loading dynamically imported module/i.test(
    message,
  );
};

export const lazyWithRetry = <T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  cacheKey: string,
): LazyExoticComponent<T> =>
  lazy(async () => {
    try {
      const module = await importer();

      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`${LAZY_RETRY_PREFIX}:${cacheKey}:${window.location.pathname}`);
      }

      return module;
    } catch (error) {
      if (typeof window !== "undefined" && isChunkLoadError(error)) {
        const retryKey = `${LAZY_RETRY_PREFIX}:${cacheKey}:${window.location.pathname}`;
        const hasRetried = sessionStorage.getItem(retryKey) === "1";

        if (!hasRetried) {
          sessionStorage.setItem(retryKey, "1");
          window.location.reload();

          return new Promise<never>(() => {});
        }
      }

      throw error;
    }
  });