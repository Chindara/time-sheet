/**
 * Local UI preview with mock data and no Azure DevOps SDK.
 *
 * Run: npm run preview
 *
 * The hub's container (ProjectTimesheet) talks to the SDK on mount, so this
 * renders its presentational parts directly against a fixed data set. That
 * covers layout, grouping, charts and empty states — the parts worth iterating
 * on locally. Anything touching storage, work item metadata or the REST client
 * has to be exercised in a real project; see docs/LOCAL_TESTING.md.
 */

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TimeEntry, ActivityType } from './models/TimeEntry';
import { WorkItemMeta } from './services/WorkItemMetadataService';
import { TimeEntryList } from './components/TimeEntryList/TimeEntryList';
import { BreakdownTable } from './components/ProjectTimesheet/BreakdownTable';
import { ProjectKpis } from './components/ProjectTimesheet/ProjectKpis';
import { ContributorBars } from './components/ProjectTimesheet/ContributorBars';
import { DailyHoursChart, DailyPoint, DailySeries } from './components/ProjectTimesheet/DailyHoursChart';
import { ActivityDonutChart } from './components/TimesheetReport/ActivityDonutChart';
import { buildBreakdown, buildSummary, GroupBy, GROUP_BY_LABELS } from './utils/breakdown';
import { hoursByUser } from './utils/aggregate';
import { ACTIVITY_ORDER } from './utils/activityColors';
import { buildContributorColors } from './utils/contributorColors';
import { partitionByProject } from './utils/projectScope';
import { Button } from '@/components/ui/button';
import './styles.css';

const PROJECT = { id: 'guid-web', name: 'Web Platform' };

// Epic > Feature > User Story > Task | Bug | Suggestion
const META: WorkItemMeta[] = [
  { id: 900, title: 'Customer Platform', workItemType: 'Epic', state: 'Active', areaPath: 'Web Platform', projectName: 'Web Platform' },
  { id: 1042, title: 'Customer Onboarding Revamp', workItemType: 'Feature', state: 'Active', areaPath: 'Web Platform', projectName: 'Web Platform', parentId: 900, rollupId: 1042, rollupTitle: 'Customer Onboarding Revamp', rollupType: 'Feature' },
  { id: 1058, title: 'Billing & Invoicing', workItemType: 'Feature', state: 'Active', areaPath: 'Web Platform\\Billing', projectName: 'Web Platform', parentId: 900, rollupId: 1058, rollupTitle: 'Billing & Invoicing', rollupType: 'Feature' },
];

function leaf(
  id: number,
  title: string,
  type: string,
  state: string,
  rollupId: number | undefined,
  rollupTitle: string | undefined,
  estimate?: number,
  areaPath = 'Web Platform'
): WorkItemMeta {
  return {
    id, title, workItemType: type, state, areaPath, projectName: 'Web Platform',
    rollupId, rollupTitle, rollupType: rollupId ? 'Feature' : undefined, originalEstimate: estimate
  };
}

const metadata = new Map<number, WorkItemMeta>();
[
  ...META,
  leaf(1101, 'Build signup wizard', 'Task', 'Closed', 1042, 'Customer Onboarding Revamp', 20),
  leaf(1119, 'Wizard back button loses state', 'Bug', 'In Development', 1042, 'Customer Onboarding Revamp', 8),
  leaf(1122, 'Add a progress indicator', 'Suggestion', 'In Testing', 1042, 'Customer Onboarding Revamp', 6),
  leaf(1145, 'Stripe webhook handler', 'Task', 'In Development', 1058, 'Billing & Invoicing', 24, 'Web Platform\\Billing'),
  leaf(1163, 'Proration miscalculated', 'Bug', 'New', 1058, 'Billing & Invoicing', 10, 'Web Platform\\Billing'),
  leaf(1222, 'Login page 500 on Safari', 'Bug', 'Closed', undefined, undefined, 4),
].forEach(m => metadata.set(m.id, m));

