# Design: Add Start/End Time Range to Time Entry

## Context
Time entries currently store a single `hours` decimal and a `date`. Users need to express when within a day they worked, but calculating durations by hand is tedious. This change adds structured `startTime` / `endTime` fields and derives `hours` automatically.

## Goals / Non-Goals
- **Goals:**
  - Allow users to pick a start and end time from 15-minute-interval dropdowns
  - Auto-calculate `hours` from the selected range (no manual entry)
  - Display Date, Start Time, End Time on every time entry card and list row
  - Maintain full backward compatibility with existing entries that have no time range
- **Non-Goals:**
  - Multi-day time entries (a single entry always falls within one calendar day)
  - Cross-midnight entries (End Time must be after Start Time on the same day)
  - Importing or migrating existing entries to add start/end times

## Decisions

### Decision: Store times as `HH:MM` strings (24-hour), display as 12-hour AM/PM
- `"14:30"` is unambiguous, locale-independent, and easy to parse/compare as a string
- Display layer formats to `"2:30 PM"` using existing `dateUtils` helpers or a small new utility
- Alternatives considered: storing as minutes-since-midnight (integer) — simpler math but less readable in storage/debugging

### Decision: `startTime` and `endTime` are optional on the model
- Existing entries written before this change have no time range; they must continue to render correctly (displaying only `hours` and `date`)
- New entries always require both fields (enforced in the form, not the model interface)
- Alternatives considered: making fields required — would break existing entries unless a migration runs first, which is out of scope

### Decision: `hours` field is always the source of truth for calculation and field sync
- `hours` = `(endTime − startTime)` in decimal (e.g., 1.75 for 1 h 45 min)
- The work-item field sync reads `hours`, so no downstream changes are needed
- The form computes and displays a read-only preview before save

### Decision: Time picker implemented as a `<select>` dropdown, not a free-text input
- Constraining to 96 discrete values per day (24 h × 4 intervals) prevents invalid inputs without extra validation
- Native `<input type="time">` does not enforce 15-minute steps consistently across browsers inside the Azure DevOps extension iframe; a `<select>` is reliable

## Risks / Trade-offs
- Entries with no `startTime`/`endTime` fall back to displaying only `hours` in the card — minor visual inconsistency that resolves itself as users re-save entries
- 15-minute granularity does not support exact times like 9:23 AM (per spec requirements — this is intentional)

## Open Questions
- Should the End Time dropdown dynamically exclude options ≤ Start Time, or just validate on submit? (Proposed: validate on submit; filtering the dropdown adds complexity for minimal UX gain)
