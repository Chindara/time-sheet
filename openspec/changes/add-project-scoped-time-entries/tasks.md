# Tasks: Scope time entries to their project

## 1. Data model

- [x] 1.1 Add optional `projectId` and `projectName` to `TimeEntry` in `src/models/TimeEntry.ts`
- [x] 1.2 Add `DataService.setProjectContext({ id, name })`
- [x] 1.3 Stamp both fields in `createTimeEntry`
- [x] 1.4 Persist and read them in the create document, update document and `documentToTimeEntry`
- [x] 1.5 Correct the comment describing the storage scope — it is account-wide, not project-collection

## 2. Attribution

- [x] 2.1 Add `System.TeamProject` to `FIELDS` in `WorkItemMetadataService` and surface it as `WorkItemMeta.projectName`
- [x] 2.2 Expose `getProjectId()` alongside `getProjectName()`
- [x] 2.3 Stop passing the project to `getWorkItems`, so foreign work items resolve and are distinguishable from unreadable ones
- [x] 2.4 Create `src/utils/projectScope.ts` with `partitionByProject()` returning `inProject` / `otherProject` / `unattributed`
- [x] 2.5 Prefer the work item's `System.TeamProject`; fall back to the stored stamp only when the work item is unreadable

## 3. Apply to the reports

- [x] 3.1 In the hub, pre-filter to candidate entries by stamp, resolve metadata for those, then partition before any other filter
- [x] 3.2 Base the date range, filter options and empty states on the project's entries rather than the whole collection
- [x] 3.3 Hold the report behind the loading state until attribution has settled once
- [x] 3.4 Disclose the count of unattributable entries in the hub
- [x] 3.5 Apply the same attribution to My Timesheet in `TimesheetReport`
- [x] 3.6 Initialize `workItemMetadataService` and set project context in `TimeSheetTab`

## 4. Work item lookup robustness

- [x] 4.0a Send `errorPolicy` as the enum's name — the generated client passes the numeric value straight through as a query param and the API rejects `errorPolicy=2`
- [x] 4.0b Stop requesting a `fields` list; use `$expand=All` instead, because `System.Parent` is not a requestable field on every API version and asking for it 400s the whole batch
- [x] 4.0c Read the parent from the `System.LinkTypes.Hierarchy-Reverse` relation, falling back to `System.Parent` when present
- [x] 4.0d Bisect a failing chunk so one unreadable id costs that id, not every id beside it
- [x] 4.0e Record the last request error and surface it in the hub — a total lookup failure previously rendered as per-row "no read access", which is a different problem entirely
- [x] 4.0f Label restricted rows "details unavailable" rather than "no read access" when the cause was a failed lookup

## 5. Validation

Done locally:

- [x] 4.1 `npx tsc --noEmit` clean; `npm run build` succeeds
- [x] 5.3 14 assertions over `parentIdOf`: numeric and string `System.Parent`, hierarchy relation parsing, field winning over relation, forward child links not mistaken for parents, unparseable and zero ids rejected
- [x] 4.2 19 assertions over `partitionByProject`: metadata authority, moved work item beating a stale stamp, stamp fallback for unreadable work items, foreign stamps excluded, unattributable entries excluded from *both* projects, blank `System.TeamProject` falling through to the stamp, and every entry landing in exactly one bucket

Needs a real Azure DevOps organization with two or more projects:

- [ ] 4.3 Verify the hub in project A shows no entries from project B
- [ ] 4.4 Verify My Timesheet in project A shows none of the user's project B entries
- [ ] 4.5 Verify a newly logged entry carries `projectId` and `projectName` in storage
- [ ] 4.6 Verify entries logged before this change still appear in their own project's hub
- [ ] 4.7 Verify moving a work item to another project moves its logged hours with it
- [ ] 4.8 Verify the exclusion notice appears when an entry's work item has been deleted
