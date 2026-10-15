import { defaultClientConditions, defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  // One Solid for the demo and any linked package (e.g. a local solid-viewport).
  resolve: {
    dedupe: ["solid-js"],
    // Workspace packages from their src/, so the demo hot-reloads across them.
    conditions: ["@solid-music-ui/source", ...defaultClientConditions],
  },
  build: {
    target: "esnext",
    copyPublicDir: true,
  },
});
