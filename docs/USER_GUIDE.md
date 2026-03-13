# Time Sheet Extension - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Logging Time](#logging-time)
3. [Viewing Timesheets](#viewing-timesheets)
4. [Exporting Data](#exporting-data)
5. [Tips & Best Practices](#tips--best-practices)
6. [Troubleshooting](#troubleshooting)

## Getting Started

### Accessing the Extension

The Time Sheet extension adds a new tab to all work items in your Azure DevOps organization.

**To access:**
1. Navigate to any work item (User Story, Task, Bug, Feature, etc.)
2. Look for the "Time Sheet" tab in the work item form
3. Click the tab to view and manage time entries

### First Time Setup

No setup required! The extension is ready to use immediately after installation.

## Logging Time

### Adding a Time Entry

1. **Open a Work Item**
   - Navigate to the work item you worked on
   - Click the "Time Sheet" tab

2. **Click "Log Time"**
   - The Log Time button is in the top-right corner of the tab
   - A form will appear

3. **Fill in the Details:**
   - **Date** (required): Select the date when you did the work
     - Defaults to today
   - **Hours** (required): Enter time worked
     - Decimal format: `1.5` (1 hour 30 minutes)
     - Time format: `1:30` (1 hour 30 minutes)
   - **Activity Type** (required): Choose from:
     - Development
     - Code Review
     - Testing
     - Bug Fixing
     - Documentation
     - Planning/Meetings
     - Research
     - Deployment
     - Other
   - **Description** (optional): Describe what you did
     - Max 500 characters
     - Examples: "Implemented user authentication", "Fixed login bug"

4. **Click "Save"**
   - Your time entry will be added to the list
   - Total hours for the work item will update automatically

### Editing a Time Entry

1. Find your time entry in the list
2. Click the "Edit" button (only available for your own entries)
3. Modify the fields as needed
4. Click "Update" to save changes

### Deleting a Time Entry

1. Find your time entry in the list
2. Click the "Delete" button (only available for your own entries)
3. Confirm the deletion when prompted
4. The entry will be permanently removed

**Note:** You can only edit or delete your own time entries. Entries from other team members are read-only.

## Viewing Timesheets

### My Timesheet Report

Access your personal timesheet to see all your time entries across all work items.

**To access:**
1. Click "My Timesheet" in the top-right of any Time Sheet tab
2. The timesheet report will open

### Date Range Selection

Filter your timesheet by different time periods:

**Preset Ranges:**
- **This Week**: Monday to Sunday of current week
- **Last Week**: Previous week
- **This Month**: Current calendar month
- **Last Month**: Previous calendar month
- **This Quarter**: Current business quarter
- **Custom Range**: Choose specific start and end dates

**To change date range:**
1. Click the "Date Range" dropdown
2. Select a preset range OR choose "Custom Range"
3. For custom ranges, select start and end dates
4. The timesheet updates automatically

### Filtering by Activity

Filter your timesheet to show only specific types of work:

1. Click the "Filter by Activity" dropdown
2. Select an activity type (or "All Activities")
3. The report updates to show only matching entries

### Understanding the Summary

The summary section shows:
- **Total Hours**: Sum of all hours in the selected date range
- **Total Entries**: Number of time entries logged
- **Work Items**: Number of work items you logged time against
- **By Activity Type**: Visual breakdown with:
  - Hours per activity
  - Percentage of total time
  - Progress bars for easy comparison

### Time Entry Details

Below the summary, time entries are grouped by work item:
- **Work Item #**: ID and title of the work item
- **Total**: Total hours logged on that work item
- **Individual Entries**: Each time entry with:
  - Date
  - Hours
  - Activity type (color-coded)
  - Description

## Exporting Data

### Export Formats

Two export formats are available:
- **CSV**: Comma-separated values, opens in Excel and other spreadsheet software
- **Excel**: CSV with summary statistics included

### Exporting from Timesheet

1. Open "My Timesheet"
2. Select your desired date range and filters
3. Click "Export CSV" or "Export Excel"
4. The file will download automatically

**Export includes:**
- All time entries in current view
- Work item IDs and titles
- User names
- Dates and hours
- Activity types
- Descriptions
- Created/updated timestamps

### Export File Contents

**CSV Format:**
```
Work Item ID,User Name,Date,Hours,Activity Type,Description,Created At,Updated At
12345,John Doe,2026-02-10,2.50,Development,Implemented feature X,2026-02-10T10:30:00Z,2026-02-10T10:30:00Z
```

**Excel Format:**
Same as CSV, plus a summary section at the top with:
- Total hours
- Date range
- Total entries
- Hours by activity type

### Using Exported Data

**Common Uses:**
- **Billing**: Import into invoicing systems
- **Payroll**: Submit for time tracking
- **Analysis**: Create pivot tables and charts
- **Archiving**: Keep historical records
- **Integration**: Import into project management tools

## Tips & Best Practices

### Daily Time Logging

**Best Practice**: Log time daily while the work is fresh in your mind.

**Tips:**
- Set a reminder at end of day to log time
- Log time immediately after completing tasks
- Use descriptions to help remember what you did

### Accurate Time Entry

**Do:**
- ✅ Round to nearest 15 minutes (0.25 hours)
- ✅ Log actual time spent, not estimated time
- ✅ Include all work-related activities
- ✅ Be consistent with activity categorization

**Don't:**
- ❌ Guess at time worked several days ago
- ❌ Combine multiple days into one entry
- ❌ Forget to log meetings and planning time
- ❌ Mix different activity types in one entry

### Activity Type Guidelines

| Activity | When to Use | Examples |
|----------|-------------|----------|
| Development | Writing new code | Features, enhancements |
| Code Review | Reviewing others' code | PR reviews, pair programming |
| Testing | Writing or running tests | Unit tests, integration tests, manual testing |
| Bug Fixing | Fixing defects | Bug investigations, patches |
| Documentation | Writing docs | README, API docs, comments |
| Planning/Meetings | Meetings and planning | Standups, sprint planning, retros |
| Research | Investigation and learning | Spike work, technology research |
| Deployment | Release activities | CI/CD, production deploys |
| Other | Miscellaneous work | Admin tasks, setup |

### Description Best Practices

Good descriptions help you and your team understand the work:

**Good Examples:**
- "Implemented user authentication with OAuth"
- "Fixed memory leak in data processing module"
- "Reviewed PR #123 for payment integration"
- "Sprint planning meeting with team"

**Poor Examples:**
- "Work" (too vague)
- "Stuff" (no information)
- "Fixed bug" (which bug?)
- "" (empty)

## Troubleshooting

### Common Issues

#### "Failed to load time entries"

**Possible Causes:**
- Network connectivity issues
- Azure DevOps service outage
- Extension permissions issue

**Solutions:**
1. Refresh the page (F5)
2. Check your internet connection
3. Try again in a few minutes
4. Contact your Azure DevOps administrator

#### Time entry not saving

**Possible Causes:**
- Required fields not filled
- Invalid data (e.g., negative hours)
- Network timeout

**Solutions:**
1. Check that Date, Hours, and Activity Type are filled
2. Ensure hours are positive numbers
3. Try clicking Save again
4. If error persists, refresh the page and re-enter

#### Cannot edit or delete someone else's entry

**This is by design!** Users can only modify their own time entries.

**If you need to edit someone else's entry:**
- Ask them to edit it themselves
- Contact your Azure DevOps administrator for data management

#### Timesheet shows no data

**Possible Causes:**
- No time logged in selected date range
- Wrong date range selected
- Activity filter hiding all entries

**Solutions:**
1. Check the selected date range
2. Try "This Month" or "Custom Range" with wider dates
3. Set activity filter to "All Activities"
4. Verify you've actually logged time entries

#### Export button not working

**Solutions:**
1. Check browser pop-up blocker settings
2. Ensure browser allows file downloads
3. Try a different browser
4. Check browser console for errors (F12)

### Performance Issues

If the extension is slow:
1. **Large number of entries**: Use date range filters to reduce displayed data
2. **Network latency**: Check your connection to Azure DevOps
3. **Browser issues**: Clear cache and reload (Ctrl+Shift+R)

### Getting Help

If you encounter issues not covered here:

1. **Check the FAQ**: See overview.md for common questions
2. **Report a Bug**: [GitHub Issues](https://github.com/your-username/devops-time-sheet/issues)
3. **Contact Support**: Reach out to your organization's Azure DevOps administrator

---

**Version**: 1.0.0
**Last Updated**: 2026-02-10
