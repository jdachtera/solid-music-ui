import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";

export default defineConfig(({ mode }) => {
  // to test in server environment, run with "--mode ssr" or "--mode test:ssr" flag
  // loads only server.test.ts file
  const testSSR = mode === "test:ssr" || mode === "ssr";

  return {
    plugins: [
      solidPlugin({
        // https://github.com/solidjs/solid-refresh/issues/29
        hot: false,
        // For testing SSR we need to do a SSR JSX transform
        solid: { generate: testSSR ? "ssr" : "dom" },
      }),
    ],
    test: {
      watch: false,
      // Solid packages ship JSX/reactive code that has to share this Solid
      // instance; run them through Vite rather than load them from Node.
      server: { deps: { inline: [/solid-viewport/, /solid-piano-keyboard/] } },
      isolate: !testSSR,
      environment: testSSR ? "node" : "jsdom",
      ...(testSSR
        ? {
            include: ["test/server.test.{ts,tsx}"],
          }
        : {
            include: ["test/*.test.{ts,tsx}"],
            exclude: ["test/server.test.{ts,tsx}"],
          }),
    },
    resolve: {
      dedupe: ["solid-js"],
      conditions: ["@solid-music-ui/source", "browser", "development"],
    },
    ssr: { resolve: { conditions: ["@solid-music-ui/source", "node"] } },
  };
});
