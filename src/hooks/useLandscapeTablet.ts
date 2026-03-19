import { useEffect } from "react";

/**
 * Robust landscape tablet detection for Samsung Galaxy Tab S7 FE and similar.
 * Uses window dimensions as primary signal (most reliable on Android PWA).
 */
export function useLandscapeTablet() {
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      // Primary signal: window dimensions (most reliable everywhere)
      const isLandscape = w > h && w >= 600;
      
      // Tablet: short side >= 360px, long side >= 600px
      const shortSide = Math.min(w, h);
      const isTabletSize = shortSide >= 360;

      document.documentElement.classList.toggle(
        "landscape-tablet",
        isLandscape && isTabletSize
      );
    };

    check();
    
    window.addEventListener("resize", check);
    
    const onOrientationChange = () => {
      // Samsung devices delay viewport updates
      check();
      setTimeout(check, 50);
      setTimeout(check, 150);
      setTimeout(check, 300);
      setTimeout(check, 500);
      setTimeout(check, 1000);
    };
    
    window.addEventListener("orientationchange", onOrientationChange);
    
    const screenOrientation = window.screen?.orientation;
    if (screenOrientation) {
      screenOrientation.addEventListener("change", onOrientationChange);
    }

    const mql = window.matchMedia("(orientation: landscape)");
    const onMqlChange = () => {
      check();
      setTimeout(check, 200);
    };
    mql.addEventListener("change", onMqlChange);

    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", onOrientationChange);
      screenOrientation?.removeEventListener("change", onOrientationChange);
      mql.removeEventListener("change", onMqlChange);
    };
  }, []);
}
