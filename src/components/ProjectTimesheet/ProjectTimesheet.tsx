import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { TimeEntry } from "../../models/TimeEntry";
import { dataService } from "../../services/DataService";
import { exportService } from "../../services/ExportService";
import {
  WorkItemMeta,
  workItemMetadataService,
} from "../../services/WorkItemMetadataService";
import {
  aggregateByProjectAndUser,
  attributeProjects,
  partitionByProject,
} from "../../utils/projectScope";
import { formatDateToISO, getMonthRange } from "../../utils/dateUtils";
import { ReportDefinition, ReportRunResult } from "./ReportsPanel";
import { ProjectTimesheetView } from "./ProjectTimesheetView";

/**
 * Upper bound on the whole startup path before we give up and say so. Generous,
 * because the work item lookup may probe more than one request shape before it
 * finds one this collection accepts, each with its own timeout.
 */
const STARTUP_TIMEOUT_MS = 90000;

/**
 * Container for the project report: resolves the project, loads the entries,
 * attributes them, and hands the result to ProjectTimesheetView. Everything the
 * user sees lives in that view, so the local preview can render it unchanged.
 */
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
  /** Current sprint's iteration path, for defaulting the Iteration filter — a
   *  nice-to-have that must never block or fail the load it rides alongside */
  const [currentIterationPath, setCurrentIterationPath] = useState<string | null>(null);
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

      // Fire-and-forget: a default is nice to have, not load-bearing, so it
      // must never hold up or fail the report it rides alongside
      workItemMetadataService
        .getCurrentIterationPath()
        .then(setCurrentIterationPath)
        .catch(() => setCurrentIterationPath(null));

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
   * Monthly Summary: total hours per project and user for a chosen month,
   * across every project the current user can access — not just this one.
   * Runs against `allEntries` rather than `projectEntries`, and resolves
   * metadata for whatever work items that month touches, since a work item
   * from another project has usually never been looked up here before.
   */
  const runMonthlySummary = async (year: number, month: number): Promise<ReportRunResult> => {
    const { startDate, endDate } = getMonthRange(year, month);
    const start = formatDateToISO(startDate);
    const end = formatDateToISO(endDate);

    const monthEntries = allEntries.filter(
      (entry) => entry.date >= start && entry.date <= end,
    );
    if (monthEntries.length === 0) {
      return { status: "empty" };
    }

    const ids = Array.from(new Set(monthEntries.map((e) => e.workItemId))).sort(
      (a, b) => a - b,
    );
    const monthMetadata = await workItemMetadataService.getMetadata(ids);

    const { attributed, unattributedCount } = attributeProjects(monthEntries, monthMetadata);
    if (attributed.length === 0) {
      return { status: "empty" };
    }

    const rows = aggregateByProjectAndUser(attributed);
    exportService.exportMonthlySummary(rows, `monthly-summary_${start.slice(0, 7)}.csv`);

    return { status: "exported", excludedCount: unattributedCount };
  };

  const reports: ReportDefinition[] = [
    { id: "monthly-summary", label: "Monthly Summary", run: runMonthlySummary },
  ];

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

  return (
    <ProjectTimesheetView
      projectName={projectName}
      projectEntries={projectEntries}
      metadata={metadata}
      unattributedCount={partition.unattributed.length}
      isResolvingMetadata={isResolvingMetadata}
      metadataError={metadataError}
      endpointFailed={endpointFailed}
      error={error}
      reports={reports}
      currentIterationPath={currentIterationPath}
      onRefresh={loadEntries}
      onRetry={initialize}
    />
  );
};
