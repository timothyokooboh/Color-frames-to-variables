# Overwrite and recovery verification

Verified on 2026-10-14 for issues #6 and #7.

## Automated

`corepack pnpm check` passes: all workspace typechecks, lint (including composition/accessibility rules), formatting, 33 tests across eight files, production build and offline artifact verification.

Controller tests cover 40 created / 3 updated / 2 excluded, unchanged other modes, stale target/source approvals, alias resolution and changed alias referents, failed-only retries, surviving allocations, all-failed collections, deleted sources/collections, changed artifacts, repeated retries, corrected names, and warnings for retained incomplete allocations. Vue tests cover individual approval, HEX comparisons, cleared consent after edits, failed-only previews, retained counts, and focus restoration.

## Figma desktop

Used the separate Color Frames — verification draft; the original palette was not modified.

- Approved a Colors/Brand/100 overwrite after comparing #D9D9D966 with #D9D9D93C. Result: 0 created, 1 updated, 0 failed. This changes paint alpha from 40% to 23.53%.
- Submitted the proposed name `Recovery{invalid}` to exercise an actual Figma `createVariable` failure. Result: 0 created, 1 failed with the API error visible.
- Back to preview retained the failed proposal, pinned Colors, and restored focus to Refresh selection. Corrected the name to `Recovery/Verified`; Retry reported 1 created, 0 failed, and focused the results heading.

The native Variables panel confirmed exactly three Colors variables: Brand/100 at 23.53%, untouched Brand/200 at 40%, and Recovery/Verified at 23.53%, with no duplicate allocation. Both Primitives variables remained at 40%.

Native desktop verification used a single-mode collection. Multiple-mode preservation and allocation-cleanup failures were tested with the simulated host. Browser-host and full screen-reader verification remain unperformed. Unresolvable color aliases cannot be overwritten; the designer must rename or exclude them.
