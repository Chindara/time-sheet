import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CalendarRange, RefreshCw } from "lucide-react";
import { TimeEntry } from "../../models/TimeEntry";
import { WorkItemMeta } from "../../services/WorkItemMetadataService";
import { exportService } from "../../services/ExportService";
import { formatDateToISO, getDateRange } from "../../utils/dateUtils";
import { hoursByUser } from "../../utils/aggregate";
import {
  buildBreakdown,
  buildSummary,
  GroupBy,
  GROUP_BY_LABELS,
} from "../../utils/breakdown";
import { ACTIVITY_ORDER } from "../../utils/activityColors";
import { buildContributorColors, contributorColor } from "../../utils/contributorColors";
import {
  ProjectFilters,
  ProjectFiltersState,
  RANGE_PRESET_LABELS,
} from "./ProjectFilters";
import { ProjectKpis } from "./ProjectKpis";
import { BreakdownTable } from "./BreakdownTable";
import { ContributorBars, ContributorTotal } from "./ContributorBars";
import { DailyHoursChart, DailyPoint, DailySeries } from "./DailyHoursChart";
import { ActivityDonutChart } from "../TimesheetReport/ActivityDonutChart";
import { ReportsPanel, ReportDefinition } from "./ReportsPanel";

const CLOSED_STATES = ["Closed", "Done", "Completed", "Resolved", "Removed"];

/**
 * The breakdown table groups by feature. It used to be switchable, but the
 * other groupings are all answered elsewhere on the page — contributor by the
 * contributor bars and the stacked daily chart, activity by the donut — so the
 * control was three ways of re-reading panels already on screen.
 */
const BREAKDOWN_GROUP_BY: GroupBy = "feature";

const Panel: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  bodyClassName?: string;
}> = ({ title, subtitle, children, bodyClassName = "p-4" }) => (
  <section className="overflow-hidden rounded-md border bg-card">
    <div className="flex items-center gap-3 border-b px-4 py-2.5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {subtitle && (
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      )}
    </div>
    <div className={bodyClassName}>{children}</div>
  </section>
);

function defaultFilters(): ProjectFiltersState {
  return {
    // All time by default: the report is a project overview, and anything
    // narrower makes a project with historical entries look empty on first open
    preset: "all-time",
    startDate: "",
    endDate: "",
    userIds: [],
    activityTypes: [],
    iterationPath: "",
  };
}

export interface ProjectTimesheetViewProps {
  projectName: string;
  /** Entries already attributed to this project — the basis for everything shown */
  projectEntries: TimeEntry[];
  metadata: Map<number, WorkItemMeta>;
  /** Entries that could not be tied to any project, disclosed rather than folded in */
  unattributedCount: number;
  /** True while work item titles are still being resolved */
  isResolvingMetadata?: boolean;
  /** Message from a failed work item lookup, surfaced above the report */
  metadataError?: string | null;
  /** True when work item lookup is broken outright, not merely permission-trimmed */
  endpointFailed?: boolean;
  /** A load error worth showing while some data is still on screen */
  error?: string;
  /** Cross-project reports offered from the Reports panel */
  reports?: ReportDefinition[];
  /** The current sprint's iteration path, for defaulting the Iteration filter */
  currentIterationPath?: string | null;
  onRefresh: () => void;
  onRetry: () => void;
}

/**
 * Whether an iteration option is the same iteration the Work API reported as
 * current. Not always a plain equality check: `System.IterationPath` (what
 * options are built from) always includes the project name as its root
 * segment, but it isn't certain from documentation alone whether the Work
 * API's `path` does too — so a path ending the other on a `\` boundary counts
 * as the same iteration as well.
 */
function isCurrentIteration(optionPath: string, currentPath: string): boolean {
  if (optionPath === currentPath) return true;
  return (
    optionPath.endsWith(`\\${currentPath}`) || currentPath.endsWith(`\\${optionPath}`)
  );
}

/**
 * The whole project report, as a pure function of the data handed to it.
 *
 * Split from its container so the same component renders in Azure DevOps and in
 * the local preview harness — a second copy of this layout would drift from the
 * real one the moment either changed.
 */
