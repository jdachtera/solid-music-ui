// One build for every package: tsup-preset-solid, which emits the `solid`
// export condition (preserved JSX for SolidStart/SSR) next to the compiled
// ESM/CJS. A package's tsup.config.ts names its entry and anything extra.
import type { Options } from "tsup";
import * as preset from "tsup-preset-solid";

type SolidLibraryOptions = {
  entry: string;
  /** A development-only build, served under the `development` condition. */
  devEntry?: boolean;
  dropConsole?: boolean;
  esbuildPlugins?: NonNullable<Options["esbuildPlugins"]>;
};

export const solidLibrary =
  ({ entry, devEntry = false, dropConsole = false, esbuildPlugins = [] }: SolidLibraryOptions) =>
  (config: Options): Options[] => {
    const parsed = preset.parsePresetOptions(
      { entries: { entry, dev_entry: devEntry }, drop_console: dropConsole, cjs: true },
      Boolean(config.watch),
    );
    return preset.generateTsupOptions(parsed).map((options) => ({
      ...options,
      esbuildPlugins: [...(options.esbuildPlugins ?? []), ...esbuildPlugins],
    }));
  };
