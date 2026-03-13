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
 * Gets the start of the current week (Monday)
 */
export function getStartOfWeek(date: Date = new Date()): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust when day is Sunday
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Gets the end of the current week (Sunday)
 */
export function getEndOfWeek(date: Date = new Date()): Date {
  const result = getStartOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Gets the start of the current month
 */
export function getStartOfMonth(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Gets the end of the current month
 */
export function getEndOfMonth(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Formats a date for display (e.g., "Jan 15, 2024")
 */
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Formats a datetime for display (e.g., "Jan 15, 2024 2:30 PM")
 */
export function formatDateTimeForDisplay(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Gets the date range for a predefined period
 */
export function getDateRange(period: 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'this-quarter'): { startDate: Date; endDate: Date } {
  const now = new Date();

  switch (period) {
    case 'this-week':
      return {
        startDate: getStartOfWeek(now),
        endDate: getEndOfWeek(now)
      };

    case 'last-week': {
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return {
        startDate: getStartOfWeek(lastWeek),
        endDate: getEndOfWeek(lastWeek)
      };
    }

    case 'this-month':
      return {
        startDate: getStartOfMonth(now),
        endDate: getEndOfMonth(now)
      };

    case 'last-month': {
      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return {
        startDate: getStartOfMonth(lastMonth),
        endDate: getEndOfMonth(lastMonth)
      };
    }

    case 'this-quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const startMonth = quarter * 3;
      const startDate = new Date(now.getFullYear(), startMonth, 1);
      const endDate = new Date(now.getFullYear(), startMonth + 3, 0);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    }

    default:
      return {
        startDate: getStartOfWeek(now),
        endDate: getEndOfWeek(now)
      };
  }
}

/**
 * Checks if a date is within a range
 */
export function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  return d >= start && d <= end;
}

/**
 * Gets the number of days between two dates
 */
export function getDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