export const ProjectTimesheetView: React.FC<ProjectTimesheetViewProps> = ({
  projectName,
  projectEntries,
  metadata,
  unattributedCount,
  isResolvingMetadata = false,
  metadataError = null,
  endpointFailed = false,
  error = "",
  reports = [],
  currentIterationPath = null,
  onRefresh,
  onRetry,
}) => {
  const [filters, setFilters] = useState<ProjectFiltersState>(defaultFilters);

  const today = formatDateToISO(new Date());

  /**
   * The range actually applied, resolved from the preset. "All time" spans the
   * first to the last entry in this project, so working-day maths stays
   * meaningful.
   */
  const range = useMemo(() => {
    if (filters.preset === "custom") {
      return { start: filters.startDate, end: filters.endDate };
    }

    if (filters.preset === "all-time") {
      const dates = projectEntries.map((e) => e.date).sort();
      return {
        start: dates[0] ?? today,
        end: dates[dates.length - 1] ?? today,
      };
    }

    const { startDate, endDate } = getDateRange(filters.preset);
    return { start: formatDateToISO(startDate), end: formatDateToISO(endDate) };
  }, [filters.preset, filters.startDate, filters.endDate, projectEntries, today]);

  const rangeError =
    range.start && range.end && range.end < range.start
      ? "End date must be on or after the start date."
      : "";

  const rangedEntries = useMemo(
    () =>
      rangeError
        ? []
        : projectEntries.filter(
            (entry) => entry.date >= range.start && entry.date <= range.end,
          ),
    [projectEntries, range.start, range.end, rangeError],
  );

  const outOfRangeCount = projectEntries.length - rangedEntries.length;

  // Remaining filters apply on top of the date range
  const filteredEntries = useMemo(
    () =>
      rangedEntries.filter((entry) => {
        if (filters.userIds.length > 0 && !filters.userIds.includes(entry.userId)) {
          return false;
        }
        if (
          filters.activityTypes.length > 0 &&
          !filters.activityTypes.includes(entry.activityType)
        ) {
          return false;
        }
        if (filters.iterationPath !== "") {
          if (
            metadata.get(entry.workItemId)?.iterationPath !==
            filters.iterationPath
          ) {
            return false;
          }
        }
        return true;
      }),
    [
      rangedEntries,
      metadata,
      filters.userIds,
      filters.activityTypes,
      filters.iterationPath,
    ],
  );

  const summary = useMemo(
    () => buildSummary(filteredEntries, metadata, range.start, range.end),
    [filteredEntries, metadata, range.start, range.end],
  );

  const rows = useMemo(
    () => buildBreakdown(filteredEntries, metadata, BREAKDOWN_GROUP_BY),
    [filteredEntries, metadata],
  );

  const closedWorkItems = useMemo(() => {
    let closed = 0;
    new Set(filteredEntries.map((e) => e.workItemId)).forEach((id) => {
      const state = metadata.get(id)?.state;
      if (state && CLOSED_STATES.includes(state)) closed++;
    });
    return closed;
  }, [filteredEntries, metadata]);

  const contributors = useMemo<ContributorTotal[]>(() => {
    const names = new Map<string, string>();
    filteredEntries.forEach((e) => names.set(e.userId, e.userDisplayName));

    return Array.from(hoursByUser(filteredEntries).entries())
      .map(([userId, hours]) => ({
        userId,
        displayName: names.get(userId) ?? userId,
        hours,
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredEntries]);

  /** One point per day, carrying both the day's total and its per-contributor split */
  const dailyPoints = useMemo<DailyPoint[]>(() => {
    const byDate = new Map<string, DailyPoint>();

    filteredEntries.forEach((entry) => {
      let point = byDate.get(entry.date);
      if (!point) {
        point = { date: entry.date, hours: 0, byUser: {} };
        byDate.set(entry.date, point);
      }
      point.hours += entry.hours;
      point.byUser[entry.userId] =
        (point.byUser[entry.userId] ?? 0) + entry.hours;
    });

    return Array.from(byDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [filteredEntries]);

  const activityHours = useMemo(() => {
    const hours = new Map<string, number>();
    filteredEntries.forEach((entry) => {
      hours.set(
        entry.activityType,
        (hours.get(entry.activityType) ?? 0) + entry.hours,
      );
    });

    // Emit in fixed palette order so donut colours stay stable
    const ordered = new Map<string, number>();
    ACTIVITY_ORDER.forEach((activity) => {
      const value = hours.get(activity);
      if (value !== undefined) ordered.set(activity, value);
    });
    hours.forEach((value, activity) => {
      if (!ordered.has(activity)) ordered.set(activity, value);
    });
    return ordered;
  }, [filteredEntries]);

  // Options come from the loaded data, so they never offer an empty filter
  const contributorOptions = useMemo(() => {
    const names = new Map<string, string>();
    projectEntries.forEach((e) => names.set(e.userId, e.userDisplayName));
    return Array.from(names.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [projectEntries]);

  /**
   * Colours are pinned to a contributor's slot in the project-wide list, not to
   * their position in the filtered set, so narrowing the contributor filter
   * never repaints the people who remain.
   */
  const contributorColors = useMemo(
    () => buildContributorColors(contributorOptions.map((o) => o.value)),
    [contributorOptions],
  );

  /**
   * Stack segments for the daily chart, in the same stable order as the colour
   * slots — so a day's segments keep their vertical order between renders —
   * limited to contributors who actually logged time in the current view.
   */
  const dailySeries = useMemo<DailySeries[]>(() => {
    const present = new Set(filteredEntries.map((e) => e.userId));
    return contributorOptions
      .filter((option) => present.has(option.value))
      .map((option) => ({
        userId: option.value,
        displayName: option.label,
        color: contributorColors.get(option.value) ?? contributorColor(0),
      }));
  }, [filteredEntries, contributorOptions, contributorColors]);

  const activityOptions = useMemo(() => {
    const present = new Set(projectEntries.map((e) => e.activityType as string));
    return ACTIVITY_ORDER.filter((activity) => present.has(activity)).map(
      (activity) => ({ value: activity, label: activity }),
    );
  }, [projectEntries]);

  /**
   * Iterations that time was actually logged against, labelled by the part of
   * the path below the project — the project prefix is on every iteration in a
   * report already scoped to one project, so it is noise in a 190px dropdown.
   */
  const iterationOptions = useMemo(() => {
    const paths = new Set<string>();
    projectEntries.forEach((entry) => {
      const path = metadata.get(entry.workItemId)?.iterationPath;
      if (path) paths.add(path);
    });

    return Array.from(paths)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((path) => {
        const trimmed = path.split("\\").slice(1).join(" › ");
        return { value: path, label: trimmed || path };
      });
  }, [projectEntries, metadata]);

  /**
   * Pre-selects the current sprint, once, the first time it resolves to an
   * option that actually exists — never before that (nothing to select yet)
   * and never again after (so clearing the filter back to "All iterations"
   * sticks, rather than being fought on the next render).
   */
  const appliedDefaultIterationRef = useRef(false);
  useEffect(() => {
    if (appliedDefaultIterationRef.current || !currentIterationPath) return;

    const match = iterationOptions.find((option) =>
      isCurrentIteration(option.value, currentIterationPath),
    );
    if (!match) return;

    appliedDefaultIterationRef.current = true;
    setFilters((f) => (f.iterationPath === "" ? { ...f, iterationPath: match.value } : f));
  }, [currentIterationPath, iterationOptions]);

  /** Switching to a custom range seeds the inputs from the range in view */
  const handleFiltersChange = (next: ProjectFiltersState) => {
    if (next.preset === "custom" && filters.preset !== "custom") {
      setFilters({ ...next, startDate: range.start, endDate: range.end });
      return;
    }
    setFilters(next);
  };

  const showAllTime = () =>
    setFilters((f) => ({ ...f, preset: "all-time", startDate: "", endDate: "" }));

  const handleExport = () => {
    const safeProject = (projectName || "project").replace(/[^\w-]+/g, "-");

    exportService.exportTimeEntries(
      filteredEntries,
      `timesheet_${safeProject}_${range.start}_to_${range.end}.csv`,
      {
        metadata,
        summary: exportService.generateSummary(
          filteredEntries,
          range.start,
          range.end,
        ),
        contributorHours: hoursByUser(filteredEntries),
        userNames: new Map(
          filteredEntries.map((e) => [e.userId, e.userDisplayName]),
        ),
      },
    );
  };

  const rangeSubtitle =
    filters.preset === "all-time"
      ? projectEntries.length === 0
        ? "no entries yet"
        : `all time · ${range.start} to ${range.end}`
      : filters.preset === "custom"
        ? `${range.start} to ${range.end}`
        : `${RANGE_PRESET_LABELS[filters.preset]} · ${range.start} to ${range.end}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="flex flex-wrap items-end gap-4 p-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Time Sheet</h1>
            <p className="text-sm text-muted-foreground">
              All time logged in {projectName || "this project"} — every work
              item, every contributor.
            </p>
          </div>
          <div className="flex-1" />
          <div className="flex gap-2">
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleExport} disabled={filteredEntries.length === 0}>
              Export CSV
            </Button>
            {reports.length > 0 && <ReportsPanel reports={reports} />}
          </div>
        </div>
      </div>

      <div className="space-y-3 p-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <ProjectFilters
          filters={filters}
          onChange={handleFiltersChange}
          contributorOptions={contributorOptions}
          activityOptions={activityOptions}
          iterationOptions={iterationOptions}
          rangeError={rangeError}
        />

        {/* A failed lookup is not a permissions problem — say so, because the
            symptom is otherwise identical to every work item being restricted */}
        {metadataError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Work item details could not be loaded.</strong> Feature
              names, states and project scoping are unavailable until this is
              resolved — rows below are grouped by whatever could be read.
              <span className="mt-1 block font-mono text-xs opacity-80">
                {metadataError}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Entries we could not tie to any project are excluded, not folded in —
            disclose them so the totals are not quietly incomplete */}
        {unattributedCount > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {unattributedCount}{" "}
              {unattributedCount === 1 ? "entry is" : "entries are"}{" "}
              excluded from this report: their work {
                unattributedCount === 1 ? "item" : "items"
              } could not be read, and they predate project tracking, so they
              cannot be attributed to {projectName || "this project"}.
            </AlertDescription>
          </Alert>
        )}

        {/* An empty range is a filter problem, not an empty project — say which */}
        {filteredEntries.length === 0 ? (
          <div className="rounded-md border bg-card p-10 text-center">
            {endpointFailed ? (
              /* Not an empty project — we simply cannot tell which entries
                 belong here, and guessing would show other projects' hours */
              <>
                <AlertCircle className="mx-auto mb-2 h-6 w-6 text-destructive" />
                <p className="text-sm font-medium">
                  Cannot determine which entries belong to this project
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  Work item lookup is failing, so entries cannot be attributed to
                  a project. Rather than risk showing another project's hours,
                  nothing is displayed. See the error above.
                </p>
                <Button className="mt-4" variant="outline" onClick={onRetry}>
                  Retry
                </Button>
              </>
            ) : projectEntries.length === 0 ? (
              <>
                <p className="text-sm font-medium">
                  No time logged in {projectName || "this project"} yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Open a work item in this project and use its Time Sheet tab to
                  log time.
                </p>
              </>
            ) : (
              <>
                <CalendarRange className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium">
                  No time entries match the current filters
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  {outOfRangeCount > 0
                    ? `${outOfRangeCount} ${outOfRangeCount === 1 ? "entry falls" : "entries fall"} outside ${
                        filters.preset === "custom"
                          ? "this date range"
                          : `"${RANGE_PRESET_LABELS[filters.preset]}"`
                      }.`
                    : "Try clearing the contributor, activity or iteration filters."}
                </p>
                {outOfRangeCount > 0 && filters.preset !== "all-time" && (
                  <Button className="mt-4" onClick={showAllTime}>
                    Show all time
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            <ProjectKpis
              summary={summary}
              dailyHours={dailyPoints.map((p) => p.hours)}
            />

            <div className="grid items-start gap-3 lg:grid-cols-[1.85fr_1fr]">
              <div className="min-w-0 space-y-3">
                <Panel
                  title={`Time by ${GROUP_BY_LABELS[BREAKDOWN_GROUP_BY].toLowerCase()}`}
                  subtitle={
                    isResolvingMetadata
                      ? "resolving work item titles..."
                      : `${rows.length} row${rows.length === 1 ? "" : "s"} · ${summary.workItems} work item${summary.workItems === 1 ? "" : "s"}`
                  }
                  bodyClassName=""
                >
                  <BreakdownTable
                    rows={rows}
                    groupBy={BREAKDOWN_GROUP_BY}
                    totalWorkItems={summary.workItems}
                    totalClosedWorkItems={closedWorkItems}
                    metadataFailed={metadataError !== null}
                  />
                </Panel>

                <Panel title="Hours per day" subtitle={rangeSubtitle}>
                  <DailyHoursChart points={dailyPoints} series={dailySeries} />
                </Panel>
              </div>

              <div className="space-y-3">
                <Panel title="Hours by activity">
                  <ActivityDonutChart
                    activityHours={activityHours}
                    totalHours={summary.totalHours}
                  />
                </Panel>

                <Panel title="Hours by contributor">
                  <ContributorBars
                    contributors={contributors}
                    totalHours={summary.totalHours}
                    colors={contributorColors}
                  />
                </Panel>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
