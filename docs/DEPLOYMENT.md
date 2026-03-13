# Deployment Guide

This guide covers packaging, publishing, and deploying the Time Sheet extension to Azure DevOps.

## Prerequisites

### Required Tools
- Node.js 16+ and npm
- tfx-cli: `npm install -g tfx-cli`
- Azure DevOps organization (for testing)
- Azure DevOps publisher account (for marketplace)

### Before You Start
1. Update `vss-extension.json`:
   - Set your `publisher` ID
   - Update version number
   - Update repository URLs
2. Add extension icon: `images/logo.png` (128x128px minimum)
3. Build the extension: `npm run build`

## Packaging the Extension

### 1. Install TFX-CLI

```bash
npm install -g tfx-cli
```

### 2. Build the Extension

```bash
# Production build
npm run build

# Verify dist folder contains:
# - timesheet-tab.js
# - timesheet-tab.html
# - Source maps and assets
```

### 3. Create Extension Package

```bash
# Create .vsix package
tfx extension create --manifest-globs vss-extension.json
```

**Output**: `your-publisher-id.devops-timesheet-extension-1.0.0.vsix`

### 4. Verify Package Contents

```bash
# List files in package
tfx extension show --vsix your-publisher-id.devops-timesheet-extension-1.0.0.vsix
```

**Should include:**
- vss-extension.json
- dist/ folder with all built files
- images/ folder with logo
- overview.md
- LICENSE.txt

## Creating a Publisher

### 1. Sign in to Visual Studio Marketplace

1. Go to [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage)
2. Sign in with your Microsoft account
3. Click "Create Publisher" if you don't have one

### 2. Fill Publisher Details

- **ID**: Unique identifier (lowercase, no spaces)
  - Example: `yourcompany` or `your-name`
- **Display Name**: Public name shown in marketplace
  - Example: "Your Company" or "Your Name"
- **Description**: Brief description of your organization
- **Logo**: 128x128px image

### 3. Update vss-extension.json

Replace `"publisher": "your-publisher-id"` with your actual publisher ID.

## Publishing to Marketplace

### Option 1: Private (Recommended for Testing)

#### A. Upload via Portal

