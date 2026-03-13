# Change: Auto-transition Task/Bug state based on time entry presence

## Why
When a user logs the first time entry against a Task or Bug, it signals that work has started. When all entries are deleted, it signals that no work has been recorded and the item should revert to its initial state. Automating these transitions keeps Azure DevOps state accurate with minimal friction.

## What Changes
- When a time entry is created and it is the **first** entry for the work item, and the work item type is `Task` or `Bug`, the system sets `System.State` to `"In Development"`
- When a time entry is deleted and it is the **last** entry for the work item (i.e., no entries remain), and the work item type is `Task` or `Bug`, the system sets `System.State` to `"New"`
- Both transitions are non-blocking: if they fail, the time entry operation is still considered successful and a non-blocking warning is shown (consistent with the existing field-sync failure pattern)
- No state change occurs if the work item type is not `Task` or `Bug`
- No state change on delete if other entries still remain after deletion

## Impact
- Affected specs: `work-item-field-sync` (pattern reference), new capability `work-item-status-transition`
- Affected code:
  - `src/services/DataService.ts` — `createTimeEntry`: detect first entry, trigger "In Development" transition; `deleteTimeEntry`: detect last entry deleted, trigger "New" transition
  - `src/services/WorkItemService.ts` — add `setWorkItemState(state: string)` reusing existing `setFieldValues`
