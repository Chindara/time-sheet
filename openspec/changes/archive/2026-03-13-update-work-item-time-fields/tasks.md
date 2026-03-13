# Tasks: update-work-item-time-fields

## 1. WorkItemService — write-back capability
- [x] 1.1 Add `setFieldValues(fields: { [key: string]: any }): Promise<void>` to `WorkItemService`

## 2. DataService — field sync helper
- [x] 2.1 Add `syncWorkItemTimeFields(workItemId: number): Promise<boolean>` that:
  - Loads all time entries for the work item
  - Reads `Microsoft.VSTS.Scheduling.OriginalEstimate` via `WorkItemService`
  - Calculates `completedWork = sum(hours)` and `remainingWork = max(0, originalEstimate - completedWork)`
  - Writes both fields via `WorkItemService.setFieldValues`
  - Logs a warning (does not throw) on failure

## 3. Wire sync into time entry mutations
- [x] 3.1 Call `syncWorkItemTimeFields` after a successful `createTimeEntry`
- [x] 3.2 Call `syncWorkItemTimeFields` after a successful `updateTimeEntry`
- [x] 3.3 Call `syncWorkItemTimeFields` after a successful `deleteTimeEntry`

## 4. UI — non-blocking warning
- [x] 4.1 If field sync fails, surface a dismissible warning banner in `TimeSheetTab` without blocking the user

## 5. Tests / Validation
- [ ] 5.1 Unit-test `syncWorkItemTimeFields`: verify correct field values are written for standard cases (entries exist, no entries, no original estimate)
- [ ] 5.2 Verify that a sync failure does not prevent the time entry from being saved

