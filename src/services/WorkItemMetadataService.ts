import * as SDK from 'azure-devops-extension-sdk';
import {
  CommonServiceIds,
  ILocationService,
  IProjectPageService
} from 'azure-devops-extension-api';
import { getClient } from 'azure-devops-extension-api/Common';
import {
  WorkItem,
  WorkItemErrorPolicy,
  WorkItemExpand
} from 'azure-devops-extension-api/WorkItemTracking';
import { WorkItemTrackingRestClient } from 'azure-devops-extension-api/WorkItemTracking/WorkItemTrackingClient';
import { parentIdOf, resolveRollups } from '../utils/rollup';

/**
 * Ids per request. The API allows 200, but a large batch is the slowest and most
 * failure-prone shape — especially with an expand — and a request that never
 * returns stalls the whole report. Smaller batches complete.
 */
const BATCH_SIZE = 50;

/** Fields the report needs. Light: no expand, no relations. */
const CORE_FIELDS = [
  'System.Title',
  'System.WorkItemType',
  'System.State',
  'System.IterationPath',
  'System.TeamProject',
  'Microsoft.VSTS.Scheduling.OriginalEstimate'
];

/**
 * Request shapes, tried in order until one works, then reused for the rest of
 * the session. Each trades something different:
 *
 * - `fields`      cheapest, and `System.Parent` gives the parent chain directly.
 *                 Fails if the collection's API version rejects that field name.
 * - `relations`   parent comes from the hierarchy link instead, which every API
 *                 version supports. Heavier: no field projection.
 * - `core`        no parent at all. Titles, states and project scoping still
 *                 work; feature grouping degrades to "No parent feature".
 */
type FetchStrategy = 'fields' | 'relations' | 'core';
const STRATEGIES: FetchStrategy[] = ['fields', 'relations', 'core'];

/** Ceiling on a single work item request before it is treated as failed */
const REQUEST_TIMEOUT_MS = 12000;

/**
 * The generated client passes `errorPolicy` straight through as a query value,
 * and the REST API expects the enum's *name* rather than its numeric value —
 * `errorPolicy=2` is rejected. Send the name.
 */
const OMIT_ERROR_POLICY = 'Omit' as unknown as WorkItemErrorPolicy;

/**
 * Ceiling on any SDK host round-trip. The SDK resolves services by posting a
 * message to the parent frame; if the host never answers, the promise stays
 * pending indefinitely and takes the whole page's loading state with it.
 */
const SERVICE_TIMEOUT_MS = 10000;

