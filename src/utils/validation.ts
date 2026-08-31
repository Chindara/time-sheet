import { CreateTimeEntryInput, UpdateTimeEntryInput, ValidationResult, ValidationError } from '../models/TimeEntry';

/**
 * Validates input for creating a new time entry
 */
export function validateCreateTimeEntry(input: CreateTimeEntryInput): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate work item ID
  if (!input.workItemId || input.workItemId <= 0) {
    errors.push({
      field: 'workItemId',
      message: 'Work item ID is required and must be a positive number'
    });
  }

  // Validate hours
  if (input.hours === undefined || input.hours === null) {
    errors.push({
      field: 'hours',
      message: 'Hours is required'
    });
  } else if (input.hours <= 0) {
    errors.push({
      field: 'hours',
      message: 'Hours must be greater than zero'
    });
  } else if (input.hours > 24) {
    // This is a warning, but we'll allow it
    console.warn('Time entry exceeds 24 hours - please verify this is correct');
  }

  // Validate date
  if (!input.date) {
    errors.push({
      field: 'date',
      message: 'Date is required'
    });
  } else if (!isValidISODate(input.date)) {
    errors.push({
      field: 'date',
      message: 'Date must be in ISO 8601 format (YYYY-MM-DD)'
    });
  }

  // Validate activity type
  if (!input.activityType) {
    errors.push({
      field: 'activityType',
      message: 'Activity type is required'
    });
  }

  // Validate time range if provided
  if (input.startTime || input.endTime) {
    if (!input.startTime || !input.endTime) {
      errors.push({ field: 'startTime', message: 'Both Start Time and End Time are required' });
    } else if (calculateHoursFromRange(input.startTime, input.endTime) <= 0) {
      errors.push({ field: 'endTime', message: 'End Time must be after Start Time' });
    }
  }

  // Validate description length if provided
  if (input.description && input.description.length > 500) {
    errors.push({
      field: 'description',
      message: 'Description must not exceed 500 characters'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates input for updating a time entry
 */
export function validateUpdateTimeEntry(input: UpdateTimeEntryInput): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate ID
  if (!input.id) {
    errors.push({
      field: 'id',
      message: 'Time entry ID is required'
    });
  }

  // Validate hours if provided
  if (input.hours !== undefined) {
    if (input.hours <= 0) {
      errors.push({
        field: 'hours',
        message: 'Hours must be greater than zero'
      });
    } else if (input.hours > 24) {
      console.warn('Time entry exceeds 24 hours - please verify this is correct');
    }
  }

  // Validate date if provided
  if (input.date !== undefined && !isValidISODate(input.date)) {
    errors.push({
      field: 'date',
      message: 'Date must be in ISO 8601 format (YYYY-MM-DD)'
    });
  }

  // Validate time range if provided
  if (input.startTime || input.endTime) {
    if (!input.startTime || !input.endTime) {
      errors.push({ field: 'startTime', message: 'Both Start Time and End Time are required' });
    } else if (calculateHoursFromRange(input.startTime, input.endTime) <= 0) {
      errors.push({ field: 'endTime', message: 'End Time must be after Start Time' });
    }
  }

  // Validate description length if provided
  if (input.description !== undefined && input.description.length > 500) {
    errors.push({
      field: 'description',
      message: 'Description must not exceed 500 characters'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates that a string is a valid ISO 8601 date (YYYY-MM-DD)
 */
function isValidISODate(dateString: string): boolean {
  // Check format
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateString)) {
    return false;
  }

  // Check if it's a valid date
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Formats a date to ISO 8601 format (YYYY-MM-DD)
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date-time to ISO 8601 format
 */
export function formatDateTimeToISO(date: Date): string {
  return date.toISOString();
}

/**
 * Calculates decimal hours from a start and end time string ("HH:MM" 24-hour format).
 * Returns a positive number if endTime > startTime, zero or negative otherwise.
 */
export function calculateHoursFromRange(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60;
}