1. Go to [Marketplace Manage](https://marketplace.visualstudio.com/manage)
2. Click "+ New extension" → "Azure DevOps"
3. Upload your .vsix file
4. Set visibility to "Private"
5. Share with your organization

#### B. Upload via CLI

```bash
# Login to marketplace
tfx login

# Publish as private
tfx extension publish --vsix your-publisher-id.devops-timesheet-extension-1.0.0.vsix --share-with your-org-name
```

### Option 2: Public

⚠️ **Only publish publicly after thorough testing!**

```bash
# Publish to public marketplace
tfx extension publish --vsix your-publisher-id.devops-timesheet-extension-1.0.0.vsix
```

## Installing in Azure DevOps

### 1. Access Marketplace

1. Navigate to your Azure DevOps organization
2. Click the shopping bag icon (top right)
3. Select "Manage extensions"

### 2. Install Extension

**For Private Extensions:**
1. Click "Shared with me" tab
2. Find "Time Sheet for Azure DevOps"
3. Click "Install"
4. Select the organization to install to

**For Public Extensions:**
1. Go to [Marketplace](https://marketplace.visualstudio.com/)
2. Search for "Time Sheet for Azure DevOps"
3. Click "Get it free"
4. Select organization and install

### 3. Verify Installation

1. Open any work item
2. Check for "Time Sheet" tab
3. Try logging a time entry
4. Verify data persists after refresh

## Testing Checklist

Before releasing to production:

### Functionality Tests
- [ ] Create time entry with all fields
- [ ] Edit own time entry
- [ ] Delete own time entry with confirmation
- [ ] Cannot edit other users' entries
- [ ] View "My Timesheet" report
- [ ] Filter by date ranges (all presets + custom)
- [ ] Filter by activity type
- [ ] Export to CSV
- [ ] Export to Excel with summary
- [ ] Totals calculate correctly
- [ ] Data persists across page refreshes

### UI/UX Tests
- [ ] Tab loads without errors
- [ ] Loading states display properly
- [ ] Error messages are clear
- [ ] Forms validate input correctly
- [ ] Buttons and links work
- [ ] Responsive layout (no horizontal scroll)
- [ ] Icons and styling match Azure DevOps

### Cross-browser Testing
- [ ] Chrome (latest)
- [ ] Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, if applicable)

### Work Item Types
Test with different work item types:
- [ ] User Story
- [ ] Task
- [ ] Bug
- [ ] Feature
- [ ] Epic

### Performance Tests
- [ ] Load 100+ time entries
- [ ] Create/edit/delete operations are fast (< 2s)
- [ ] Export with 500+ entries
- [ ] Multiple tabs open simultaneously

### Permission Tests
- [ ] Users can only edit/delete own entries
- [ ] Work item permissions are respected
- [ ] Extension data storage permissions work

## Updating the Extension

### Version Numbering

Follow semantic versioning:
- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backwards compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes

### Update Process

1. **Update Code**
   ```bash
   # Make your changes
   git commit -m "Add feature X"
   ```

2. **Update Version**
   - Edit `vss-extension.json`
   - Change `version` field (e.g., "1.0.1")
   - Edit `package.json` version to match

3. **Rebuild**
   ```bash
   npm run build
   ```

4. **Package New Version**
   ```bash
   tfx extension create --manifest-globs vss-extension.json
   ```

5. **Publish Update**
   ```bash
   tfx extension publish --vsix your-publisher-id.devops-timesheet-extension-1.0.1.vsix
   ```

6. **Verify Auto-update**
   - Azure DevOps automatically updates installed extensions
   - May take up to 24 hours
   - Users can manually update from "Manage Extensions"

## Rollback

If you need to rollback a bad release:

1. **Unpublish Bad Version** (if still unpublished)
   ```bash
   tfx extension unpublish --publisher your-publisher-id --extension-id devops-timesheet-extension
   ```

2. **Publish Previous Version**
   ```bash
   tfx extension publish --vsix your-publisher-id.devops-timesheet-extension-1.0.0.vsix
   ```

3. **Notify Users**
   - Update overview.md with known issues
   - Contact affected organizations

## Monitoring

### Check Extension Health

1. [Marketplace Manage](https://marketplace.visualstudio.com/manage)
2. Click on your extension
3. View "Acquisition" and "Rating & Review" tabs

### Gather User Feedback

- Monitor GitHub Issues
- Check marketplace Q&A
- Review ratings and reviews
- Track download/install statistics

### Error Tracking

Consider adding error tracking:
- Browser console logs
- Azure Application Insights
- Custom error reporting to your service

## Best Practices

### Before Publishing
1. ✅ Test in private mode first
2. ✅ Get feedback from pilot users (5-10 people)
3. ✅ Address all critical bugs
4. ✅ Update documentation
5. ✅ Create screenshots for marketplace

### After Publishing
1. ✅ Monitor for errors first 48 hours
2. ✅ Respond to user feedback quickly
3. ✅ Plan regular updates
4. ✅ Keep documentation current

### Security
1. ✅ Never commit API keys or secrets
2. ✅ Use environment variables for sensitive data
3. ✅ Keep dependencies updated
4. ✅ Follow Azure DevOps security best practices

## Troubleshooting

### Package Creation Fails

**Error**: "Cannot find module"
**Solution**: Run `npm install` first

**Error**: "No files matched"
**Solution**: Ensure `dist/` folder exists and contains built files

### Upload Fails

**Error**: "Extension already exists"
**Solution**: Increment version number in vss-extension.json

**Error**: "Publisher not found"
**Solution**: Create publisher account first

### Extension Won't Install

**Error**: "Organization admin required"
**Solution**: Contact your Azure DevOps admin to install

**Error**: "Scopes not available"
**Solution**: Check that required scopes are supported by your Azure DevOps instance

## Support

For deployment issues:
- [Azure DevOps Extensions Documentation](https://docs.microsoft.com/en-us/azure/devops/extend/)
- [TFX-CLI GitHub](https://github.com/Microsoft/tfs-cli)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/azure-devops-extensions)

---

**Last Updated**: 2026-02-10
