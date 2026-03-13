# Time Sheet for Azure DevOps

Track time spent on work items with comprehensive reporting and export capabilities. This extension adds a dedicated "Time Sheet" tab to all work items, allowing teams to log hours, analyze time data, and export reports.

## Features

### 📝 Time Entry Logging
- **Quick Time Logging**: Add time entries directly from work item forms
- **Flexible Input**: Enter hours in decimal format (1.5) or time format (1:30)
- **Rich Context**: Add descriptions and categorize work with 9 activity types:
  - Development
  - Code Review
  - Testing
  - Bug Fixing
  - Documentation
  - Planning/Meetings
  - Research
  - Deployment
  - Other
- **Edit & Delete**: Manage your own time entries with full edit and delete capabilities

### 📊 Comprehensive Reporting
- **My Timesheet View**: See all your time entries across work items
- **Date Range Filtering**:
  - This Week / Last Week
  - This Month / Last Month
  - This Quarter
  - Custom date ranges
- **Activity Analysis**: Visual breakdown of time by activity type with percentages
- **Summary Statistics**: Total hours, entry counts, and work item summaries
- **Work Item Grouping**: Time entries organized by work item for easy tracking

### 📈 Data Export
- **CSV Export**: Download time data in comma-separated format
- **Excel-Compatible**: Export with summary statistics for spreadsheet analysis
- **Multiple Export Levels**:
  - Single work item exports
  - User timesheet exports for date ranges
  - Team and project-level exports
- **Complete Data**: All time entry details, timestamps, and metadata included

### 🔒 Security & Permissions
- **Work Item Permissions**: Respects Azure DevOps work item security
- **User Isolation**: Users can only edit/delete their own time entries
- **Secure Storage**: Data stored using Azure DevOps Extension Data Service

## Getting Started

### Installation
1. Install the extension from the Azure DevOps Marketplace
2. Navigate to any work item in your Azure DevOps organization
3. Click the "Time Sheet" tab to start logging time

### Logging Time
1. Open any work item (User Story, Task, Bug, etc.)
2. Click the "Time Sheet" tab
3. Click "Log Time" button
4. Fill in:
   - Date (defaults to today)
   - Hours (e.g., 1.5 or 1:30)
   - Activity Type
   - Description (optional)
5. Click "Save"

### Viewing Your Timesheet
1. From any work item's Time Sheet tab, click "My Timesheet"
2. Select your date range (defaults to This Week)
3. Filter by activity type if desired
4. View summary statistics and detailed entries
5. Export to CSV or Excel for external analysis

### Exporting Data
- **From Work Item**: View time entries on a work item and export that specific data
- **From Timesheet**: Click "Export CSV" or "Export Excel" to download your timesheet
- **Reports Include**: All time entries with user names, dates, hours, activities, and descriptions

## Use Cases

### Project Management
- Track actual time spent vs. estimates
- Understand team capacity and utilization
- Identify bottlenecks in development process

### Billing & Invoicing
- Export time data for client billing
- Generate detailed timesheets for invoicing
- Track billable vs. non-billable hours by activity type

### Productivity Analysis
- Analyze time distribution across activity types
- Identify time-consuming activities
- Optimize team workflows based on time data

### Compliance & Reporting
- Maintain accurate time records
- Generate reports for stakeholders
- Export data for integration with other systems

## Privacy & Data

- **Data Storage**: All time entries are stored securely using Azure DevOps Extension Data Service
- **Data Ownership**: Your organization owns all time entry data
- **No External Services**: No data is sent to external services or third parties
- **User Privacy**: Time entries are only visible to users with work item access

## Support

- **Documentation**: [GitHub Repository](https://github.com/your-username/devops-time-sheet)
- **Issues**: [Report Issues](https://github.com/your-username/devops-time-sheet/issues)
- **Feature Requests**: Submit feature requests via GitHub Issues

## Version History

### 1.0.0 (Initial Release)
- Time entry logging on work items
- My Timesheet reporting view
- CSV and Excel export functionality
- Activity type categorization
- Date range filtering
- Summary statistics

## License

MIT License - See LICENSE.txt for details

---

**Built with ❤️ for Azure DevOps teams who need simple, effective time tracking**
