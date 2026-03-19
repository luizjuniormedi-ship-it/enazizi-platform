import { useEffect } from "react";

/**
 * Detects landscape-oriented tablets (Samsung Tab S7 FE, etc.)
 * and toggles a CSS class on <html> for Tailwind to target.
 * More reliable than pure CSS media queries on Android WebView/Chrome.
 */
export function useLandscapeTablet() {
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isLandscape = w > h;
      const isTabletSize = Math.min(w, h) >= 400 && Math.max(w, h) >= 600;
      const isMobilePhone = Math.min(w, h) < 380; // small phones excluded

      document.documentElement.classList.toggle(
        "landscape-tablet",
        isLandscape && isTabletSize && !isMobilePhone
      );
    };

    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", () => {
      // Samsung devices sometimes delay viewport update
      setTimeout(check, 100);
      setTimeout(check, 300);
      setTimeout(check, 500);
    });

    // Also listen to screen.orientation API if available
    if (screen.orientation) {
      screen.orientation.addEventListener("change", () => {
        setTimeout(check, 100);
        setTimeout(check, 300);
      });
    }

    return () => {
      window.removeEventListener("resize", check);
    };
  }, []);
}
