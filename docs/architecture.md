# Project architecture

One product and one domain, organized as a pnpm workspace to separate runtime environments. The root glossary and product decisions remain authoritative; separate workspaces do not introduce separate domain contexts.

## Workspace boundaries

| Workspace            | Responsibility                                                               | Allowed dependencies                                  |
| -------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------- |
| `apps/ui`            | Vue interface, interaction, Pinia state, accessible primitives               | Shared contracts and browser libraries                |
| `apps/plugin`        | Figma sandbox entry and controller operations                                | Shared contracts and Figma API                        |
| `packages/contracts` | Serializable commands, responses, and boundary validation as features arrive | Plain TypeScript, no DOM, Vue, or Figma runtime types |

Both apps may import contracts. Neither imports the other. Separate TypeScript environments keep Figma globals out of the UI and DOM globals out of the controller. Contracts are consumed as TypeScript source by Vite and need no publishing pipeline.

The contracts package defines the preview-selection command and preview-result/error responses. Both runtime boundaries validate incoming data. Request IDs correlate results and prevent older responses from replacing a refreshed preview. Add further commands alongside their actual behavior.

## Component map

| Component              | Responsibility                                           | Contract                              |
| ---------------------- | -------------------------------------------------------- | ------------------------------------- |
| App                    | Compose the shell and preview                            | No props or events                    |
| PluginShell            | Header, scrollable main region, optional footer          | title; default/footer slots           |
| SelectionPreview       | Compose request states and preview sections              | Uses useSelectionPreview              |
| SelectionSummary       | Show counts and request refresh                          | eligible/skipped props; refresh event |
| PreviewEmptyState      | Explain empty or ineligible selections                   | hasSkipped prop                       |
| SwatchList / SwatchRow | Render eligible paints and display-only color formatting | swatches / swatch props               |
| SkippedLayers          | Explain each excluded source layer                       | layers prop                           |

The useSelectionPreview composable owns messaging, loading/error state, response correlation, and listener/timer cleanup. Preview state is local to this feature, so it does not need a Pinia store. Pure display formatting never changes the original channel values carried in contracts.

Group reusable primitives under `components/ui`, layout under `components/layout`, and feature UI by feature. Add focused composables and Pinia setup stores when behavior needs them; avoid empty stores and abstractions with no consumer. Components own presentation, composables own stateful orchestration, and plain functions own pure transformations.

ESLint enforces a 180 nonblank/noncomment line ceiling per Vue component, with block ceilings of 80 script, 100 template, and 60 style lines. These are guardrails, not targets. Split multiple responsibilities even below the limits.

## UI foundation

Vue uses Composition API and TypeScript. Pinia is registered at startup for shared feature state. Tailwind uses its Vite integration. The shadcn-vue CLI, aliases, utility helper, theme variables, and Reka UI dependency are configured; add only primitives needed by a feature. Use native controls for simple interactions.

Theming uses Figma colors where available and standalone browser fallbacks. System fonts and bundled assets avoid runtime network requests. Libraries and lint rules support accessibility but do not replace keyboard, screen-reader, and contrast verification.

## Build and development

Vite builds a self-contained UI HTML file with inline JavaScript and CSS. A separate Vite build emits a sandbox IIFE. The root manifest points to both artifacts, enables dynamic-page document access, and disallows network access.

Browser development provides UI hot reload. Figma development watches both production bundles; rerun the plugin after rebuilding. Keeping the manifest at the root preserves Figma's assigned plugin identity when rebuilding output.

## Verification

Typecheck all workspaces, lint accessibility/composition rules, check formatting, run Vitest, then build and verify artifacts. Vitest has a DOM project for Vue tests and a Node project for controller/contracts tests. Controller-command tests cover extraction and failure responses; Vue interaction tests cover preview states, rendering, retry, and message validation.

Use the controller command boundary with a simulated Figma environment for integration tests and focused user-facing Vue tests. Acceptance still requires actual Figma desktop and browser checks.
