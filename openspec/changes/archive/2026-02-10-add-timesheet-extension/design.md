# Design: Azure DevOps Time Sheet Extension

## Context
Azure DevOps provides an extensibility framework allowing third-party extensions to integrate with work items, boards, and other services. This extension will leverage the Azure DevOps Extension SDK to add time tracking capabilities directly within the platform.

**Key Constraints:**
- Must work within Azure DevOps extension sandbox and security model
- Limited to Azure DevOps Extension API capabilities
- Must support both Azure DevOps Services (cloud) and Server (on-premise)
- Extension data storage has quota limits per organization

**Stakeholders:**
- Development teams tracking project hours
- Project managers monitoring time allocation
- Finance/billing teams requiring time data for invoicing

## Goals / Non-Goals

**Goals:**
- Seamless integration with Azure DevOps work item experience
- Simple, intuitive time entry workflow
- Comprehensive reporting for individuals and teams
- Data export for integration with payroll/billing systems
- Support for multiple activity categories

**Non-Goals:**
- Time approval workflows (future enhancement)
- Integration with external time tracking systems
- Automated time tracking based on code commits
- Capacity planning integration (future enhancement)
- Mobile app support (rely on Azure DevOps mobile web experience)

## Decisions

### Decision 1: Extension Type - Work Item Form Contribution
**Choice:** Implement as a work item form group/tab contribution

**Rationale:**
- Provides direct context: users log time where they work
- No navigation required - time logging is one click away
- Automatically inherits work item security and permissions
- Standard pattern used by other successful Azure DevOps extensions

**Alternatives Considered:**
- Hub contribution (separate page): Would require navigation away from work items, breaking user flow
- Both form and hub: Adds complexity without clear benefit for initial release

### Decision 2: Data Storage - Extension Data Service
**Choice:** Use Azure DevOps Extension Data Storage API

**Rationale:**
- Purpose-built for extension data with proper isolation
- Automatic replication and backup
- Quota managed at organization level
- No infrastructure setup required
- RESTful API with good SDK support

**Alternatives Considered:**
- Work item custom fields: Limited field types, clutters work item schema, harder to query efficiently
- External database: Requires hosting, authentication complexity, network latency, separate backup strategy

### Decision 3: Frontend Framework - React + TypeScript
**Choice:** React with TypeScript and Azure DevOps UI library

**Rationale:**
- Azure DevOps UI library provides React components matching platform look/feel
- TypeScript provides type safety for SDK integration
- React is well-supported by Azure DevOps extension samples
- Large community and tooling ecosystem

**Alternatives Considered:**
- Vanilla JavaScript: Harder to maintain, no type safety
- Angular: Less commonly used in Azure DevOps extensions, larger bundle size
- Vue.js: Limited Azure DevOps UI component support

### Decision 4: Time Entry Data Model
**Choice:** Store time entries as individual records linked to work items

**Data Structure:**
```typescript
interface TimeEntry {
  id: string;
  workItemId: number;
  userId: string;
  userDisplayName: string;
  date: string; // ISO 8601 date
  hours: number;
  description?: string;
  activityType: string;
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
}
```

**Rationale:**
- Granular entries enable detailed reporting and auditing
- User information cached for display (avoiding extra API calls)
- ISO 8601 dates ensure timezone consistency
- Activity type as string allows future extensibility

**Alternatives Considered:**
- Aggregate daily summaries: Loses granularity, harder to edit specific entries
- Storing only hours per day: No activity categorization, limited reporting

### Decision 5: Activity Type Configuration
**Choice:** Hardcoded set of common activity types with future extensibility

**Initial Activity Types:**
- Development
- Code Review
- Testing
- Bug Fixing
- Documentation
- Planning/Meetings
- Research
- Deployment
- Other

**Rationale:**
- Covers 90% of software development activities
- Simple implementation for initial release
- Can be extended to user-configurable in future

**Alternatives Considered:**
- Fully configurable from day one: Adds complexity, requires admin UI
- No categorization: Reduces reporting value
- Project-specific categories: Adds configuration overhead

## Architecture

