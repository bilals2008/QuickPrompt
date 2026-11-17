import { defineConfig } from "vite";
import path from "node:path";
import electron from "vite-plugin-electron/simple";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: "electron/main.js",
        vite: {
          build: {
            rolldownOptions: {
              external: ["sqlite3", "electron", "electron-updater", "node:fs", "node:path", "node:url", "node:os"],
            },
          },
        },
      },
      preload: {
        input: path.join(import.meta.dirname, "electron/preload.js"),
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
