# Changesets

Run `pnpm changeset` in a pull request that changes a published package, pick
the packages and the bump, and describe the change for the changelog. `pnpm
version-packages` applies the pending changesets (versions, changelogs, and
the ranges between workspace packages); `pnpm release` builds and publishes
whatever versions are not on npm yet, tagging each as `<package>@<version>`.
