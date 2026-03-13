# Manual Testing Guide

## Prerequisites

Before you can test the extension, you need:

1. **Azure DevOps Organization** (free tier is fine)
   - Sign up at https://dev.azure.com if you don't have one
   - You need organization admin permissions

2. **Node.js and npm** installed
   - Already done ✅

3. **TFX-CLI** installed globally
   ```bash
   npm install -g tfx-cli
   ```

4. **Extension built**
   ```bash
   npm run build
   ```

## Option 1: Quick Local Testing (Limited)

Azure DevOps extensions can't fully run locally, but you can test individual components:

### Test React Components Locally

1. **Create a test page** (temporary):

```bash
# Create a simple test HTML file
cat > test-local.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Local Test</title>
</head>
<body>
    <div id="root"></div>
    <script src="dist/timesheet-tab.js"></script>
</body>
</html>
EOF
```

2. **Serve locally**:
```bash
npx http-server . -p 8080
```

3. **Open browser**: http://localhost:8080/test-local.html

**Limitations**: Azure DevOps SDK APIs won't work locally (no work item context, no data storage).

## Option 2: Deploy to Test Organization (RECOMMENDED)

This is the proper way to test Azure DevOps extensions.

### Step 1: Create a Publisher

1. **Sign in to Visual Studio Marketplace**:
   - Go to https://marketplace.visualstudio.com/manage
   - Sign in with your Microsoft account
   - Click "Create Publisher"

2. **Fill out publisher details**:
   ```
   Publisher ID: yourname-test (e.g., "john-test")
   Display Name: Your Name Test Publisher
   Description: Test publisher for development
   ```

3. **Update vss-extension.json**:
   ```json
   "publisher": "yourname-test"
   ```

### Step 2: Build and Package

1. **Build the extension**:
   ```bash
   cd "c:\Users\chinthakab\Documents\Source\Personal GitHub\devops-time-sheet"
   npm run build
   ```

2. **Verify build output**:
   ```bash
   ls dist/
   # Should see:
   # - timesheet-tab.js
   # - timesheet-tab.html
   # - Source maps
   # - CSS files
   ```

3. **Create extension package**:
   ```bash
   tfx extension create --manifest-globs vss-extension.json
   ```

   **Output**: `yourname-test.devops-timesheet-extension-1.0.0.vsix`

### Step 3: Upload to Marketplace (Private)

**Option A: Via Web Portal (Easier)**

1. Go to https://marketplace.visualstudio.com/manage
2. Click "+ New extension" → "Azure DevOps"
3. Drag and drop your `.vsix` file
4. Click "Upload"
5. **Important**: Set visibility to **Private**
6. Click "Share" and enter your organization name

**Option B: Via CLI**

```bash
# Login first
tfx login
# Enter your Personal Access Token when prompted

# Publish as private and share with your org
tfx extension publish --vsix yourname-test.devops-timesheet-extension-1.0.0.vsix --share-with your-org-name
```

**Creating a Personal Access Token (PAT)**:
1. Go to https://dev.azure.com/your-org/_usersSettings/tokens
2. Click "+ New Token"
3. Name: "Extension Publishing"
4. Scopes: Select "Marketplace" → "Manage"
5. Click "Create" and copy the token

### Step 4: Install in Your Organization

1. **Navigate to your Azure DevOps organization**:
   - https://dev.azure.com/your-org

2. **Access Marketplace**:
   - Click the shopping bag icon (top right)
   - Select "Manage extensions"

3. **Install the extension**:
   - Click "Shared with me" tab
   - Find "Time Sheet for Azure DevOps"
   - Click "Install"
   - Select your organization
   - Click "Install"

### Step 5: Test the Extension

1. **Navigate to a work item**:
   - Go to any project
   - Open Boards → Work Items
   - Create or open a User Story, Task, or Bug

2. **Find the Time Sheet tab**:
   - Look for "Time Sheet" tab in the work item form
   - Click it

3. **If you see the tab**: Success! ✅ Extension is installed

4. **If you don't see the tab**:
   - Refresh the page (F5)
   - Check if extension is installed in organization settings
   - Check browser console for errors (F12)

## Complete Testing Checklist

Use this checklist to thoroughly test the extension:

### ✅ Basic Functionality

#### Time Entry Creation
- [ ] Click "Log Time" button - form appears
- [ ] Fill in all required fields (Date, Hours, Activity Type)
- [ ] Enter hours in decimal format (e.g., `1.5`) - accepts
- [ ] Enter hours in time format (e.g., `1:30`) - accepts
- [ ] Leave description empty - still saves
- [ ] Add description (< 500 chars) - saves
- [ ] Try description > 500 chars - shows error
- [ ] Click "Save" - entry appears in list
- [ ] Total hours updates correctly
- [ ] Click "Cancel" - form closes without saving

