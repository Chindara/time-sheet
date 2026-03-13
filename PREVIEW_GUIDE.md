# Local Preview Guide

Preview the Time Sheet extension UI locally without deploying to Azure DevOps!

## 🚀 Quick Start

```bash
npm run preview
```

This will:
- Start a development server at http://localhost:3000
- Open your browser automatically
- Show the extension UI with mock data
- Enable hot reload (changes update automatically)

## 📋 Preview Features

### ✅ What Works in Preview

- **Add Time Entries**: Click "Log Time" to create new entries (saved in memory)
- **Edit Entries**: Click "Edit" on any entry you created
- **Delete Entries**: Click "Delete" to remove entries
- **Form Validation**: Test hour parsing (e.g., "2.5" or "2:30")
- **UI Layout**: See how components look and interact
- **Mock Data**: Start with 3 sample time entries to explore the UI
- **Styling**: Preview all colors, fonts, and layouts

### ⚠️ Limitations

- **Data Not Persisted**: Refreshing the page resets to mock data
- **No Azure DevOps Integration**: SDK features are mocked
- **Single User View**: Always shows as "John Doe"
- **Timesheet Report**: May not work fully (needs data service)

## 🎨 Development Workflow

### 1. Start Preview
```bash
npm run preview
```

### 2. Make Changes
Edit any file in `src/`:
- `src/components/` - React components
- `src/styles.css` - Styles
- `src/preview.tsx` - Preview app and mock data

### 3. See Updates
Changes appear automatically in the browser!

### 4. Build for Preview
To create a static preview build:
```bash
npm run preview:build
```
Output: `preview-dist/` folder

## 🧪 Testing Scenarios

### Scenario 1: Add Time Entry
1. Click "➕ Log Time" button
2. Fill in the form:
   - Date: Today
   - Hours: Try both formats (2.5 and 2:30)
   - Activity Type: Choose any
   - Description: Optional text
3. Click "Save"
4. ✅ Entry appears in list

### Scenario 2: Edit Entry
1. Find an entry you created
2. Click "Edit" button
3. Change the hours or description
4. Click "Update"
5. ✅ Entry updates in list

### Scenario 3: Delete Entry
1. Find an entry you created
2. Click "Delete" button
3. Confirm the dialog
4. ✅ Entry disappears

### Scenario 4: Form Validation
1. Click "Log Time"
2. Try invalid inputs:
   - Empty hours → Error
   - Negative hours → Error
   - Very large hours (100) → Warning
3. ✅ Validation messages appear

## 📝 Adding Mock Data

Edit `src/preview.tsx` to customize mock data:

```typescript
const mockEntries: TimeEntry[] = [
  {
    id: '1',
    workItemId: 123,
    userId: 'user-1',
    userDisplayName: 'Your Name',
    date: '2026-02-10',
    hours: 8.0,
    description: 'Your work description',
    activityType: ActivityType.Development,
    createdAt: '2026-02-10T09:00:00Z',
    updatedAt: '2026-02-10T09:00:00Z'
  }
  // Add more entries...
];
```

## 🔧 Troubleshooting

### Port 3000 already in use
```bash
# Use a different port
npx webpack serve --config webpack.preview.config.js --port 3001
```

### Changes not appearing
1. Stop the preview (Ctrl+C)
2. Clear browser cache
3. Run `npm run preview` again

### TypeScript errors
```bash
# Rebuild TypeScript definitions
npm run build
```

## 📦 Production Deployment

Preview is for **development only**. To deploy:

1. **Build extension**:
   ```bash
   npm run package
   ```

2. **Upload to Azure DevOps**:
   - Upload the `.vsix` file to Visual Studio Marketplace
   - Install in your Azure DevOps organization

3. **Test in real work item**:
   - Open any work item
   - Click the "Time Sheet" tab
   - Test with real Azure DevOps integration

## 🎯 Preview vs Production

| Feature | Preview | Production |
|---------|---------|------------|
| UI Components | ✅ Full | ✅ Full |
| Form Validation | ✅ Full | ✅ Full |
| Data Persistence | ❌ Memory only | ✅ Azure DevOps Storage |
| Work Item Context | ❌ Mocked | ✅ Real |
| User Identity | ❌ Fake | ✅ Real Azure DevOps user |
| Multi-user | ❌ Single user | ✅ Multiple users |
| Timesheet Reports | ⚠️ Limited | ✅ Full |

## 💡 Tips

1. **Test UI changes quickly**: Use preview for rapid iteration on styles and layout
2. **Validate forms**: Test edge cases like very large/small hours
3. **Check responsive layout**: Resize browser window to test responsiveness
4. **Experiment freely**: Preview changes don't affect production
5. **Use with dev build**: Run `npm run dev` in another terminal for faster rebuilds

---

**Ready to preview?** Run `npm run preview` and start developing! 🚀
