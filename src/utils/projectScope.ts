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
