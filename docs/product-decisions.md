# Product decisions

These decisions clarify the supplied Color Frames to Variables PRD. Implementation remains pending completion of the design discussion.

## Naming and destination

- For existing collections, preserve an exact leading `Colors/` prefix; otherwise prepend `Colors/`. Matching is case-sensitive.
- Rename edits affect only the proposed relative variable name. The destination prefix is handled separately, and source layers remain unchanged.
- Destination strategy determines prefixing even when the existing collection is named Colors: a new collection receives `Brand/100`, whereas an existing Colors collection receives `Colors/Brand/100`. Preview the full path explicitly.
- Empty or whitespace-only names require renaming or skipping. Preserve spaces in otherwise valid names; never silently trim or correct them.

## Selection eligibility

- An explicitly selected hidden layer remains eligible when it has exactly one visible solid fill. Show a note that the layer itself is hidden.

## Preview and revalidation

- Keep the current preview when the canvas selection changes. Show a selection-change notice with an explicit Refresh selection action rather than discarding pending edits automatically.
- If a source name, source color, or an existing target variable's value changes after preview, stop creation and show the refreshed preview for confirmation. Overwrite approval applies to the values reviewed.
- Refresh selection starts a fresh preview and discards pending renames and conflict choices. Warn before discarding those edits when present.

## Conflicts and results

- Offer Skip all conflicts as a bulk action. Require individual approval for each overwrite.
- After partial failure, retry only failed items and revalidate them first. Retain successful results and exclude successful items from retry submission.
- Allow any eligible item to be excluded using a per-item checkbox, including nonconflicting items.
- Disable creation when there are no valid, approved writes. Do not create a collection for an empty batch.
- Keep the plugin open after success with its results and a Start new batch action. A completed batch cannot be resubmitted.
- If a newly created collection receives no successful variable writes, retain it and report that it is empty. Retry against that same collection while preserving the original new-collection strategy and unprefixed paths.
- Offer Back to preview from results, alongside Retry failed when applicable and Start new batch. Keep successful items locked against resubmission while allowing failed items to be corrected.

## Interface

- Use a compact single-screen layout with the selection summary and destination controls above a scrollable preview and a fixed primary action at the bottom.
- Show conflict controls within affected rows. Replace the preview with results after processing.
