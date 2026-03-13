## MODIFIED Requirements

### Requirement: User Timesheet View
The extension SHALL provide a comprehensive timesheet view showing all time entries for the current user across a specified date range. The "My Timesheet" view SHALL be the default view shown when the Time Sheet tab is opened on a work item.

#### Scenario: My Timesheet is the default view on tab open
- **WHEN** user opens the Time Sheet tab on any work item
- **THEN** the "My Timesheet" view SHALL be displayed immediately without requiring any additional click
- **AND** the view SHALL show the current user's time entries for the default date range

#### Scenario: Access work item entries from My Timesheet
- **WHEN** user is viewing the My Timesheet default view
- **THEN** a control (button or link) SHALL be available to switch to the work-item-scoped entry list
- **WHEN** user clicks it
- **THEN** the time entries for the current work item SHALL be displayed

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

### Requirement: Visual Data Representation
The reporting interface SHALL include visual representations of time data.

#### Scenario: Activity type donut chart displayed
- **WHEN** viewing the My Timesheet view
- **THEN** a donut chart showing hours by activity type SHALL be displayed at the top of the summary column
- **AND** each segment SHALL represent one activity type
- **AND** the chart legend SHALL show activity type labels with percentage of total hours
- **AND** hovering over a segment SHALL show the exact hours for that activity type

#### Scenario: Daily hours trend
- **WHEN** viewing timesheet for a multi-day range
- **THEN** a line or bar chart showing hours per day SHOULD be displayed

#### Scenario: User comparison in team reports
- **WHEN** viewing team reports
- **THEN** a chart comparing total hours by team member SHOULD be available

#### Scenario: Charts are interactive
- **WHEN** charts are displayed
- **THEN** hovering over data points SHOULD show detailed information
- **AND** clicking on chart segments SHOULD filter the detailed entry list

## ADDED Requirements

### Requirement: Timesheet Two-Column Layout
The My Timesheet view SHALL render in a two-column layout to present entries and summary information side by side.

#### Scenario: Two-column layout rendered
- **WHEN** user views the My Timesheet page
- **THEN** the layout SHALL be divided into two columns at a 2:1 width ratio
- **AND** the wider column (left) SHALL display the time entries list
- **AND** the narrower column (right) SHALL display the summary box

#### Scenario: Summary column structure
- **WHEN** viewing the summary column
- **THEN** the donut chart SHALL appear at the top of the column
- **AND** summary statistics (total hours, entry count, work item count) SHALL appear below the chart
- **AND** the activity type breakdown table SHALL appear below the statistics

#### Scenario: Layout is responsive
- **WHEN** the available width is insufficient for a two-column layout (narrow panel)
- **THEN** the columns SHALL stack vertically, with the entries list on top and the summary below
