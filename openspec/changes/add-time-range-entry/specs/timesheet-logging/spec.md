## MODIFIED Requirements

### Requirement: Time Entry Creation
Users SHALL be able to create time entries by selecting a Date, Start Time, and End Time; the system SHALL automatically calculate Hours as the duration between Start Time and End Time. Activity type and optional description are also captured. After a time entry is successfully saved, the system SHALL sync `Completed Work` and `Remaining Work` on the work item (see `work-item-field-sync` capability).

#### Scenario: User logs time successfully via time range
- **WHEN** user clicks "Log Time" button
- **THEN** a form SHALL appear with fields for Date, Start Time, End Time, Activity Type, and Description
- **WHEN** user selects a valid date, start time, and end time and submits
- **THEN** the system SHALL calculate hours as `endTime − startTime` in decimal format
- **AND** the time entry SHALL be saved with the computed hours, startTime, and endTime
- **AND** the entry SHALL appear in the time entry list
- **AND** the work item's `Completed Work` and `Remaining Work` fields SHALL be updated

#### Scenario: Required fields validation
- **WHEN** user attempts to submit without selecting a Start Time
- **THEN** an error message SHALL indicate Start Time is required
- **WHEN** user attempts to submit without selecting an End Time
- **THEN** an error message SHALL indicate End Time is required
- **WHEN** user attempts to submit without selecting a date
- **THEN** an error message SHALL indicate date is required

#### Scenario: End time must be after start time
- **WHEN** user selects an End Time equal to or before the Start Time
- **THEN** an error message SHALL indicate that End Time must be after Start Time
- **AND** the form SHALL NOT submit

#### Scenario: Date defaults to today
- **WHEN** user opens the time entry form
- **THEN** the date field SHALL default to the current date

### Requirement: Time Entry Data Fields
Each time entry SHALL capture the following information:

- **Work Item ID:** The ID of the work item being logged against (automatically set)
- **User:** The user who logged the time (automatically set from current user)
- **Hours:** Decimal number representing computed duration (endTime − startTime); required
- **Start Time:** The time work began, stored as `HH:MM` 24-hour string (optional for backward compatibility with legacy entries)
- **End Time:** The time work ended, stored as `HH:MM` 24-hour string (optional for backward compatibility with legacy entries)
- **Date:** The date when the work was performed in ISO 8601 format (required)
- **Description:** Optional text description of work performed (max 500 characters)
- **Activity Type:** Category of work performed from predefined list (required)
- **Created At:** Timestamp when entry was created (automatically set)
- **Updated At:** Timestamp when entry was last modified (automatically set)

#### Scenario: User information captured automatically
- **WHEN** a time entry is created
- **THEN** the current user's ID and display name SHALL be recorded
- **AND** the user SHALL NOT be able to log time on behalf of another user

#### Scenario: Timestamps maintained automatically
- **WHEN** a time entry is created
- **THEN** createdAt SHALL be set to current UTC time
- **WHEN** a time entry is edited
- **THEN** updatedAt SHALL be set to current UTC time

#### Scenario: Legacy entries without time range remain valid
- **WHEN** a time entry was created before start/end time fields existed
- **THEN** startTime and endTime SHALL be absent (undefined)
- **AND** the entry SHALL still display and function correctly using only its hours and date

## ADDED Requirements

### Requirement: 15-Minute Interval Time Selection
The time entry form SHALL constrain Start Time and End Time selection to 15-minute interval boundaries.

#### Scenario: Time options are limited to 15-minute intervals
- **WHEN** user opens the Start Time or End Time picker
- **THEN** only times at 00, 15, 30, and 45 minutes past each hour SHALL be available (e.g., 10:00 AM, 10:15 AM, 10:30 AM, 10:45 AM)
- **AND** arbitrary times such as 9:23 AM or 2:10 PM SHALL NOT be selectable

#### Scenario: Time displayed in 12-hour AM/PM format
- **WHEN** Start Time or End Time is displayed in the form or entry card
- **THEN** it SHALL appear in 12-hour format with AM/PM suffix (e.g., "10:15 AM", "2:45 PM")

### Requirement: Auto-Calculated Hours from Time Range
The system SHALL compute Hours automatically from the selected Start Time and End Time, without requiring manual entry.

#### Scenario: Hours computed on time selection
- **WHEN** the user selects both a Start Time and an End Time
- **THEN** the form SHALL display a read-only duration preview (e.g., "1 h 45 min")
- **AND** the computed hours value SHALL be stored as a decimal (e.g., 1.75)

#### Scenario: Fractional hours stored correctly
- **WHEN** the time range spans 1 hour and 15 minutes
- **THEN** hours SHALL be stored as 1.25
- **WHEN** the time range spans 30 minutes
- **THEN** hours SHALL be stored as 0.5

### Requirement: Time Range Display in Entry Card
Each time entry card and compact list row SHALL display the Date, Start Time, and End Time when those fields are present.

#### Scenario: Entry card shows date and time range
- **WHEN** viewing a time entry that has startTime and endTime
- **THEN** the card SHALL display the date (e.g., "Mar 20, 2026") and time range (e.g., "10:15 AM – 2:45 PM")
- **AND** the computed hours duration SHALL also be visible

#### Scenario: Legacy entry card shows date and hours only
- **WHEN** viewing a time entry that has no startTime or endTime
- **THEN** the card SHALL display the date and hours (e.g., "Mar 20, 2026 · 3 h")
- **AND** no time range placeholder or blank field SHALL be shown
