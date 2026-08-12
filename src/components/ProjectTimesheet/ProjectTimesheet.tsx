import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CalendarRange, Loader2, RefreshCw } from "lucide-react";
import { TimeEntry } from "../../models/TimeEntry";
import { dataService } from "../../services/DataService";
import {
  WorkItemMeta,
  workItemMetadataService,
} from "../../services/WorkItemMetadataService";
import { exportService } from "../../services/ExportService";
import { formatDateToISO, getDateRange } from "../../utils/dateUtils";
import { hoursByDate, hoursByUser } from "../../utils/aggregate";
import {
  buildBreakdown,
  buildSummary,
  GROUP_BY_LABELS,
} from "../../utils/breakdown";
import { ACTIVITY_ORDER } from "../../utils/activityColors";
import { partitionByProject } from "../../utils/projectScope";
import {
  ProjectFilters,
  ProjectFiltersState,
  RANGE_PRESET_LABELS,
} from "./ProjectFilters";
import { ProjectKpis } from "./ProjectKpis";
import { BreakdownTable } from "./BreakdownTable";
import { ContributorBars, ContributorTotal } from "./ContributorBars";
import { DailyHoursChart, DailyPoint } from "./DailyHoursChart";
import { ActivityDonutChart } from "../TimesheetReport/ActivityDonutChart";

const CLOSED_STATES = ["Closed", "Done", "Completed", "Resolved", "Removed"];

/**
 * Upper bound on the whole startup path before we give up and say so. Generous,
 * because the work item lookup may probe more than one request shape before it
 * finds one this collection accepts, each with its own timeout.
 */
const STARTUP_TIMEOUT_MS = 90000;

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
    areaPath: "",
    groupBy: "feature",
  };
}

