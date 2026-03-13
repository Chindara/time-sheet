## 1. Dependency
- [x] 1.1 Add `recharts` to `package.json` dependencies and run `npm install`

## 2. Default View Change
- [x] 2.1 In `src/TimeSheetTab.tsx`, set the initial state so `showReport` (or equivalent) defaults to `true`, making My Timesheet the first view shown
- [x] 2.2 Add a "Work Item Entries" / "Back" button in the My Timesheet header so users can switch to the per-work-item entry list

## 3. Two-Column Layout
- [x] 3.1 Refactor `src/components/TimesheetReport/TimesheetReport.tsx` to wrap content in a two-column CSS grid (`grid-cols-3` with `col-span-2` for entries, `col-span-1` for summary)
- [x] 3.2 Move the existing summary `Card` into the right column
- [x] 3.3 Move the time entries section into the left column

## 4. Donut Chart
- [x] 4.1 Create `src/components/TimesheetReport/ActivityDonutChart.tsx` using recharts `PieChart` with `innerRadius` to produce a donut shape
- [x] 4.2 Derive chart data from `filteredEntries` grouped by `activityType` (hours per type)
- [x] 4.3 Add a `Tooltip` showing exact hours on hover and a `Legend` showing activity type + percentage
- [x] 4.4 Place the donut chart at the top of the summary column (above existing summary stats)

## 5. Compact Entry Rows
- [x] 5.1 Add a `compact` prop (boolean) to `TimeEntryList` or implement compact rows inline in `TimesheetReport`
- [x] 5.2 In compact mode, render each entry as a `<div>` row (not a `Card`) with date, hours, and activity badge on one line
- [x] 5.3 Truncate description text with `truncate` / `overflow-hidden text-ellipsis` Tailwind classes
- [x] 5.4 Replace text edit/delete buttons with icon-only variants using `lucide-react` icons (`Pencil`, `Trash2`)

## 6. Responsive Fallback
- [x] 6.1 Wrap the two-column grid in a responsive class (`grid-cols-1 md:grid-cols-3`) so columns stack on narrow panels
