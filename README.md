# Color Frames to Variables

A Figma Design plugin for converting selected color swatches into native color variables while preserving designer-defined names and paint values.

**Current stage:** selection preview. Inspect selected frames and rectangles, their exact names and paint values, and reasons for skipped layers. Variable creation is not implemented yet. See [the MVP specification](https://github.com/timothyokooboh/Color-frames-to-variables/issues/1).

## Setup

Use Node.js 24 (recorded in `.node-version`) and pnpm 10.30.3, pinned in `package.json`.

```sh
corepack pnpm install
corepack pnpm dev
```

If your pnpm shim is available, `pnpm` and `corepack pnpm` are interchangeable. Browser development runs the UI only; Figma API operations require the plugin environment.

## Commands

| Command           | Purpose                                                          |
| ----------------- | ---------------------------------------------------------------- |
| `pnpm dev`        | UI development server with hot reload                            |
| `pnpm dev:plugin` | Initial build followed by UI/controller build watchers           |
| `pnpm build`      | Bundle and verify the Figma plugin artifacts                     |
| `pnpm typecheck`  | Check all workspace TypeScript environments                      |
| `pnpm lint`       | Check code, component size, and Vue accessibility rules          |
| `pnpm format`     | Format project files, excluding skills and generated output      |
| `pnpm test`       | Run controller-command and Vue preview interaction tests         |
| `pnpm check`      | Typecheck, lint, format check, test, build, and verify artifacts |

## Load in Figma

1. Run `pnpm build`.
2. Import the root `manifest.json` from Figma's development plugin menu.
3. If Figma requires registration, create a development plugin and copy its assigned ID into the root manifest. This scaffold does not fabricate a published plugin ID.
4. Select color swatches and run the plugin to see the preview. Use Refresh selection after changing your selection.

Use `pnpm dev:plugin` while developing and rerun the plugin after rebuilds. The manifest denies runtime network access and the UI bundle is self-contained.

## Architecture

```text
apps/
  ui/             Vue 3, Pinia, Tailwind, shadcn-vue setup
  plugin/         Figma sandbox controller
packages/
  contracts/      Shared serializable message contracts
docs/
  architecture.md Component map, module boundaries, and testing approach
```

Read [the architecture guide](docs/architecture.md) before adding a feature. Composition is central: small components, typed props/events, slots for layouts, and focused composables. `App.vue` remains a composition surface.

## Adding UI primitives

The [shadcn-vue setup](https://www.shadcn-vue.com/docs/installation/vite) is scoped to the UI workspace. Add components when needed:

```sh
pnpm --filter @color-frames/ui exec shadcn-vue add button
```

Review generated components against project accessibility and composition conventions. A component library alone does not establish WCAG compliance.
