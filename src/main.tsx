import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA (auto-update)
const updateSW = registerSW({
  onNeedRefresh() {
    console.log("[PWA] Nova versão disponível, atualizando...");
    // Auto-apply update immediately
    updateSW(true);
  },
  onOfflineReady() {
    console.log("[PWA] App pronto para uso offline.");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
