# Spec: UI Components

## ADDED Requirements

### Requirement: Modern UI Component Library
**ID**: UI-001
**Priority**: High

The extension MUST use a modern, accessible UI component library based on shadcn/ui and Tailwind CSS for all user interface elements.

#### Scenario: Developer imports UI components
**Given** a developer is implementing a feature
**When** they need to add a button, input, or other UI element
**Then** they import components from `@/components/ui/*`
**And** components are fully typed with TypeScript
**And** components support Tailwind CSS classes for styling

#### Scenario: Component renders with proper styling
**Given** a UI component is rendered
**When** the user views the component in the extension
**Then** the component displays with modern, clean styling
**And** the component matches the shadcn/ui design system
**And** the component is responsive to container size

---

### Requirement: Accessible Form Components
**ID**: UI-002
**Priority**: High

All form inputs MUST be accessible, keyboard-navigable, and screen reader compatible using shadcn/ui form components built on Radix UI primitives.

#### Scenario: User navigates form with keyboard
**Given** a form is displayed (e.g., time entry form)
**When** the user presses Tab key
**Then** focus moves between form fields in logical order
**And** focused elements have visible focus indicators
**And** user can activate buttons with Enter or Space key
**And** user can open/close Select dropdowns with Arrow keys

#### Scenario: Screen reader announces form fields
**Given** a user is using a screen reader (NVDA, JAWS)
**When** focus moves to a form field
**Then** screen reader announces the field label
**And** screen reader announces the field type (text, select, button)
**And** screen reader announces validation errors if present
**And** screen reader announces required fields

#### Scenario: Form validation displays clearly
**Given** a user submits a form with invalid data
**When** validation errors occur
**Then** error messages appear next to relevant fields
**And** error messages use Alert component with destructive variant
**And** error messages are announced to screen readers
**And** form focus moves to first invalid field

---

### Requirement: Consistent Visual Design
**ID**: UI-003
**Priority**: Medium

All UI components MUST follow a consistent visual design using Tailwind CSS utility classes and shadcn/ui component variants.

#### Scenario: Primary actions use consistent button style
**Given** any view in the extension (form, list, report)
**When** a primary action button is displayed (e.g., "Log Time", "Save")
**Then** button uses shadcn Button with default variant
**And** button has consistent padding and border radius
**And** button color matches primary theme color
**And** button has hover and active states

#### Scenario: Data display uses Card component
**Given** information needs to be grouped visually (e.g., time entry, summary)
**When** the content is rendered
**Then** content is wrapped in shadcn Card component
**And** Card has consistent border, shadow, and padding
**And** Card background contrasts with page background
**And** Card layout is responsive

#### Scenario: Activity types use Badge component
**Given** an activity type is displayed (Development, Testing, etc.)
**When** the activity type is rendered
**Then** activity type uses shadcn Badge component
**And** Badge color corresponds to activity type
**And** Badge text is readable with sufficient contrast
**And** Badge size is consistent across the extension

---

### Requirement: Icon System
**ID**: UI-004
**Priority**: Medium

The extension MUST use Lucide React icons consistently for all iconography, replacing Azure DevOps icons.

#### Scenario: Common actions have icons
**Given** a user views action buttons
**When** action buttons are rendered (Add, Edit, Delete, etc.)
**Then** buttons include relevant Lucide icons
**And** icons are sized consistently (16px or 20px)
**And** icons have proper spacing from button text
**And** icons inherit button color and states

#### Scenario: Icons are accessible
**Given** an icon is displayed
**When** the icon conveys meaning
**Then** icon has appropriate aria-label or aria-hidden attribute
**And** interactive icons have sufficient click/touch target size (≥24px)
**And** icons do not convey information solely through color

---

### Requirement: Loading States
**ID**: UI-005
**Priority**: Medium

Loading states MUST use custom spinner components built with Lucide icons and Tailwind animations, replacing Azure DevOps Spinner.

#### Scenario: Data fetching shows loading state
**Given** the extension is fetching data from Azure DevOps
**When** the operation is in progress
**Then** a loading spinner is displayed
**And** spinner uses Lucide Loader2 icon with rotation animation
**And** spinner includes loading text ("Loading time entries...")
**And** spinner is centered in the container
**And** spinner is announced to screen readers

