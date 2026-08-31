/**
 * Local UI preview with mock data and no Azure DevOps SDK.
 *
 * Run: npm run preview
 *
 * Both surfaces are rendered through the same view components the extension
 * ships — ProjectTimesheetView and WorkItemTimesheetView — so what shows here
 * is the real layout, filters and empty states rather than a copy that drifts.
 * Only the containers are replaced: this file plays the part of storage, work
 * item metadata and the REST client, none of which are exercised. Anything that
 * depends on them for real has to be tried in a project; see
 * docs/LOCAL_TESTING.md.
 */

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  TimeEntry,
  ActivityType,
  CreateTimeEntryInput,
  UpdateTimeEntryInput
} from './models/TimeEntry';
import { WorkItemMeta } from './services/WorkItemMetadataService';
import { ProjectTimesheetView } from './components/ProjectTimesheet/ProjectTimesheetView';
import { WorkItemTimesheetView } from './components/WorkItemTimesheet/WorkItemTimesheetView';
import { partitionByProject } from './utils/projectScope';
import { formatDateToISO } from './utils/dateUtils';
import { Button } from '@/components/ui/button';
import './styles.css';

const PROJECT = { id: 'guid-web', name: 'Web Platform' };

/** The work item whose tab the preview stands in for */
const TAB_WORK_ITEM = 1101;

/** Whose entries carry edit and delete controls in the preview */
const CURRENT_USER = 'u1';

// Epic > Feature > User Story > Task | Bug | Suggestion
const META: WorkItemMeta[] = [
  { id: 900, title: 'Customer Platform', workItemType: 'Epic', state: 'Active', iterationPath: 'Web Platform\\Sprint 12', projectName: 'Web Platform' },
  { id: 1042, title: 'Customer Onboarding Revamp', workItemType: 'Feature', state: 'Active', iterationPath: 'Web Platform\\Sprint 12', projectName: 'Web Platform', parentId: 900, rollupId: 1042, rollupTitle: 'Customer Onboarding Revamp', rollupType: 'Feature' },
  { id: 1058, title: 'Billing & Invoicing', workItemType: 'Feature', state: 'Active', iterationPath: 'Web Platform\\Sprint 13', projectName: 'Web Platform', parentId: 900, rollupId: 1058, rollupTitle: 'Billing & Invoicing', rollupType: 'Feature' },
];

function leaf(
  id: number,
  title: string,
  type: string,
  state: string,
  rollupId: number | undefined,
  rollupTitle: string | undefined,
  estimate?: number,
  iterationPath = 'Web Platform\\Sprint 12'
): WorkItemMeta {
  return {
    id, title, workItemType: type, state, iterationPath, projectName: 'Web Platform',
    rollupId, rollupTitle, rollupType: rollupId ? 'Feature' : undefined, originalEstimate: estimate
  };
}

const metadata = new Map<number, WorkItemMeta>();
[
  ...META,
  leaf(TAB_WORK_ITEM, 'Build signup wizard', 'Task', 'Closed', 1042, 'Customer Onboarding Revamp', 20),
  leaf(1119, 'Wizard back button loses state', 'Bug', 'In Development', 1042, 'Customer Onboarding Revamp', 8),
  leaf(1122, 'Add a progress indicator', 'Suggestion', 'In Testing', 1042, 'Customer Onboarding Revamp', 6),
  leaf(1145, 'Stripe webhook handler', 'Task', 'In Development', 1058, 'Billing & Invoicing', 24, 'Web Platform\\Sprint 13'),
  leaf(1163, 'Proration miscalculated', 'Bug', 'New', 1058, 'Billing & Invoicing', 10, 'Web Platform\\Sprint 13'),
  leaf(1222, 'Login page 500 on Safari', 'Bug', 'Closed', undefined, undefined, 4),
].forEach(m => metadata.set(m.id, m));

/**
 * Dates are relative to today rather than fixed, so the date presets and the
 * working-day maths have data to work with whenever the preview is run.
 */
function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateToISO(date);
}