/** Rejects if the promise has not settled in time, so a hang becomes an error */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} did not respond within ${ms}ms`)),
      ms
    );
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * Work item types a rollup group can be titled by. Nearest match wins, so in an
 * Epic > Feature > User Story > Task hierarchy a Task groups under its Feature.
 */
const ROLLUP_TYPES = ['Feature', 'Epic'];

/**
 * How many ancestor levels to inspect. Task > User Story > Feature needs two;
 * four leaves room for deeper custom hierarchies, and each level costs one
 * batched request only when that level is actually reached.
 */
const MAX_ANCESTOR_DEPTH = 4;

/**
 * Metadata for a single work item, as far as the current user is allowed to see it
 */
export interface WorkItemMeta {
  id: number;
  title: string;
  workItemType: string;
  state: string;
  /** Iteration (sprint) the work item is assigned to, as a backslash path */
  iterationPath: string;
  /** Project the work item lives in — the authority for attributing an entry */
  projectName: string;
  parentId?: number;
  originalEstimate?: number;
  /** Nearest Feature or Epic ancestor, absent when the item has none */
  rollupId?: number;
  rollupTitle?: string;
  /** Type of the rollup ancestor, so a group titled by an Epic can say so */
  rollupType?: string;
}

/**
 * Looks up work item metadata for the project time sheet report.
 *
 * The report only stores workItemId against each time entry, and
 * IWorkItemFormService does not exist outside a work item form, so titles,
 * types, states and parent links come from the Work Item Tracking REST API.
 */
export class WorkItemMetadataService {
  private client: WorkItemTrackingRestClient | null = null;
  private projectName = '';
  private projectId = '';
  private cache = new Map<number, WorkItemMeta>();
  /** Ids the API declined to return — cached so we do not re-request them */
  private inaccessible = new Set<number>();
  /**
   * Message from the most recent failed request, if any. A total failure here
   * otherwise looks identical to every work item being permission-trimmed, so
   * callers must surface it rather than rendering "no read access".
   */
  private lastError: string | null = null;
  /**
   * Set when even a single-id request fails, which means the endpoint itself is
   * unusable rather than a particular work item being unreadable.
   */
  private endpointFailed = false;
  /** Request shape known to work in this collection, once one has been found */
  private strategy: FetchStrategy | null = null;

  getLastError(): string | null {
    return this.lastError;
  }

  /** True when work item lookup is broken outright, not merely permission-trimmed */
  hasEndpointFailed(): boolean {
    return this.endpointFailed;
  }

  async initialize(): Promise<void> {
    await SDK.ready();

    const project = await this.resolveProject();

    if (!project) {
      throw new Error(
        'Unable to determine the current project. The Time Sheet hub must be opened from within a project.'
      );
    }

    this.projectName = project.name;
    this.projectId = project.id;

    /*
     * rootPath is supplied explicitly, and that is the whole point.
     *
     * Left to itself, getClient resolves the base URL lazily via
     * SDK.getService("ms.vss-features.location-service") on the first request.
     * Like every getService call, that is a message to the host frame with no
     * timeout — and when the host does not answer it, the very first REST call
     * hangs forever with no error to catch. Resolving the URL ourselves keeps
     * the request path free of host handshakes.
     */
    this.client = getClient(WorkItemTrackingRestClient, {
      rootPath: this.resolveRootPath()
    });
  }

  /**
   * Base URL for REST calls.
   *
   * Derived from the host context, which is already populated and synchronous.
   * The location service is only a fallback for hosts whose organization name
   * is not in the context (on-premises collections), and it is given a timeout
   * so it cannot stall the client it is meant to configure.
   */
  private async resolveRootPath(): Promise<string> {
    try {
      const host = SDK.getHost();
      if (host?.name) {
        return `https://dev.azure.com/${encodeURIComponent(host.name)}/`;
      }
      console.warn('Host context carried no organization name');
    } catch (error) {
      console.warn('Host context unavailable:', error);
    }

    const locationService = await withTimeout(
      SDK.getService<ILocationService>(CommonServiceIds.LocationService),
      SERVICE_TIMEOUT_MS,
      'LocationService'
    );
    const url = await withTimeout(
      locationService.getResourceAreaLocation(WorkItemTrackingRestClient.RESOURCE_AREA_ID),
      SERVICE_TIMEOUT_MS,
      'getResourceAreaLocation'
    );

    if (!url) {
      throw new Error('Unable to determine the Azure DevOps service URL');
    }
    return url;
  }

  /**
   * Resolves the current project.
   *
   * `getWebContext()` is synchronous and already populated by the time the SDK
   * is ready, so it is tried first. `getService` is only a fallback: resolving a
   * contribution id is a message round-trip to the host, and when the host does
   * not answer — which is what happens for `ProjectPageService` in some
   * contribution contexts — the promise never settles and the caller waits
   * forever. Hence the timeout: a slow handshake must degrade to an error, not
   * to a permanent loading spinner.
   */
  private async resolveProject(): Promise<{ id: string; name: string } | undefined> {
    try {
      const fromContext = SDK.getWebContext()?.project;
      if (fromContext?.id && fromContext.name) {
        return { id: fromContext.id, name: fromContext.name };
      }
    } catch (error) {
      console.warn('Web context did not carry a project:', error);
    }

    try {
      const projectService = await withTimeout(
        SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService),
        SERVICE_TIMEOUT_MS,
        'ProjectPageService'
      );
      const project = await withTimeout(
        projectService.getProject(),
        SERVICE_TIMEOUT_MS,
        'getProject'
      );
      return project ? { id: project.id, name: project.name } : undefined;
    } catch (error) {
      console.warn('Project page service unavailable:', error);
      return undefined;
    }
  }

  getProjectName(): string {
    return this.projectName;
  }

  getProjectId(): string {
    return this.projectId;
  }

  /**
   * Resolves metadata for the given work item ids, including their nearest
   * Feature or Epic ancestor. Ids the user cannot read are simply absent from
   * the returned map — callers must handle misses rather than assume a hit.
   */
  async getMetadata(ids: number[]): Promise<Map<number, WorkItemMeta>> {
    const wanted = Array.from(new Set(ids));
    const missing = wanted.filter(id => !this.cache.has(id) && !this.inaccessible.has(id));

    this.lastError = null;
    this.endpointFailed = false;

    if (missing.length > 0) {
      const fetched = await this.fetchBatched(missing);

      for (const workItem of fetched) {
        this.cache.set(workItem.id, this.toMeta(workItem));
      }

      // Anything still absent is permission-trimmed or deleted
      for (const id of missing) {
        if (!this.cache.has(id)) {
          this.inaccessible.add(id);
        }
      }

    }

    // Resolve for every requested id, not just the newly fetched ones: an item
    // first cached as somebody else's ancestor has no rollup recorded yet
    await this.resolveRollups(wanted);

    const result = new Map<number, WorkItemMeta>();
    for (const id of wanted) {
      const meta = this.cache.get(id);
      if (meta) {
        result.set(id, meta);
      }
    }
    return result;
  }

  /**
   * Walks the parent chain of the given ids until it finds a Feature or Epic,
   * annotating each item's cache entry with the rollup it belongs to.
   */
  private async resolveRollups(ids: number[]): Promise<void> {
    const unresolved = ids.filter(id => {
      const meta = this.cache.get(id);
      return meta !== undefined && meta.rollupId === undefined;
    });

    if (unresolved.length === 0) return;

    const rollups = await resolveRollups(
      unresolved,
      this.cache,
      async (ancestorIds) => {
        const wanted = ancestorIds.filter(id => !this.inaccessible.has(id));
        const ancestors = await this.fetchBatched(wanted);
        const metas = ancestors.map(a => this.toMeta(a));
        const returned = new Set(metas.map(m => m.id));

        for (const id of wanted) {
          if (!returned.has(id)) this.inaccessible.add(id);
        }

        return metas;
      },
      { rollupTypes: ROLLUP_TYPES, maxDepth: MAX_ANCESTOR_DEPTH }
    );

    rollups.forEach((rollup, itemId) => {
      const meta = this.cache.get(itemId);
      if (!meta) return;
      meta.rollupId = rollup.rollupId;
      meta.rollupTitle = rollup.rollupTitle;
      meta.rollupType = rollup.rollupType;
    });
  }

  /**
   * Requests work items in batches.
   *
   * Deliberately not scoped to a project: the extension's storage is
   * account-wide, so ids from other projects turn up here and we need their
   * System.TeamProject to recognise and exclude them. Scoping the request would
   * make a foreign work item indistinguishable from one the user cannot read.
   *
   * No `fields` list is sent. The parent link is the one piece the walk cannot
   * do without, and `System.Parent` is not a requestable field on every API
   * version — asking for it returns a 400 that fails the entire batch. Asking
   * for everything and reading the hierarchy relation works regardless, at the
   * cost of a larger response.
   */
  private async fetchBatched(ids: number[]): Promise<WorkItem[]> {
    if (!this.client) {
      throw new Error('Work item metadata service not initialized');
    }

    const results: WorkItem[] = [];

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      results.push(...(await this.fetchChunk(ids.slice(i, i + BATCH_SIZE))));
    }

    return results;
  }

  /**
   * Fetches one chunk, degrading rather than losing the whole report.
   *
   * First attempt asks the server to omit ids the user cannot read; if the
   * request is rejected outright, retry without that policy.
   *
   * Tries each request shape in turn (see `STRATEGIES`) and remembers the first
   * that works, so a collection that rejects one shape costs a few probes
   * rather than one per chunk.
   *
   * When every shape fails there are two very different causes, and they must
   * not be treated alike. One poisonous id in the batch is worth isolating by
   * splitting. A broken endpoint — wrong scope, expired token, unsupported API
   * version — is not: splitting it turns one failure into several requests per
   * work item, which for a full batch means hundreds of doomed calls and a
   * report that never finishes loading. So probe a single id first, and only
   * split if that probe proves the endpoint actually works.
   */
  private async fetchChunk(ids: number[]): Promise<WorkItem[]> {
    if (ids.length === 0) return [];

    /** One request in a given shape, timed out so a hang becomes a failure */
    const request = async (batch: number[], strategy: FetchStrategy) => {
      const fields =
        strategy === 'fields' ? [...CORE_FIELDS, 'System.Parent']
        : strategy === 'core' ? CORE_FIELDS
        : undefined;
      const expand = strategy === 'relations' ? WorkItemExpand.Relations : undefined;

      const workItems = await withTimeout(
        this.client!.getWorkItems(
          batch,
          undefined,
          fields,
          undefined,
          expand,
          OMIT_ERROR_POLICY
        ),
        REQUEST_TIMEOUT_MS,
        `getWorkItems (${strategy}, ${batch.length} ids)`
      );
      // With an omit policy, entries for unreadable ids come back null
      return workItems.filter(workItem => workItem && workItem.id);
    };

    const attempt = async (batch: number[]): Promise<WorkItem[] | null> => {
      // Once a shape works, stop probing — re-testing every chunk multiplies
      // the cost of a slow collection by the number of chunks
      const toTry = this.strategy ? [this.strategy] : STRATEGIES;

      for (const strategy of toTry) {
        try {
          const workItems = await request(batch, strategy);
          if (!this.strategy) {
            this.strategy = strategy;
            if (strategy !== 'fields') {
              console.warn(`Work item lookup fell back to the "${strategy}" strategy`);
            }
          }
          return workItems;
        } catch (error) {
          this.lastError = error instanceof Error ? error.message : String(error);
          // Logged, not swallowed: a silent ladder leaves the user watching a
          // spinner with no idea anything is being retried
          console.warn(
            `Work item lookup failed (${strategy}, ${batch.length} ids): ${this.lastError}`
          );
        }
      }
      return null;
    };

    const whole = await attempt(ids);
    if (whole) return whole;

    if (ids.length === 1) {
      // Unreadable, deleted, or unreachable. The caller marks it inaccessible.
      return [];
    }

    // One id, to tell "bad id in the batch" from "endpoint is broken"
    const probe = await attempt(ids.slice(0, 1));
    if (!probe) {
      console.error(
        'Work item lookup is failing for a single id too — treating the endpoint as unavailable'
      );
      this.endpointFailed = true;
      return [];
    }

    const rest = await this.fetchChunk(ids.slice(1));
    return [...probe, ...rest];
  }

  private toMeta(workItem: WorkItem): WorkItemMeta {
    const fields = workItem.fields || {};
    const estimate = fields['Microsoft.VSTS.Scheduling.OriginalEstimate'];

    return {
      id: workItem.id,
      title: fields['System.Title'] ?? `Work item ${workItem.id}`,
      workItemType: fields['System.WorkItemType'] ?? '',
      state: fields['System.State'] ?? '',
      iterationPath: fields['System.IterationPath'] ?? '',
      projectName: fields['System.TeamProject'] ?? '',
      parentId: parentIdOf(workItem),
      originalEstimate: typeof estimate === 'number' ? estimate : undefined
    };
  }
}

// Export singleton instance
export const workItemMetadataService = new WorkItemMetadataService();
