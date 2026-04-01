import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Redirect to canonical domain in production
const canonical = "enazizi.com";
if (
  window.location.hostname !== canonical &&
  window.location.hostname !== `www.${canonical}` &&
  !window.location.hostname.includes("localhost") &&
  !window.location.hostname.includes("id-preview--") &&
  !window.location.hostname.includes("lovableproject.com")
) {
  window.location.replace(`https://${canonical}${window.location.pathname}${window.location.search}`);
}

// Guard: disable SW in iframe/preview contexts
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  // Unregister any existing service workers in preview/iframe contexts
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
} else {
  // Register service worker for PWA (auto-update) — production only
  const updateSW = registerSW({
    onNeedRefresh() {
      console.log("[PWA] Nova versão disponível, atualizando...");
      updateSW(true);
    },
    onOfflineReady() {
      console.log("[PWA] App pronto para uso offline.");
    },
  });

  // Periodic update check every 10 minutes
  setInterval(() => {
    updateSW();
  }, 10 * 60 * 1000);

  // Check for updates when user returns to the app
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      updateSW();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
