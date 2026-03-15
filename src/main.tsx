import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA (auto-update)
registerSW({
  onNeedRefresh() {
    // Silently update — could show a toast here
    console.log("[PWA] Nova versão disponível, atualizando...");
  },
  onOfflineReady() {
    console.log("[PWA] App pronto para uso offline.");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
