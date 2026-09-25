import { TimeEntry } from '../models/TimeEntry';
import { WorkItemMeta } from './WorkItemMetadataService';
import { MonthlySummaryRow } from '../utils/projectScope';

/** Column order for every time entry export */
const HEADERS = [
  'Work Item ID',
  'Work Item Title',
  'Feature',
  'User Name',
  'Date',
  'Start Time',
  'End Time',
  'Hours',
  'Activity Type',
  'Description',
  'Created At',
  'Updated At'
];

/**
 * Optional extras the project report supplies to enrich its export
 */
export interface ExportContext {
  /** Work item metadata for title and feature columns */
  metadata?: Map<number, WorkItemMeta>;
  /** Summary block written above the rows */
  summary?: ExportSummary;
  /** Hours per user id, for the summary block */
  contributorHours?: Map<string, number>;
  /** User id to display name, for the summary block */
  userNames?: Map<string, string>;
}

/**
 * Service for exporting time entry data to various formats
 */
export class ExportService {
  /**
   * Exports time entries to CSV, optionally preceded by a summary block and
   * enriched with work item titles and their parent feature.
   */
  exportTimeEntries(entries: TimeEntry[], filename: string, context: ExportContext = {}): void {
    const { metadata, summary, contributorHours, userNames } = context;

    let csvContent = '';

    if (summary) {
      csvContent += 'Summary\n';
      csvContent += `Total Hours,${summary.totalHours.toFixed(2)}\n`;
      csvContent += `Date Range,${summary.startDate} to ${summary.endDate}\n`;
      csvContent += `Total Entries,${summary.totalEntries}\n`;
      csvContent += '\n';

      if (summary.byActivityType.size > 0) {
        csvContent += 'Hours by Activity Type\n';
        summary.byActivityType.forEach((hours, activity) => {
          csvContent += `${this.escapeCSVCell(activity)},${hours.toFixed(2)}\n`;
        });
        csvContent += '\n';
      }

      if (contributorHours && contributorHours.size > 0) {
        csvContent += 'Hours by Contributor\n';
        contributorHours.forEach((hours, userId) => {
          const name = userNames?.get(userId) ?? userId;
          csvContent += `${this.escapeCSVCell(name)},${hours.toFixed(2)}\n`;
        });
        csvContent += '\n';
      }
    }

    const rows = entries.map(entry => {
      const meta = metadata?.get(entry.workItemId);
      return [
        entry.workItemId.toString(),
        meta?.title ?? '',
        meta?.rollupTitle ?? '',
        entry.userDisplayName,
        entry.date,
        entry.startTime ?? '',
        entry.endTime ?? '',
        entry.hours.toFixed(2),
        entry.activityType,
        entry.description || '',
        entry.createdAt,
        entry.updatedAt
      ];
    });

    csvContent += HEADERS.join(',') + '\n';
    csvContent += rows
      .map(row => row.map(cell => this.escapeCSVCell(cell)).join(','))
      .join('\n');

    this.downloadFile(csvContent, filename, 'text/csv');
  }

  /**
   * Exports time entries to CSV format
   */
  exportToCSV(entries: TimeEntry[], filename: string): void {
    this.exportTimeEntries(entries, filename);
  }

  /**
   * Exports time entries to Excel-compatible CSV format.
   *
   * Excel opens CSV directly, so this is the same writer with a forced .csv
   * extension rather than a real .xlsx workbook.
   */
  exportToExcel(entries: TimeEntry[], filename: string, summary?: ExportSummary): void {
    this.exportTimeEntries(entries, filename.replace('.xlsx', '.csv'), { summary });
  }

  /**
   * Exports a project x user hours summary — one row per pair, rather than
   * the fixed 12-column per-entry shape the other export methods write.
   */
  exportMonthlySummary(rows: MonthlySummaryRow[], filename: string): void {
    const csvContent =
      'Project,User,Total Hours\n' +
      rows
        .map(row =>
          [row.project, row.user, row.totalHours.toFixed(2)]
            .map(cell => this.escapeCSVCell(cell))
            .join(',')
        )
        .join('\n');

    this.downloadFile(csvContent, filename, 'text/csv');
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
