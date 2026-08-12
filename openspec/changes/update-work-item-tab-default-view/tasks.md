# Tasks: Open the work item Time Sheet tab on the work item's own entries

## 1. Restore the work-item-scoped view

- [x] 1.1 Render `TimeEntryList` in `src/TimeSheetTab.tsx` — it was imported but never used, so the work item's own entries were unreachable
- [x] 1.2 Drive the view from the existing `showReport` state, which was written but never read
- [x] 1.3 Default `showReport` to `false` so the tab opens on the work item's entries

## 2. Scope switch

- [x] 2.1 Add a two-option switch to the tab header: "My Timesheet" and "This work item", with `aria-pressed` marking the active scope
- [x] 2.2 Make the header summary follow the active scope — entry count plus hours for the work item, total hours for My Timesheet
- [x] 2.3 Keep "Log Time" available in both scopes

## 3. Cleanup

- [x] 3.1 Remove the unreachable duplicate `ActivityType.Deployment` case in `TimeEntryList`'s badge-variant switch

## 4. Validation

Done locally:

- [x] 4.1 `npx tsc --noEmit` clean; `npm run build` succeeds

Needs a real Azure DevOps project:

- [ ] 4.2 Verify the tab opens showing only the current work item's entries
- [ ] 4.3 Verify switching to My Timesheet shows entries from other work items, and switching back narrows again
- [ ] 4.4 Verify the header count and hours match the entries listed in each scope
- [ ] 4.5 Verify edit and delete still work from the work-item-scoped list, including the ownership restriction on entries logged by others
- [ ] 4.6 Verify logging time from either scope refreshes the visible list
