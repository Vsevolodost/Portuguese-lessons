import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "/learn/",
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:27602",
      "/assets": "http://127.0.0.1:27602",
    },
  },
  build: {
    outDir: "../outputs/bora-v2",
    emptyOutDir: true,
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "@tanstack/react-query",
          ],
        },
      },
    },
  },
});
