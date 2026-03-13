# timesheet-reporting Specification

## Purpose
TBD - created by archiving change add-timesheet-extension. Update Purpose after archive.
## Requirements
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

### Requirement: Date Range Selection
Users SHALL be able to filter their timesheet by custom date ranges.

#### Scenario: Select predefined date ranges
- **WHEN** user interacts with date range selector
- **THEN** the following preset options SHALL be available:
  - This Week
  - Last Week
  - This Month
  - Last Month
  - This Quarter
  - Custom Range

#### Scenario: Custom date range selection
- **WHEN** user selects "Custom Range"
- **THEN** date pickers for start and end date SHALL appear
- **WHEN** user selects dates and applies
- **THEN** timesheet SHALL update to show entries in that range

#### Scenario: Invalid date range handling
- **WHEN** user selects an end date before start date
- **THEN** an error message SHALL indicate invalid range
- **AND** the timesheet SHALL NOT update until valid range provided

### Requirement: Activity Type Breakdown
The timesheet view SHALL show time distribution across activity types.

#### Scenario: Activity summary displayed
- **WHEN** viewing the user timesheet
- **THEN** total hours per activity type SHALL be calculated and displayed
- **AND** percentage of total time per activity type SHALL be shown

#### Scenario: Visual activity breakdown
- **WHEN** viewing activity type breakdown
- **THEN** a visual representation (chart or graph) SHOULD be provided
- **AND** clicking an activity type SHOULD filter entries to that type

### Requirement: Work Item Time Summary
The extension SHALL display total time logged per work item within the time entry list.

#### Scenario: Total hours shown on work item tab
- **WHEN** viewing the Time Sheet tab on a work item
- **THEN** total hours logged by all users SHALL be displayed prominently
- **AND** the total SHALL include all time entries for that work item

#### Scenario: User-specific total on work item
- **WHEN** viewing time entries on a work item
- **THEN** total hours logged by the current user SHALL also be displayed
- **AND** it SHALL be visually distinct from the overall total

#### Scenario: Breakdown by user displayed
- **WHEN** multiple users have logged time on a work item
- **THEN** a summary showing hours per user SHOULD be available
- **AND** clicking a user SHOULD filter entries to that user

### Requirement: Team and Project Reports
The extension SHALL provide aggregated time reports at team and project levels.

#### Scenario: View team time summary
- **WHEN** a user accesses team-level reporting
- **THEN** total hours logged by all team members SHALL be displayed
- **AND** breakdown by user SHALL be available
- **AND** breakdown by work item SHALL be available
- **AND** breakdown by activity type SHALL be available

#### Scenario: Date range filtering for team reports
- **WHEN** viewing team reports
- **THEN** user SHALL be able to select date range
- **AND** the report SHALL update to show only entries in that range

#### Scenario: Team member filtering
- **WHEN** viewing team reports
- **THEN** user SHALL be able to filter by specific team members
- **AND** multi-select filtering SHALL be supported

### Requirement: Data Export - CSV Format
Users SHALL be able to export time data to CSV format for external analysis.

#### Scenario: Export work item time entries
- **WHEN** viewing time entries on a work item
- **WHEN** user clicks "Export" button
- **THEN** a dialog SHALL offer export options
- **WHEN** user confirms CSV export
- **THEN** a CSV file SHALL download containing all time entries for that work item

#### Scenario: CSV format specification
- **WHEN** exporting to CSV
- **THEN** the file SHALL include the following columns:
  - Work Item ID
  - Work Item Title
  - User Name
  - User Email (if available)
  - Date
  - Hours
  - Activity Type
  - Description
  - Created At
  - Updated At

#### Scenario: Export user timesheet
- **WHEN** viewing user timesheet for a date range
- **WHEN** user clicks "Export"
- **THEN** CSV SHALL include all entries in the current view
- **AND** filename SHALL include user name and date range

