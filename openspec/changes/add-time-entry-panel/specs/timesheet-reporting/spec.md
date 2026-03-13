## MODIFIED Requirements

### Requirement: Report Refresh and Real-time Updates
Reports SHALL reflect current data and allow manual refresh.

#### Scenario: Manual refresh available
- **WHEN** viewing any report
- **THEN** a refresh button SHALL be available
- **WHEN** user clicks refresh
- **THEN** the report SHALL reload with current data from storage

#### Scenario: Data staleness indicator
- **WHEN** viewing a report
- **THEN** the time when data was last loaded SHALL be displayed
- **WHEN** data is more than 5 minutes old
- **THEN** a message SHOULD suggest refreshing for latest data

#### Scenario: Auto-refresh after user actions
- **WHEN** user creates or edits a time entry via the time entry panel
- **AND** the save completes successfully
- **THEN** the `TimesheetReport` SHALL automatically reload its entries
- **AND** the updated totals and entry list SHALL reflect the change without requiring a manual refresh
