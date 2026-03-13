## 1. Panel Component
- [ ] 1.1 Create `src/components/TimeEntryPanel/TimeEntryPanel.tsx` — a slide-in overlay/drawer that accepts `isOpen`, `entry`, `workItemId`, `onSave`, and `onClose` props and renders `TimeEntryForm` inside

## 2. TimeSheetTab Wiring
- [ ] 2.1 Replace the inline `{showForm ? <TimeEntryForm … /> : null}` block with `<TimeEntryPanel … />`
- [ ] 2.2 Pass `onEdit={handleEditEntry}` and a `refreshKey` (or callback) to `TimesheetReport` so it reloads after a save

## 3. TimesheetReport Edit Button
- [ ] 3.1 Add `onEdit?: (entry: TimeEntry) => void` prop to `TimesheetReportProps`
- [ ] 3.2 Wire `onClick={() => onEdit?.(entry)}` to the existing Pencil button for each entry row

## 4. TimesheetReport Refresh
- [ ] 4.1 Expose a refresh mechanism (e.g., accept a `refreshKey` prop that triggers `loadEntries` via `useEffect`) so the parent can force a reload after save

## 5. Validation
- [ ] 5.1 Manually verify: "Log Time" opens panel in create mode, form is blank
- [ ] 5.2 Manually verify: Edit icon opens panel with correct entry data pre-populated
- [ ] 5.3 Manually verify: Saving an entry closes the panel and the report refreshes
- [ ] 5.4 Manually verify: Cancelling closes the panel without refreshing