let seq = 0;
function entry(
  workItemId: number,
  userId: string,
  name: string,
  date: string,
  startTime: string,
  hours: number,
  activityType: ActivityType
): TimeEntry {
  seq++;
  const [h, m] = startTime.split(':').map(Number);
  const endMinutes = h * 60 + m + Math.round(hours * 60);
  const endTime = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
  return {
    id: `e${seq}`, workItemId, projectId: PROJECT.id, projectName: PROJECT.name,
    userId, userDisplayName: name, date, startTime, endTime, hours,
    description: undefined, activityType,
    createdAt: `${date}T${startTime}:00Z`, updatedAt: `${date}T${startTime}:00Z`
  };
}

const ENTRIES: TimeEntry[] = [
  entry(1101, 'u1', 'Priya Raman', '2026-08-03', '09:00', 4.5, ActivityType.Development),
  entry(1101, 'u1', 'Priya Raman', '2026-08-04', '09:15', 3.25, ActivityType.Development),
  entry(1119, 'u2', 'Daniel Osei', '2026-08-04', '13:00', 2.5, ActivityType.BugFixing),
  entry(1122, 'u3', 'Mei Tanaka', '2026-08-05', '10:00', 3, ActivityType.Design),
  entry(1145, 'u2', 'Daniel Osei', '2026-08-05', '09:00', 6, ActivityType.Development),
  entry(1145, 'u2', 'Daniel Osei', '2026-08-06', '09:00', 5.5, ActivityType.Development),
  entry(1163, 'u1', 'Priya Raman', '2026-08-06', '14:00', 2, ActivityType.BugFixing),
  entry(1222, 'u4', 'Aisha Bello', '2026-08-07', '11:00', 3.75, ActivityType.Testing),
  entry(1101, 'u4', 'Aisha Bello', '2026-08-07', '15:00', 1.5, ActivityType.CodeReview),
  entry(1145, 'u3', 'Mei Tanaka', '2026-08-10', '09:30', 4, ActivityType.Documentation),
  entry(1119, 'u2', 'Daniel Osei', '2026-08-11', '09:00', 2.25, ActivityType.Deployment),
  entry(1163, 'u1', 'Priya Raman', '2026-08-11', '13:30', 3, ActivityType.Requirements),
];

// An entry from another project, to prove the scoping filter drops it
const FOREIGN: TimeEntry = {
  ...entry(7777, 'u1', 'Priya Raman', '2026-08-10', '09:00', 8, ActivityType.Development),
  projectId: 'guid-mobile',
  projectName: 'Mobile App'
};

const RANGE = { start: '2026-08-01', end: '2026-08-31' };

const Panel: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; flush?: boolean }> = ({
  title, subtitle, children, flush
}) => (
  <section className="overflow-hidden rounded-md border bg-card">
    <div className="flex items-center gap-3 border-b px-4 py-2.5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
    </div>
    <div className={flush ? '' : 'p-4'}>{children}</div>
  </section>
);

