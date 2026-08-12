/**
 * Represents a time entry logged against a work item
 */
export interface TimeEntry {
  /** Unique identifier for the time entry */
  id: string;

  /** ID of the work item this time is logged against */
  workItemId: number;

  /**
   * GUID of the project the work item belonged to when the entry was created.
   * Optional: absent on entries created before project stamping existed, which
   * are attributed via their work item's System.TeamProject instead.
   */
  projectId?: string;

  /** Name of the project at creation time (cached for display and fallback matching) */
  projectName?: string;

  /** ID of the user who logged the time */
  userId: string;

  /** Display name of the user (cached for performance) */
  userDisplayName: string;

  /** Date when the work was performed (ISO 8601 format) */
  date: string;

  /** Time work began, stored as HH:MM in 24-hour format (optional, absent on legacy entries) */
  startTime?: string;

  /** Time work ended, stored as HH:MM in 24-hour format (optional, absent on legacy entries) */
  endTime?: string;

  /** Number of hours worked (decimal format, e.g., 1.5) */
  hours: number;

  /** Optional description of work performed */
  description?: string;

  /** Category of work performed */
  activityType: ActivityType;

  /** Timestamp when entry was created (ISO 8601 format) */
  createdAt: string;

  /** Timestamp when entry was last updated (ISO 8601 format) */
  updatedAt: string;
}

/**
 * Activity types for categorizing time entries
 */
export enum ActivityType {
  Design = "Design",
  Requirements = "Requirements",
  Documentation = "Documentation",
  Development = "Development",
  CodeReview = "Code Review",
  BugFixing = "Bug Fixing",
  Deployment = "Deployment",
  Testing = "Testing",
}

/**
 * Input model for creating a new time entry
 */
export interface CreateTimeEntryInput {
  workItemId: number;
  date: string;
  startTime?: string;
  endTime?: string;
  hours: number;
  description?: string;
  activityType: ActivityType;
}

/**
 * Input model for updating an existing time entry
 */
export interface UpdateTimeEntryInput {
  id: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  hours?: number;
  description?: string;
  activityType?: ActivityType;
}

/**
 * Query parameters for filtering time entries
 */
export interface TimeEntryQuery {
  workItemId?: number;
  userId?: string;
  startDate?: string;
  endDate?: string;
  activityType?: ActivityType;
}

/**
 * Validation result for time entry data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}
