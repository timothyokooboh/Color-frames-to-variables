# Color Palette to Variables

A Figma Design plugin for converting selected color swatches into native color variables while preserving designer-defined names and paint values.

**Current stage:** preview, refine, and create variables in new or existing collections. Edit proposed names without renaming source layers, exclude items, and resolve conflicts before creating. The collection picker defaults to Colors; all other collections, new or existing, receive variables under a Colors group. Results separate created, updated, failed, intentionally excluded, and unsupported items. Existing color variables require individual overwrite approval with a color comparison. Failed items can be refreshed, corrected, and retried without repeating successful writes. See [the MVP specification](https://github.com/timothyokooboh/Color-frames-to-variables/issues/1).

## Setup

Use Node.js 24 (recorded in `.node-version`) and pnpm 10.30.3, pinned in `package.json`.

```sh
corepack pnpm install --frozen-lockfile
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
4. Select color swatches and run the plugin to see the preview. Use Refresh selection after changing your selection. Review the destination and full paths, then choose Create variables. Original RGB channels and paint alpha are written without conversion through HEX. A stale selection requires refreshed review.

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

## Release status and privacy

Submitted to Figma Community for review; approval is pending. See the [acceptance record and remaining gates](docs/verification/release.md) and [Community listing package](docs/release/community.md). Local plugin development requires Figma desktop; `pnpm dev` is a standalone UI preview, not a browser-host Figma test.

The plugin has no backend, analytics, account system, external runtime requests, or external design-data storage. It reads the selected layers and local variables, writes only approved variables, and retains retry state in memory for the current plugin session. Closing the plugin loses that retry context; inspect any reported incomplete allocations before starting again. Figma itself retains and syncs the document under its own terms.

Only explicitly selected frames and rectangles with one visible solid fill qualify. The plugin writes the default mode, preserves paint opacity, and does not bind variables back to source fills. Unresolvable aliases require renaming or exclusion.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md). Project code is [MIT licensed](LICENSE); dependency and third-party guidance licenses remain applicable.
