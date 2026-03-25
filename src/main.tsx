import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA (auto-update)
const updateSW = registerSW({
  onNeedRefresh() {
    console.log("[PWA] Nova versão disponível, atualizando...");
    updateSW(true);
  },
  onOfflineReady() {
    console.log("[PWA] App pronto para uso offline.");
  },
});

// Periodic update check every 10 minutes (helps tablets kept in background)
setInterval(() => {
  updateSW();
}, 10 * 60 * 1000);

// Check for updates when user returns to the app (tab/app focus)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    updateSW();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
