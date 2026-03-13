## 1. WorkItemService — state transition helper
- [x] 1.1 Add `setWorkItemState(state: string): Promise<void>` to `WorkItemService` using the existing `setFieldValues({ 'System.State': state })` pattern

## 2. DataService — first entry detection (create)
- [x] 2.1 In `createTimeEntry`, before saving, load existing entries for the work item and capture `isFirstEntry = existingEntries.length === 0`
- [x] 2.2 After a successful save, if `isFirstEntry` is true and work item type is `Task` or `Bug`, call `workItemService.setWorkItemState('In Development')`
- [x] 2.3 Wrap the call in try/catch; on failure set `stateTransitionOk = false` (do not rethrow)
- [x] 2.4 Return `stateTransitionOk` alongside `syncOk` in the `createTimeEntry` return value

## 3. DataService — last entry detection (delete)
- [x] 3.1 In `deleteTimeEntry`, after deletion, load remaining entries for the work item and capture `isLastEntry = remainingEntries.length === 0`
- [x] 3.2 If `isLastEntry` is true and work item type is `Task` or `Bug`, call `workItemService.setWorkItemState('New')`
- [x] 3.3 Wrap in try/catch; on failure set `stateTransitionOk = false` (do not rethrow)
- [x] 3.4 Return `stateTransitionOk` alongside `syncOk` in the `deleteTimeEntry` return value

## 4. UI — surface warnings
- [x] 4.1 In the save handler, if state transition failed, display a non-blocking dismissible warning consistent with the existing `syncWarning` pattern
- [x] 4.2 In the delete handler, same warning pattern on state transition failure

## 5. Validation
- [ ] 5.1 Manually verify: first entry on a Task → state becomes "In Development"
- [ ] 5.2 Manually verify: first entry on a Bug → state becomes "In Development"
- [ ] 5.3 Manually verify: second entry on Task/Bug → state is NOT changed
- [ ] 5.4 Manually verify: first entry on User Story/Epic → state is NOT changed
- [ ] 5.5 Manually verify: deleting last entry on a Task → state becomes "New"
- [ ] 5.6 Manually verify: deleting last entry on a Bug → state becomes "New"
- [ ] 5.7 Manually verify: deleting a non-last entry → state is NOT changed
- [ ] 5.8 Manually verify: state transition failure → entry op succeeds, warning shown
