## ADDED Requirements

### Requirement: Project Time Sheet Hub
The extension SHALL contribute a project-level hub named "Time Sheet" to the Boards navigation group, providing a read-only report of every time entry logged in the project by every user.

#### Scenario: Hub appears in the left navigation
- **WHEN** the extension is installed in a project
- **THEN** a "Time Sheet" entry SHALL appear in the left menu within the Boards hub group
- **AND** it SHALL appear alongside Work items, Boards, Backlogs, Sprints and Queries
- **WHEN** the user selects it
- **THEN** the project time sheet report SHALL open

#### Scenario: All users' entries are included
- **WHEN** the project time sheet report loads
- **THEN** it SHALL include time entries logged by every user in the project, not only the current user
- **AND** the total hours SHALL equal the sum of all included entries

#### Scenario: Report is read-only
- **WHEN** viewing the project time sheet report
- **THEN** no control to create, edit or delete a time entry SHALL be present
- **AND** entry mutation SHALL remain available only on the work item Time Sheet tab

#### Scenario: Empty project
- **WHEN** no time entries exist in the selected range
- **THEN** an empty state SHALL explain that no time has been logged for the range
- **AND** the filter controls SHALL remain usable so the user can widen the range

### Requirement: Project Report Summary Metrics
The project time sheet report SHALL present aggregate metrics for the selected range before any detailed breakdown.

#### Scenario: Summary metrics displayed
- **WHEN** the project report loads
- **THEN** total hours logged SHALL be displayed
- **AND** the number of distinct contributors SHALL be displayed
- **AND** the number of distinct work items SHALL be displayed
- **AND** average hours per working day SHALL be displayed

#### Scenario: Logged against estimate
- **WHEN** work items in the range carry an Original Estimate value
- **THEN** total logged hours SHALL be shown as a percentage of total original estimate
- **AND** the absolute difference SHALL be shown, labelled as over or under estimate

#### Scenario: Summary loads before detail
- **WHEN** the report is still resolving work item titles
- **THEN** the summary metrics SHALL already be rendered from the time entry data
- **AND** the detailed breakdown SHALL fill in when metadata resolution completes

### Requirement: Project Report Grouping
The project time sheet report SHALL present a flat summary table grouped by a user-selected dimension, defaulting to parent feature, showing one total row per group.

#### Scenario: Default grouping by feature
- **WHEN** the project report loads
- **THEN** the breakdown SHALL display one row per parent feature
- **AND** each row SHALL display the feature id, feature title, closed-versus-total work item count, number of contributors, activity mix, total hours, and share of project total
- **AND** rows SHALL NOT be expandable — individual work item entries are not listed in this table

#### Scenario: Table total row
- **WHEN** viewing the breakdown
- **THEN** a total row SHALL close the table
- **AND** it SHALL show total hours equal to the sum of all group rows, and a share of 100%

#### Scenario: Ancestor resolution for feature grouping
- **WHEN** a work item's immediate parent is not a Feature or Epic
- **THEN** ancestors SHALL be walked up to three levels to find the nearest Feature or Epic
- **AND** the work item SHALL be grouped under that ancestor

#### Scenario: Work items with no parent feature
- **WHEN** a work item has no Feature or Epic ancestor
- **THEN** it SHALL be placed in a group labelled "No parent feature"
- **AND** that group's hours SHALL count toward the project total

#### Scenario: Alternative groupings selectable
- **WHEN** the user changes the group-by control
- **THEN** the breakdown SHALL regroup by work item, contributor, or activity type as selected
- **AND** one total row per group SHALL be shown for the new dimension
- **AND** the summary metrics SHALL remain unchanged

### Requirement: Project Report Filtering
The project time sheet report SHALL support filtering by date range, contributor, activity type, and area path.

#### Scenario: Date range filtering
- **WHEN** the report loads
- **THEN** the date range SHALL default to all time, so a project with historical entries is never empty on first open
- **AND** presets for All time, This Month, Last Month, This Quarter and Custom Range SHALL be available
- **WHEN** the user changes the range
- **THEN** all metrics, charts and breakdowns SHALL recalculate for that range without refetching from storage

#### Scenario: All time resolves to the span of logged entries
- **WHEN** the All time preset is selected
- **THEN** the effective range SHALL run from the earliest to the latest logged entry date
- **AND** working-day counts SHALL be computed over that span

#### Scenario: Empty range is distinguished from an empty project
- **WHEN** the active filters match no entries but entries exist outside the selected range
- **THEN** the report SHALL state how many entries fall outside the range
- **AND** it SHALL offer a control to switch to All time
- **WHEN** no entries exist in the project at all
- **THEN** the report SHALL instead explain that time is logged from a work item's Time Sheet tab

#### Scenario: Contributor filtering
- **WHEN** the user filters by one or more contributors
- **THEN** only entries logged by those contributors SHALL be included
- **AND** the summary metrics SHALL reflect the filtered set

#### Scenario: Filters are cumulative
- **WHEN** more than one filter is applied
- **THEN** entries SHALL match all applied filters
- **AND** active filters SHALL be visible
- **AND** the user SHALL be able to clear filters individually or all at once

### Requirement: Project Report Visualisations
The project time sheet report SHALL visualise the distribution of logged time across activity types, contributors, and days.

#### Scenario: Activity type distribution
- **WHEN** viewing the project report
- **THEN** a donut chart of hours by activity type SHALL be displayed
- **AND** an accompanying table SHALL list each activity type with its hours and percentage of total
- **AND** activity identity SHALL never be conveyed by colour alone

#### Scenario: Contributor comparison
- **WHEN** viewing the project report
- **THEN** a bar list comparing total hours per contributor SHALL be displayed
- **AND** each bar SHALL be labelled with the contributor name, hours, and share of total

#### Scenario: Daily hours trend
- **WHEN** viewing the project report for a multi-day range
- **THEN** a bar chart of hours per day SHALL be displayed
- **AND** hovering a bar SHALL reveal the date and exact hours

### Requirement: Project Report Permission Trimming
The project time sheet report SHALL respect Azure DevOps work item read permissions and SHALL NOT disclose details of work items the viewer cannot read.

#### Scenario: Inaccessible work items are aggregated, not hidden
- **WHEN** the viewer lacks read permission on a work item that has logged time
- **THEN** that work item's title, type, state and contributors SHALL NOT be displayed
- **AND** its hours SHALL be aggregated into a single "Restricted" group showing a work item count and total hours
- **AND** the project total SHALL continue to equal the sum of all displayed groups

### Requirement: Project Report Export
The project time sheet report SHALL export the currently filtered data set to CSV.

#### Scenario: Export reflects active filters
- **WHEN** the user exports from the project report
- **THEN** the CSV SHALL contain exactly the entries matching the active filters
- **AND** the filename SHALL include the project name and the selected date range

#### Scenario: Export columns
- **WHEN** exporting from the project report
- **THEN** the CSV SHALL include Work Item ID, Work Item Title, Feature, User Name, Date, Start Time, End Time, Hours, Activity Type, Description, Created At and Updated At

#### Scenario: Export summary block
- **WHEN** exporting from the project report
- **THEN** a summary block SHALL precede the rows containing total hours, date range, entry count, hours by activity type, and hours by contributor
