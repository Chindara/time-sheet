import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Download,
  AlertCircle,
  Pencil,
  Trash2,
  ClipboardList,
} from "lucide-react";
import { TimeEntry, ActivityType } from "../../models/TimeEntry";
import { dataService } from "../../services/DataService";
import { exportService } from "../../services/ExportService";
import {
  getDateRange,
  formatDateForDisplay,
  formatDateToISO,
} from "../../utils/dateUtils";
import { ActivityDonutChart } from "./ActivityDonutChart";

type DateRangePeriod =
  | "this-week"
  | "last-week"
  | "this-month"
  | "last-month"
  | "this-quarter"
  | "custom";

const dateRangeOptions = [
  { value: "this-week", label: "This Week" },
  { value: "last-week", label: "Last Week" },
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "this-quarter", label: "This Quarter" },
  { value: "custom", label: "Custom Range" },
] as const;

interface TimesheetReportProps {
  onClose: () => void;
}

export const TimesheetReport: React.FC<TimesheetReportProps> = ({
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [period, setPeriod] = useState<DateRangePeriod>("this-week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterActivity, setFilterActivity] = useState<ActivityType | "all">(
    "all",
  );
  const [deleteConfirmEntry, setDeleteConfirmEntry] =
    useState<TimeEntry | null>(null);

  useEffect(() => {
    loadEntries();
  }, [period, startDate, endDate]);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      setError("");

      let start: string, end: string;

      if (period === "custom") {
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
      console.error("Failed to load timesheet:", err);
      setError("Failed to load timesheet data");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value as DateRangePeriod);
    if (value !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

  const handleExport = (format: "csv" | "excel") => {
    const summary = exportService.generateSummary(entries, startDate, endDate);
    const filename = `timesheet_${new Date().toISOString().split("T")[0]}.${format === "csv" ? "csv" : "xlsx"}`;

    if (format === "csv") {
      exportService.exportToCSV(entries, filename);
    } else {
      exportService.exportToExcel(entries, filename, summary);
    }
  };

  // Filter entries by activity type
  const filteredEntries =
    filterActivity === "all"
      ? entries
      : entries.filter((e) => e.activityType === filterActivity);

  // Calculate totals
  const totalHours = filteredEntries.reduce((sum, e) => sum + e.hours, 0);

  // Group by work item
  const byWorkItem = new Map<number, TimeEntry[]>();
  filteredEntries.forEach((entry) => {
    const existing = byWorkItem.get(entry.workItemId) || [];
    existing.push(entry);
    byWorkItem.set(entry.workItemId, existing);
  });

  // Group by activity type for breakdown and chart
  const byActivity = dataService.groupByActivityType(filteredEntries);

  // Compute hours per activity for the donut chart
  const activityHours = new Map<string, number>();
  byActivity.forEach((actEntries, activity) => {
    activityHours.set(activity, dataService.calculateTotalHours(actEntries));
  });

  const activityFilterOptions = [
    { value: "all", label: "All Activities" },
    ...Object.values(ActivityType).map((type) => ({
      value: type,
      label: type,
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Timesheet</h2>
        <Button
          variant="outline"
          onClick={onClose}
        >
          <ClipboardList className="h-4 w-4 mr-2" />
          Work Item Entries
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1 min-w-[160px]">
          <Label htmlFor="date-range">Date Range</Label>
          <Select
            value={period}
            onValueChange={handlePeriodChange}
          >
            <SelectTrigger id="date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 min-w-[160px]">
          <Label htmlFor="activity-filter">Filter by Activity</Label>
          <Select
            value={filterActivity}
            onValueChange={(value) =>
              setFilterActivity(value as ActivityType | "all")
            }
          >
            <SelectTrigger id="activity-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {activityFilterOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {period === "custom" && (
          <>
            <div className="space-y-1">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[140px]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[140px]"
              />
            </div>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading timesheet...</p>
        </div>
      ) : (
        /* Two-column layout: 2:1 ratio */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column (2/3): Time Entries */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-base font-semibold">Time Entries</h3>
            {byWorkItem.size === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No time entries found for the selected period
              </div>
            ) : (
              Array.from(byWorkItem.entries()).map(
                ([workItemId, workItemEntries]) => {
                  const workItemTotal =
                    dataService.calculateTotalHours(workItemEntries);
                  return (
                    <div
                      key={workItemId}
                      className="border rounded-md overflow-hidden"
                    >
                      {/* Work item header */}
                      <div className="bg-muted/40 px-3 py-2 flex justify-between items-center text-sm">
                        <span className="font-medium">
                          Work Item #{workItemId}
                        </span>
                        <span className="text-muted-foreground">
                          {workItemTotal.toFixed(2)}h
                        </span>
                      </div>

                      {/* Compact entry rows */}
                      <div className="divide-y">
                        {workItemEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="px-3 py-2 flex items-center gap-3 text-sm hover:bg-muted/20"
                          >
                            <span className="text-muted-foreground w-[90px] shrink-0">
                              {formatDateForDisplay(entry.date)}
                            </span>
                            <span className="font-medium w-[50px] shrink-0 text-right">
                              {entry.hours.toFixed(2)}h
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs shrink-0"
                            >
                              {entry.activityType}
                            </Badge>
                            {entry.description && (
                              <span className="text-muted-foreground truncate flex-1 text-xs">
                                {entry.description}
                              </span>
                            )}
                            <div className="flex gap-1 ml-auto shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                title="Edit"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                title="Delete"
                                onClick={() => setDeleteConfirmEntry(entry)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                },
              )
            )}
          </div>

          {/* Right column (1/3): Summary */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Donut chart */}
                <ActivityDonutChart
                  activityHours={activityHours}
                  totalHours={totalHours}
                />

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Hours</div>
                    <div className="text-xl font-bold">
                      {totalHours.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Entries</div>
                    <div className="text-xl font-bold">
                      {filteredEntries.length}
                    </div>
                  </div>
                </div>

                {/* Activity breakdown */}
                {activityHours.size > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      By Activity
                    </div>
                    {Array.from(activityHours.entries()).map(
                      ([activity, hours]) => {
                        const percentage =
                          totalHours > 0
                            ? ((hours / totalHours) * 100).toFixed(1)
                            : "0";
                        return (
                          <div key={activity}>
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="truncate mr-2">{activity}</span>
                              <span className="text-muted-foreground shrink-0">
                                {hours.toFixed(2)}h ({percentage}%)
                              </span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirmEntry && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Card className="min-w-[360px]">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">Delete Time Entry</h3>
              <p className="mb-4 text-sm">
                Are you sure you want to delete this time entry?
              </p>
              <div className="bg-muted p-3 rounded-md mb-6 space-y-1 text-sm">
                <div>
                  <strong>Date:</strong>{" "}
                  {formatDateForDisplay(deleteConfirmEntry.date)}
                </div>
                <div>
                  <strong>Hours:</strong> {deleteConfirmEntry.hours}
                </div>
                <div>
                  <strong>Activity:</strong> {deleteConfirmEntry.activityType}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmEntry(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteConfirmEntry(null)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
