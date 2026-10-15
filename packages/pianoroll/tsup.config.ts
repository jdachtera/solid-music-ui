import { defineConfig } from "tsup";
import esbuildCss from "esbuild-css-modules-plugin";
import { solidLibrary } from "../../scripts/tsup-solid";

export default defineConfig(
  solidLibrary({
    entry: "src/index.tsx",
    devEntry: true,
    dropConsole: true,
    // The roll's styles are CSS modules, injected by the JS so consumers need
    // no stylesheet import.
    esbuildPlugins: [esbuildCss({ inject: true, localsConvention: "camelCase" })],
  }),
);
