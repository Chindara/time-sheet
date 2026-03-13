# Change: Add Time Entry Panel

## Why
The `TimeEntryForm` is currently rendered inline inside the main content area, which disrupts the `TimesheetReport` layout. A slide-in panel keeps the report visible and provides a focused editing surface without a full-page context switch.

## What Changes
- A `TimeEntryPanel` slide-in panel component wraps `TimeEntryForm`
- Clicking "Log Time" opens the panel in create mode
- Clicking the Edit (pencil) icon on any report entry opens the panel in edit mode with data pre-populated
- After a successful save or update the `TimesheetReport` refreshes automatically

## Impact
- Affected specs: `timesheet-logging`, `timesheet-reporting`
- Affected code:
  - `src/TimeSheetTab.tsx` — replaces inline form with panel, passes `onEdit` to `TimesheetReport`
  - `src/components/TimeEntryForm/TimeEntryForm.tsx` — no structural change needed
  - `src/components/TimesheetReport/TimesheetReport.tsx` — add `onEdit` callback prop, connect Edit button, expose refresh trigger
  - New file: `src/components/TimeEntryPanel/TimeEntryPanel.tsx`
