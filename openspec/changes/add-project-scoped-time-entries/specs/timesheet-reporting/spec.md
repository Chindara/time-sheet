## ADDED Requirements

### Requirement: Reports Are Scoped to One Project
Every report that aggregates across work items SHALL show only entries belonging to the project being viewed, and SHALL NOT disclose entries from other projects in the organization.

#### Scenario: Project hub excludes other projects
- **WHEN** the project Time Sheet hub loads
- **THEN** only entries belonging to the current project SHALL be included in totals, charts, breakdowns and exports
- **AND** entries belonging to other projects SHALL NOT be shown in any form, including aggregate rows

#### Scenario: My Timesheet excludes other projects
- **WHEN** the user views My Timesheet on a work item's Time Sheet tab
- **THEN** only the user's entries belonging to the current project SHALL be shown

#### Scenario: Work item project is the authority
- **WHEN** an entry's work item can be read
- **THEN** the work item's `System.TeamProject` SHALL determine which project the entry belongs to
- **AND** this SHALL take precedence over any project stamped on the entry, so a work item moved between projects is reported under its current project

#### Scenario: Stored stamp is the fallback for unreadable work items
- **WHEN** an entry's work item cannot be read and the entry carries a stored project id or name
- **THEN** the stored value SHALL determine which project the entry belongs to
- **AND** an entry belonging to the current project SHALL still count toward its totals even though its work item details cannot be shown

#### Scenario: Unattributable entries are excluded and disclosed
- **WHEN** an entry has no stored project and its work item cannot be read
- **THEN** it SHALL be excluded from the report rather than attributed to the project being viewed
- **AND** the report SHALL state how many entries were excluded for this reason
- **AND** it SHALL NOT be attributed to any other project either

#### Scenario: Attribution settles before totals are shown
- **WHEN** the report is still resolving which entries belong to the project
- **THEN** a loading state SHALL be shown
- **AND** totals SHALL NOT be rendered from a partially attributed set
