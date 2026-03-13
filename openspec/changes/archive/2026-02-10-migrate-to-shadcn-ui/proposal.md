# Proposal: Migrate to shadcn/ui with Tailwind CSS

## Why

The current implementation uses Azure DevOps UI components which have several limitations:

1. **Limited Customization**: Azure DevOps UI components are designed for the Azure DevOps platform and offer limited styling flexibility
2. **Bundle Size**: The azure-devops-ui library adds significant bundle overhead (currently 800KB+)
3. **Compatibility Issues**: Encountered multiple API compatibility issues with Azure DevOps UI SDK updates (React 19, component prop changes)
4. **Developer Experience**: Azure DevOps UI components require specific patterns and don't integrate well with modern React development workflows
5. **Design Flexibility**: Cannot customize the design to create a unique, modern look and feel

**Benefits of shadcn/ui + Tailwind CSS:**
- **Modern Design System**: Fully accessible, customizable components built on Radix UI primitives
- **Better DX**: Components copy into codebase, full control over implementation
- **Smaller Bundle**: Tree-shakeable, only includes components actually used
- **Type Safety**: Full TypeScript support with better type inference
- **Styling Flexibility**: Utility-first CSS with Tailwind allows rapid UI iterations
- **Active Ecosystem**: Large community, extensive documentation, regular updates

## What Changes

Replace all Azure DevOps UI components with shadcn/ui components styled with Tailwind CSS:

### Components to Replace

| Current (Azure DevOps UI) | New (shadcn/ui) | Priority |
|---------------------------|-----------------|----------|
| Button | Button | High |
| TextField | Input | High |
| Dropdown | Select | High |
| MessageCard | Alert | High |
| Spinner | Spinner (custom) | High |
| Header | div + Typography | Medium |
| Icon | Lucide Icons | Medium |
| Surface/Page | Card | Medium |

### Dependencies to Add
- `tailwindcss` - Utility-first CSS framework
- `tailwindcss-animate` - Animation utilities for Tailwind
- `class-variance-authority` - For component variants
- `clsx` / `tailwind-merge` - For conditional class merging
- `lucide-react` - Icon library (replacement for Azure DevOps icons)
- `@radix-ui/*` - Headless UI primitives (installed via shadcn/ui)

### Dependencies to Remove
- `azure-devops-ui` - No longer needed

### Configuration Changes
- Add `tailwind.config.js`
- Add `postcss.config.js`
- Update `webpack.config.js` to process Tailwind CSS
- Create `src/lib/utils.ts` for shadcn/ui utilities
- Create `components.json` for shadcn/ui configuration

### Scope
- **In Scope**: Production extension components (TimeSheetTab, TimeEntryForm, TimeEntryList, TimesheetReport)
- **Out of Scope**: Preview mode (will continue using current simplified components)

## Impact

### Breaking Changes
- ✅ **None for end users** - UI functionality remains identical
- ✅ **None for Azure DevOps integration** - Extension SDK usage unchanged
- ⚠️ **Developer experience** - Component import paths and prop APIs change

### Migration Path
1. Set up Tailwind CSS and PostCSS in build pipeline
2. Install shadcn/ui CLI and initialize configuration
3. Add required shadcn/ui components one at a time
4. Migrate each React component file sequentially
5. Remove Azure DevOps UI dependencies after full migration
6. Test thoroughly in both production and local preview

### Risk Mitigation
- **Low Risk**: UI-only changes, no data layer or SDK changes
- **Incremental**: Migrate components one file at a time
- **Reversible**: Can revert individual component migrations if issues arise
- **Testing**: Use existing preview mode to validate each component change

## Success Criteria

✅ All Azure DevOps UI components replaced with shadcn/ui equivalents
✅ Tailwind CSS properly configured and building
✅ Bundle size reduced or remains similar despite new dependencies
✅ All existing functionality works identically
✅ Extension builds and packages successfully
✅ Visual appearance is modern and polished
✅ No TypeScript compilation errors
✅ Components are accessible (WCAG 2.1 Level AA)

## Related Specs

This change affects UI components but does not modify requirements. The following specs remain unchanged in functionality:
- `timesheet-logging` - Time entry CRUD operations (UI only changes)
- `timesheet-reporting` - Report generation and filtering (UI only changes)

New spec delta will capture UI component requirements.
