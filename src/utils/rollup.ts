/**
 * The parent-chain walk that maps a leaf work item to the Feature (or Epic) it
 * rolls up to.
 *
 * Kept separate from the REST plumbing so it can be exercised against a real
 * process hierarchy — Task/Bug/Suggestion under User Story under Feature under
 * Epic means the walk has to climb two levels before it finds anything to group
 * by, and getting that wrong silently dumps every entry into "No parent
 * feature".
 */

/** Hierarchy link pointing at a work item's parent */
export const PARENT_REL = 'System.LinkTypes.Hierarchy-Reverse';

/** Just enough of a REST work item to find its parent */
export interface ParentSource {
  fields?: { [key: string]: any };
  relations?: { rel: string; url: string }[];
}

/**
 * Reads a work item's parent id.
 *
 * Prefers `System.Parent` when the server supplies it, falling back to the
 * hierarchy relation whose URL ends in the parent's id. The relation is
 * available on every API version; the field is not, which is why it cannot be
 * requested in a `fields` list without risking a 400 on the whole batch.
 */
export function parentIdOf(workItem: ParentSource): number | undefined {
  const field = workItem.fields?.['System.Parent'];

  if (typeof field === 'number' && Number.isFinite(field)) return field;

  if (typeof field === 'string' && field.trim() !== '') {
    const parsed = Number(field);
    if (Number.isFinite(parsed)) return parsed;
  }

  const relation = (workItem.relations ?? []).find(link => link.rel === PARENT_REL);
  if (!relation?.url) return undefined;

  const id = Number(relation.url.split('/').pop());
  return Number.isFinite(id) && id > 0 ? id : undefined;
}

/** The shape the walk needs; `WorkItemMeta` satisfies it */
export interface RollupNode {
  id: number;
  title: string;
  workItemType: string;
  parentId?: number;
}

export interface RollupResult {
  rollupId: number;
  rollupTitle: string;
  rollupType: string;
}

export interface RollupOptions {
  /** Work item types a group can be titled by, nearest match wins */
  rollupTypes: string[];
  /** How many ancestor levels to inspect before giving up */
  maxDepth: number;
}

/**
 * Resolves the nearest rollup ancestor for each id.
 *
 * `cache` is read and written in place: nodes already present are reused, and
 * ancestors fetched along the way are added, so repeated calls across a session
 * only fetch levels they have not seen. `fetchNodes` is called once per level
 * with the ids still needed, which keeps the walk to one batched request per
 * level rather than one per work item. Ids it does not return are treated as
 * unreadable and the walk stops for the items depending on them.
 */
export async function resolveRollups<T extends RollupNode>(
  ids: number[],
  cache: Map<number, T>,
  fetchNodes: (ids: number[]) => Promise<T[]>,
  options: RollupOptions
): Promise<Map<number, RollupResult>> {
  const results = new Map<number, RollupResult>();
  const asResult = (node: RollupNode): RollupResult => ({
    rollupId: node.id,
    rollupTitle: node.title,
    rollupType: node.workItemType
  });

  // itemId -> the ancestor id still to inspect for it
  let pending = new Map<number, number>();

  for (const id of ids) {
    const node = cache.get(id);
    if (!node) continue;

    if (options.rollupTypes.includes(node.workItemType)) {
      // The item is itself a Feature or Epic — it is its own group
      results.set(id, asResult(node));
    } else if (node.parentId !== undefined) {
      pending.set(id, node.parentId);
    }
  }

  for (let depth = 0; depth < options.maxDepth && pending.size > 0; depth++) {
    const needed = Array.from(new Set(pending.values())).filter(id => !cache.has(id));

    if (needed.length > 0) {
      for (const node of await fetchNodes(needed)) {
        cache.set(node.id, node);
      }
    }

    const next = new Map<number, number>();

    pending.forEach((ancestorId, itemId) => {
      const ancestor = cache.get(ancestorId);
      if (!ancestor) return; // unreadable or deleted — stop climbing for this item

      if (options.rollupTypes.includes(ancestor.workItemType)) {
        results.set(itemId, asResult(ancestor));
      } else if (ancestor.parentId !== undefined) {
        next.set(itemId, ancestor.parentId);
      }
    });

    pending = next;
  }

  return results;
}
