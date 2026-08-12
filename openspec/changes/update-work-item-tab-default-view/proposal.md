# Change: Open the work item Time Sheet tab on the work item's own entries

## Why

Opening the Time Sheet tab on a work item shows every entry the user has logged across the whole project, grouped by work item. Users read the tab as being about the work item in front of them, so an unfiltered list reads as a filtering bug rather than a deliberate overview. The project-wide view now has its own home in the Boards Time Sheet hub, so the tab no longer needs to carry that job.

A second, plainer defect motivated this: the switch to the work-item-scoped list required by `specs/timesheet-reporting/spec.md` was never rendered. `TimeEntryList` was imported in `src/TimeSheetTab.tsx` but never used, and the `showReport` state that would have driven it was written but never read — so there was no way to reach the work item's own entries at all.

## What Changes

- **BREAKING** (user-visible default): the work item Time Sheet tab SHALL open on the entries logged against that work item, not on My Timesheet.
- Add the missing scope switch to the tab header, offering both directions: "This work item" and "My Timesheet".
- Header summary reflects the active scope — entry count and hours for the work item, total hours when viewing My Timesheet.
- Remove the unreachable duplicate `ActivityType.Deployment` case in the badge-variant switch in `TimeEntryList`.

## Impact

- Affected specs: `timesheet-reporting`
- Affected code:
  - `src/TimeSheetTab.tsx` — render `TimeEntryList`, add the scope switch, default `showReport` to `false`
  - `src/components/TimeEntryList/TimeEntryList.tsx` — drop the unreachable duplicate case
- Reverses the default-view part of `changes/archive/2026-03-13-update-timesheet-default-layout`. The two-column My Timesheet layout that change introduced is unaffected and stays as-is.
- No data or storage change; both views read the same collection.
