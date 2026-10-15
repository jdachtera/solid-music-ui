import { defineConfig } from "tsup";
import { solidLibrary } from "../../scripts/tsup-solid";

export default defineConfig(solidLibrary({ entry: "src/index.tsx" }));
