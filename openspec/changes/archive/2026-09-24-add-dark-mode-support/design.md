## Context

Two independent webpack entry points (`src/TimeSheetTab.tsx` for the work item form page, `src/project-timesheet.tsx` for the project hub) each render into their own Azure DevOps iframe and each call `SDK.init()` / `SDK.ready()` independently. Both already import the shared `src/styles.css`, which defines a full shadcn/ui light theme in `:root` and a complete, already-correct dark palette in `.dark { ... }` (lines 29-49) — but nothing ever adds the `dark` class, so it has been dead code since it was added.

`azure-devops-extension-sdk` defaults `SDK.init()` to `applyTheme: true`, which injects the host's own theme variables (`--background-color`, `--text-primary-color`, etc. — Azure DevOps' own naming, unrelated to the shadcn variable names this app uses) into `:root` via an injected `<style>` tag, and dispatches a `window` `"themeApplied"` CustomEvent with the raw theme variable dictionary as `event.detail`. The SDK also listens for a host-pushed `"themeChanged"` event and re-runs `applyTheme` (which re-dispatches `"themeApplied"`) whenever the host theme changes live, so an extension iframe already open does not need to reload to pick up a new host theme.

A prior audit of the component layer (`src/components/**`) found no hardcoded `bg-white` / `text-gray-*` / raw hex colors — components already consume the shadcn CSS variables via Tailwind semantic classes (`bg-card`, `text-popover-foreground`, `border`, etc.) or `stroke="currentColor"` in charts. This significantly narrows the actual gap to: (1) toggling the `dark` class based on the host theme, and (2) the small number of genuinely hardcoded colors in `src/styles.css`'s `.activity-*` badge rules.

## Goals / Non-Goals

- Goals
  - The extension's own light/dark rendering matches whatever theme the user has active in Azure DevOps, automatically, with no extra click.
  - Theme changes made while the extension is already open (e.g. switched in another tab) are picked up live.
  - Both entry points behave identically and share one implementation.
  - Existing light-mode rendering is pixel-identical to today when the host theme is light.
- Non-Goals
  - A manual override toggle stored per-user — out of scope per product decision; the extension always mirrors the host.
  - A dedicated high-contrast theme — any host theme is bucketed into light or dark by luminance.
  - Re-architecting the CSS variable system itself; it already works and just needs to be turned on.

## Decisions

- **Decision: classify light vs. dark by the luminance of the host's applied background color, not by theme name.**
  Azure DevOps theme names are not part of the SDK's public contract and have changed over time (e.g. legacy "dark"/"darkteal" variants). Reading the numeric background color the host actually applied and computing relative luminance against a fixed threshold is robust to any current or future host theme without a name allowlist.
  Alternative considered: matching `SDK.getPageContext().globalization.theme` against a known-dark string list — rejected because it requires maintaining that list and doesn't naturally extend to unnamed/custom host themes.

- **Decision: derive the decision from the SDK's own `"themeApplied"` event, not a separate DOM/computed-style read.**
  `SDK.applyTheme()` (invoked internally by the SDK on init and again on every host `"themeChanged"`) dispatches `window` `"themeApplied"` with the exact theme variable dictionary it just wrote to `:root`, keyed by variable name without the `--` prefix (e.g. `background-color`). Reading `event.detail["background-color"]` (falling back to `document.body`'s computed `color` well only if that key is ever absent) avoids a second theme lookup mechanism and stays in sync with whatever the SDK just applied.

- **Decision: one shared utility, `src/utils/hostTheme.ts`, exporting `watchHostTheme(): void`, called once from each entry point after `SDK.ready()`.**
  It attaches the `"themeApplied"` listener (which also fires once synchronously right after `SDK.init()` completes, covering the initial load) and toggles `document.documentElement.classList` between adding/removing `dark`. Each entry point owns its own `document`, so each must call it — there is no way to share the call itself across bundles, only the logic.

- **Decision: fix `.activity-*` badge colors by giving them a `.dark` override block in `src/styles.css`, following the exact pattern already used for the shadcn tokens (lines 29-49), rather than converting them to inline chart-palette hex.**
  This is the smallest change that keeps the existing `activity-badge activity-development` etc. class-based usage in components untouched while making the colors theme-aware.

- **Decision: treat the recharts categorical palette (`src/utils/palette.ts`) as adequate until proven otherwise.**
  Its ten hues were deliberately chosen at a shared, moderately saturated lightness (per the file's own doc comment) specifically so one color reads consistently everywhere; spot-checking a few against both the light `--card` and dark `--card` background luminance is a verification task, not an assumed rewrite. Chart chrome (`CartesianGrid stroke="currentColor"`, tooltip using `bg-popover`/`text-popover-foreground`) already tracks the CSS variables and needs no change.

## Risks / Trade-offs

- **Luminance threshold is a heuristic.** An unusual custom host theme with mid-gray background could be classified either way. → Acceptable: Azure DevOps ships only light and dark today; document the threshold choice in code so it's easy to revisit.
- **`"themeApplied"` fires before React has mounted on very first load** (it's dispatched as part of the `SDK.init()` handshake, which both entry points already `await` before rendering). → Not a race: `watchHostTheme()` is called after `await SDK.ready()`, and toggling a class on `document.documentElement` is safe to do before or after the React tree mounts since Tailwind's dark selector is purely CSS-driven.
- **Two entry points, two listeners.** Each iframe gets its own `"themeApplied"` subscription; if a user has both the work item tab and the hub open simultaneously and changes theme, both update independently. No shared state is needed since each iframe re-derives its own class from the event it receives.

## Migration Plan
None. Purely additive: when the host theme is light (today's default for essentially all existing users), rendering is unchanged. No data migration, no config flag needed since detection is automatic.

## Open Questions
None outstanding — theme trigger (auto-detect only) and scope (light/dark only, no high-contrast) were confirmed with the requester before this proposal was written.
