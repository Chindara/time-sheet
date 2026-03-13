# Tasks: Migrate to shadcn/ui with Tailwind CSS

## Phase 1: Setup & Configuration (4 tasks)

- [x] **Install Tailwind CSS and dependencies**
  - Add tailwindcss, postcss, autoprefixer to devDependencies
  - Add tailwindcss-animate for animations
  - Add class-variance-authority for component variants
  - Add clsx and tailwind-merge for class utilities
  - Verify: Run `npm install` successfully

- [x] **Configure Tailwind CSS**
  - Create `tailwind.config.js` with content paths
  - Create `postcss.config.js` for PostCSS processing
  - Add Tailwind directives to `src/styles.css`
  - Verify: Tailwind classes work in a test component

- [x] **Update webpack configuration**
  - Add postcss-loader to webpack CSS processing chain
  - Ensure CSS modules and Tailwind work together
  - Configure Tailwind purge for production builds
  - Verify: `npm run build` succeeds with Tailwind processed

- [x] **Initialize shadcn/ui**
  - Install shadcn/ui CLI: `npm install -D @shadcn/ui`
  - Run `npx shadcn@latest init` to create configuration
  - Create `src/lib/utils.ts` with cn() utility function
  - Create `components.json` with configuration
  - Verify: shadcn/ui configuration files exist

## Phase 2: Install Core Components (5 tasks)

- [x] **Add Button component**
  - Run `npx shadcn@latest add button`
  - Review generated `src/components/ui/button.tsx`
  - Test component renders with variants
  - Verify: Button component works in isolation

- [x] **Add Input component**
  - Run `npx shadcn@latest add input`
  - Review generated `src/components/ui/input.tsx`
  - Test with different input types (text, number, date)
  - Verify: Input component works with controlled state

- [x] **Add Select component**
  - Run `npx shadcn@latest add select`
  - Review generated `src/components/ui/select.tsx`
  - Test with options and value selection
  - Verify: Select component works with onChange

- [x] **Add Alert component**
  - Run `npx shadcn@latest add alert`
  - Review generated `src/components/ui/alert.tsx`
  - Test all variants (default, destructive)
  - Verify: Alert component displays correctly

- [x] **Add supporting components**
  - Run `npx shadcn@latest add card`
  - Run `npx shadcn@latest add badge`
  - Run `npx shadcn@latest add label`
  - Install lucide-react for icons: `npm install lucide-react`
  - Verify: All components installed and importable

## Phase 3: Migrate Components (4 tasks)

- [x] **Migrate TimeEntryForm component**
  - Replace TextField with Input
  - Replace Dropdown with Select
  - Replace Button with shadcn Button
  - Replace MessageCard with Alert
  - Update styling to use Tailwind classes
  - Test form submission and validation
  - Verify: Form works identically to before

- [x] **Migrate TimeEntryList component**
  - Replace Button with shadcn Button
  - Replace Icon with Lucide icons
  - Create custom Card layout with Tailwind
  - Add Badge for activity types
  - Update styling to use Tailwind classes
  - Test edit and delete actions
  - Verify: List displays and actions work

- [x] **Migrate TimesheetReport component**
  - Replace Dropdown with Select (filters)
  - Replace Button with shadcn Button
  - Replace Spinner with custom Lucide-based spinner
  - Replace MessageCard with Alert
  - Update styling to use Tailwind classes
  - Test filtering and date range selection
  - Verify: Report generates and exports work

- [x] **Migrate TimeSheetTab component**
  - Replace Header with custom styled header
  - Replace Button with shadcn Button
  - Replace MessageCard with Alert
  - Replace Spinner with custom spinner
  - Update styling to use Tailwind classes
  - Test navigation between views
  - Verify: Tab integration works in Azure DevOps

## Phase 4: Cleanup & Optimization (3 tasks)

- [x] **Remove Azure DevOps UI dependencies**
  - Remove `azure-devops-ui` from package.json dependencies
  - Remove all Azure DevOps UI imports from codebase
  - Run `npm prune` to remove unused packages
  - Verify: No import errors, build succeeds

- [x] **Optimize bundle size**
  - Run production build: `npm run build`
  - Analyze bundle size (should be smaller or similar)
  - Configure Tailwind purge if bundle size increased
  - Verify: Bundle size ≤ current size (800KB)

- [ ] **Update documentation**
  - Update README.md with new UI framework
  - Update PREVIEW_GUIDE.md (note: preview still uses old components)
  - Update component import examples in docs
  - Verify: Documentation is accurate

## Phase 5: Testing & Validation (4 tasks)

- [ ] **Visual regression testing**
  - Compare screenshots before/after migration
  - Verify all UI elements render correctly
  - Test in different work item types
  - Verify: UI looks correct in Azure DevOps

- [ ] **Functional testing**
  - Test all CRUD operations (Create, Read, Update, Delete)
  - Test form validation (all edge cases)
  - Test timesheet filtering and date ranges
  - Test CSV/Excel export
  - Verify: All functionality works as before

- [ ] **Accessibility testing**
  - Keyboard navigation through all forms
  - Screen reader testing (NVDA or JAWS)
  - Run axe DevTools accessibility scan
  - Verify: WCAG 2.1 Level AA compliance

- [ ] **Cross-browser testing**
  - Test in Chrome (primary)
  - Test in Edge
  - Test in Firefox
  - Verify: Works in all supported browsers

## Phase 6: Package & Deploy (2 tasks)

- [ ] **Create extension package**
  - Increment version to 1.1.0 in vss-extension.json
  - Run `npm run package`
  - Review generated .vsix file
  - Verify: Package created successfully

- [ ] **Deploy and verify in production**
  - Upload to Azure DevOps marketplace
  - Update extension in test organization
  - Open work item and test all features
  - Verify: Extension works in production

---

**Total Tasks**: 22
**Estimated Time**: 8-12 hours
**Dependencies**: Tasks must be completed in phase order
**Parallel Work**: Within each phase, some tasks can be done simultaneously