export const ProjectTimesheet: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isResolvingMetadata, setIsResolvingMetadata] = useState(false);
  const [error, setError] = useState("");
  const [project, setProject] = useState({ id: "", name: "" });
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
  const [metadata, setMetadata] = useState<Map<number, WorkItemMeta>>(new Map());
  const [hasResolvedMetadata, setHasResolvedMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [endpointFailed, setEndpointFailed] = useState(false);
  const [filters, setFilters] = useState<ProjectFiltersState>(defaultFilters);
  /** Last startup step reached, so a timeout can name where it stalled */
  const stageRef = useRef("starting up");
  const [stage, setStage] = useState("starting up");

  const enterStage = (next: string) => {
    stageRef.current = next;
    setStage(next);
  };

  const projectName = project.name;

  useEffect(() => {
    void initialize();
  }, []);

  /**
   * Watchdog. Every call in the startup path is a promise that depends on the
   * Azure DevOps host answering, and a host that never answers leaves the
   * spinner up permanently with nothing on screen to explain it. Surface a real
   * error instead, naming the last step that completed.
   */
  useEffect(() => {
    if (!isLoading && hasResolvedMetadata) return;

    const timer = setTimeout(() => {
      setError(
        `Timed out while loading (last step: ${stageRef.current}). ` +
          `The Azure DevOps host did not respond. Check the browser console in the extension frame for details.`,
      );
      setIsLoading(false);
      setHasResolvedMetadata(true);
    }, STARTUP_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [isLoading, hasResolvedMetadata]);

  const initialize = async () => {
    try {
      setIsLoading(true);
      setError("");

      enterStage("connecting to extension storage");
      await dataService.initialize();

      enterStage("resolving the current project");
      await workItemMetadataService.initialize();

      const context = {
        id: workItemMetadataService.getProjectId(),
        name: workItemMetadataService.getProjectName(),
      };
      console.log("Project resolved:", context.name, context.id);
      setProject(context);
      dataService.setProjectContext(context);

      enterStage("loading time entries");
      await loadEntries();
      enterStage("resolving work item details");
    } catch (err) {
      console.error("Failed to initialize project timesheet:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to load the project time sheet: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Loads the whole collection once.
   *
   * getDocuments has no server-side filtering — it returns every document in
   * the collection regardless — so narrowing by date here would save nothing
   * and would stop us telling the user that entries exist outside their range.
   * Date filtering happens client-side instead, which also makes switching
   * ranges instant.
   */
  const loadEntries = async () => {
    try {
      setError("");
      setHasResolvedMetadata(false);
      setAllEntries(await dataService.getAllProjectTimeEntries());
    } catch (err) {
      console.error("Failed to load project time entries:", err);
      setError("Failed to load time entries. Please try again.");
    }
  };

  const today = formatDateToISO(new Date());

  /**
   * Entries that could plausibly belong to this project. Anything stamped with a
   * different project is dropped here without a metadata lookup; unstamped
   * (legacy) entries stay in until their work item can be checked.
   */
  const candidates = useMemo(
    () =>
      allEntries.filter((entry) => {
        if (!entry.projectId && !entry.projectName) return true;
        return (
          entry.projectId === project.id || entry.projectName === project.name
        );
      }),
    [allEntries, project.id, project.name],
  );

  const candidateIds = useMemo(
    () => Array.from(new Set(candidates.map((e) => e.workItemId))).sort((a, b) => a - b),
    [candidates],
  );
  const candidateIdsKey = candidateIds.join(",");

  // Resolve metadata before attributing, since the work item's TeamProject is
  // the authority and legacy entries have no stamp to fall back on
  useEffect(() => {
    if (isLoading) return;

    if (candidateIds.length === 0) {
      setHasResolvedMetadata(true);
      return;
    }

    let cancelled = false;
    setIsResolvingMetadata(true);

    workItemMetadataService
      .getMetadata(candidateIds)
      .then((resolved) => {
        if (cancelled) return;
        setMetadata(resolved);
        setMetadataError(workItemMetadataService.getLastError());
        setEndpointFailed(workItemMetadataService.hasEndpointFailed());
      })
      .catch((err) => {
        console.error("Failed to resolve work item metadata:", err);
        if (!cancelled) {
          setMetadataError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsResolvingMetadata(false);
          setHasResolvedMetadata(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [candidateIdsKey, isLoading]);

  const partition = useMemo(
    () => partitionByProject(candidates, metadata, project),
    [candidates, metadata, project],
  );

  /** Entries belonging to this project — the basis for everything below */
  const projectEntries = partition.inProject;

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
        if (filters.areaPath !== "") {
          if (metadata.get(entry.workItemId)?.areaPath !== filters.areaPath) {
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
      filters.areaPath,
    ],
  );

  const summary = useMemo(
    () => buildSummary(filteredEntries, metadata, range.start, range.end),
    [filteredEntries, metadata, range.start, range.end],
  );

  const rows = useMemo(
    () => buildBreakdown(filteredEntries, metadata, filters.groupBy),
    [filteredEntries, metadata, filters.groupBy],
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

  const dailyPoints = useMemo<DailyPoint[]>(
    () =>
      Array.from(hoursByDate(filteredEntries).entries())
        .map(([date, hours]) => ({ date, hours }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [filteredEntries],
  );

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

  const activityOptions = useMemo(() => {
    const present = new Set(projectEntries.map((e) => e.activityType as string));
    return ACTIVITY_ORDER.filter((activity) => present.has(activity)).map(
      (activity) => ({ value: activity, label: activity }),
    );
  }, [projectEntries]);

  const areaPathOptions = useMemo(() => {
    const paths = new Set<string>();
    metadata.forEach((meta) => {
      if (meta.areaPath) paths.add(meta.areaPath);
    });
    return Array.from(paths).sort();
  }, [metadata]);

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

  // Hold the report back until attribution is settled — showing totals from a
  // half-resolved partition would flash other projects' hours on screen
  if (isLoading || !hasResolvedMetadata) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Loading project time sheet — {stage}...
        </p>
      </div>
    );
  }

  if (error && projectEntries.length === 0) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={initialize}>Retry</Button>
        </div>
      </div>
    );
  }

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
            <Button variant="outline" onClick={loadEntries}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleExport} disabled={filteredEntries.length === 0}>
              Export CSV
            </Button>
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
          areaPathOptions={areaPathOptions}
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
        {partition.unattributed.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {partition.unattributed.length}{" "}
              {partition.unattributed.length === 1 ? "entry is" : "entries are"}{" "}
              excluded from this report: their work {
                partition.unattributed.length === 1 ? "item" : "items"
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
                <Button className="mt-4" variant="outline" onClick={initialize}>
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
                    : "Try clearing the contributor, activity or area filters."}
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
                  title={`Time by ${GROUP_BY_LABELS[filters.groupBy].toLowerCase()}`}
                  subtitle={
                    isResolvingMetadata
                      ? "resolving work item titles..."
                      : `${rows.length} row${rows.length === 1 ? "" : "s"} · ${summary.workItems} work item${summary.workItems === 1 ? "" : "s"}`
                  }
                  bodyClassName=""
                >
                  <BreakdownTable
                    rows={rows}
                    groupBy={filters.groupBy}
                    totalWorkItems={summary.workItems}
                    totalClosedWorkItems={closedWorkItems}
                    metadataFailed={metadataError !== null}
                  />
                </Panel>

                <Panel title="Hours per day" subtitle={rangeSubtitle}>
                  <DailyHoursChart points={dailyPoints} />
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
