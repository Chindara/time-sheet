## ADDED Requirements

### Requirement: Project Stamping on Time Entries
Time entries SHALL record the project they were logged against, because extension storage is account-wide and carries no project dimension of its own.

#### Scenario: New entry records its project
- **WHEN** a time entry is created
- **THEN** the entry SHALL store the current project's id and name
- **AND** both SHALL be persisted with the entry document

#### Scenario: Editing an entry preserves its project
- **WHEN** an existing entry is updated
- **THEN** its stored project id and name SHALL be carried through unchanged

#### Scenario: Entries created before project stamping remain valid
- **WHEN** an entry has no stored project id or name
- **THEN** it SHALL still load and render without error
- **AND** its project SHALL be determined from its work item instead
