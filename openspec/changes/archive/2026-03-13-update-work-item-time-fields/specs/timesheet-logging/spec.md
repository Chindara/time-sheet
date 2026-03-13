## MODIFIED Requirements

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