#### Scenario: Export team report
- **WHEN** viewing team-level report
- **WHEN** user clicks "Export"
- **THEN** CSV SHALL include all team members' entries for selected date range
- **AND** CSV SHALL be filtered by current view filters

### Requirement: Data Export - Excel Format
Users SHALL have the option to export time data in Excel-compatible format.

#### Scenario: Excel export option available
- **WHEN** user clicks "Export" button
- **THEN** format options SHALL include "Excel (.xlsx)"
- **WHEN** user selects Excel format
- **THEN** an Excel file SHALL download

#### Scenario: Excel formatting
- **WHEN** exporting to Excel
- **THEN** the file SHALL have:
  - Header row with column names in bold
  - Appropriate column widths for readability
  - Date columns formatted as dates
  - Hours column formatted as numbers with 2 decimal places

#### Scenario: Excel summary sheet
- **WHEN** exporting to Excel
- **THEN** a summary sheet SHOULD be included with:
  - Total hours
  - Breakdown by activity type
  - Breakdown by day/week
  - Date range of export

### Requirement: Filtering and Sorting
The timesheet and reporting views SHALL support filtering and sorting capabilities.

#### Scenario: Filter by activity type
- **WHEN** viewing time entries in any view
- **THEN** user SHALL be able to filter by one or more activity types
- **AND** filtered view SHALL update immediately

#### Scenario: Sort by date, hours, or activity
- **WHEN** viewing time entries
- **THEN** user SHALL be able to sort by:
  - Date (ascending or descending)
  - Hours (ascending or descending)
  - Activity Type (alphabetically)
  - User (alphabetically, in team views)

#### Scenario: Search by work item or description
- **WHEN** viewing user timesheet or team reports
- **THEN** a search box SHALL allow filtering by:
  - Work item ID
  - Work item title
  - Time entry description

#### Scenario: Filters are cumulative
- **WHEN** user applies multiple filters
- **THEN** entries SHALL match ALL applied filters (AND logic)
- **AND** active filters SHALL be clearly indicated
- **AND** user SHALL be able to clear individual filters or all at once

### Requirement: Report Access Control
Report visibility SHALL be controlled based on user permissions within Azure DevOps.

#### Scenario: Users can view their own timesheet
- **WHEN** any user accesses the extension
- **THEN** they SHALL always be able to view their own time entries
- **AND** their own timesheet report

#### Scenario: Team reports require team membership
- **WHEN** a user accesses team-level reports
- **THEN** they SHALL only see data for teams they are a member of
- **AND** they SHALL NOT see data from teams they don't belong to

#### Scenario: Project reports require project access
- **WHEN** a user accesses project-level reports
- **THEN** they SHALL only see data from projects they have access to
- **AND** work items they don't have permission to view SHALL be excluded

#### Scenario: Admin access to all reports
- **WHEN** a user with organization admin or project admin permissions accesses reports
- **THEN** they SHALL be able to view all time entries within their scope
- **AND** generate reports for any user, team, or project in that scope

### Requirement: Performance for Large Datasets
Reporting features SHALL remain performant with large volumes of time entry data.

#### Scenario: Efficient data loading
- **WHEN** generating a report with more than 1000 time entries
- **THEN** results SHALL be paginated (100 entries per page)
- **AND** summary totals SHALL be calculated without loading all details

#### Scenario: Progressive loading
- **WHEN** user opens a large report
- **THEN** summary data SHALL load first
- **AND** detailed entries SHALL load progressively
- **AND** user SHALL be able to interact with loaded data while more loads

#### Scenario: Export of large datasets
- **WHEN** exporting more than 10,000 entries
- **THEN** a progress indicator SHALL be displayed
- **AND** export SHALL complete within 60 seconds
- **OR** user SHALL be notified if longer processing is required

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
- **WHEN** user creates, edits, or deletes a time entry
- **THEN** any open reports showing that data SHALL automatically refresh
- **AND** user SHALL be notified of the update

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

