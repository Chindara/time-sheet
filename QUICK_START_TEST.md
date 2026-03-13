# Quick Start - Test the Extension in 15 Minutes

Follow these steps to get the extension running in your Azure DevOps organization.

## 🎯 Goal
Install and test the Time Sheet extension in your Azure DevOps organization.

## ✅ Prerequisites Checklist
- [ ] Azure DevOps organization (free tier OK) - https://dev.azure.com
- [ ] Organization admin access
- [ ] Project with at least one work item

## 📦 Step 1: Install TFX-CLI (2 minutes)

```bash
npm install -g tfx-cli
```

**Verify installation:**
```bash
tfx version
```

## 🔨 Step 2: Build the Extension (1 minute)

```bash
cd "c:\Users\chinthakab\Documents\Source\Personal GitHub\devops-time-sheet"
npm run build
```

**Expected output**: "webpack 5.105.0 compiled with 3 warnings"

**Verify dist folder:**
```bash
ls dist/
```
Should see: `timesheet-tab.js`, `timesheet-tab.html`, and other files

## 🏷️ Step 3: Create Publisher (5 minutes)

### A. Update Publisher ID

1. **Choose your publisher ID** (lowercase, no spaces):
   - Example: `yourname-test` or `john-test`

2. **Edit vss-extension.json**:
   - Open: `vss-extension.json`
   - Find line 7: `"publisher": "your-publisher-id"`
   - Replace with: `"publisher": "yourname-test"`
   - Save file

### B. Create Publisher Account

1. **Go to**: https://marketplace.visualstudio.com/manage
2. **Sign in** with your Microsoft account
3. **Click**: "Create Publisher"
4. **Fill in**:
   - **Publisher ID**: `yourname-test` (same as above)
   - **Publisher Name**: `Your Name (Test)`
   - **Email**: your email
5. **Click**: "Create"

## 📤 Step 4: Package Extension (1 minute)

```bash
tfx extension create --manifest-globs vss-extension.json
```

**Output**: `yourname-test.devops-timesheet-extension-1.0.0.vsix`

**If you see errors**:
- Make sure you updated the publisher in vss-extension.json
- Make sure `npm run build` completed successfully

## 🚀 Step 5: Upload to Marketplace (3 minutes)

### Option A: Web Portal (Easier)

1. **Go to**: https://marketplace.visualstudio.com/manage
2. **Click**: "+ New extension" → "Azure DevOps"
3. **Drag and drop** the `.vsix` file
4. **IMPORTANT**: Keep visibility as **"Private"**
5. **Click** "Upload"
6. **Wait** for processing (~30 seconds)
7. **Click** "Share" button
8. **Enter** your Azure DevOps organization name
9. **Click** "Share"

### Option B: Command Line

```bash
# Get a Personal Access Token first:
# 1. Go to: https://dev.azure.com/YOUR-ORG/_usersSettings/tokens
# 2. Click "+ New Token"
# 3. Name: "Extension Publishing"
# 4. Scope: Marketplace (Manage)
# 5. Create and copy the token

# Login
tfx login
# Paste your token when prompted

# Publish and share
tfx extension publish --vsix yourname-test.devops-timesheet-extension-1.0.0.vsix --share-with YOUR-ORG-NAME
```

## 🔧 Step 6: Install in Organization (2 minutes)

1. **Go to**: https://dev.azure.com/YOUR-ORG
2. **Click**: Shopping bag icon (top right)
3. **Click**: "Manage extensions"
4. **Click**: "Shared with me" tab
5. **Find**: "Time Sheet for Azure DevOps"
6. **Click**: "Install"
7. **Select**: Your organization
8. **Click**: "Install"

**Success message**: "Time Sheet for Azure DevOps has been successfully installed"

## ✨ Step 7: Test It! (5 minutes)

### First Test - Basic Functionality

1. **Navigate to a work item**:
   - Go to Boards → Work Items
   - Open or create a User Story, Task, or Bug

2. **Find the Time Sheet tab**:
   - Look for "Time Sheet" tab
   - Click it
   - ✅ **Success if you see**: "No time entries logged yet" with "Log Time" button

3. **Log your first time entry**:
   - Click "Log Time"
   - Fill in:
     - **Date**: Today (default)
     - **Hours**: `2` or `2:00`
     - **Activity Type**: Development
     - **Description**: Testing the extension
   - Click "Save"
   - ✅ **Success if**: Entry appears in the list below

4. **Test My Timesheet**:
   - Click "My Timesheet" button (top right)
   - ✅ **Success if**: See your entry with summary statistics
   - Try different date ranges
   - Try "Export CSV" button

5. **Test Edit/Delete**:
   - Go back to the work item (click "Close" on timesheet)
   - Click "Edit" on your entry
   - Change hours to `3`
   - Click "Update"
   - ✅ **Success if**: Entry updates
   - Click "Delete"
   - Confirm deletion
   - ✅ **Success if**: Entry is removed

## 🎉 Success!

If all tests passed, the extension is working! You now have:
- ✅ Extension installed in your organization
- ✅ Time logging working on work items
- ✅ Timesheet reporting working
- ✅ Export functionality working

## 📝 Next Steps

### Keep Testing
- Create more time entries with different activity types
- Test with multiple work items
- Try different date ranges in timesheet
- Export and open CSV files

### Share with Team (Optional)
1. Ask 2-3 teammates to try it
2. Have them log time on their work items
3. Gather feedback

### Full Testing
For comprehensive testing, see: [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md)

## 🐛 Troubleshooting

### "Time Sheet tab doesn't appear"
1. Refresh the page (F5)
2. Check if extension is installed (Org Settings → Extensions)
3. Try a different work item
4. Check browser console for errors (F12)

### "Failed to load time entries"
1. Check internet connection
2. Wait 30 seconds and refresh
3. Check Azure DevOps status: https://status.dev.azure.com

### "Cannot save time entry"
1. Check all required fields are filled
2. Ensure hours is a positive number
3. Check browser console for errors (F12)

### Extension not in "Shared with me"
1. Verify you uploaded to marketplace
2. Check you clicked "Share" with correct org name
3. Wait 1-2 minutes and refresh

### Package creation fails
1. Verify `npm run build` completed
2. Check `dist/` folder exists
3. Verify publisher ID in vss-extension.json
4. Run `npm install` again

## 📞 Need Help?

- **Full Testing Guide**: [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md)
- **Deployment Guide**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **User Guide**: [docs/USER_GUIDE.md](docs/USER_GUIDE.md)

---

**Total Time**: ~15 minutes
**Difficulty**: Easy
**Result**: Working time tracking extension in your Azure DevOps!
