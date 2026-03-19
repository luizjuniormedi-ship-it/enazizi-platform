import { useEffect } from "react";

/**
 * Robust landscape tablet detection for Samsung Galaxy Tab S7 FE and similar.
 * Uses multiple detection methods since PWA WebViews on Samsung can be unreliable
 * with CSS media queries alone.
 */
export function useLandscapeTablet() {
  useEffect(() => {
    const check = () => {
      // Method 1: window dimensions
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      // Method 2: screen dimensions (more reliable on Android PWA)
      const sw = window.screen?.availWidth || window.screen?.width || w;
      const sh = window.screen?.availHeight || window.screen?.height || h;
      
      // Method 3: matchMedia (most reliable CSS-level check)
      const mqLandscape = window.matchMedia("(orientation: landscape)").matches;
      
      // Method 4: screen.orientation API
      const orientationType = window.screen?.orientation?.type || "";
      const isOrientationLandscape = orientationType.includes("landscape");
      
      // Combine signals: landscape if ANY method confirms it
      const isLandscape = (w > h) || mqLandscape || isOrientationLandscape;
      
      // Tablet detection: use the larger dimension pair to estimate screen size
      const maxDim = Math.max(w, h, sw, sh);
      const minDim = Math.min(
        Math.max(w, h), // ensure we compare the right axis
        Math.max(sw, sh)
      );
      
      // A tablet typically has min dimension >= 400px and max >= 600px
      // Exclude small phones (both dimensions small)
      const shortSide = Math.min(w, h);
      const isTabletSize = shortSide >= 360 && maxDim >= 580;
      const isSmallPhone = shortSide < 360 && maxDim < 700;

      const shouldShow = isLandscape && isTabletSize && !isSmallPhone;
      
      document.documentElement.classList.toggle("landscape-tablet", shouldShow);
    };

    check();
    
    // Resize is the most reliable event across all Android browsers
    window.addEventListener("resize", check);
    
    // orientationchange fires on rotation but viewport may not be updated yet
    const onOrientationChange = () => {
      // Samsung devices delay viewport updates significantly
      check();
      setTimeout(check, 50);
      setTimeout(check, 150);
      setTimeout(check, 300);
      setTimeout(check, 500);
      setTimeout(check, 1000);
    };
    
    window.addEventListener("orientationchange", onOrientationChange);
    
    // Modern screen.orientation API
    const screenOrientation = window.screen?.orientation;
    if (screenOrientation) {
      screenOrientation.addEventListener("change", onOrientationChange);
    }

    // matchMedia listener as additional trigger
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
