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
  },
  android: {
    backgroundColor: "#0f172a",
  },
};

export default config;
