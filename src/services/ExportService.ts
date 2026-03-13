import { TimeEntry } from '../models/TimeEntry';
import { formatDateForDisplay } from '../utils/dateUtils';

/**
 * Service for exporting time entry data to various formats
 */
export class ExportService {
  /**
   * Exports time entries to CSV format
   */
  exportToCSV(entries: TimeEntry[], filename: string): void {
    const headers = [
      'Work Item ID',
      'User Name',
      'Date',
      'Hours',
      'Activity Type',
      'Description',
      'Created At',
      'Updated At'
    ];

    const rows = entries.map(entry => [
      entry.workItemId.toString(),
      entry.userDisplayName,
      entry.date,
      entry.hours.toFixed(2),
      entry.activityType,
      entry.description || '',
      entry.createdAt,
      entry.updatedAt
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => this.escapeCSVCell(cell)).join(','))
    ].join('\n');

    this.downloadFile(csvContent, filename, 'text/csv');
  }

  /**
   * Exports time entries to Excel-compatible CSV format
   */
  exportToExcel(entries: TimeEntry[], filename: string, summary?: ExportSummary): void {
    // For simplicity, we'll use CSV format which Excel can open
    // In a production app, you might want to use a library like xlsx for true .xlsx files

    let csvContent = '';

    // Add summary if provided
    if (summary) {
      csvContent += 'Summary\n';
      csvContent += `Total Hours,${summary.totalHours.toFixed(2)}\n`;
      csvContent += `Date Range,${summary.startDate} to ${summary.endDate}\n`;
      csvContent += `Total Entries,${summary.totalEntries}\n`;
      csvContent += '\n';

      if (summary.byActivityType && summary.byActivityType.size > 0) {
        csvContent += 'Hours by Activity Type\n';
        summary.byActivityType.forEach((hours, activity) => {
          csvContent += `${activity},${hours.toFixed(2)}\n`;
        });
        csvContent += '\n';
      }
    }

    // Add main data
    const headers = [
      'Work Item ID',
      'User Name',
      'Date',
      'Hours',
      'Activity Type',
      'Description',
      'Created At',
      'Updated At'
    ];

    const rows = entries.map(entry => [
      entry.workItemId.toString(),
      entry.userDisplayName,
      entry.date,
      entry.hours.toFixed(2),
      entry.activityType,
      entry.description || '',
      entry.createdAt,
      entry.updatedAt
    ]);

    csvContent += headers.join(',') + '\n';
    csvContent += rows.map(row => row.map(cell => this.escapeCSVCell(cell)).join(',')).join('\n');

    this.downloadFile(csvContent, filename.replace('.xlsx', '.csv'), 'text/csv');
  }

  /**
   * Generates a summary from time entries
   */
  generateSummary(entries: TimeEntry[], startDate?: string, endDate?: string): ExportSummary {
    const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

    // Group by activity type
    const byActivityType = new Map<string, number>();
    entries.forEach(entry => {
      const current = byActivityType.get(entry.activityType) || 0;
      byActivityType.set(entry.activityType, current + entry.hours);
    });

    // Group by date
    const byDate = new Map<string, number>();
    entries.forEach(entry => {
      const current = byDate.get(entry.date) || 0;
      byDate.set(entry.date, current + entry.hours);
    });

    // Determine date range
    const dates = entries.map(e => e.date).sort();
    const actualStartDate = startDate || dates[0] || '';
    const actualEndDate = endDate || dates[dates.length - 1] || '';

    return {
      totalHours,
      totalEntries: entries.length,
      startDate: actualStartDate,
      endDate: actualEndDate,
      byActivityType,
      byDate
    };
  }

  /**
   * Escapes a cell value for CSV format
   */
  private escapeCSVCell(cell: string): string {
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  }

  /**
   * Downloads a file to the user's computer
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Summary information for exports
 */
export interface ExportSummary {
  totalHours: number;
  totalEntries: number;
  startDate: string;
  endDate: string;
  byActivityType: Map<string, number>;
  byDate: Map<string, number>;
}

// Export singleton instance
export const exportService = new ExportService();
