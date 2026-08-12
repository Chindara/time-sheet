# Change: Scope time entries to their project

## Why

Time entries are stored in the extension's **account-wide** default scope, and `TimeEntry` carries no project field. Every project in the organization therefore shares one flat collection with nothing to tell entries apart. Two reports read that collection unfiltered, so both show other projects' data:

- the project Time Sheet hub, which is presented as a report on the selected project
- **My Timesheet** on the work item tab, which shows the user's entries from every project in the organization

This is a data-exposure defect, not only a usability one: hours, work item ids and contributor names from projects the viewer may have no interest in — or no business seeing grouped this way — appear in a report labelled with a different project's name. The comment in `DataService` describing the storage as "project collection scope" was wrong and helped the bug survive review.

Only "This work item" was unaffected, because work item ids are unique per organization.

## What Changes

- **BREAKING** (data model): add optional `projectId` and `projectName` to `TimeEntry`, stamped from the current project when an entry is created.
- Add `DataService.setProjectContext()`; both entry points supply it during initialization.
- Add `System.TeamProject` to the fields fetched by `WorkItemMetadataService`, and expose it on `WorkItemMeta`.
- Stop scoping `getWorkItems` to the current project, so work items belonging to other projects resolve and can be recognised as foreign rather than looking unreadable.
- Add `partitionByProject()`, which attributes each entry to a project using the work item's `System.TeamProject` first and the stored stamp as a fallback.
- Filter the project hub and My Timesheet through it.
- Disclose entries that cannot be attributed either way instead of counting or silently dropping them.
- Correct the misleading storage-scope comment in `DataService`.

## Impact

- Affected specs: `timesheet-logging`, `timesheet-reporting`
- Affected code:
  - `src/models/TimeEntry.ts` — two new optional fields
  - `src/services/DataService.ts` — project context, stamping on create, persisting and reading the fields
  - `src/services/WorkItemMetadataService.ts` — `System.TeamProject`, unscoped `getWorkItems`
  - `src/utils/projectScope.ts` — new attribution helper
  - `src/components/ProjectTimesheet/ProjectTimesheet.tsx` — attribution before every other filter
  - `src/components/TimesheetReport/TimesheetReport.tsx` — same, for My Timesheet
  - `src/TimeSheetTab.tsx` — initialize the metadata service and set project context
- **No storage migration.** Existing entries have no stamp and are attributed through their work item, which is correct retroactively and survives a work item being moved between projects. The stamp only matters when the work item cannot be read.
- Entries that are both unstamped *and* whose work item is unreadable cannot be attributed at all. They are excluded from every project's report and their count is disclosed, rather than being assigned to whichever project happens to be open.
