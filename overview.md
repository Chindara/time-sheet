# Time Sheet for Azure DevOps

Track time spent on work items with built-in reporting and work item synchronization. This extension adds a dedicated "Time Sheet" tab to all work items, allowing teams to log hours, view timesheet summaries, and keep Azure DevOps fields in sync automatically.

## Features

### 📝 Time Entry Logging
- **Quick Time Logging**: Add time entries directly from work item forms via a slide-in panel
- **Flexible Input**: Enter hours in decimal format (e.g., `1.5`) or time format (e.g., `1:30`)
- **Rich Context**: Add descriptions and categorize work with 8 activity types:
  - Development
  - Code Review
  - Testing
  - Bug Fixing
  - Documentation
  - Design
  - Requirements
  - Deployment
- **Edit & Delete**: Manage your own time entries with full edit and delete capabilities (with delete confirmation)

### 📊 Timesheet Report
- **My Entries View**: See all your time entries across all work items in one place
- **Work Item Grouping**: Time entries organized by work item for easy tracking, with per-work-item hour totals
- **Activity Breakdown**: Donut chart visualizing time distribution by activity type
- **Summary Statistics**: Total hours logged and total entry count
- **Inline Edit & Delete**: Edit or remove entries directly from the report

### 🔄 Automatic Work Item Synchronization
- **Completed Work**: Automatically updates the `Completed Work` field to reflect the sum of all logged hours
- **Remaining Work**: Automatically recalculates `Remaining Work` as `Original Estimate − Completed Work` (floored at 0)
- **State Transitions** (Task and Bug work items only):
  - When the **first** time entry is logged, the work item state is automatically set to **"In Development"**
  - When the **last** time entry is deleted (no entries remain), the work item state is automatically reset to **"New"**
- All synchronization is non-blocking: if a field or state update fails, the time entry operation still succeeds and a dismissible warning is shown

### 🔒 Security & Permissions
- **Work Item Permissions**: Respects Azure DevOps work item security
- **User Isolation**: Users can only edit or delete their own time entries
- **Secure Storage**: Data stored using Azure DevOps Extension Data Service with retry logic

## Getting Started

### Installation
1. Install the extension from the Azure DevOps Marketplace
2. Navigate to any work item in your Azure DevOps organization
3. Click the **"Time Sheet"** tab to start logging time

### Logging Time
1. Open any work item (User Story, Task, Bug, etc.)
2. Click the **"Time Sheet"** tab
3. Click **"Log Time"**
4. Fill in:
   - Date (defaults to today)
   - Hours (e.g., `1.5` or `1:30`)
   - Activity Type
   - Description (optional, up to 500 characters)
5. Click **"Save"**

The work item's Completed Work and Remaining Work fields update automatically. For Task and Bug work items, the state transitions to "In Development" on the first entry.

### Viewing Your Timesheet
The Time Sheet tab displays all your time entries across work items grouped by work item, alongside a donut chart and summary totals. Use the edit (pencil) and delete (trash) icons next to each entry to manage them inline.

### Warnings
If the automatic work item field sync or state transition cannot complete (e.g., due to insufficient permissions or a network error), a dismissible warning banner is shown at the top of the tab. The time entry itself is always saved successfully.

## Use Cases

### Sprint & Project Tracking
- Track actual time spent vs. estimates using automatic Completed/Remaining Work sync
- Identify which activity types consume the most time

### Productivity Analysis
- Analyze time distribution across activity types via the built-in donut chart
- Review time logged across multiple work items from a single view

### Compliance & Auditing
- Maintain accurate, per-user time records stored securely within Azure DevOps
- All entries include timestamps (created/updated) for audit trails

## Privacy & Data

- **Data Storage**: All time entries are stored securely using Azure DevOps Extension Data Service
- **Data Ownership**: Your organization owns all time entry data
- **No External Services**: No data is sent to external services or third parties
- **User Privacy**: Time entries are only visible to users with work item access

## Support

- **Repository**: [github.com/Chindara/time-sheet](https://github.com/Chindara/time-sheet)
- **Issues & Feature Requests**: [GitHub Issues](https://github.com/Chindara/time-sheet/issues)

## Version History

### 1.0.1
- Automatic state transitions for Task and Bug work items (first entry → "In Development", last entry deleted → "New")

### 1.0.0 (Initial Release)
- Time entry logging on work items
- Timesheet report grouped by work item with activity donut chart
- Automatic Completed Work and Remaining Work field sync
- Edit and delete with ownership enforcement
- 8 activity type categories

## License

MIT License - See LICENSE.txt for details

---

**Built for Azure DevOps teams who need simple, effective time tracking**