const PreviewApp: React.FC = () => {
  const [groupBy, setGroupBy] = useState<GroupBy>('feature');
  const [includeForeign, setIncludeForeign] = useState(true);
  const [showTab, setShowTab] = useState(false);

  const all = includeForeign ? [...ENTRIES, FOREIGN] : ENTRIES;
  const { inProject, otherProject } = partitionByProject(all, metadata, PROJECT);

  const summary = buildSummary(inProject, metadata, RANGE.start, RANGE.end);
  const rows = buildBreakdown(inProject, metadata, groupBy);

  const closed = (() => {
    let n = 0;
    new Set(inProject.map(e => e.workItemId)).forEach(id => {
      if (['Closed', 'Done', 'Completed', 'Resolved', 'Removed'].includes(metadata.get(id)?.state ?? '')) n++;
    });
    return n;
  })();

  const contributorNames = new Map(inProject.map(e => [e.userId, e.userDisplayName]));
  const contributors = Array.from(hoursByUser(inProject).entries())
    .map(([userId, hours]) => ({ userId, displayName: contributorNames.get(userId) ?? userId, hours }))
    .sort((a, b) => b.hours - a.hours);

  const dailyPoints: DailyPoint[] = (() => {
    const byDate = new Map<string, DailyPoint>();
    inProject.forEach(entry => {
      let point = byDate.get(entry.date);
      if (!point) {
        point = { date: entry.date, hours: 0, byUser: {} };
        byDate.set(entry.date, point);
      }
      point.hours += entry.hours;
      point.byUser[entry.userId] = (point.byUser[entry.userId] ?? 0) + entry.hours;
    });
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  })();

  // Same stable ordering the hub uses: alphabetical over every contributor
  const contributorSlots = Array.from(contributorNames.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const contributorColors = buildContributorColors(contributorSlots.map(c => c.value));
  const dailySeries: DailySeries[] = contributorSlots.map(c => ({
    userId: c.value,
    displayName: c.label,
    color: contributorColors.get(c.value) ?? '#9498a0'
  }));

  const activityHours = new Map<string, number>();
  ACTIVITY_ORDER.forEach(activity => {
    const total = inProject.filter(e => e.activityType === activity).reduce((s, e) => s + e.hours, 0);
    if (total > 0) activityHours.set(activity, total);
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-[1280px] space-y-3">
        <div className="rounded-md border border-dashed bg-muted/40 p-3 text-sm">
          <strong>Local preview</strong> — mock data, no Azure DevOps. Storage,
          work item metadata and the REST client are not exercised here.
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Group by</span>
          {(['feature', 'workItem', 'contributor', 'activity'] as GroupBy[]).map(option => (
            <Button
              key={option}
              size="sm"
              variant={groupBy === option ? 'default' : 'outline'}
              onClick={() => setGroupBy(option)}
            >
              {GROUP_BY_LABELS[option]}
            </Button>
          ))}
          <div className="flex-1" />
          <Button size="sm" variant={includeForeign ? 'default' : 'outline'} onClick={() => setIncludeForeign(v => !v)}>
            Foreign entry in data: {includeForeign ? 'yes' : 'no'}
          </Button>
          <span className="text-xs text-muted-foreground">
            excluded by scoping: {otherProject.length}
          </span>
          <Button size="sm" variant="outline" onClick={() => setShowTab(v => !v)}>
            {showTab ? 'Show hub' : 'Show work item list'}
          </Button>
        </div>

        {showTab ? (
          <Panel title="Work item tab — This work item" subtitle="work item #1101">
            <TimeEntryList
              entries={inProject.filter(e => e.workItemId === 1101)}
              currentUserId="u1"
              onEdit={() => undefined}
              onDelete={async () => undefined}
            />
          </Panel>
        ) : (
          <>
            <ProjectKpis summary={summary} dailyHours={dailyPoints.map(p => p.hours)} />

            <div className="grid items-start gap-3 lg:grid-cols-[1.85fr_1fr]">
              <div className="min-w-0 space-y-3">
                <Panel
                  title={`Time by ${GROUP_BY_LABELS[groupBy].toLowerCase()}`}
                  subtitle={`${rows.length} rows`}
                  flush
                >
                  <BreakdownTable
                    rows={rows}
                    groupBy={groupBy}
                    totalWorkItems={summary.workItems}
                    totalClosedWorkItems={closed}
                  />
                </Panel>
                <Panel title="Hours per day" subtitle={`${RANGE.start} to ${RANGE.end}`}>
                  <DailyHoursChart points={dailyPoints} series={dailySeries} />
                </Panel>
              </div>
              <div className="space-y-3">
                <Panel title="Hours by activity">
                  <ActivityDonutChart activityHours={activityHours} totalHours={summary.totalHours} />
                </Panel>
                <Panel title="Hours by contributor">
                  <ContributorBars contributors={contributors} totalHours={summary.totalHours} />
                </Panel>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<PreviewApp />);
}