#### Scenario: Loading spinner has proper timing
**Given** data is being loaded
**When** the loading operation completes
**Then** spinner is removed immediately
**And** spinner does not flash briefly if operation is very fast (< 200ms)
**And** spinner appears if operation takes longer than 200ms

---

### Requirement: Error and Success Feedback
**ID**: UI-006
**Priority**: High

User feedback for errors and success MUST use shadcn Alert component with appropriate variants.

#### Scenario: Error messages display prominently
**Given** an error occurs (validation, network, etc.)
**When** the error message needs to be shown
**Then** error uses Alert component with destructive variant
**And** alert includes error icon (AlertCircle from Lucide)
**And** alert message is clear and actionable
**And** alert can be dismissed if appropriate

#### Scenario: Success feedback confirms actions
**Given** a user successfully completes an action (save, delete)
**When** the operation succeeds
**Then** success message uses Alert component with default variant
**And** alert includes success icon (CheckCircle from Lucide)
**And** alert auto-dismisses after 3-5 seconds
**And** alert does not block user from continuing work

---

### Requirement: Responsive Layout
**ID**: UI-007
**Priority**: Low

Components MUST adapt gracefully to different container sizes using Tailwind responsive utilities.

#### Scenario: Form layouts adapt to narrow containers
**Given** a form is displayed in a narrow container
**When** container width is less than 640px
**Then** form fields stack vertically
**And** labels appear above inputs
**And** buttons expand to full width
**And** all content remains readable and interactive

#### Scenario: Data tables adapt to container
**Given** a list or table of time entries is displayed
**When** container width changes
**Then** table uses horizontal scroll if needed
**And** critical columns remain visible
**And** row actions remain accessible

---

### Requirement: Dark Mode Preparation
**ID**: UI-008
**Priority**: Low

UI components MUST support Tailwind dark mode classes for future dark mode implementation.

#### Scenario: Components use semantic color classes
**Given** any component uses colors
**When** the component is implemented
**Then** colors use Tailwind semantic classes (bg-background, text-foreground)
**And** colors do not use hardcoded hex values
**And** colors have dark mode equivalents defined in Tailwind config
**And** dark mode can be enabled with a configuration change

#### Scenario: Contrast ratios support both modes
**Given** text and background colors are defined
**When** colors are applied to components
**Then** contrast ratio meets WCAG AA in light mode (≥4.5:1 for normal text)
**And** contrast ratio meets WCAG AA in dark mode (≥4.5:1 for normal text)
**And** interactive elements have sufficient contrast in both modes

---

### Requirement: Build Performance
**ID**: UI-009
**Priority**: Medium

The Tailwind CSS build process MUST be optimized for fast development builds and minimal production bundle size.

#### Scenario: Development builds process quickly
**Given** a developer makes a code change
**When** webpack rebuilds the project
**Then** Tailwind CSS processes in < 2 seconds
**And** hot reload updates the browser
**And** build does not slow down significantly vs. previous setup

#### Scenario: Production builds purge unused CSS
**Given** production build is triggered
**When** Tailwind CSS is processed
**Then** unused utility classes are removed from bundle
**And** only classes used in components are included
**And** final CSS bundle is minimal (< 50KB)

#### Scenario: Bundle size is optimized
**Given** the extension is built for production
**When** the final bundle is created
**Then** total bundle size is ≤ previous size (800KB) or smaller
**And** shadcn/ui components are tree-shaken
**And** no duplicate CSS rules exist

---

### Requirement: TypeScript Type Safety
**ID**: UI-010
**Priority**: High

All shadcn/ui components MUST have full TypeScript support with proper type inference and no `any` types.

#### Scenario: Component props are strongly typed
**Given** a developer uses a shadcn UI component
**When** they pass props to the component
**Then** TypeScript provides autocomplete for valid props
**And** TypeScript shows errors for invalid props
**And** TypeScript infers return types correctly
**And** no explicit `any` types are used in component code

#### Scenario: Utility functions are typed
**Given** the `cn()` utility function from `@/lib/utils`
**When** developer uses it to merge classes
**Then** function accepts string, object, or array arguments
**And** function returns type `string`
**And** TypeScript enforces correct usage

---

## Related Capabilities

This spec relates to:
- **timesheet-logging**: Time entry form components use new UI library
- **timesheet-reporting**: Report interface components use new UI library

---

**Total Requirements**: 10
**Total Scenarios**: 18
**Coverage**: All user-facing UI elements in the extension
