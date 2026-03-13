# Design: Update Timesheet Default Layout

## Context
The Time Sheet tab currently defaults to the work-item-scoped entry list (`TimeEntryList`). The "My Timesheet" (`TimesheetReport`) is a secondary view gated behind a button click. Users primarily want their full timesheet overview, so this change inverts the default.

The layout change introduces a two-column split inside `TimesheetReport`, and a donut chart requires a charting library not currently in the project.

## Goals / Non-Goals
- **Goals:**
  - My Timesheet is the first thing users see on the Time Sheet tab.
  - Two-column layout (2:1) with compact entry list and summary/chart.
  - Donut chart shows time breakdown by activity type.
- **Non-Goals:**
  - Changing data fetching or storage logic.
  - Adding team-level or project-level reports (out of scope for this change).
  - Interactive chart filtering (nice-to-have, deferred).

## Decisions

### Chart Library: recharts
- **Decision:** Add `recharts` as a runtime dependency.
- **Alternatives considered:**
  - `chart.js` + `react-chartjs-2` — larger bundle, more configuration.
  - Hand-rolled SVG — sufficient for a static donut, but poor maintainability.
  - `victory` — similar size to recharts, less community adoption in Azure DevOps extensions.
- **Rationale:** recharts is composable, React-native, tree-shakeable, and widely used; its `PieChart` with `innerRadius` produces a donut with minimal setup.

### Default View Strategy
- **Decision:** Change `showReport` initial state in `TimeSheetTab.tsx` from `false` to `true`.
- **Alternative:** Introduce a separate route or tab. Rejected — the existing state machine is sufficient and routing adds complexity.
- A "Back" or "Work Item Entries" link/button should remain available so users can still access the per-work-item view.

### Compact Row Design
- **Decision:** Add a `compact` boolean prop to `TimeEntryList` (or create an inline compact variant inside `TimesheetReport`).
- Compact rows collapse description to a single truncated line; edit/delete actions are icon-only.

## Risks / Trade-offs
- Adding recharts (~150 KB minified) increases the extension bundle. Acceptable given the extension already uses React 19.
- Making My Timesheet the default means the per-work-item view is one click away instead of zero — communicate the "Work Item" button clearly in the UI.

## Open Questions
- Should the "work item entries" view be completely removed from the default or just demoted to a secondary tab/button? (Current proposal: keep it accessible via a button, as today.)
- Should the donut chart legend show hours or percentages? (Proposal: both — percentage in legend, hours in tooltip.)
