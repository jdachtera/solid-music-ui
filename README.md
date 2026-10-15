# solid-music-ui

Solid JS components for music apps, published as separate npm packages.

| Package                                 |                                                                        | Demo                                         |
| --------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------- |
| [`solid-viewport`](packages/viewport)   | One scroll/zoom core: virtual lists, waveforms, piano rolls, keyboards | [demo](https://solid-viewport.netlify.app/)  |
| [`solid-waveform`](packages/waveform)   | Waveform display with regions, markers and a play head                 | [demo](https://solid-waveform.netlify.app/)  |
| [`solid-pianoroll`](packages/pianoroll) | Piano roll editor                                                      | [demo](https://solid-pianoroll.netlify.app/) |

Each package was its own repository until it moved here with its history.
Release tags are `<package>@<version>`.

## Develop

```sh
pnpm install
pnpm --filter solid-pianoroll dev   # a package's demo, hot-reloading across packages
pnpm check                          # lint, format, typecheck, test, build: what CI runs
```

Packages import each other from source (the `@solid-music-ui/source` export
condition), so nothing needs building before you typecheck, test or run a demo.

## Release

Add a changeset in the pull request (`pnpm changeset`). To publish, run
`pnpm version-packages`, commit, then `pnpm release`.
