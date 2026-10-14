# New collection verification

Verified on 2026-10-14 for issue #3.

## Automated

Controller-command tests simulate 45 unique source layers, exact RGB floats, paint alpha, slash hierarchy, name preservation, unchanged sources, collection collisions, invalid names, duplicate paths, empty batches, stale selection/source data, concurrent/completed submissions, allocation failures, value failures, cleanup failure, and retained empty collections.

Vue interaction tests exercise editable destinations, stale review responses, disabled invalid submissions, one submission per batch, full paths, results, errors, and keyboard focus across result/new-batch transitions. Existing preview tests remain in place.

## Figma desktop

Used a separate draft, [Color Frames — verification](https://www.figma.com/design/pLu73alrN98XOFm6z3QI3A/), to avoid writing test variables into the original palette file.

- Created a test rectangle named `Brand/100`, fill `#D9D9D9` at 40% paint alpha and 20% layer opacity.
- Plugin preview showed `#D9D9D966`, full path `Brand/100`, and the layer-opacity exclusion notice.
- Confirmed Create: results and Figma toast both showed `1 created · 0 failed · 0 unsupported`.
- Native Variables view showed collection `Colors`, group `Brand`, variable `100`, color `D9D9D9`, and **40%** opacity.
- Start new batch retained the selection and blocked `Colors` with an existing-collection-name error.

The 45-item write and simulated failure cases are automated coverage; they have not yet been repeated manually in Figma. Browser-host verification remains outstanding.

## API references

Uses the collection-object form of [createVariable](https://developers.figma.com/docs/plugins/api/properties/figma-variables-createvariable/) and writes the original RGBA value into the [collection's default mode](https://developers.figma.com/docs/plugins/api/VariableCollection/), following [Working with Variables](https://developers.figma.com/docs/plugins/working-with-variables/).
