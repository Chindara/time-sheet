import { TimeEntry } from '../models/TimeEntry';
import { WorkItemMeta } from '../services/WorkItemMetadataService';

export interface ProjectContext {
  id: string;
  name: string;
}

export interface ProjectPartition {
  /** Entries confidently attributed to the current project */
  inProject: TimeEntry[];
  /** Entries confidently attributed to a different project */
  otherProject: TimeEntry[];
  /**
   * Entries that cannot be attributed either way: no stored project stamp, and
   * their work item could not be read (deleted, or no permission).
   */
  unattributed: TimeEntry[];
}

/**
 * Splits entries by whether they belong to the current project.
 *
 * Time entries live in the extension's account-wide storage scope, which has no
 * project dimension, so every project in the organization shares one collection.
 * Attribution therefore has to be reconstructed, in priority order:
 *
 * 1. The work item's `System.TeamProject`. This is the authority — it is correct
 *    even for entries written before project stamping existed, and it follows
 *    the work item if it is moved between projects.
 * 2. The `projectId` / `projectName` stamped on the entry at creation. Used only
 *    when the work item could not be read, so a restricted work item in this
 *    project still counts toward its totals.
 *
 * Entries matching neither are returned as `unattributed` rather than being
 * silently folded into the current project — counting them would leak another
 * project's hours into this project's report, and dropping them without a word
 * would make the numbers quietly incomplete. Callers are expected to disclose
 * the count.
 */
export function partitionByProject(
  entries: TimeEntry[],
  metadata: Map<number, WorkItemMeta>,
  project: ProjectContext
): ProjectPartition {
  const inProject: TimeEntry[] = [];
  const otherProject: TimeEntry[] = [];
  const unattributed: TimeEntry[] = [];

  for (const entry of entries) {
    const meta = metadata.get(entry.workItemId);

    if (meta && meta.projectName) {
      (meta.projectName === project.name ? inProject : otherProject).push(entry);
      continue;
    }

    if (entry.projectId || entry.projectName) {
      const matches =
        (!!entry.projectId && entry.projectId === project.id) ||
        (!!entry.projectName && entry.projectName === project.name);
      (matches ? inProject : otherProject).push(entry);
      continue;
    }

    unattributed.push(entry);
  }

  return { inProject, otherProject, unattributed };
}

export interface ProjectAttribution {
  entry: TimeEntry;
  /** Resolved project label — a name when known, otherwise the stamped id */
  projectName: string;
}

export interface ProjectAttributionResult {
  attributed: ProjectAttribution[];
  /** Count of entries that could not be tied to any project, for disclosure */
  unattributedCount: number;
}

/**
 * Resolves every entry's project using the same priority order as
 * partitionByProject (work item's System.TeamProject first, then the stamped
 * projectId/projectName), but keeps each entry's own project instead of
 * filtering against a single target — for reports that span every project.
 */
export function attributeProjects(
  entries: TimeEntry[],
  metadata: Map<number, WorkItemMeta>
): ProjectAttributionResult {
  const attributed: ProjectAttribution[] = [];
  let unattributedCount = 0;

  for (const entry of entries) {
    const meta = metadata.get(entry.workItemId);

    if (meta && meta.projectName) {
      attributed.push({ entry, projectName: meta.projectName });
      continue;
    }

    if (entry.projectName || entry.projectId) {
      attributed.push({ entry, projectName: entry.projectName || entry.projectId! });
      continue;
    }

    unattributedCount++;
  }

  return { attributed, unattributedCount };
}

export interface MonthlySummaryRow {
  project: string;
  user: string;
  totalHours: number;
}

/**
 * Sums hours per project/user pair, sorted by project then user so the
 * exported report reads the same way every time.
 */
export function aggregateByProjectAndUser(attributed: ProjectAttribution[]): MonthlySummaryRow[] {
  const totals = new Map<string, MonthlySummaryRow>();

  for (const { entry, projectName } of attributed) {
    const key = `${projectName}\u0000${entry.userDisplayName}`;
    const existing = totals.get(key);
    if (existing) {
      existing.totalHours += entry.hours;
    } else {
      totals.set(key, { project: projectName, user: entry.userDisplayName, totalHours: entry.hours });
    }
  }

  return Array.from(totals.values()).sort(
    (a, b) => a.project.localeCompare(b.project) || a.user.localeCompare(b.user)
  );
}
