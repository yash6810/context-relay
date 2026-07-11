import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        popup: resolve(__dirname, "popup.html"),
        sidepanel: resolve(__dirname, "sidepanel.html"),
        background: resolve(__dirname, "src/background.ts"),
        "content-chatgpt": resolve(__dirname, "src/content-scripts/chatgpt.ts"),
        "content-claude": resolve(__dirname, "src/content-scripts/claude.ts"),
        "content-gemini": resolve(__dirname, "src/content-scripts/gemini.ts"),
        "content-perplexity": resolve(__dirname, "src/content-scripts/perplexity.ts"),
        "content-grok": resolve(__dirname, "src/content-scripts/grok.ts"),
        "content-mistral": resolve(__dirname, "src/content-scripts/mistral.ts"),
      },
      output: {
        entryFileNames: "scripts/[name].js",
        chunkFileNames: "scripts/chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    allowedHosts: true,
    hmr: false,
  },
});