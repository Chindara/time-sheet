## MODIFIED Requirements

### Requirement: Time Entry Listing
The system SHALL display all time entries for the current work item in a clear, organized list. When displayed inside the My Timesheet two-column layout, entries SHALL use a compact row format to maximize visible entries within the constrained column width.

#### Scenario: Entries displayed in reverse chronological order
- **WHEN** viewing the time entry list
- **THEN** entries SHALL be sorted by date (most recent first)
- **AND** if multiple entries exist for the same date, they SHALL be sorted by creation time

#### Scenario: Entry display includes all relevant information
- **WHEN** viewing a time entry in the list
- **THEN** the following SHALL be displayed:
  - User name who logged the time
  - Date of work
  - Hours logged
  - Activity type
  - Description (if provided)

#### Scenario: Compact row display in My Timesheet layout
- **WHEN** entries are rendered inside the My Timesheet two-column layout
- **THEN** each entry SHALL be rendered as a compact single-line row (not a full Card)
- **AND** the date, hours, and activity type badge SHALL appear inline on one line
- **AND** the description SHALL be truncated to a single line with ellipsis if it overflows
- **AND** edit and delete actions SHALL be available as icon-only buttons to reduce row width

#### Scenario: Work item summary shows total hours
- **WHEN** viewing time entries for a work item
- **THEN** the total hours logged SHALL be displayed prominently
- **AND** the total SHALL update automatically when entries are added, edited, or deleted
