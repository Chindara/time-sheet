import { TimeEntry } from '../models/TimeEntry';

/**
 * Pure aggregation helpers shared by the work item Time Sheet tab and the
 * project Time Sheet hub, so both surfaces compute totals the same way.
 */

/**
 * Sums the hours of a set of time entries
 */
export function totalHours(entries: TimeEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.hours, 0);
}

/**
 * Groups entries by an arbitrary key, preserving first-seen key order
 */
export function groupBy<K>(entries: TimeEntry[], keyOf: (entry: TimeEntry) => K): Map<K, TimeEntry[]> {
  const grouped = new Map<K, TimeEntry[]>();

  for (const entry of entries) {
    const key = keyOf(entry);
    const existing = grouped.get(key);
    if (existing) {
      existing.push(entry);
    } else {
      grouped.set(key, [entry]);
    }
  }

  return grouped;
}

/**
 * Sums hours per group, preserving the grouping's key order
 */
export function sumByGroup<K>(grouped: Map<K, TimeEntry[]>): Map<K, number> {
  const sums = new Map<K, number>();
  grouped.forEach((groupEntries, key) => {
    sums.set(key, totalHours(groupEntries));
  });
  return sums;
}

export function groupByWorkItem(entries: TimeEntry[]): Map<number, TimeEntry[]> {
  return groupBy(entries, e => e.workItemId);
}

export function groupByActivity(entries: TimeEntry[]): Map<string, TimeEntry[]> {
  return groupBy(entries, e => e.activityType as string);
}

export function groupByUser(entries: TimeEntry[]): Map<string, TimeEntry[]> {
  return groupBy(entries, e => e.userId);
}

export function hoursByActivity(entries: TimeEntry[]): Map<string, number> {
  return sumByGroup(groupByActivity(entries));
}

export function hoursByUser(entries: TimeEntry[]): Map<string, number> {
  return sumByGroup(groupByUser(entries));
}

/**
 * Counts distinct values of a key across a set of entries
 */
export function distinctCount<K>(entries: TimeEntry[], keyOf: (entry: TimeEntry) => K): number {
  return new Set(entries.map(keyOf)).size;
}

/**
 * Sorts entries newest first, breaking ties on creation time
 */
export function sortByDateDesc(entries: TimeEntry[]): TimeEntry[] {
  return entries
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

/**
 * Returns a share of a total as a percentage, guarding against divide-by-zero
 */
export function shareOfTotal(value: number, total: number): number {
  return total === 0 ? 0 : (value / total) * 100;
}
