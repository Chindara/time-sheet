import * as SDK from 'azure-devops-extension-sdk';
import { IExtensionDataManager, IExtensionDataService } from 'azure-devops-extension-api';
import { TimeEntry, CreateTimeEntryInput, UpdateTimeEntryInput, TimeEntryQuery } from '../models/TimeEntry';
import { validateCreateTimeEntry, validateUpdateTimeEntry, formatDateToISO, formatDateTimeToISO } from '../utils/validation';
import { v4 as uuidv4 } from 'uuid';
import { WorkItemService } from './WorkItemService';

const COLLECTION_NAME = 'TimeEntries';
const DOCUMENT_ID_PREFIX = 'entry-';

/**
 * Service for managing time entry data using Azure DevOps Extension Data Storage
 */
export class DataService {
  private dataManager: IExtensionDataManager | null = null;
  private currentUser: { id: string; displayName: string } | null = null;
  private workItemService: WorkItemService | null = null;

  /**
   * Provides a WorkItemService instance for field write-back after time entry mutations.
   */
  setWorkItemService(service: WorkItemService): void {
    this.workItemService = service;
  }

  /**
   * Initializes the data service
   */
  async initialize(): Promise<void> {
    try {
      // SDK should already be ready, but ensure it
      await SDK.ready();

      // Get extension data service first, then get the manager
      console.log('Getting extension data service...');
      const dataService = await SDK.getService<IExtensionDataService>('ms.vss-features.extension-data-service');

      if (!dataService) {
        throw new Error('Extension data service is null');
      }

      // Get the extension context
      const extensionContext = SDK.getExtensionContext();
      console.log('Extension context:', extensionContext.id, extensionContext.publisherId);

      // Get the data manager for this extension
      console.log('Getting extension data manager...');
      this.dataManager = await dataService.getExtensionDataManager(
        extensionContext.id,
        await SDK.getAccessToken()
      );

      if (!this.dataManager) {
        throw new Error('Extension data manager is null');
      }

      console.log('Data manager obtained successfully');

      // Get current user info
      const user = SDK.getUser();
      if (!user || !user.id) {
        throw new Error('Unable to get current user information');
      }

      this.currentUser = {
        id: user.id,
        displayName: user.displayName || 'Unknown User'
      };

      console.log('DataService initialized successfully for user:', this.currentUser.displayName);
    } catch (error) {
      console.error('Failed to initialize DataService:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize data service: ${errorMessage}`);
    }
  }

  /**
   * Creates a new time entry
   * @returns the saved entry and a syncOk flag (false means field write-back failed)
   */
  async createTimeEntry(input: CreateTimeEntryInput): Promise<{ entry: TimeEntry; syncOk: boolean }> {
    // Validate input
    const validation = validateCreateTimeEntry(input);
    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join(', '));
    }

    if (!this.dataManager || !this.currentUser) {
      throw new Error('Data service not initialized');
    }

    const now = new Date();
    const entry: TimeEntry = {
      id: uuidv4(),
      workItemId: input.workItemId,
      userId: this.currentUser.id,
      userDisplayName: this.currentUser.displayName,
      date: input.date,
      hours: input.hours,
      description: input.description,
      activityType: input.activityType,
      createdAt: formatDateTimeToISO(now),
      updatedAt: formatDateTimeToISO(now)
    };

