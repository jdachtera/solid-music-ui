import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin({ hot: false })],
  test: {
    watch: false,
    environment: "jsdom",
    include: ["test/*.test.{ts,tsx}"],
  },
  resolve: {
    dedupe: ["solid-js"],
    conditions: ["@solid-music-ui/source", "browser", "development"],
  },
});
