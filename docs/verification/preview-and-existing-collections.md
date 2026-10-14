# Preview refinement and existing collections verification

Verified on 2026-10-14 for issues #4 and #5.

## Automated

Controller-command coverage checks proposed-name corrections without source mutations, intentional exclusions, invalid and duplicate paths, existing COLOR and FLOAT conflicts, collection identity by ID, direct Colors paths, prefixed paths in Primitives and Design Tokens, already-prefixed names, and preservation of unrelated variables and modes. Deletion, collection renaming, default-mode changes, and new conflicts between review and submission prevent writes.

Vue interaction coverage checks default destination selection, destination changes, proposed-name editing, actual postMessage serialization, skipping every duplicate, disabled empty batches, custom collection names, selection-change notices, refresh confirmation and cancellation, result focus, and collection discovery for a new batch. Results distinguish intentional exclusions from unsupported layers.

## Figma desktop

Used the separate [Color Frames — verification draft](https://www.figma.com/design/pLu73alrN98XOFm6z3QI3A/) with a source rectangle named `Brand/100`, paint `D9D9D9` at 40% alpha and 20% layer opacity.

- The picker defaulted to `Colors (Existing)` and blocked its existing `Brand/100` variable with a conflict.
- Renaming the proposal to `Brand/200` made it ready. Refresh displayed the discard confirmation; Keep edits retained the proposed name and restored focus to Refresh selection.
- Creation added `Brand/200` directly to Colors. Native Variables showed both Brand/100 and Brand/200 with 40% alpha; the source layer remained Brand/100.
- Created a custom Primitives collection containing direct `Brand/100` as a fixture. Start new batch refreshed the dropdown and exposed that collection.
- Selecting existing Primitives proposed `Colors/Brand/100`. Creation succeeded, and native Variables showed the Colors → Brand group alongside the original direct Brand group. Both variables retained 40% alpha.
- A real postMessage failure exposed readonly Vue proxies in proposed items; outgoing items now serialize to plain objects, with a structuredClone regression assertion.

Browser-host verification and a full screen-reader audit remain outstanding. Figma displayed an offline sync notice during local verification; these checks confirm local document behavior, not cloud sync.
