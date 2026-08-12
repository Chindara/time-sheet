# Change: Add a project-level Time Sheet hub to the Boards navigation

## Why

Time entries can only be seen from inside a single work item's Time Sheet tab, and the report there is scoped to the current user. Nobody can answer "how much time went into this feature?" or "what did the team log this month?" without opening every work item one at a time. The `timesheet-reporting` spec already promises team and project reports (`specs/timesheet-reporting/spec.md`), but no surface exists to deliver them.

## What Changes

- Add a **"Time Sheet"** hub to the project's left navigation, inside the Boards hub group alongside Queries, via a new `ms.vss-web.hub` contribution.
- Add a second webpack entry point (`project-timesheet.tsx` / `project-timesheet.html`) so the hub ships independently of the work-item tab.
- Add a project-scoped report that aggregates **all** time entries from **all** users: totals, hours per contributor, hours per activity type, hours per day, and a flat summary table of hours per parent Feature.
- Add filters for date range, contributor, activity type, and area path, plus a group-by switch (Feature / Work item / Contributor / Activity).
- Resolve work item metadata (title, type, state, parent Feature, original estimate) through the Work Item Tracking REST client, since `IWorkItemFormService` is only available inside a work item form.
- Extend CSV export with Work Item Title, Feature, and Start/End Time columns and reuse it for the project report.
- Extract the aggregation helpers currently inlined in `TimesheetReport.tsx` into a shared module so both reports compute totals the same way.

## Impact

- Affected specs: `timesheet-reporting`
- Affected code:
  - `vss-extension.json` — new `ms.vss-web.hub` contribution, `dist/project-timesheet.html` file entry
  - `webpack.config.js` — second entry point and `HtmlWebpackPlugin` instance
  - `src/project-timesheet.tsx`, `src/project-timesheet.html` — new hub entry point
  - `src/components/ProjectTimesheet/**` — new hub components
  - `src/services/DataService.ts` — cross-user query, plus the `documentToTimeEntry` start/end time mapping fix this report depends on
  - `src/services/WorkItemMetadataService.ts` — new REST-based metadata lookup
  - `src/services/ExportService.ts` — additional columns
  - `src/utils/aggregate.ts` — new shared aggregation helpers
- No storage migration: entries are already written at the default (project collection) scope, so they are readable across users as-is.
