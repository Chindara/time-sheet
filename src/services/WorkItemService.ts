import * as SDK from 'azure-devops-extension-sdk';
import { IWorkItemFormService, IWorkItemLoadedArgs, WorkItemTrackingServiceIds } from 'azure-devops-extension-api/WorkItemTracking';

/**
 * Service for interacting with Azure DevOps work items
 */
export class WorkItemService {
  private formService: IWorkItemFormService | null = null;

  /**
   * Initializes the work item service
   */
  async initialize(): Promise<void> {
    try {
      await SDK.ready();

      // Try to get the work item form service using the service ID constant
      console.log('Attempting to get work item form service...');
      try {
        this.formService = await SDK.getService<IWorkItemFormService>(
          WorkItemTrackingServiceIds.WorkItemFormService
        );
      } catch (err) {
        console.warn('Failed to get service using WorkItemTrackingServiceIds, trying alternative...', err);
        // Fallback to string ID
        this.formService = await SDK.getService<IWorkItemFormService>(
          'ms.vss-work-web.work-item-form-service'
        );
      }

      if (!this.formService) {
        throw new Error('Work item form service is null - extension may not be running in work item context');
      }

      console.log('WorkItemService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WorkItemService:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize work item service: ${errorMessage}`);
    }
  }

  /**
   * Gets the ID of the current work item
   */
  async getCurrentWorkItemId(): Promise<number> {
    if (!this.formService) {
      throw new Error('Work item service not initialized');
    }

    try {
      const id = await this.formService.getId();
      return id;
    } catch (error) {
      console.error('Failed to get work item ID:', error);
      throw new Error('Failed to get current work item');
    }
  }

  /**
   * Gets field values from the current work item
   */
  async getFieldValues(fieldNames: string[]): Promise<{ [key: string]: any }> {
    if (!this.formService) {
      throw new Error('Work item service not initialized');
    }

    try {
      const values = await this.formService.getFieldValues(fieldNames);
      return values;
    } catch (error) {
      console.error('Failed to get field values:', error);
      throw new Error('Failed to get work item fields');
    }
  }

  /**
   * Gets the work item type (Bug, User Story, Task, etc.)
   */
  async getWorkItemType(): Promise<string> {
    const values = await this.getFieldValues(['System.WorkItemType']);
    return values['System.WorkItemType'] as string;
  }

  /**
   * Gets the work item title
   */
  async getWorkItemTitle(): Promise<string> {
    const values = await this.getFieldValues(['System.Title']);
    return values['System.Title'] as string;
  }

  /**
   * Sets the state of the current work item
   */
  async setWorkItemState(state: string): Promise<void> {
    await this.setFieldValues({ 'System.State': state });
  }

  /**
   * Sets field values on the current work item
   */
  async setFieldValues(fields: { [key: string]: any }): Promise<void> {
    if (!this.formService) {
      throw new Error('Work item service not initialized');
    }

    try {
      await this.formService.setFieldValues(fields);
    } catch (error) {
      console.error('Failed to set field values:', error);
      throw new Error('Failed to update work item fields');
    }
  }

  /**
   * Registers a callback for when the work item changes
   */
  onWorkItemChanged(callback: (args: IWorkItemLoadedArgs) => void): void {
    if (!this.formService) {
      throw new Error('Work item service not initialized');
    }

    try {
      // Note: Event handlers in the current API don't return promises
      SDK.register('work-item-loaded', callback);
    } catch (error) {
      console.error('Failed to register work item change listener:', error);
    }
  }
}

// Export singleton instance
export const workItemService = new WorkItemService();
