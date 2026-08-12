## MODIFIED Requirements

### Requirement: User Timesheet View
The extension SHALL provide a comprehensive timesheet view showing all time entries for the current user across a specified date range. The work-item-scoped entry list SHALL be the default view shown when the Time Sheet tab is opened on a work item, and the user SHALL be able to switch between that list and the "My Timesheet" view at any time.

#### Scenario: Work item entries are the default view on tab open
- **WHEN** user opens the Time Sheet tab on any work item
- **THEN** the time entries logged against that work item SHALL be displayed immediately without requiring any additional click
- **AND** entries logged against other work items SHALL NOT be shown in that view
- **AND** the header SHALL state the entry count and total hours for that work item

#### Scenario: Switch between work item and My Timesheet scope
- **WHEN** user is viewing the Time Sheet tab in either scope
- **THEN** a control SHALL be available offering both "This work item" and "My Timesheet"
- **AND** the control SHALL indicate which scope is active
- **WHEN** user selects "My Timesheet"
- **THEN** the current user's entries across all work items SHALL be displayed
- **WHEN** user selects "This work item"
- **THEN** the view SHALL return to the entries for the work item being viewed

#### Scenario: Default date range is current week
- **WHEN** user opens their timesheet view
- **THEN** the date range SHALL default to the current week (Monday-Sunday)
- **AND** time entries within that range SHALL be displayed

#### Scenario: Entries grouped by work item
- **WHEN** viewing the user timesheet
- **THEN** time entries SHALL be grouped by work item
- **AND** each group SHALL display the work item ID and title
- **AND** clicking a work item SHALL navigate to that work item

#### Scenario: Daily totals displayed
- **WHEN** viewing the user timesheet
- **THEN** total hours per day SHALL be calculated and displayed
- **AND** total hours for the entire date range SHALL be displayed
