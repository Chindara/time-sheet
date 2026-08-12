# Tasks: Add Start/End Time Range to Time Entry

## 1. Data Model
- [x] 1.1 Add optional `startTime?: string` and `endTime?: string` fields to `TimeEntry` interface in `src/models/TimeEntry.ts`
- [x] 1.2 Add optional `startTime?: string` and `endTime?: string` to `CreateTimeEntryInput`
- [x] 1.3 Add optional `startTime?: string` and `endTime?: string` to `UpdateTimeEntryInput`

## 2. Utilities
- [x] 2.1 Add `formatTimeForDisplay(time: string): string` to `src/utils/dateUtils.ts` — converts `"14:30"` → `"2:30 PM"`
- [x] 2.2 Add `calculateHoursFromRange(startTime: string, endTime: string): number` to `src/utils/validation.ts` — returns decimal hours (e.g., `1.75` for 1 h 45 min)
- [x] 2.3 Add `generateTimeOptions(): { value: string; label: string }[]` helper — returns all 96 15-minute-interval options in 24-hour value / 12-hour label pairs

## 3. Validation
- [x] 3.1 Add validation rule: if `startTime` or `endTime` is present, both must be present
- [x] 3.2 Add validation rule: `endTime` must be strictly after `startTime` (same-day only)
- [x] 3.3 Remove the manual hours input validation path from `TimeEntryForm` (hours is now computed, not entered)

## 4. Form Component (`TimeEntryForm`)
- [x] 4.1 Replace the free-text hours `<input>` with a Start Time `<select>` dropdown (15-min intervals, 12-hour display)
- [x] 4.2 Add End Time `<select>` dropdown (same options as Start Time)
- [x] 4.3 Compute `hours` reactively as `calculateHoursFromRange(startTime, endTime)` and show a read-only "Duration" preview (e.g., "1 h 45 min")
- [x] 4.4 Pre-populate `startTime` and `endTime` when editing an existing entry that has those fields
- [x] 4.5 Default `startTime` to nearest past 15-minute interval on form open (optional UX improvement)

## 5. Time Entry Card / List Display
- [x] 5.1 Update `TimeEntryList` card to show Date, Start Time, End Time when available (e.g., "Mar 20 · 10:15 AM – 2:45 PM")
- [x] 5.2 Fall back to displaying only Date and Hours for entries without `startTime`/`endTime`
- [x] 5.3 Update compact row in `TimesheetReport` to include Start/End time display alongside date and hours

## 6. Validation
- [x] 6.1 Verify that saving a time entry with a valid time range stores `startTime`, `endTime`, and computed `hours` correctly
- [x] 6.2 Verify that an existing entry without `startTime`/`endTime` still renders without errors
- [x] 6.3 Verify that submitting with End Time ≤ Start Time shows a clear validation error
