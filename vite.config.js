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
        name: "Drishti",
        short_name: "Drishti",
        description: "Watershed monitoring and offline field companion",
        theme_color: "#0d47a1",
        background_color: "#f8fafc",
        display: "standalone",
        orientation: "portrait",
      },
    }),
  ],
});