#### Validation Tests
- [ ] Try saving without date - shows error
- [ ] Try saving without hours - shows error
- [ ] Try saving without activity type - shows error
- [ ] Enter negative hours - shows error
- [ ] Enter zero hours - shows error
- [ ] Enter very large hours (e.g., 100) - accepts with warning

#### Time Entry Viewing
- [ ] Entries display in reverse chronological order
- [ ] Each entry shows: Date, Hours, Activity, Description
- [ ] User name is displayed correctly
- [ ] Created/Updated timestamps are shown
- [ ] Activity type badges are color-coded
- [ ] Total hours at top is accurate

#### Time Entry Editing
- [ ] Click "Edit" on your entry - form opens
- [ ] Form is pre-filled with existing values
- [ ] Change date - saves correctly
- [ ] Change hours - saves correctly
- [ ] Change activity type - saves correctly
- [ ] Change description - saves correctly
- [ ] Click "Update" - changes appear immediately
- [ ] Updated timestamp changes

#### Time Entry Deletion
- [ ] Click "Delete" on your entry - confirmation appears
- [ ] Confirmation shows entry details
- [ ] Click "Cancel" - entry remains
- [ ] Click "Delete" again, confirm - entry is removed
- [ ] Total hours updates after deletion
- [ ] Entry disappears from list

#### Permission Tests
- [ ] Log time as User A
- [ ] Sign in as User B
- [ ] Open same work item
- [ ] User A's entries are visible
- [ ] Edit/Delete buttons are NOT visible for User A's entries
- [ ] Can only edit/delete own entries

### ✅ Reporting Features

#### My Timesheet Access
- [ ] Click "My Timesheet" button - report opens
- [ ] Shows all your time entries across work items
- [ ] Summary section displays correctly
- [ ] Entries are grouped by work item

#### Date Range Selection
- [ ] Default is "This Week" (Monday-Sunday)
- [ ] Select "Last Week" - shows previous week's entries
- [ ] Select "This Month" - shows current month
- [ ] Select "Last Month" - shows previous month
- [ ] Select "This Quarter" - shows current quarter
- [ ] Select "Custom Range" - date pickers appear
- [ ] Set custom start/end dates - updates correctly
- [ ] Invalid range (end before start) - shows error

#### Activity Filtering
- [ ] Default shows "All Activities"
- [ ] Select specific activity - shows only those entries
- [ ] Summary updates with filtered data
- [ ] Total hours reflects filtered entries

#### Summary Statistics
- [ ] Total Hours is accurate
- [ ] Total Entries count is correct
- [ ] Work Items count is correct
- [ ] Activity breakdown shows all types with hours
- [ ] Percentages add up to 100%
- [ ] Progress bars are proportional

#### Work Item Grouping
- [ ] Entries are grouped by work item ID
- [ ] Work item totals are accurate
- [ ] Each entry shows date, hours, activity, description
- [ ] Clicking work item ID navigates to work item (optional)

### ✅ Export Functionality

#### CSV Export
- [ ] Click "Export CSV" - file downloads
- [ ] File name includes date
- [ ] Open in Excel/Notepad - formatted correctly
- [ ] Contains all expected columns
- [ ] Data matches what's displayed
- [ ] Special characters are escaped properly

#### Excel Export
- [ ] Click "Export Excel" - file downloads
- [ ] File opens in Excel
- [ ] Summary section is at top
- [ ] Total hours is correct
- [ ] Activity breakdown is included
- [ ] Date range is shown
- [ ] Data section follows summary
- [ ] All entries are included

#### Export Scope
- [ ] Export from work item tab - includes only that work item
- [ ] Export from timesheet - includes filtered date range
- [ ] Export reflects current filters

### ✅ User Experience

#### Loading States
- [ ] Opening work item shows spinner
- [ ] "Loading time entries..." message appears
- [ ] Spinner disappears when loaded
- [ ] No loading state when switching between tabs

#### Error Handling
- [ ] Network error shows friendly message
- [ ] Error message has "Retry" button
- [ ] Retry button reloads data
- [ ] Invalid data shows specific error
- [ ] Errors don't crash the extension

#### Visual Design
- [ ] Tab matches Azure DevOps styling
- [ ] Buttons have hover states
- [ ] Colors match Azure DevOps theme
- [ ] No layout issues (overflow, alignment)
- [ ] Responsive to different screen sizes

### ✅ Cross-Browser Testing

Test in multiple browsers:

