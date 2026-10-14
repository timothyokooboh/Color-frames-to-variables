## Technology stack

Build the Figma plugin interface with Vue 3 and TypeScript.

## Architecture and composition

- Before adding modules, read `docs/architecture.md` for workspace boundaries and component responsibilities.
- Use the installed Vue best-practices skill for Vue work and the Pinia/testing skills when applicable.
- Use Composition API with `<script setup lang="ts">`. Keep root components as composition surfaces.
- Give each component one responsibility. Extract independent sections and repeated UI into children; move stateful behavior and side effects into focused composables.
- Prefer typed props down and events up, with slots for layout composition. Keep pure calculations in plain TypeScript functions.
- Treat ESLint component size limits as ceilings, not targets. Split by responsibility before reaching them; do not disable limits to accommodate large components.
- Use Pinia setup stores for shared feature state, local state for local concerns, and computed values for derivations. Keep Figma nodes and API calls in the controller.
- Use semantic HTML and accessible primitives; verify labels, focus, keyboard behavior, and contrast as each feature is built.
- Run `pnpm check` before handing off implementation changes.

## Agent skills

### Issue tracker

Use GitHub Issues. Before working with issues or specs, read
`docs/agents/issue-tracker.md`.

### Triage labels

Use the default five triage labels. Before triaging issues, read
`docs/agents/triage-labels.md`.

### Domain docs

Use a single-context layout. Before exploring the codebase, read
`docs/agents/domain.md`.
