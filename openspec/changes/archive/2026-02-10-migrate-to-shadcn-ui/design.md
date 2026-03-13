# Design: shadcn/ui Migration Architecture

## Overview

This document outlines the architectural decisions for migrating from Azure DevOps UI to shadcn/ui with Tailwind CSS.

## Key Architectural Decisions

### 1. Component Installation Strategy

**Decision**: Use shadcn/ui CLI to install components into `src/components/ui/`

**Rationale**:
- Components are copied into the codebase, providing full control
- Can modify components if needed for specific extension requirements
- No hidden dependencies or black-box behavior
- Aligns with shadcn/ui best practices

**Alternatives Considered**:
- Installing shadcn/ui as a package: Rejected because shadcn/ui is not distributed as an npm package
- Manual component copying: Rejected because CLI ensures proper setup and dependencies

### 2. Styling Approach

**Decision**: Use Tailwind CSS with shadcn/ui's default configuration

**Rationale**:
- shadcn/ui components are designed for Tailwind
- Provides utility-first approach for rapid styling iterations
- Excellent tree-shaking reduces bundle size
- Built-in dark mode support (future enhancement)

**Configuration**:
```javascript
// tailwind.config.js
- Base colors: slate (neutral gray scale)
- Primary: blue-600 (matches Azure DevOps theme loosely)
- Destructive: red-600 for errors/deletions
- Border radius: Default (0.5rem)
```

**Alternatives Considered**:
- CSS-in-JS (styled-components): Rejected for bundle size and build complexity
- Plain CSS: Rejected for lack of utility-first benefits

### 3. Icon Library

**Decision**: Use Lucide React for icons

**Rationale**:
- Default icon library for shadcn/ui
- Tree-shakeable, small bundle impact
- Modern, consistent icon set
- Easy to customize size and color via Tailwind classes

**Migration Map**:
| Azure DevOps Icon | Lucide Icon |
|-------------------|-------------|
| Add | Plus |
| Edit | Pencil |
| Delete | Trash2 |
| Calendar | Calendar |
| Close | X |
| Info | Info |
| Warning | AlertTriangle |
| Error | AlertCircle |

### 4. Build Pipeline Integration

**Decision**: Integrate Tailwind CSS via PostCSS in webpack

**Webpack Changes**:
1. Add PostCSS loader for CSS files
2. Process Tailwind directives (`@tailwind base`, `@apply`, etc.)
3. Purge unused styles in production build
4. Maintain compatibility with existing CSS modules

**Build Performance**:
- Development: ~10-15% slower (Tailwind processing)
- Production: Similar or faster (better tree-shaking)
- Bundle size: Expected 50-100KB reduction after removing azure-devops-ui

### 5. Component Migration Order

**Phase 1 - Form Components** (Highest ROI):
1. Button → shadcn/ui Button
2. TextField → shadcn/ui Input
3. Dropdown → shadcn/ui Select
4. MessageCard → shadcn/ui Alert

**Phase 2 - Layout & Display**:
5. Spinner → Custom spinner using Lucide icons
6. Header → Custom header with typography
7. Surface/Page → shadcn/ui Card
8. Icon → Lucide icons

**Rationale for Order**:
- Form components are used most frequently
- High visual impact with manageable complexity
- Builds confidence before tackling complex components

### 6. Accessibility Preservation

**Decision**: Leverage Radix UI primitives (foundation of shadcn/ui)

**Guarantees**:
- Keyboard navigation maintained
- ARIA attributes properly set
- Focus management handled automatically
- Screen reader compatibility

**Testing Plan**:
- Manual keyboard navigation testing
- NVDA/JAWS screen reader testing
- axe DevTools automated accessibility scan

### 7. State Management

**Decision**: No changes to existing React state patterns

**Rationale**:
- shadcn/ui components are controlled components
- Work seamlessly with existing useState/useEffect patterns
- No need for additional state libraries
- Migration is purely presentational

### 8. TypeScript Integration

**Decision**: Maintain strong typing with component prop interfaces

**Approach**:
- shadcn/ui components include TypeScript definitions
- Create custom type extensions if needed
- Ensure zero `any` types in migrated components

## File Structure

```
src/
├── components/
│   ├── ui/                          # shadcn/ui components (new)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── alert.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── TimeEntryForm/
│   │   └── TimeEntryForm.tsx        # Update imports
│   ├── TimeEntryList/
│   │   └── TimeEntryList.tsx        # Update imports
│   ├── TimesheetReport/
│   │   └── TimesheetReport.tsx      # Update imports
│   └── ...
├── lib/
│   └── utils.ts                     # shadcn/ui utilities (new)
├── styles.css                       # Add Tailwind directives
└── TimeSheetTab.tsx                 # Update imports
```

## Risk Assessment

### Low Risk
- ✅ UI-only changes, no business logic modification
- ✅ No Azure DevOps SDK interaction changes
- ✅ Incremental migration allows early issue detection

### Medium Risk
- ⚠️ Bundle size could increase if not properly tree-shaken
  - Mitigation: Monitor bundle size after each component addition
- ⚠️ Tailwind CSS class purging could be too aggressive
  - Mitigation: Configure safelist for dynamic classes

### Mitigated Risks
- Component compatibility with React 19: shadcn/ui fully supports React 19
- TypeScript compatibility: shadcn/ui is TypeScript-first
- Build complexity: PostCSS integration is well-documented

## Performance Considerations

**Expected Improvements**:
- 50-100KB smaller bundle (removing azure-devops-ui fonts and styles)
- Faster initial render (less CSS to parse)
- Better tree-shaking (Tailwind purges unused utilities)

**Trade-offs**:
- Slightly slower development builds (Tailwind processing)
- More HTML classes in output (acceptable for utility-first approach)

## Rollback Plan

If critical issues arise:
1. Revert individual component files to Azure DevOps UI
2. Webpack config changes are backwards compatible
3. Can run both UI libraries temporarily if needed
4. Git history allows clean revert of entire change

## Future Enhancements Enabled

Post-migration, the following becomes easier:
- **Dark mode**: Tailwind dark mode utilities ready to use
- **Responsive design**: Tailwind breakpoints for mobile support (if Azure DevOps adds mobile)
- **Theme customization**: Easy to create organization-specific themes
- **Animation**: Built-in Tailwind animations for enhanced UX
- **Additional shadcn/ui components**: Toast notifications, Command palette, etc.