let seq = 0;
function entry(
  workItemId: number,
  userId: string,
  name: string,
  daysBack: number,
  startTime: string,
  hours: number,
  activityType: ActivityType,
  description?: string
): TimeEntry {
  seq++;
  const date = daysAgo(daysBack);
  const [h, m] = startTime.split(':').map(Number);
  const endMinutes = h * 60 + m + Math.round(hours * 60);
  const endTime = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
  return {
    id: `e${seq}`, workItemId, projectId: PROJECT.id, projectName: PROJECT.name,
    userId, userDisplayName: name, date, startTime, endTime, hours,
    description, activityType,
    createdAt: `${date}T${startTime}:00Z`, updatedAt: `${date}T${startTime}:00Z`
  };
}

const SEED_ENTRIES: TimeEntry[] = [
  entry(TAB_WORK_ITEM, 'u1', 'Priya Raman', 20, '09:00', 4.5, ActivityType.Development, 'Wizard shell, routing and the step model.'),
  entry(TAB_WORK_ITEM, 'u1', 'Priya Raman', 19, '09:15', 3.25, ActivityType.Development),
  entry(1119, 'u2', 'Daniel Osei', 19, '13:00', 2.5, ActivityType.BugFixing),
  entry(1122, 'u3', 'Mei Tanaka', 18, '10:00', 3, ActivityType.Design),
  entry(1145, 'u2', 'Daniel Osei', 18, '09:00', 6, ActivityType.Development),
  entry(1145, 'u2', 'Daniel Osei', 17, '09:00', 5.5, ActivityType.Development),
  entry(1163, 'u1', 'Priya Raman', 17, '14:00', 2, ActivityType.BugFixing),
  entry(1222, 'u4', 'Aisha Bello', 16, '11:00', 3.75, ActivityType.Testing),
  entry(TAB_WORK_ITEM, 'u4', 'Aisha Bello', 16, '15:00', 1.5, ActivityType.CodeReview, 'Reviewed the wizard PR.'),
  entry(1145, 'u3', 'Mei Tanaka', 13, '09:30', 4, ActivityType.Documentation),
  entry(1119, 'u2', 'Daniel Osei', 12, '09:00', 2.25, ActivityType.Deployment),
  entry(1163, 'u1', 'Priya Raman', 12, '13:30', 3, ActivityType.Requirements),
  entry(TAB_WORK_ITEM, 'u1', 'Priya Raman', 4, '10:00', 2.75, ActivityType.Development),
  entry(1145, 'u2', 'Daniel Osei', 2, '09:00', 4, ActivityType.Development),
];

// An entry from another project, to prove the scoping filter drops it
const FOREIGN: TimeEntry = {
  ...entry(7777, 'u1', 'Priya Raman', 13, '09:00', 8, ActivityType.Development),
  projectId: 'guid-mobile',
  projectName: 'Mobile App'
};

// An entry with no project stamp on an unreadable work item: attributable
// neither way, so the report has to disclose it rather than count it
const UNATTRIBUTED: TimeEntry = {
  ...entry(9999, 'u3', 'Mei Tanaka', 15, '11:00', 1.5, ActivityType.Testing),
  projectId: undefined,
  projectName: undefined
};

const METADATA_ERROR =
  'getWorkItems (fields, 50 ids) did not respond within 12000ms';

type Surface = 'hub' | 'tab';

const Toggle: React.FC<{
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ on, onClick, children }) => (
  <Button size="sm" variant={on ? 'default' : 'outline'} onClick={onClick}>
    {children}
  </Button>
);