    try {
      // Store the entry with retry logic
      const document = {
        id: `${DOCUMENT_ID_PREFIX}${entry.id}`,
        entryId: entry.id,
        workItemId: entry.workItemId,
        userId: entry.userId,
        userDisplayName: entry.userDisplayName,
        date: entry.date,
        hours: entry.hours,
        description: entry.description,
        activityType: entry.activityType,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      };

      await this.retryOperation(async () => {
        await this.dataManager!.setDocument(COLLECTION_NAME, document);
      });

      const syncOk = await this.syncWorkItemTimeFields(entry.workItemId);
      return { entry, syncOk };
    } catch (error) {
      console.error('Failed to create time entry:', error);
      throw new Error('Failed to save time entry. Please try again.');
    }
  }

  /**
   * Updates an existing time entry
   * @returns the updated entry and a syncOk flag (false means field write-back failed)
   */
  async updateTimeEntry(input: UpdateTimeEntryInput): Promise<{ entry: TimeEntry; syncOk: boolean }> {
    // Validate input
    const validation = validateUpdateTimeEntry(input);
    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join(', '));
    }

    if (!this.dataManager || !this.currentUser) {
      throw new Error('Data service not initialized');
    }

    try {
      // Get existing entry
      const existing = await this.getTimeEntryById(input.id);

      // Verify ownership
      if (existing.userId !== this.currentUser.id) {
        throw new Error('You can only edit your own time entries');
      }

      // Update fields
      const updated: TimeEntry = {
        ...existing,
        date: input.date ?? existing.date,
        hours: input.hours ?? existing.hours,
        description: input.description ?? existing.description,
        activityType: input.activityType ?? existing.activityType,
        updatedAt: formatDateTimeToISO(new Date())
      };

      // Save updated entry with retry logic
      const document = {
        id: `${DOCUMENT_ID_PREFIX}${updated.id}`,
        entryId: updated.id,
        workItemId: updated.workItemId,
        userId: updated.userId,
        userDisplayName: updated.userDisplayName,
        date: updated.date,
        hours: updated.hours,
        description: updated.description,
        activityType: updated.activityType,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      };

      await this.retryOperation(async () => {
        await this.dataManager!.setDocument(COLLECTION_NAME, document);
      });

      const syncOk = await this.syncWorkItemTimeFields(updated.workItemId);
      return { entry: updated, syncOk };
    } catch (error) {
      console.error('Failed to update time entry:', error);
      if (error instanceof Error && error.message.includes('only edit your own')) {
        throw error;
      }
      throw new Error('Failed to update time entry. Please try again.');
    }
  }

  /**
   * Deletes a time entry
   * @returns a syncOk flag (false means field write-back failed)
   */
  async deleteTimeEntry(id: string): Promise<{ syncOk: boolean }> {
    if (!this.dataManager || !this.currentUser) {
      throw new Error('Data service not initialized');
    }

    try {
      // Get existing entry to verify ownership
      const existing = await this.getTimeEntryById(id);

      if (existing.userId !== this.currentUser.id) {
        throw new Error('You can only delete your own time entries');
      }

      const { workItemId } = existing;

      // Delete with retry logic
      await this.retryOperation(async () => {
        await this.dataManager!.deleteDocument(COLLECTION_NAME, `${DOCUMENT_ID_PREFIX}${id}`);
      });

      const syncOk = await this.syncWorkItemTimeFields(workItemId);
      return { syncOk };
    } catch (error) {
      console.error('Failed to delete time entry:', error);
      if (error instanceof Error && error.message.includes('only delete your own')) {
        throw error;
      }
      throw new Error('Failed to delete time entry. Please try again.');
    }
  }

  /**
   * Gets a single time entry by ID
   */
  async getTimeEntryById(id: string): Promise<TimeEntry> {
    if (!this.dataManager) {
      throw new Error('Data service not initialized');
    }

    try {
      const doc = await this.dataManager.getDocument(COLLECTION_NAME, `${DOCUMENT_ID_PREFIX}${id}`);
      return this.documentToTimeEntry(doc);
    } catch (error: any) {
      console.error('Failed to get time entry:', error);
      if (error?.status === 404 || error?.message?.includes('not found')) {
        throw new Error('Time entry not found');
      }
      throw new Error(`Failed to get time entry: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Queries time entries with optional filters
   */
  async queryTimeEntries(query: TimeEntryQuery = {}): Promise<TimeEntry[]> {
    if (!this.dataManager) {
      throw new Error('Data service not initialized');
    }

    try {
      // Get all documents in collection
      let documents: any[] = [];
      try {
        documents = await this.dataManager.getDocuments(COLLECTION_NAME);
      } catch (collectionError: any) {
        // If collection doesn't exist yet, return empty array
        if (collectionError?.message?.includes('not found') ||
            collectionError?.message?.includes('does not exist') ||
            collectionError?.status === 404) {
          console.log('Collection does not exist yet, returning empty array');
          return [];
        }
        // Re-throw other errors
        throw collectionError;
      }

      // Convert to TimeEntry objects
      let entries = documents.map(doc => this.documentToTimeEntry(doc));

      // Apply filters
      if (query.workItemId !== undefined) {
        entries = entries.filter(e => e.workItemId === query.workItemId);
      }

      if (query.userId) {
        entries = entries.filter(e => e.userId === query.userId);
      }

      if (query.activityType) {
        entries = entries.filter(e => e.activityType === query.activityType);
      }

      if (query.startDate) {
        entries = entries.filter(e => e.date >= query.startDate!);
      }

      if (query.endDate) {
        entries = entries.filter(e => e.date <= query.endDate!);
      }

      // Sort by date (most recent first)
      entries.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.createdAt.localeCompare(a.createdAt);
      });

      return entries;
    } catch (error) {
      console.error('Failed to query time entries:', error);
      throw new Error('Failed to load time entries. Please try again.');
    }
  }

  /**
   * Gets all time entries for a specific work item
   */
  async getTimeEntriesForWorkItem(workItemId: number): Promise<TimeEntry[]> {
    return this.queryTimeEntries({ workItemId });
  }

  /**
   * Gets current user's time entries for a date range
   */
  async getUserTimeEntries(startDate: string, endDate: string): Promise<TimeEntry[]> {
    if (!this.currentUser) {
      throw new Error('Data service not initialized');
    }

    return this.queryTimeEntries({
      userId: this.currentUser.id,
      startDate,
      endDate
    });
  }

  /**
   * Calculates total hours for a set of time entries
   */
  calculateTotalHours(entries: TimeEntry[]): number {
    return entries.reduce((sum, entry) => sum + entry.hours, 0);
  }

  /**
   * Groups time entries by activity type
   */
  groupByActivityType(entries: TimeEntry[]): Map<string, TimeEntry[]> {
    const grouped = new Map<string, TimeEntry[]>();

    for (const entry of entries) {
      const existing = grouped.get(entry.activityType) || [];
      existing.push(entry);
      grouped.set(entry.activityType, existing);
    }

    return grouped;
  }

  /**
   * Groups time entries by date
   */
  groupByDate(entries: TimeEntry[]): Map<string, TimeEntry[]> {
    const grouped = new Map<string, TimeEntry[]>();

    for (const entry of entries) {
      const existing = grouped.get(entry.date) || [];
      existing.push(entry);
      grouped.set(entry.date, existing);
    }

    return grouped;
  }

  /**
   * Recalculates Completed Work and Remaining Work on the work item after any time entry mutation.
   * Errors are non-fatal — the method logs a warning and returns false on failure.
   */
  async syncWorkItemTimeFields(workItemId: number): Promise<boolean> {
    if (!this.workItemService) {
      return false;
    }

    try {
      const entries = await this.getTimeEntriesForWorkItem(workItemId);
      const completedWork = entries.reduce((sum, e) => sum + e.hours, 0);

      const fieldValues = await this.workItemService.getFieldValues([
        'Microsoft.VSTS.Scheduling.OriginalEstimate'
      ]);
      const originalEstimate: number =
        Number(fieldValues['Microsoft.VSTS.Scheduling.OriginalEstimate']) || 0;

      const remainingWork = Math.max(0, originalEstimate - completedWork);

      await this.workItemService.setFieldValues({
        'Microsoft.VSTS.Scheduling.CompletedWork': completedWork,
        'Microsoft.VSTS.Scheduling.RemainingWork': remainingWork
      });

      return true;
    } catch (error) {
      console.warn('Failed to sync work item time fields:', error);
      return false;
    }
  }

  /**
   * Converts a document from data storage to TimeEntry
   */
  private documentToTimeEntry(doc: any): TimeEntry {
    return {
      id: doc.entryId,
      workItemId: doc.workItemId,
      userId: doc.userId,
      userDisplayName: doc.userDisplayName,
      date: doc.date,
      hours: doc.hours,
      description: doc.description,
      activityType: doc.activityType,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  /**
   * Retries an operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on validation or permission errors
        if (lastError.message.includes('only edit') ||
            lastError.message.includes('only delete') ||
            lastError.message.includes('required')) {
          throw lastError;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }
}

// Export singleton instance
export const dataService = new DataService();
