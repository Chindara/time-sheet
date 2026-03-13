/**
 * Local development preview with mocked Azure DevOps SDK
 * Run: npm run dev-preview
 */

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TimeEntryForm } from './components/TimeEntryForm/TimeEntryForm';
import { TimeEntryList } from './components/TimeEntryList/TimeEntryList';
import { TimesheetReport } from './components/TimesheetReport/TimesheetReport';
import { TimeEntry, ActivityType } from './models/TimeEntry';
import './styles.css';

// Mock data for preview
const mockEntries: TimeEntry[] = [
  {
    id: '1',
    workItemId: 123,
    userId: 'user-1',
    userDisplayName: 'John Doe',
    date: '2026-02-10',
    hours: 4.5,
    description: 'Implemented user authentication feature',
    activityType: ActivityType.Development,
    createdAt: '2026-02-10T09:00:00Z',
    updatedAt: '2026-02-10T09:00:00Z'
  },
  {
    id: '2',
    workItemId: 123,
    userId: 'user-1',
    userDisplayName: 'John Doe',
    date: '2026-02-09',
    hours: 2.0,
    description: 'Code review for PR #456',
    activityType: ActivityType.CodeReview,
    createdAt: '2026-02-09T14:00:00Z',
    updatedAt: '2026-02-09T14:00:00Z'
  },
  {
    id: '3',
    workItemId: 123,
    userId: 'user-2',
    userDisplayName: 'Jane Smith',
    date: '2026-02-10',
    hours: 3.0,
    description: 'Fixed login page bug',
    activityType: ActivityType.BugFixing,
    createdAt: '2026-02-10T11:00:00Z',
    updatedAt: '2026-02-10T11:00:00Z'
  }
];

const PreviewApp: React.FC = () => {
  const [entries, setEntries] = useState<TimeEntry[]>(mockEntries);
  const [showForm, setShowForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | undefined>();
  const currentUserId = 'user-1';
  const workItemId = 123;

  const handleLogTime = () => {
    setEditingEntry(undefined);
    setShowForm(true);
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleSave = async (input: any) => {
    if ('id' in input) {
      // Update
      setEntries(prev => prev.map(e =>
        e.id === input.id
          ? { ...e, ...input, updatedAt: new Date().toISOString() }
          : e
      ));
    } else {
      // Create
      const newEntry: TimeEntry = {
        id: `entry-${Date.now()}`,
        workItemId,
        userId: currentUserId,
        userDisplayName: 'John Doe',
        date: input.date,
        hours: input.hours,
        description: input.description,
        activityType: input.activityType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setEntries(prev => [newEntry, ...prev]);
    }
    setShowForm(false);
    setEditingEntry(undefined);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEntry(undefined);
  };

  const handleDelete = async (entry: TimeEntry) => {
    if (window.confirm(`Delete time entry: ${entry.hours}h on ${entry.date}?`)) {
      setEntries(prev => prev.filter(e => e.id !== entry.id));
    }
  };

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Preview Header */}
      <div style={{
        background: '#0078d4',
        color: 'white',
        padding: '15px 20px',
        marginBottom: '20px',
        borderRadius: '4px'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🧪 Local Preview - Time Sheet Extension</h1>
        <p style={{ margin: '5px 0 0', opacity: 0.9 }}>
          Work Item #123 | User: John Doe | Mode: Development Preview
        </p>
      </div>

      {/* Preview Note */}
      <div style={{
        background: '#fff4ce',
        border: '1px solid #ffb900',
        borderLeft: '4px solid #ffb900',
        padding: '12px 16px',
        marginBottom: '20px',
        borderRadius: '4px'
      }}>
        <strong>⚠️ Preview Mode:</strong> This is a local preview with mock data.
        Changes are not saved. Deploy to Azure DevOps to test real functionality.
      </div>

      {/* Main UI */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '1px solid #edebe9'
        }}>
          <div>
            <h2 style={{ margin: '0 0 5px' }}>Time Sheet</h2>
            <p style={{ margin: 0, color: '#605e5c' }}>
              Total hours logged: {totalHours.toFixed(2)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleLogTime}
              disabled={showForm || showReport}
              style={{
                background: '#0078d4',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '2px',
                cursor: showForm || showReport ? 'not-allowed' : 'pointer',
                opacity: showForm || showReport ? 0.6 : 1
              }}
            >
              ➕ Log Time
            </button>
            <button
              onClick={() => setShowReport(true)}
              disabled={showForm || showReport}
              style={{
                background: '#fff',
                color: '#0078d4',
                border: '1px solid #0078d4',
                padding: '8px 16px',
                borderRadius: '2px',
                cursor: showForm || showReport ? 'not-allowed' : 'pointer',
                opacity: showForm || showReport ? 0.6 : 1
              }}
            >
              📅 My Timesheet
            </button>
          </div>
        </div>

        {/* Content */}
        {showReport ? (
          <TimesheetReport onClose={() => setShowReport(false)} />
        ) : showForm ? (
          <TimeEntryForm
            workItemId={workItemId}
            entry={editingEntry}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <TimeEntryList
            entries={entries}
            currentUserId={currentUserId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Preview Info */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#f3f2f1',
        borderRadius: '4px',
        fontSize: '14px',
        color: '#605e5c'
      }}>
        <strong>Preview Features:</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>✅ Add, edit, and delete time entries (in-memory only)</li>
          <li>✅ View time entry list with mock data</li>
          <li>✅ Test form validation and hour parsing</li>
          <li>✅ Preview UI layout and styling</li>
          <li>⚠️ Data not persisted (refreshing clears changes)</li>
          <li>⚠️ Timesheet report may not work fully (needs real data service)</li>
        </ul>
      </div>
    </div>
  );
};

// Render preview
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PreviewApp />);
}
