# ui-theming Specification

## Purpose
Defines how the extension's own visual theme (light/dark) tracks the Azure DevOps host it is embedded in, so the WorkItem tab and Time Sheet hub never look broken next to the host page around them.

## Requirements

### Requirement: Automatic Host Theme Detection
The extension SHALL automatically match its own light/dark rendering to the active Azure DevOps host theme, without requiring any manual toggle from the user.

#### Scenario: Extension loads while host is in dark theme
- **WHEN** a user with the Azure DevOps Dark theme active opens the WorkItem tab or the Time Sheet hub
- **THEN** the extension SHALL render using its dark color palette from the first paint after initialization completes

#### Scenario: Extension loads while host is in light (default) theme
- **WHEN** a user with the Azure DevOps default (light) theme active opens the WorkItem tab or the Time Sheet hub
- **THEN** the extension SHALL render using its light color palette, unchanged from current behavior

#### Scenario: Host theme changes while the extension is open
- **WHEN** the Azure DevOps host theme changes while the WorkItem tab or Time Sheet hub is already open
- **THEN** the extension SHALL switch its rendering to match the new host theme without requiring a manual page reload

#### Scenario: Unrecognized or custom host theme
- **WHEN** the host applies a theme whose name is not explicitly known to the extension
- **THEN** the extension SHALL classify it as light or dark based on the luminance of the host's applied background color
- **AND** SHALL render using whichever of its two palettes best matches that classification

### Requirement: Legible Activity Type Badges In Both Themes
Activity type badges SHALL remain clearly readable, with adequate text-to-background contrast, in both the light and dark host themes.

#### Scenario: Activity badge rendered in dark theme
- **WHEN** the extension is rendering in dark mode
- **THEN** each activity type badge SHALL use a background and text color pair distinct from its light-mode pair
- **AND** the badge text SHALL remain clearly legible against its background

#### Scenario: Activity badge rendered in light theme
- **WHEN** the extension is rendering in light mode
- **THEN** activity badges SHALL render identically to their current (pre-dark-mode) appearance
