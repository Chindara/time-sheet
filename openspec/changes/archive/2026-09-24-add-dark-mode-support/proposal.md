# Change: Add dark mode support driven by the Azure DevOps host theme

## Why
The WorkItem tab and the Time Sheet hub always render in a fixed light theme, even when a user's Azure DevOps profile is set to the Dark theme. Because both surfaces are embedded directly inside Azure DevOps pages, a light-only extension next to a dark host reads as broken. The shadcn/Tailwind theme system already ships a complete dark color palette (`src/styles.css`, the `.dark { ... }` block) and `tailwind.config.js` already has `darkMode: ["class"]` configured — this was explicitly prepared for in the `2026-02-10-migrate-to-shadcn-ui` change (Requirement "UI-008: Dark Mode Preparation") but never wired up. Nothing in the app currently adds or removes the `dark` class, so that palette is dead code.

## What Changes
- Detect the Azure DevOps host's active theme automatically (no manual in-app toggle) using the `azure-devops-extension-sdk` theme events, and toggle Tailwind's `dark` class accordingly on both entry points.
- React to live theme changes pushed by the host while the extension is open, not just the theme at initial load.
- Classify any host theme as light or dark by the luminance of the host's applied background color, rather than matching a fixed list of theme names — no separate high-contrast handling for now.
- Fix the remaining hardcoded (non-variable) colors that would otherwise stay wrong in dark mode: the `.activity-*` badge classes in `src/styles.css`.
- Audit the categorical chart palette (`src/utils/palette.ts`) and chart chrome (grid lines, tooltips, axes) for adequate contrast against both the light and dark card backgrounds; adjust only if a concrete contrast problem is found.

## Out of Scope
- A manual light/dark toggle in the UI — the extension always follows the host.
- A distinct high-contrast theme variant.
- Re-theming colors that already resolve through the existing shadcn CSS variables or `currentColor` (most components already do this correctly).

## Impact
- Affected specs: `ui-theming` (new capability)
- Affected code:
  - `src/TimeSheetTab.tsx`, `src/project-timesheet.tsx` — call theme detection after `SDK.ready()`
  - New `src/utils/hostTheme.ts` — shared theme-detection/toggle utility used by both entry points
  - `src/styles.css` — fix hardcoded `.activity-*` badge colors (lines ~78-132)
  - `src/utils/palette.ts` and chart components (`DailyHoursChart.tsx`, `ActivityDonutChart.tsx`, `ContributorBars.tsx`, `BreakdownTable.tsx`) — only if the audit finds a real contrast issue
