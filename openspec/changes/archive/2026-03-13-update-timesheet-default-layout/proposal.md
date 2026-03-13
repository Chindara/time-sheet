# Change: Update Timesheet Default Layout to Two-Column View with Donut Chart

## Why
The current Time Sheet tab defaults to a work-item-scoped entry list, requiring an extra click to reach the user's full "My Timesheet" view. Surfacing "My Timesheet" as the default and restructuring it into a two-column layout with a donut chart gives users immediate access to their time data and an at-a-glance activity breakdown.

## What Changes
- The Time Sheet tab SHALL open with the "My Timesheet" view as the default (instead of the work-item entry list).
- The "My Timesheet" view SHALL use a two-column layout at a 2:1 ratio.
- Column 1 (wider): time entries list rendered as compact rows.
- Column 2 (narrower): summary box, with a donut chart (time by activity type) positioned at the top.
- A lightweight chart library (recharts) SHALL be added as a dependency to power the donut chart.
- The visual chart requirement in the existing spec is promoted from SHOULD to SHALL and narrowed to a donut chart.

## Impact
- Affected specs: `timesheet-reporting`, `timesheet-logging`
- Affected code:
  - `src/TimeSheetTab.tsx` — change default view state
  - `src/components/TimesheetReport/TimesheetReport.tsx` — two-column layout, donut chart
  - `src/components/TimeEntryList/TimeEntryList.tsx` — compact row variant
  - `package.json` — add recharts dependency
