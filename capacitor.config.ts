import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.87c4855c32604ae3bbeb9a3f29d0ed53",
  appName: "ENAZIZI",
  webDir: "dist",
  server: {
    url: "https://87c4855c-3260-4ae3-bbeb-9a3f29d0ed53.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    minVersion: "16.0",
    scheme: "ENAZIZI",
  },
  android: {
    backgroundColor: "#0f172a",
    minWebViewVersion: "113.0.5672.24",
  },
};

export default config;