### Component Structure
```
azure-devops-timesheet-extension/
├── src/
│   ├── components/
│   │   ├── TimeEntryForm/       # Form for adding/editing time
│   │   ├── TimeEntryList/       # List of time entries for work item
│   │   ├── TimesheetReport/     # User timesheet view
│   │   └── ExportDialog/        # Export functionality
│   ├── services/
│   │   ├── DataService.ts       # Extension data storage API wrapper
│   │   ├── WorkItemService.ts   # Work item API wrapper
│   │   └── ExportService.ts     # CSV/Excel export logic
│   ├── models/
│   │   └── TimeEntry.ts         # TypeScript interfaces
│   ├── utils/
│   │   ├── dateUtils.ts         # Date formatting/parsing
│   │   └── validation.ts        # Input validation
│   └── TimeSheetTab.tsx         # Main work item tab component
├── vss-extension.json           # Extension manifest
└── package.json
```

### Data Flow
1. User opens work item → Extension tab loads
2. Extension queries DataService for time entries linked to work item
3. User adds/edits entry → Validation → DataService saves to Extension Data Storage
4. User views reports → DataService aggregates entries → Display in reporting UI
5. User exports data → ExportService formats data → Browser download

### Extension Manifest Structure
```json
{
  "contributions": [
    {
      "id": "timesheet-tab",
      "type": "ms.vss-work-web.work-item-form-page",
      "targets": ["ms.vss-work-web.work-item-form"],
      "properties": {
        "name": "Time Sheet",
        "uri": "dist/timesheet-tab.html",
        "height": 600
      }
    }
  ],
  "scopes": [
    "vso.work",
    "vso.extension_data"
  ]
}
```

## Risks / Trade-offs

### Risk: Extension Data Storage Quota Limits
**Mitigation:**
- Document recommended retention policies
- Provide data export before archiving old entries
- Monitor quota usage and alert admins

### Risk: Performance with Large Numbers of Time Entries
**Mitigation:**
- Implement pagination for time entry lists
- Use date range filters by default
- Index entries by work item ID and date

### Risk: Timezone Handling
**Mitigation:**
- Store all dates/times in ISO 8601 format (UTC)
- Display in user's local timezone
- Clearly indicate timezone in UI

### Trade-off: Simplicity vs. Advanced Features
**Decision:** Start simple, iterate based on feedback
- No approval workflows in v1
- No integration with capacity planning
- No automated time tracking
- Focus on core logging and reporting

### Risk: Cross-browser Compatibility
**Mitigation:**
- Use Azure DevOps UI library (pre-tested across browsers)
- Test on Chrome, Edge, Firefox, Safari
- Leverage Azure DevOps SDK for API compatibility

## Migration Plan

**Initial Deployment:**
1. Publish extension to private Azure DevOps marketplace
2. Install in test organization
3. Validate with small pilot team (5-10 users)
4. Gather feedback and iterate
5. Public marketplace release

**Data Migration:**
- N/A for initial release (no existing data)
- Future: If users have spreadsheet data, provide import tool

**Rollback:**
- Extension can be disabled/uninstalled at organization level
- Data remains in Extension Data Storage (can be exported before uninstall)
- No schema changes to Azure DevOps work items

## Open Questions

1. **Permissions Model:** Should we add granular permissions (e.g., users can only edit their own time entries)? Or rely on work item permissions?
   - **Recommendation:** Start with work item permissions (if you can view work item, you can see time entries; if you can edit, you can log time). Add granular permissions if requested.

2. **Bulk Time Entry:** Should users be able to log time across multiple work items at once?
   - **Recommendation:** Defer to v2 based on user feedback. Initial focus is single work item logging.

3. **Time Entry Editing History:** Should we track who edited time entries and when?
   - **Recommendation:** Store `createdAt` and `updatedAt` timestamps. Full audit log can be future enhancement.

4. **Decimal Hours:** Should we support hours in decimal format (e.g., 1.5) or hours:minutes (e.g., 1:30)?
   - **Recommendation:** Decimal format for simplicity. Accept both formats in UI and convert to decimal.
