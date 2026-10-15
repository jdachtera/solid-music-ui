import { defineConfig } from "tsup";
import esbuildCss from "esbuild-css-modules-plugin";
import { solidLibrary } from "../../scripts/tsup-solid";

export default defineConfig(
  solidLibrary({
    entry: "src/index.tsx",
    // Injected by the JS, so a consumer needs no stylesheet import.
    esbuildPlugins: [esbuildCss({ inject: true, localsConvention: "camelCase" })],
  }),
);
