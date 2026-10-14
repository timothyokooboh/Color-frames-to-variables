# Contributing

Use GitHub Issues for bugs and feature proposals. Include the plugin revision, Figma desktop/browser version, plan, steps, expected/actual results, and a minimal non-sensitive example. Do not attach private design files or credentials.

## Development

1. Use Node.js 24 and the pinned pnpm version (`corepack pnpm --version`).
2. Run `corepack pnpm install --frozen-lockfile` and `corepack pnpm check`.
3. Run `corepack pnpm dev` for UI development or `corepack pnpm dev:plugin` to rebuild both plugin bundles. Import the root manifest in Figma desktop, then rerun after rebuilds.
4. Work on a branch and submit a PR linked to its issue. Include the observed behavior, validation, and any remaining platform limitations.

Read [the architecture](docs/architecture.md), [glossary](GLOSSARY.md), and [product decisions](docs/product-decisions.md). Use Vue Composition API with TypeScript. Compose small components; place stateful workflow logic in composables and authoritative validation/writes in the controller. Keep shared contracts serializable and validate both message boundaries. Preserve exact source paints and names; never weaken individual overwrite consent.

Test at the controller command boundary and through user-facing Vue interactions. Add a failing regression for a defect before fixing it. Run affected tests during development and `corepack pnpm check` before submitting. Automated tests do not establish real Figma compatibility. Use disposable files for native acceptance; see [the release verification record](docs/verification/release.md).

## License and assets

Contributions to the project are under MIT. Retain third-party notices; do not contribute assets or code you cannot license. The `.agents/skills` directory contains development guidance with its own provenance and any applicable upstream terms; it is not bundled into the plugin. Runtime dependencies retain their own licenses.
