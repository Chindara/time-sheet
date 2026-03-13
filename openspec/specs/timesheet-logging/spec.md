# timesheet-logging Specification

## Purpose
TBD - created by archiving change add-timesheet-extension. Update Purpose after archive.
## Requirements
### Requirement: Work Item Time Entry Tab
The extension SHALL provide a dedicated "Time Sheet" tab on Azure DevOps work item forms where users can view and manage time entries associated with that work item.

#### Scenario: Tab appears on work items
- **WHEN** a user opens any work item (User Story, Task, Bug, etc.)
- **THEN** a "Time Sheet" tab SHALL be visible in the work item form
- **AND** the tab SHALL display all time entries logged against that work item

#### Scenario: Tab is empty for new work items
- **WHEN** a work item has no time entries logged
- **THEN** the tab SHALL display a message indicating no time has been logged
- **AND** a "Log Time" button SHALL be visible to add the first entry

### Requirement: Time Entry Creation
Users SHALL be able to create time entries with hours, date, optional description, and activity type. After a time entry is successfully saved, the system SHALL sync `Completed Work` and `Remaining Work` on the work item (see `work-item-field-sync` capability).

#### Scenario: User logs time successfully
- **WHEN** user clicks "Log Time" button
- **THEN** a form SHALL appear with fields for hours, date, description, and activity type
- **WHEN** user enters valid data and submits
- **THEN** the time entry SHALL be saved
- **AND** the entry SHALL appear in the time entry list
- **AND** a success message SHALL be displayed
- **AND** the work item's `Completed Work` and `Remaining Work` fields SHALL be updated

#### Scenario: Required fields validation
- **WHEN** user attempts to submit without entering hours
- **THEN** an error message SHALL indicate hours is required
- **WHEN** user attempts to submit without selecting a date
- **THEN** an error message SHALL indicate date is required

#### Scenario: Hours validation
- **WHEN** user enters a negative number for hours
- **THEN** an error message SHALL indicate hours must be positive
- **WHEN** user enters zero hours
- **THEN** an error message SHALL indicate hours must be greater than zero
- **WHEN** user enters more than 24 hours
- **THEN** a warning SHALL be displayed (but submission allowed)

#### Scenario: Date defaults to today
- **WHEN** user opens the time entry form
- **THEN** the date field SHALL default to the current date

### Requirement: Time Entry Data Fields
Each time entry SHALL capture the following information:

- **Work Item ID:** The ID of the work item being logged against (automatically set)
- **User:** The user who logged the time (automatically set from current user)
- **Hours:** Decimal number representing hours worked (required)
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

### Requirement: Activity Type Selection
The system SHALL provide predefined activity types for categorizing time entries.

**Initial Activity Types:**
- Development
- Code Review
- Testing
- Bug Fixing
- Documentation
- Planning/Meetings
- Research
- Deployment
- Other

#### Scenario: Activity type required for all entries
- **WHEN** user creates a time entry
- **THEN** an activity type MUST be selected from the list
- **WHEN** user attempts to submit without selecting activity type
- **THEN** an error message SHALL indicate activity type is required

#### Scenario: Activity type displayed in entry list
- **WHEN** viewing time entries
- **THEN** each entry SHALL display its activity type
- **AND** entries MAY be visually differentiated by activity type (e.g., color coding)

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

### Requirement: Time Entry Editing
Users SHALL be able to edit their own time entries. After a successful edit, the system SHALL sync `Completed Work` and `Remaining Work` on the work item (see `work-item-field-sync` capability).

#### Scenario: User edits their own entry successfully
- **WHEN** user clicks edit on an entry they created
- **THEN** the time entry form SHALL open with existing values populated
- **WHEN** user modifies fields and saves
- **THEN** the entry SHALL be updated with new values
- **AND** the updatedAt timestamp SHALL be updated
- **AND** the work item's `Completed Work` and `Remaining Work` fields SHALL be updated

#### Scenario: Users cannot edit others' entries
- **WHEN** viewing time entries created by other users
- **THEN** edit action SHALL NOT be available for those entries
- **AND** only the entry creator can edit their own entries

#### Scenario: All fields editable except system fields
- **WHEN** editing a time entry
- **THEN** user CAN modify hours, date, description, and activity type
- **AND** user CANNOT modify work item ID, user, createdAt, or updatedAt

### Requirement: Time Entry Deletion
Users SHALL be able to delete their own time entries with confirmation. After a successful deletion, the system SHALL sync `Completed Work` and `Remaining Work` on the work item (see `work-item-field-sync` capability).

#### Scenario: User deletes their own entry with confirmation
- **WHEN** user clicks delete on an entry they created
- **THEN** a confirmation dialog SHALL appear
- **WHEN** user confirms deletion
- **THEN** the entry SHALL be permanently removed
- **AND** the entry SHALL disappear from the list
- **AND** the work item's `Completed Work` and `Remaining Work` fields SHALL be updated

#### Scenario: Deletion can be cancelled
- **WHEN** user clicks delete and the confirmation appears
- **WHEN** user cancels the deletion
- **THEN** the entry SHALL NOT be deleted
- **AND** the entry SHALL remain in the list

#### Scenario: Users cannot delete others' entries
- **WHEN** viewing time entries created by other users
- **THEN** delete action SHALL NOT be available for those entries

### Requirement: Data Persistence
Time entries SHALL be stored using Azure DevOps Extension Data Storage service.

#### Scenario: Data persists across sessions
- **WHEN** a user logs time and closes the work item
- **WHEN** the same or different user reopens the work item
- **THEN** all previously logged time entries SHALL be displayed

#### Scenario: Data is organization-scoped
- **WHEN** time entries are created in an Azure DevOps organization
- **THEN** the data SHALL be stored within that organization's extension data storage
- **AND** SHALL NOT be accessible from other organizations

#### Scenario: Concurrent edit handling
- **WHEN** two users edit the same time entry simultaneously
- **THEN** the last save SHALL overwrite previous changes (optimistic concurrency)
- **AND** no data corruption SHALL occur

### Requirement: Error Handling
The system SHALL handle errors gracefully and provide clear feedback to users.

#### Scenario: Storage quota exceeded
- **WHEN** creating a time entry would exceed organization storage quota
- **THEN** an error message SHALL inform the user
- **AND** suggest contacting administrator or archiving old entries

#### Scenario: Network failure during save
- **WHEN** a network error occurs while saving a time entry
- **THEN** an error message SHALL inform the user
- **AND** the user SHALL have option to retry
- **AND** entered data SHALL NOT be lost

#### Scenario: Work item not found
- **WHEN** attempting to load time entries for a deleted work item
- **THEN** a message SHALL inform user the work item no longer exists
- **AND** no error SHALL crash the extension

### Requirement: Performance
The extension SHALL load and display time entries efficiently.

#### Scenario: Fast initial load
- **WHEN** user opens a work item tab
- **THEN** time entries SHALL begin loading within 500ms
- **AND** a loading indicator SHALL be displayed during data fetch

#### Scenario: Pagination for large datasets
- **WHEN** a work item has more than 100 time entries
- **THEN** entries SHALL be paginated (show 50 per page)
- **AND** user SHALL be able to navigate between pages

#### Scenario: Responsive UI updates
- **WHEN** user creates, edits, or deletes an entry
- **THEN** the UI SHALL update within 1 second
- **AND** user SHALL receive immediate feedback on action success/failure

