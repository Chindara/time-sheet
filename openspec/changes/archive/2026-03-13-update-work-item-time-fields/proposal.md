# Change: Update Work Item Time Fields on Time Entry

## Why
When users log, edit, or delete time entries, the Azure DevOps work item's built-in scheduling fields (`Completed Work` and `Remaining Work`) remain out of sync. This means managers and team members cannot rely on the native work item fields to reflect actual progress.

## What Changes
- After any time entry create, update, or delete, the extension SHALL write back to the work item's `Microsoft.VSTS.Scheduling.CompletedWork` and `Microsoft.VSTS.Scheduling.RemainingWork` fields.
- `Completed Work` = sum of all logged hours for the work item (across all users).
- `Remaining Work` = `Original Estimate` − `Completed Work` (floored at 0).
- If `Original Estimate` is not set or is zero, `Remaining Work` is set to `0`.
- `WorkItemService` gains a `setFieldValues` method to write field values back to the work item form.
- Field sync errors are non-blocking: a warning is shown but the time entry operation itself succeeds.

## Impact
- Affected specs: `timesheet-logging`, `work-item-field-sync` (new)
- Affected code: `src/services/WorkItemService.ts`, `src/services/DataService.ts`, `src/TimeSheetTab.tsx`