const PreviewApp: React.FC = () => {
  const [surface, setSurface] = useState<Surface>('hub');
  const [entries, setEntries] = useState<TimeEntry[]>(SEED_ENTRIES);
  const [includeForeign, setIncludeForeign] = useState(true);
  const [includeUnattributed, setIncludeUnattributed] = useState(false);
  const [emptyProject, setEmptyProject] = useState(false);
  const [failMetadata, setFailMetadata] = useState(false);
  const [failSync, setFailSync] = useState(false);
  const [syncWarning, setSyncWarning] = useState(false);
  const [stateWarning, setStateWarning] = useState(false);

  const dataset = emptyProject
    ? []
    : [
        ...entries,
        ...(includeForeign ? [FOREIGN] : []),
        ...(includeUnattributed ? [UNATTRIBUTED] : [])
      ];

  const partition = partitionByProject(dataset, metadata, PROJECT);

  /* Storage stands in for the data service: mutations land in memory, so the
     panel, the form and the ownership rules can be driven end to end. */
  const [seqRef] = useState(() => ({ next: 0 }));
  const nextId = () => `p${(seqRef.next += 1)}`;

  const handleSave = async (input: CreateTimeEntryInput | UpdateTimeEntryInput) => {
    if (failSync) setSyncWarning(true);

    if ('id' in input) {
      setEntries(current =>
        current.map(existing =>
          existing.id === input.id
            ? {
                ...existing,
                ...input,
                hours: input.hours ?? existing.hours,
                updatedAt: new Date().toISOString()
              }
            : existing
        )
      );
      return;
    }

    // The real service only transitions state on a work item's first entry
    const isFirstOnWorkItem = !entries.some(
      e => e.workItemId === input.workItemId
    );
    if (isFirstOnWorkItem && failSync) setStateWarning(true);

    const now = new Date().toISOString();
    const created: TimeEntry = {
      id: nextId(),
      workItemId: input.workItemId,
      projectId: PROJECT.id,
      projectName: PROJECT.name,
      userId: CURRENT_USER,
      userDisplayName: 'Priya Raman',
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      hours: input.hours,
      description: input.description,
      activityType: input.activityType,
      createdAt: now,
      updatedAt: now
    };
    setEntries(current => [created, ...current]);
  };

  const handleDelete = async (target: TimeEntry) => {
    if (failSync) setSyncWarning(true);
    setEntries(current => current.filter(e => e.id !== target.id));
  };

  const reseed = () => {
    setEntries(SEED_ENTRIES);
    setSyncWarning(false);
    setStateWarning(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Preview-only chrome. Everything below it is the shipped UI. */}
      <div className="space-y-2 border-b border-dashed bg-muted/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-sm">Local preview</strong>
          <span className="text-xs text-muted-foreground">
            mock data, no Azure DevOps — storage, work item metadata and the REST
            client are not exercised
          </span>
          <div className="flex-1" />
          <Toggle on={surface === 'hub'} onClick={() => setSurface('hub')}>
            Project hub
          </Toggle>
          <Toggle on={surface === 'tab'} onClick={() => setSurface('tab')}>
            Work item tab
          </Toggle>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {surface === 'hub' ? (
            <>
              <Toggle on={emptyProject} onClick={() => setEmptyProject(v => !v)}>
                Empty project
              </Toggle>
              <Toggle on={includeForeign} onClick={() => setIncludeForeign(v => !v)}>
                Other project's entry
              </Toggle>
              <Toggle
                on={includeUnattributed}
                onClick={() => setIncludeUnattributed(v => !v)}
              >
                Unattributable entry
              </Toggle>
              <Toggle on={failMetadata} onClick={() => setFailMetadata(v => !v)}>
                Work item lookup fails
              </Toggle>
              <span className="text-xs text-muted-foreground">
                scoped out: {partition.otherProject.length} · unattributable:{' '}
                {partition.unattributed.length}
              </span>
            </>
          ) : (
            <>
              <Toggle on={failSync} onClick={() => setFailSync(v => !v)}>
                Field sync fails
              </Toggle>
              <span className="text-xs text-muted-foreground">
                editing as Priya Raman — her entries carry edit and delete
              </span>
            </>
          )}
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={reseed}>
            Reset data
          </Button>
        </div>
      </div>

      {surface === 'hub' ? (
        <ProjectTimesheetView
          projectName={PROJECT.name}
          projectEntries={failMetadata ? [] : partition.inProject}
          metadata={failMetadata ? new Map() : metadata}
          unattributedCount={partition.unattributed.length}
          metadataError={failMetadata ? METADATA_ERROR : null}
          endpointFailed={failMetadata}
          onRefresh={reseed}
          onRetry={() => setFailMetadata(false)}
        />
      ) : (
        <WorkItemTimesheetView
          workItemId={TAB_WORK_ITEM}
          entries={partition.inProject
            .filter(e => e.workItemId === TAB_WORK_ITEM)
            .sort((a, b) => b.date.localeCompare(a.date))}
          currentUserId={CURRENT_USER}
          syncWarning={syncWarning}
          stateTransitionWarning={stateWarning}
          onDismissSyncWarning={() => setSyncWarning(false)}
          onDismissStateWarning={() => setStateWarning(false)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<PreviewApp />);
}
