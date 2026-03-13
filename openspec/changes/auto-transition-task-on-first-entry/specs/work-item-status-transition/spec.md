## ADDED Requirements

### Requirement: Auto-transition to In Development on First Entry
When the first time entry is saved for a Task or Bug work item, the system SHALL automatically set the work item's `System.State` field to `"In Development"`.

#### Scenario: First entry on a Task transitions state to In Development
- **WHEN** a user successfully saves a time entry
- **AND** the work item type is `Task`
- **AND** no prior time entries existed for that work item
- **THEN** the system SHALL set `System.State` to `"In Development"` on the work item

#### Scenario: First entry on a Bug transitions state to In Development
- **WHEN** a user successfully saves a time entry
- **AND** the work item type is `Bug`
- **AND** no prior time entries existed for that work item
- **THEN** the system SHALL set `System.State` to `"In Development"` on the work item

#### Scenario: Subsequent entries do not change state
- **WHEN** a user successfully saves a time entry
- **AND** the work item already has one or more existing time entries
- **THEN** the system SHALL NOT modify `System.State`

#### Scenario: Non-Task/Bug work items are not affected on create
- **WHEN** a user successfully saves a time entry
- **AND** the work item type is NOT `Task` or `Bug` (e.g., User Story, Epic, Feature)
- **THEN** the system SHALL NOT modify `System.State`

### Requirement: Auto-transition to New When Last Entry Is Deleted
When all time entries for a Task or Bug work item are deleted, the system SHALL automatically set the work item's `System.State` field to `"New"`.

#### Scenario: Deleting last entry on a Task transitions state to New
- **WHEN** a user successfully deletes a time entry
- **AND** the work item type is `Task`
- **AND** no time entries remain for that work item after the deletion
- **THEN** the system SHALL set `System.State` to `"New"` on the work item

#### Scenario: Deleting last entry on a Bug transitions state to New
- **WHEN** a user successfully deletes a time entry
- **AND** the work item type is `Bug`
- **AND** no time entries remain for that work item after the deletion
- **THEN** the system SHALL set `System.State` to `"New"` on the work item

#### Scenario: Deleting a non-last entry does not change state
- **WHEN** a user successfully deletes a time entry
- **AND** one or more time entries still remain for that work item
- **THEN** the system SHALL NOT modify `System.State`

#### Scenario: Non-Task/Bug work items are not affected on delete
- **WHEN** a user successfully deletes a time entry
- **AND** the work item type is NOT `Task` or `Bug`
- **THEN** the system SHALL NOT modify `System.State`

### Requirement: Non-blocking State Transition Failure
If a state transition fails, the time entry operation SHALL still be considered successful and the user SHALL be informed via a non-blocking warning.

#### Scenario: State transition fails gracefully
- **WHEN** the `System.State` write-back fails (e.g., insufficient permissions, invalid transition, network error)
- **THEN** the time entry operation SHALL have already completed successfully
- **AND** a dismissible warning message SHALL be displayed to the user
- **AND** no error SHALL prevent further use of the extension
