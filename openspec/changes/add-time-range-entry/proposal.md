# Change: Add Start/End Time Range to Time Entry

## Why
Users log time in calendar-style blocks (e.g., "I worked from 10:15 AM to 2:45 PM"). The current free-text hours input forces them to calculate the duration manually, which is error-prone. Structured start/end time pickers that snap to 15-minute intervals make entry faster and more accurate, while the auto-calculated hours remain correct for downstream field sync.

## What Changes
- **ADDED** `startTime` and `endTime` optional fields to `TimeEntry`, `CreateTimeEntryInput`, and `UpdateTimeEntryInput` data models
- **MODIFIED** time entry form: the free-text hours input is replaced by a Date picker, Start Time dropdown, and End Time dropdown; hours are auto-calculated as `endTime − startTime`
- **MODIFIED** time entry card and list row: Date, Start Time, and End Time are displayed alongside (or instead of) the raw decimal hours
- **ADDED** 15-minute interval constraint on time pickers (valid values: 00, 15, 30, 45 minutes per hour, 12-hour AM/PM display)
- **ADDED** validation that End Time must be strictly after Start Time, and the resulting duration must be > 0

## Impact
- Affected specs: `timesheet-logging`
- Affected code:
  - `src/models/TimeEntry.ts` — data model fields
  - `src/components/TimeEntryForm/TimeEntryForm.tsx` — form UI
  - `src/components/TimeEntryList/TimeEntryList.tsx` — card display
  - `src/components/TimesheetReport/TimesheetReport.tsx` — compact row display
  - `src/utils/validation.ts` — time-range validation logic
