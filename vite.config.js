import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "GeoDrishti-AI Ground Client",
        short_name: "GeoDrishti",
        description: "ISRO Bhuvan SRISHTI/DRISHTI Offline Field Companion",
        theme_color: "#0d47a1",
        background_color: "#f8fafc",
        display: "standalone",
        orientation: "portrait",
      },
    }),
  ],
});