#### Google Chrome
- [ ] Extension loads correctly
- [ ] All features work
- [ ] No console errors
- [ ] Export downloads work

#### Microsoft Edge
- [ ] Extension loads correctly
- [ ] All features work
- [ ] No console errors
- [ ] Export downloads work

#### Firefox
- [ ] Extension loads correctly
- [ ] All features work
- [ ] No console errors
- [ ] Export downloads work

#### Safari (if available)
- [ ] Extension loads correctly
- [ ] All features work
- [ ] No console errors
- [ ] Export downloads work

### ✅ Work Item Types

Test with different work item types:

- [ ] User Story - Time Sheet tab appears and works
- [ ] Task - Time Sheet tab appears and works
- [ ] Bug - Time Sheet tab appears and works
- [ ] Feature - Time Sheet tab appears and works
- [ ] Epic - Time Sheet tab appears and works
- [ ] Custom work item types - works if applicable

### ✅ Performance Testing

#### Small Dataset (1-10 entries)
- [ ] Loads instantly (< 1 second)
- [ ] All operations are fast

#### Medium Dataset (50-100 entries)
- [ ] Loads quickly (< 2 seconds)
- [ ] Timesheet report loads fast
- [ ] Export completes quickly

#### Large Dataset (500+ entries)
- [ ] Still loads within reasonable time (< 5 seconds)
- [ ] Pagination or virtual scrolling works
- [ ] Export doesn't freeze browser
- [ ] Filtering is responsive

### ✅ Edge Cases

- [ ] Work item with no time entries - shows empty state
- [ ] User with no time entries - timesheet shows message
- [ ] Same user logs multiple entries same day - all appear
- [ ] Multiple users on same work item - all entries visible
- [ ] Long descriptions (500 chars) - display correctly
- [ ] Special characters in description - don't break layout
- [ ] Very small hours (0.01) - displays and calculates correctly
- [ ] Very large hours (24+) - accepts but may warn

### ✅ Data Persistence

- [ ] Log time, close work item, reopen - entry still there
- [ ] Log time, refresh page - entry still there
- [ ] Log time, sign out, sign in - entry still there
- [ ] Log time in one project, check another - isolated correctly

## Debugging Tips

### Browser Console

1. **Open Developer Tools**: Press F12
2. **Check Console tab**: Look for errors (red messages)
3. **Check Network tab**: See API calls
4. **Check Application tab** → "Storage" → See stored data

### Common Issues

**"Failed to initialize extension"**
- Check browser console for errors
- Verify extension is installed in organization
- Try refreshing the page

**"Failed to load time entries"**
- Check internet connection
- Check Azure DevOps service status
- Try again in a few minutes

**Data not saving**
- Check browser console for errors
- Verify all required fields are filled
- Check if you have permissions on work item

**Tab not appearing**
- Extension may not be installed
- Check organization settings → Extensions
- Refresh the page
- Try different work item type

### Checking Extension Data Storage

You can verify data is being stored:

1. **Via API (advanced)**:
   - Use Azure DevOps REST API
   - GET https://dev.azure.com/{org}/_apis/ExtensionManagement/InstalledExtensions/{publisherId}/{extensionId}/Data/Scopes/Default/Current/Collections/TimeEntries/Documents

2. **Via Extension**:
   - Just use the timesheet report
   - If entries show there, they're stored

## Performance Benchmarks

Expected performance:

| Operation | Expected Time | Red Flag |
|-----------|--------------|----------|
| Load work item tab | < 1 second | > 3 seconds |
| Create time entry | < 1 second | > 2 seconds |
| Load timesheet (100 entries) | < 2 seconds | > 5 seconds |
| Export CSV (500 entries) | < 3 seconds | > 10 seconds |
| Filter/sort operations | < 500ms | > 2 seconds |

## Test Data Setup

### Creating Test Data Quickly

Log time entries with varying:
- **Dates**: Span across multiple weeks/months
- **Hours**: Mix of small (0.5) and large (8+)
- **Activity Types**: Use all 9 types
- **Descriptions**: Some empty, some with text, some with special chars
- **Work Items**: Multiple different work items

### Test Script Example

Manually create 10-20 test entries with this pattern:
1. 2 entries last week, 3 this week, 1 next week
2. Mix of Development, Testing, Bug Fixing, Code Review
3. Hours: 0.5, 1, 1.5, 2, 4, 8
4. Some with descriptions, some without

## Reporting Issues

If you find bugs during testing:

1. **Note the exact steps to reproduce**
2. **Capture screenshots**
3. **Check browser console** for errors
4. **Note browser and version**
5. **Create GitHub issue** with all details

---

**Ready to Test?** Start with "Option 2: Deploy to Test Organization" above!
