import { TimeEntry } from '../models/TimeEntry';
import { WorkItemMeta } from '../services/WorkItemMetadataService';
import { distinctCount, shareOfTotal, totalHours } from './aggregate';
import { ACTIVITY_ORDER } from './activityColors';

export type GroupBy = 'feature' | 'workItem' | 'contributor' | 'activity';

export const GROUP_BY_LABELS: Record<GroupBy, string> = {
  feature: 'Feature',
  workItem: 'Work item',
  contributor: 'Contributor',
  activity: 'Activity'
};

/** Row-level column header for the first column, per grouping */
export const GROUP_BY_COLUMN: Record<GroupBy, string> = {
  feature: 'Feature',
  workItem: 'Work item',
  contributor: 'Contributor',
  activity: 'Activity'
};

export interface ActivitySlice {
  activity: string;
  hours: number;
}

export interface BreakdownRow {
  key: string;
  label: string;
  /** Work item id for feature and work item groupings */
  id?: number;
  /**
   * Work item type behind the row. On a feature-grouped row this is the rollup
   * ancestor's type, so a group that actually rolled up to an Epic can say so
   * rather than being labelled a Feature.
   */
  itemType?: string;
  hours: number;
  /** Percentage of the report total */
  share: number;
  contributors: number;
  workItems: number;
  closedWorkItems: number;
  activityMix: ActivitySlice[];
  /** Aggregate row for work items the viewer is not allowed to read */
  restricted: boolean;
  /** Catch-all row for work items with no Feature or Epic ancestor */
  unparented: boolean;
}

export interface ProjectSummary {
  totalHours: number;
  entryCount: number;
  contributors: number;
  workItems: number;
  workingDays: number;
  hoursPerWorkingDay: number;
  /** Sum of Original Estimate across readable work items with time logged */
  originalEstimate: number;
  /** Logged hours as a percentage of original estimate, null when no estimates */
  estimateUsedPercent: number | null;
  /** Positive when under estimate, negative when over */
  estimateRemaining: number;
}

/**
 * States treated as complete when counting a group's progress. Process
 * templates differ, so this covers the common terminal states across Agile,
 * Scrum, CMMI and Basic rather than querying state categories.
 */
const CLOSED_STATES = ['Closed', 'Done', 'Completed', 'Resolved', 'Removed'];

const RESTRICTED_KEY = 'restricted';
const UNPARENTED_KEY = 'unparented';

interface Bucket {
  key: string;
  label: string;
  id?: number;
  itemType?: string;
  entries: TimeEntry[];
  restricted: boolean;
  unparented: boolean;
}

/**
 * Builds the flat summary table — one row per group, sorted by hours, with the
 * "No parent feature" and "Restricted" catch-alls pinned to the bottom.
 */
export function buildBreakdown(
  entries: TimeEntry[],
  metadata: Map<number, WorkItemMeta>,
  groupBy: GroupBy
): BreakdownRow[] {
  const buckets = new Map<string, Bucket>();

  const push = (bucket: Omit<Bucket, 'entries'>, entry: TimeEntry) => {
    const existing = buckets.get(bucket.key);
    if (existing) {
      existing.entries.push(entry);
    } else {
      buckets.set(bucket.key, { ...bucket, entries: [entry] });
    }
  };

  for (const entry of entries) {
    const meta = metadata.get(entry.workItemId);

    switch (groupBy) {
      case 'feature': {
        if (!meta) {
          push(restrictedBucket(), entry);
        } else if (meta.rollupId === undefined) {
          push(
            { key: UNPARENTED_KEY, label: 'No parent feature', restricted: false, unparented: true },
            entry
          );
        } else {
          push(
            {
              key: `feature-${meta.rollupId}`,
              label: meta.rollupTitle ?? `Work item ${meta.rollupId}`,
              id: meta.rollupId,
              itemType: meta.rollupType,
              restricted: false,
              unparented: false
            },
            entry
          );
        }
        break;
      }

      case 'workItem': {
        if (!meta) {
          push(restrictedBucket(), entry);
        } else {
          push(
            {
              key: `wi-${meta.id}`,
              label: meta.title,
              id: meta.id,
              itemType: meta.workItemType,
              restricted: false,
              unparented: false
            },
            entry
          );
        }
        break;
      }

      case 'contributor':
        push(
          {
            key: `user-${entry.userId}`,
            label: entry.userDisplayName,
            restricted: false,
            unparented: false
          },
          entry
        );
        break;

      case 'activity':
        push(
          {
            key: `act-${entry.activityType}`,
            label: entry.activityType,
            restricted: false,
            unparented: false
          },
          entry
        );
        break;
    }
  }

  const total = totalHours(entries);
  const rows = Array.from(buckets.values()).map(bucket => toRow(bucket, total, metadata));

  return rows.sort((a, b) => {
    const rank = (row: BreakdownRow) => (row.restricted ? 2 : row.unparented ? 1 : 0);
    return rank(a) - rank(b) || b.hours - a.hours || a.label.localeCompare(b.label);
  });
}

