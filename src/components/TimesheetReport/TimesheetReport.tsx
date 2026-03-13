import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download, X, AlertCircle } from 'lucide-react';
import { TimeEntry, ActivityType } from '../../models/TimeEntry';
import { dataService } from '../../services/DataService';
import { exportService } from '../../services/ExportService';
import { getDateRange, formatDateForDisplay, formatDateToISO } from '../../utils/dateUtils';

type DateRangePeriod = 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'this-quarter' | 'custom';

const dateRangeOptions = [
  { value: 'this-week', label: 'This Week' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'this-quarter', label: 'This Quarter' },
  { value: 'custom', label: 'Custom Range' }
] as const;

interface TimesheetReportProps {
  onClose: () => void;
}

export const TimesheetReport: React.FC<TimesheetReportProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [period, setPeriod] = useState<DateRangePeriod>('this-week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterActivity, setFilterActivity] = useState<ActivityType | 'all'>('all');

  useEffect(() => {
    loadEntries();
  }, [period, startDate, endDate]);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      setError('');

      let start: string, end: string;

      if (period === 'custom') {
        if (!startDate || !endDate) {
          setIsLoading(false);
          return;
        }
        start = startDate;
        end = endDate;
      } else {
        const range = getDateRange(period);
        start = formatDateToISO(range.startDate);
        end = formatDateToISO(range.endDate);
      }

      const timeEntries = await dataService.getUserTimeEntries(start, end);
      setEntries(timeEntries);
    } catch (err) {
      console.error('Failed to load timesheet:', err);
      setError('Failed to load timesheet data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value as DateRangePeriod);
    if (value !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleExport = (format: 'csv' | 'excel') => {
    const summary = exportService.generateSummary(entries, startDate, endDate);
    const filename = `timesheet_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;

    if (format === 'csv') {
      exportService.exportToCSV(entries, filename);
    } else {
      exportService.exportToExcel(entries, filename, summary);
    }
  };

  // Filter entries by activity type
  const filteredEntries = filterActivity === 'all'
    ? entries
    : entries.filter(e => e.activityType === filterActivity);

  // Calculate totals
  const totalHours = filteredEntries.reduce((sum, e) => sum + e.hours, 0);

  // Group by work item
  const byWorkItem = new Map<number, TimeEntry[]>();
  filteredEntries.forEach(entry => {
    const existing = byWorkItem.get(entry.workItemId) || [];
    existing.push(entry);
    byWorkItem.set(entry.workItemId, existing);
  });

  // Group by activity type for breakdown
  const byActivity = dataService.groupByActivityType(filteredEntries);

  // Group by date
  const byDate = dataService.groupByDate(filteredEntries);

  const activityFilterOptions = [
    { value: 'all', label: 'All Activities' },
    ...Object.values(ActivityType).map(type => ({
      value: type,
      label: type
    }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Timesheet</h2>
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date-range">Date Range</Label>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger id="date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="activity-filter">Filter by Activity</Label>
          <Select value={filterActivity} onValueChange={(value) => setFilterActivity(value as ActivityType | 'all')}>
            <SelectTrigger id="activity-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {activityFilterOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {period === 'custom' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading timesheet...</p>
        </div>
      ) : (
        <>
          {/* Summary Section */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Hours</div>
                  <div className="text-3xl font-bold">{totalHours.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Entries</div>
                  <div className="text-3xl font-bold">{filteredEntries.length}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Work Items</div>
                  <div className="text-3xl font-bold">{byWorkItem.size}</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3">By Activity Type</h4>
                <div className="space-y-2">
                  {Array.from(byActivity.entries()).map(([activity, entries]) => {
                    const hours = dataService.calculateTotalHours(entries);
                    const percentage = totalHours > 0 ? (hours / totalHours * 100).toFixed(1) : '0';
                    return (
                      <div key={activity}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{activity}</span>
                          <span className="text-muted-foreground">{hours.toFixed(2)}h ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleExport('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => handleExport('excel')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Entries by Work Item */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Time Entries</h3>
            {byWorkItem.size === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No time entries found for the selected period
              </div>
            ) : (
              Array.from(byWorkItem.entries()).map(([workItemId, workItemEntries]) => {
                const workItemTotal = dataService.calculateTotalHours(workItemEntries);
                return (
                  <Card key={workItemId}>
                    <CardContent className="p-4">
                      <div className="mb-4 pb-3 border-b">
                        <div className="font-semibold">
                          Work Item #{workItemId}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total: {workItemTotal.toFixed(2)} hours
                        </div>
                      </div>

                      <div className="space-y-3">
                        {workItemEntries.map(entry => (
                          <div key={entry.id} className="pl-4">
                            <div className="flex gap-4 items-center text-sm">
                              <div className="font-medium min-w-[100px]">
                                {formatDateForDisplay(entry.date)}
                              </div>
                              <div className="min-w-[60px]">
                                {entry.hours.toFixed(2)}h
                              </div>
                              <Badge variant="outline">
                                {entry.activityType}
                              </Badge>
                            </div>
                            {entry.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {entry.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};
