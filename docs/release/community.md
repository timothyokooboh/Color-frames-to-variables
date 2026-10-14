# Community submission package

Status: **submitted for Figma review on 2026-10-14**, confirmed by the owner’s submission screenshot. Approval is pending. Release gates remain in [the verification record](../verification/release.md); do not describe this build as fully verified in desktop and browser yet.

## Listing copy

**Name:** Color Palette to Variables

**Tagline:** Your palette. Your names. Native Figma variables.

**Description:**

Turn selected color swatches into native Figma color variables while keeping the names and paint values you designed.

1. Select frames or rectangles with one visible solid fill.
2. Review the colors and names, then choose a new or existing local collection.
3. Rename or exclude items, resolve conflicts, and create your variables.

Names such as `Brand 100` and `Brand/100` stay as written. New or existing collections named exactly `Colors` receive your names directly. Every other collection receives a `Colors/` prefix, without duplicating an existing leading `Colors/`.

Existing color variables change only after individual overwrite approval. Compare the existing and proposed color before deciding. Results show actual created, updated, failed, excluded, and unsupported counts. Correct and retry failed items while successful writes remain locked for the current session.

The plugin preserves paint opacity, leaves source layers unchanged, and writes only the collection’s default mode. Gradients, images, multiple visible fills, and unsupported layer types are explained and skipped. It does not scan descendants, bind variables back to source fills, or generate multiple modes.

Free and open source under MIT. No plugin account, analytics, backend, or external design-data transfer.

**Suggested tags:** color, variables, palette, design systems, productivity

**Source:** https://github.com/timothyokooboh/Color-frames-to-variables

**Support:** https://github.com/timothyokooboh/Color-frames-to-variables/issues

## Assets

- [Icon PNG](assets/icon.png): 128 × 128; [editable SVG](assets/icon.svg).
- [Cover PNG](assets/cover.png): 1920 × 1080; [editable SVG](assets/cover.svg).
- The cover is an explanatory illustration, not a fabricated application screenshot. It uses the plugin’s existing three-swatch mark. Add screenshots of the final production preview, conflict approval, and results after the remaining gates pass.
- Regenerate with `corepack pnpm release:assets`. The renderer is a pinned development dependency; it is not shipped in the plugin. The cover uses Arial from the build machine; inspect regenerated text layout on other systems.

## Owner submission steps

1. Review the remaining release gates and the asset/listing copy. Complete browser acceptance before claiming cross-host compatibility.
2. In Figma desktop, open Plugins → Development → Manage plugins in development. Choose the production plugin, not the native acceptance harness.
3. Register or select the owner’s plugin identity. The root manifest now records Figma-assigned ID `1692281770771805809`. Preserve that identity for future updates. Do not invent an ID.
4. Build from the reviewed commit with a frozen lockfile. Ensure the production manifest still points to `dist/plugin/code.js` and `dist/ui/index.html`, with `allowedDomains: ["none"]`.
5. Use Figma’s current publishing dialog to set the owner Community profile, description, source/support URLs, icon, cover, and any required contact details. The owner must accept any required legal terms themselves.
6. Submit only when the outstanding verification gates are resolved. Record the submission date, commit, plugin ID, review status, and Community URL below; the assigned ID and submission status are recorded below.
7. Install the distributed build in Figma browser and repeat the matrix. If account-level distribution is available before public submission, use it for browser checks; otherwise record the review/distribution dependency explicitly and do not claim browser acceptance prematurely.

## Submission record

| Field                | Value                                                |
| -------------------- | ---------------------------------------------------- |
| Owner                | Timothy Okooboh; Community profile selection pending |
| Submission date      | 2026-10-14                                           |
| Plugin ID            | `1692281770771805809`                                |
| Community URL        | Not available                                        |
| Review status        | Submitted; awaiting review                           |
| Browser distribution | Not available for this local development build       |

## Platform references

Checked 2026-10-14: [plugin quickstart](https://developers.figma.com/docs/plugins/plugin-quickstart-guide/) requires desktop for local plugin development; [manifest documentation](https://developers.figma.com/docs/plugins/manifest/) describes the assigned ID, dynamic page access, and network restrictions. [Figma’s publishing checklist](https://developers.figma.com/docs/plugins/publishing/) calls for testing unexpected selections and changing document state. Confirm asset requirements in the owner’s publishing dialog; [Figma’s publishing tutorial](https://help.figma.com/hc/en-us/articles/4407531267607-BYFP-Publishing-to-the-Community) points to Community frame presets and dialog dimensions.