function restrictedBucket(): Omit<Bucket, 'entries'> {
  return { key: RESTRICTED_KEY, label: 'Restricted', restricted: true, unparented: false };
}

function toRow(
  bucket: Bucket,
  total: number,
  metadata: Map<number, WorkItemMeta>
): BreakdownRow {
  const hours = totalHours(bucket.entries);
  const workItemIds = new Set(bucket.entries.map(e => e.workItemId));

  let closedWorkItems = 0;
  workItemIds.forEach(id => {
    const meta = metadata.get(id);
    if (meta && CLOSED_STATES.includes(meta.state)) {
      closedWorkItems++;
    }
  });

  return {
    key: bucket.key,
    label: bucket.label,
    id: bucket.id,
    itemType: bucket.itemType,
    hours,
    share: shareOfTotal(hours, total),
    // A restricted row must not disclose who logged against those work items
    contributors: bucket.restricted ? 0 : distinctCount(bucket.entries, e => e.userId),
    workItems: workItemIds.size,
    closedWorkItems,
    activityMix: bucket.restricted ? [] : activityMix(bucket.entries),
    restricted: bucket.restricted,
    unparented: bucket.unparented
  };
}

/**
 * Hours per activity within a group, in fixed palette order so the strip's
 * colours stay stable between rows and between reloads.
 */
function activityMix(entries: TimeEntry[]): ActivitySlice[] {
  const hours = new Map<string, number>();

  for (const entry of entries) {
    const activity = entry.activityType as string;
    hours.set(activity, (hours.get(activity) ?? 0) + entry.hours);
  }

  const known = ACTIVITY_ORDER.filter(activity => hours.has(activity));
  const unknown = Array.from(hours.keys()).filter(activity => !ACTIVITY_ORDER.includes(activity));

  return [...known, ...unknown].map(activity => ({
    activity,
    hours: hours.get(activity) ?? 0
  }));
}

/**
 * Computes the summary metrics shown above the breakdown. Derived from the time
 * entries alone except for the estimate, which needs work item metadata.
 */
export function buildSummary(
  entries: TimeEntry[],
  metadata: Map<number, WorkItemMeta>,
  startDate: string,
  endDate: string
): ProjectSummary {
  const total = totalHours(entries);
  const workItemIds = new Set(entries.map(e => e.workItemId));

  let originalEstimate = 0;
  workItemIds.forEach(id => {
    const meta = metadata.get(id);
    if (meta?.originalEstimate) {
      originalEstimate += meta.originalEstimate;
    }
  });

  const workingDays = countWorkingDays(startDate, endDate);

  return {
    totalHours: total,
    entryCount: entries.length,
    contributors: distinctCount(entries, e => e.userId),
    workItems: workItemIds.size,
    workingDays,
    hoursPerWorkingDay: workingDays === 0 ? 0 : total / workingDays,
    originalEstimate,
    estimateUsedPercent: originalEstimate === 0 ? null : (total / originalEstimate) * 100,
    estimateRemaining: originalEstimate - total
  };
}

/**
 * Counts Monday-to-Friday days in an inclusive ISO date range
 */
export function countWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return 0;
  }

  let count = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}
