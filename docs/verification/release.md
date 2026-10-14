# Release verification — issue #8

Date: 2026-10-14. Starting implementation: `d4e3766`. **Release gate remains open; this is not a full platform acceptance sign-off.**

## Evidence levels

- Automated: simulated-host controller commands and focused Vue interactions. These are not real-platform proof.
- Native harness: the production controller invoked against real Figma nodes/variables in a disposable desktop file. It tests native API behavior, not production UI interactions.
- Manual desktop: the production plugin UI, actual keyboard actions, and native variable inspection.
- Browser-host: the distributed plugin running inside Figma in a supported browser, not Vite or a browser rendering the UI alone.

## Reproduce native acceptance

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm check
corepack pnpm acceptance:build
```

Create an empty disposable Figma Design file. Import `dist/acceptance/manifest.json` through desktop Plugins → Development → Import plugin from manifest. Run **Color Palette — Native acceptance (empty file only)**. It refuses nonempty current pages or files with local collections. It creates fixtures, runs command-boundary checks, and keeps the fixtures for inspection. It removes only its own temporary collection in the deleted-destination scenario. Never publish this harness or run it in a working design file. Production builds do not import it.

Read the PASS/FAIL report in the harness panel or development console. Timing includes fixture setup, lookup, and writes; it is not a UI frame-rate benchmark. Use a new disposable file for each run. Starter team-file limits can require a personal Drafts file.

## Current desktop observations

Environment: macOS Figma desktop, signed-in Starter team (the plan-limit dialog explicitly identified Starter). Disposable file: [acceptance fixtures](https://www.figma.com/design/BesaxZ70RO4MBXGt0HTvzp/). Original user palette was not modified.

- Native harness ran through the 100-swatch fixture and produced real local collections/variables. The mixed-count toast was observed: **40 created · 0 failed · 3 updated · 2 excluded · 0 unsupported**.
- The production plugin then displayed **100 eligible · 0 skipped**. Keyboard Tab navigation reached include controls with a visible focus ring and scrolled the focused row into view.
- Production Create 100 variables completed with **100 created · 0 updated · 0 failed · 0 excluded · 0 unsupported**. The Figma toast matched completed writes; focus moved to the results heading. No perceptible stall occurred in this interaction; no frame-time measurement was captured.
- The harness report was replaced by the production plugin before it was captured. Do not count individual harness assertions as passed without the report. A repeat run was interrupted by a stuck native location menu in the automation interface.
- Earlier desktop checks are recorded in [new collection](new-collection.md), [existing collections](preview-and-existing-collections.md), and [overwrite/recovery](overwrite-and-recovery.md). They remain supporting evidence, not proof of all fifteen complete UI scenarios.

## Original PRD acceptance matrix

All fifteen cases have executable native command scenarios in `apps/plugin/src/acceptance/scenarios.ts`. The full original PRD is user supplied; expected behavior below incorporates the later agreed Colors exception and HEX-only presentation.

| #   | Scenario                               | Desktop evidence / remaining check                                                         | Browser              |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------- |
| 1   | 45 exact names and paint values        | Harness prepared/executed; capture assertion report and inspect native 45-count collection | Pending distribution |
| 2   | `Brand 100` unchanged                  | Automated + harness; report recapture pending                                              | Pending              |
| 3   | Slash hierarchy                        | Prior native Brand/100 inspection; multi-group harness report pending                      | Pending              |
| 4   | Primitives gets Colors/Brand/100       | Prior desktop verified; harness report pending                                             | Pending              |
| 5   | Explicit existing conflict actions     | Prior desktop overwrite/comparison verified; complete skip/rename UI pass pending          | Pending              |
| 6   | Duplicate sources require resolution   | Automated + native harness; report pending                                                 | Pending              |
| 7   | 40 created / 3 updated / 2 excluded    | Actual native toast observed; full production UI version of mixed batch pending            | Pending              |
| 8   | Unsupported fills explained            | Automated + native harness; report pending                                                 | Pending              |
| 9   | Unrelated existing variables preserved | Prior native preservation + harness; report and multi-mode native check pending            | Pending              |
| 10  | Paint alpha 0.4 excludes layer opacity | Prior native verified; harness report pending                                              | Pending              |
| 11  | Empty slash segment blocked            | Automated + native harness; report pending                                                 | Pending              |
| 12  | Deleted destination stops writes       | Automated + native harness; report pending                                                 | Pending              |
| 13  | Partial result retains success/error   | Prior real API failure/correction verified; mixed success harness report pending           | Pending              |
| 14  | Repeated submission blocked            | Automated + native harness; report pending                                                 | Pending              |
| 15  | New collection name collision          | Prior desktop collision verified; harness report pending                                   | Pending              |

## Accessibility and edge cases

Automated suites cover empty/unsupported selection, hidden layers/fills, paint transparency and float fidelity, unchanged sources, duplicates, invalid names, incompatible types, destination prefixes, stale sources/targets/aliases, submission locks, allocation cleanup failures, retained empty collections, corrections, and failed-only recovery. Native verification of every edge remains a release gate.

Manual desktop evidence includes visible keyboard focus on the 100-row list, result-heading focus, and prior recovery-focus checks. Accessibility-tree output exposes the collection label, include checkboxes, variable name inputs, and buttons. A full keyboard-only workflow, screen-reader announcements, light-theme rendering, high zoom, and delayed loading/error states still require an end-to-end pass.

Calculated opaque token contrast (WCAG relative luminance): light normal text 17.93:1, muted/card 7.44:1, primary text 6.29:1, error/card 6.16:1; dark normal/card 12.36:1, muted/card 6.42:1, primary text 8.02:1, error/card 6.80:1, input border/card 3.10:1, focus ring/card 6.47:1. These sample token calculations do not certify WCAG conformance or all Figma theme overrides, opacity states, and rendered combinations.

## Privacy, packaging, and account compatibility

Source inspection found no production fetch/XHR/WebSocket/beacon, analytics, auth flow, clientStorage/localStorage/sessionStorage, or plugin-data writes. The production manifest denies network access; build verification checks embedded UI JS/CSS and standalone sandbox output. No backend or external design-data store exists. This is source/manifest evidence, not a browser network trace. Figma’s own document sync is outside the plugin.

The manifest uses `api: 1.0.0`, `editorType: ["figma"]`, `documentAccess: "dynamic-page"`, and `allowedDomains: ["none"]`, with supported asynchronous local variable lookup and collection-object creation. Pinned `@figma/plugin-typings` is 1.141.0. Compilation validates typing compatibility; native runs validate the operations exercised. Starter local creation and update worked; extra-mode capability is not claimed.

## Remaining release gates

1. Capture a complete native harness report and finish production UI acceptance for all fifteen cases and edge cases.
2. Obtain a distributed owner build and repeat the full matrix in Figma browser. Local desktop import cannot establish browser compatibility.
3. Complete keyboard-only, screen-reader, light/dark and zoom checks, plus a measured 100-item UI responsiveness pass.
4. Record native multi-mode preservation on an account supporting additional modes; simulated tests currently cover it.
5. Owner registration, final listing/assets approval and Community submission. See [submission package](../release/community.md).

Keep issue #8 open until these gates have evidence. Do not use an auto-closing PR reference for preparation-only changes.
