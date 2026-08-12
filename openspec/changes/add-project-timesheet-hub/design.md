## Context

The extension currently contributes exactly one thing: a `ms.vss-work-web.work-item-form-page` tab rendered inside a work item. Everything it knows about the surrounding work item comes from `IWorkItemFormService`, which only exists inside that form. A project-level report has neither a work item nor that service, so it needs its own contribution type, its own bundle, and a different way to look up work item metadata.

Time entries themselves are already project-wide. `DataService` calls `setDocument(COLLECTION_NAME, document)` with no `scopeType`, so documents land in the extension's default (project collection) scope rather than a per-user scope. `queryTimeEntries` then filters client-side, and the existing `userId` filter is what makes the current report user-scoped — not the storage. Dropping that filter yields every user's entries with no migration.

## Goals / Non-Goals

- Goals
  - One extra left-menu entry that opens a project-wide time report.
  - Aggregate across all users and all work items for a chosen date range.
  - Roll work items up to their parent Feature, because that is how the work is planned.
  - Respect Azure DevOps work item read permissions.
  - Reuse the existing storage, export, and aggregation code rather than forking it.
- Non-Goals
  - Editing or deleting entries from the hub (it is read-only; mutation stays on the work item tab, where the ownership check and the field write-back live).
  - Team-scoped reports and per-team filtering — area path is the filter for this change.
  - Cross-project reporting.
  - A true `.xlsx` writer; CSV stays the export format.

## Decisions

- **Decision: contribute a `ms.vss-web.hub` targeting `ms.vss-work-web.work-hub-group`.**
  That places "Time Sheet" as a sibling of Work items / Boards / Backlogs / Sprints / Queries under Boards, which is where users already go for work-item data. `order` is set past Queries so it lands last in the group.
  Alternatives considered: a top-level hub group of its own (needs `ms.vss-web.hub-group` plus a hub, adds a nav section for a single page, and pushes the extension's footprint into the main rail); the existing project Overview group (wrong mental model — this is Boards data).

- **Decision: a second webpack entry, not a shared bundle with a router.**
  `webpack.config.js` gains a `project-timesheet` entry and a second `HtmlWebpackPlugin`. The work-item tab keeps loading only what it needs; a bad hub build cannot break the tab. The two entry points share the same components, services, and Tailwind stylesheet, so the duplication is bundle-level only.

- **Decision: read work item metadata through `WorkItemTrackingRestClient`, batched.**
  `getClient(WorkItemTrackingRestClient).getWorkItems(ids, project, fields)` returns `System.Title`, `System.WorkItemType`, `System.State`, `System.Parent`, and `Microsoft.VSTS.Scheduling.OriginalEstimate`. IDs come from the distinct `workItemId` values on the loaded entries, chunked at 200 per request (the API's batch ceiling). A second batched call resolves the parent Feature titles collected from `System.Parent`. Results are memoised for the lifetime of the page.
  Alternative considered: caching the title on the time entry document at write time — cheaper to read, but titles then go stale silently and existing entries would have no title at all.

- **Decision: entries whose work item does not come back are grouped, not dropped silently.**
  The REST call is permission-trimmed, so a user who cannot read a work item gets no row for it. Those entries roll into a single "Restricted (n work items)" group showing hours only — no title, no contributor names. Hiding them entirely would make the project total disagree with the sum of the visible rows, which reads as a bug.

- **Decision: `hours` remains the only measure; `startTime`/`endTime` are display-only.**
  The hub shows time ranges where present, so `DataService.documentToTimeEntry` must start mapping `startTime`/`endTime` — today it writes both fields but never reads them back, so every entry loads with them `undefined`. That mapping fix is a prerequisite task here rather than a separate change.

- **Decision: aggregation helpers move to `src/utils/aggregate.ts`.**
  `TimesheetReport.tsx` currently builds its group-by-work-item and group-by-activity maps inline, and `DataService` carries near-duplicate `groupByActivityType` / `groupByDate` methods. The hub needs the same math plus group-by-user and group-by-feature. One module, pure functions, no SDK dependency.

## Risks / Trade-offs

- **`getDocuments` returns the whole collection, and always has.** The hub reads every entry in the project and filters in memory. At a few thousand entries this is fine; well past that, first paint suffers. → Mitigation: fetch once and filter dates client-side (see the decision below), resolve work item titles in a second pass keyed on the visible range, and treat server-side paging as a follow-up if real collections get large. The `Performance for Large Datasets` requirement in the existing spec is not fully satisfied by this change and should stay open.

- **Correction: a narrow default range does not bound the payload.** An earlier revision of this document justified defaulting to the current month on the grounds that it limited what was loaded. That was wrong — `getDocuments` has no server-side filtering, so a date range passed to `DataService` is applied in memory after the whole collection has already arrived. The narrow default therefore cost nothing at load time and hid every entry logged before the current month, making a project with history look empty. The hub now loads the collection once, defaults to All time, and filters dates client-side; range switching needs no refetch, and the empty state can distinguish "nothing in this range" from "nothing logged yet" because it knows both counts.
- **Everyone with the extension can see everyone's hours.** That is inherent to the default storage scope and is the point of a project report, but it is a visible change in what the extension exposes. → Mitigation: the hub reports hours against work items the viewer can already read; it adds no new permission and surfaces no data the REST API would refuse. Call it out in the marketplace overview.
- **Feature rollup assumes a Feature is the parent.** `System.Parent` on a Task is usually a User Story, not a Feature, in the Agile process. → Mitigation: walk up to the first ancestor whose type is in a configurable set (default `Feature`, `Epic`), and label the group by whatever ancestor is found; items with no such ancestor go under "No parent feature". Walking the tree costs one extra batched call per level, capped at three levels.
- **Second entry point doubles bundle output.** Two ~1 MB bundles instead of one. → Acceptable; they are cached separately and loaded on different pages.

## Migration Plan

None required for data — existing documents are already in the shared scope and readable by the new query. Steps: add the contribution and entry point, verify the hub renders for a non-author account, then publish. Rollback is removing the contribution from `vss-extension.json` and republishing; no stored data changes, so an older version keeps working against the same collection.

## Open Questions

- Is a current-sprint preset worth adding? It needs the Work API and a team context the hub does not otherwise require. (The default-range question is settled: All time — see the correction above.)
- Do we want a per-contributor drill-down page, or is the summary plus CSV export enough for the first release?
