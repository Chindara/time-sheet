# work-item-field-sync Specification

## Purpose
TBD - created by archiving change update-work-item-time-fields. Update Purpose after archive.
## Requirements
### Requirement: Work Item Time Field Sync
After any time entry is created, updated, or deleted, the system SHALL recalculate and write back the `Completed Work` and `Remaining Work` fields on the Azure DevOps work item.

The fields are derived as follows:
- **Completed Work** (`Microsoft.VSTS.Scheduling.CompletedWork`) = sum of all logged hours for the work item across all users.
- **Remaining Work** (`Microsoft.VSTS.Scheduling.RemainingWork`) = `Original Estimate` − `Completed Work`, floored at `0`. If `Original Estimate` is not set or is `0`, `Remaining Work` is set to `0`.
- **Original Estimate** (`Microsoft.VSTS.Scheduling.OriginalEstimate`) is read-only for this feature; the system SHALL NEVER modify it.

#### Scenario: Fields updated after time entry is logged
- **WHEN** a user successfully saves a new time entry
- **THEN** `Completed Work` on the work item SHALL equal the sum of all logged hours for that work item
- **AND** `Remaining Work` SHALL equal `max(0, Original Estimate − Completed Work)`

#### Scenario: Fields updated after time entry is edited
- **WHEN** a user successfully edits an existing time entry
- **THEN** `Completed Work` and `Remaining Work` SHALL be recalculated and written back to the work item

#### Scenario: Fields updated after time entry is deleted
- **WHEN** a user successfully deletes a time entry
- **THEN** `Completed Work` and `Remaining Work` SHALL be recalculated and written back to the work item

#### Scenario: Original Estimate is not set
- **WHEN** the work item's `Original Estimate` field is `0` or empty
- **THEN** `Remaining Work` SHALL be set to `0`
- **AND** `Completed Work` SHALL still reflect the sum of all logged hours

#### Scenario: Logged time exceeds Original Estimate
- **WHEN** total logged hours exceed the `Original Estimate`
- **THEN** `Completed Work` SHALL reflect the full total of logged hours (not capped)
- **AND** `Remaining Work` SHALL be set to `0`
- **AND** `Original Estimate` SHALL remain unchanged

### Requirement: Non-Blocking Sync Failure
If writing back to work item fields fails, the time entry operation SHALL still be considered successful and the user SHALL be informed via a non-blocking warning.

#### Scenario: Field sync fails gracefully
- **WHEN** the field write-back to the work item fails (e.g., insufficient permissions, network error)
- **THEN** the time entry SHALL have already been saved successfully
- **AND** a dismissible warning message SHALL be displayed to the user
- **AND** no error SHALL prevent further use of the extension

