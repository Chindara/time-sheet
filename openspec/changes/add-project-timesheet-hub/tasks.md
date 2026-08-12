# Tasks: Add a project-level Time Sheet hub

## 1. Prerequisites

- [x] 1.1 Fix `documentToTimeEntry` in `src/services/DataService.ts:467` to map `startTime` and `endTime` off the stored document — they are written but never read back, so every loaded entry has them `undefined`
- [x] 1.2 Create `src/utils/aggregate.ts` with pure helpers: `totalHours`, `groupBy<K>`, `hoursByUser`, `hoursByActivity`, `hoursByDate`, `hoursByWorkItem`
- [x] 1.3 Repoint `TimesheetReport.tsx` and `DataService.groupBy*` at the shared helpers and delete the duplicated inline math
- [x] 1.4 Remove the four `console.log` calls in `TimesheetReport.tsx:73-76`

## 2. Extension manifest and build

- [x] 2.1 Add a `ms.vss-web.hub` contribution to `vss-extension.json` with id `project-timesheet-hub`, target `ms.vss-work-web.work-hub-group`, name "Time Sheet", `uri: dist/project-timesheet.html`, and an `order` past Queries
- [x] 2.2 Add `project-timesheet: './src/project-timesheet.tsx'` to the `entry` map in `webpack.config.js`
- [x] 2.3 Add a second `HtmlWebpackPlugin` for `project-timesheet.html` with `chunks: ['project-timesheet']`
- [x] 2.4 Create `src/project-timesheet.html` mirroring `src/timesheet-tab.html`
- [x] 2.5 Bump `version` in `vss-extension.json` and verify `npm run build` emits both bundles and both HTML files

## 3. Data access

- [x] 3.1 Add `DataService.getAllProjectTimeEntries(startDate, endDate)` — `queryTimeEntries` with no `userId` filter
- [x] 3.2 Create `src/services/WorkItemMetadataService.ts` using `getClient(WorkItemTrackingRestClient)`
- [x] 3.3 Implement `getMetadata(ids: number[])` batching at 200 ids per request, requesting `System.Title`, `System.WorkItemType`, `System.State`, `System.Parent`, `Microsoft.VSTS.Scheduling.OriginalEstimate`
- [x] 3.4 Implement ancestor resolution: walk `System.Parent` up to 3 levels, stopping at the first `Feature` or `Epic`
- [x] 3.5 Memoise metadata per page load; return a `Map<number, WorkItemMeta>` with misses left absent
- [x] 3.6 Roll entries whose work item is absent from the response into a single "Restricted" group carrying hours only

## 4. Hub UI

- [x] 4.1 Create `src/project-timesheet.tsx` — `SDK.init()`, `SDK.ready()`, `createRoot`, error fallback, mirroring `TimeSheetTab.tsx:261`
- [x] 4.2 Create `ProjectTimesheet.tsx` container owning entries, metadata, filters, and loading/error state
- [x] 4.3 Build the filter row: date range presets (All time, This Month, Last Month, This Quarter, Custom), contributor multi-select, activity type multi-select, area path
- [x] 4.11 Load the collection once and filter dates client-side; default to All time, and make the empty state distinguish "nothing in this range" (with an out-of-range count and a Show all time action) from "nothing logged yet"
- [x] 4.4 Build the KPI row: total hours, contributor count, hours per working day with sparkline, logged vs. original estimate
- [x] 4.5 Build the breakdown as a flat summary table — one row per group (feature id, title, closed-of-total count, contributor count, activity mix strip, hours, share) plus a closing total row; no expansion
- [x] 4.6 Build the group-by switch (Feature / Work item / Contributor / Activity) driving the same breakdown component
- [x] 4.7 Build the activity donut plus its hours/share table (the table is required relief — three activity colours fall below 3:1 on a light surface)
- [x] 4.8 Build the hours-by-contributor bar list
- [x] 4.9 Build the hours-per-day bar chart with hover values
- [x] 4.10 Add loading skeleton, empty state, and a refresh action; summary renders as soon as entries load, work item titles fill in on the second pass

## 5. Export

- [x] 5.1 Add Work Item Title, Feature, Start Time, and End Time columns to `ExportService.exportToCSV`
- [x] 5.2 Wire the hub's Export CSV button to the current filtered set with a filename carrying project and date range
- [x] 5.3 Include the project summary block (totals, by activity, by contributor) at the top of the hub export

## 6. Validation

Done locally:

- [x] 6.0 `npx tsc --noEmit` clean; `npm run build` emits `timesheet-tab.js` + `timesheet-tab.html` and `project-timesheet.js` + `project-timesheet.html`, each HTML referencing only its own chunk
- [x] 6.1 Aggregation logic checked against a fixture covering feature rollup, unparented items, a permission-trimmed item, all four groupings, estimate roll-up and working-day edge cases — 35 assertions, all passing (shares sum to 100%, group hours sum to the project total, restricted rows disclose no contributors or activity mix)

Needs a real Azure DevOps project — cannot be verified from the repo:

- [ ] 6.2 Verify the hub appears under Boards in the left menu after installing the packaged extension
- [ ] 6.3 Verify entries logged by a second user appear in the hub for the first user
- [ ] 6.4 Verify a user without read access to a work item sees its hours in the Restricted group and no title
- [ ] 6.5 Verify feature grouping for a Task whose parent is a User Story under a Feature
- [ ] 6.6 Verify totals in the hub match the sum of the work-item tab totals for the same range
- [ ] 6.7 Verify entries without `startTime`/`endTime` still render, and that entries saved after task 1.1 show their range
- [ ] 6.8 Verify the work-item tab still behaves unchanged at runtime
