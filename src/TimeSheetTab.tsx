import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import * as SDK from "azure-devops-extension-sdk";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Calendar, AlertCircle } from "lucide-react";
import {
  TimeEntry,
  CreateTimeEntryInput,
  UpdateTimeEntryInput,
} from "./models/TimeEntry";
import { dataService } from "./services/DataService";
import { workItemService } from "./services/WorkItemService";
import { workItemMetadataService } from "./services/WorkItemMetadataService";
import { totalHours as sumHours } from "./utils/aggregate";
import { TimeEntryList } from "./components/TimeEntryList/TimeEntryList";
import { TimeEntryPanel } from "./components/TimeEntryPanel/TimeEntryPanel";
import { TimesheetReport } from "./components/TimesheetReport/TimesheetReport";
import "./styles.css";

const TimeSheetTab: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [syncWarning, setSyncWarning] = useState(false);
  const [stateTransitionWarning, setStateTransitionWarning] = useState(false);
  const [workItemId, setWorkItemId] = useState<number | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  // Opens on the work item being viewed; My Timesheet is one click away
  const [showReport, setShowReport] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | undefined>(
    undefined,
  );
  const [totalHours, setTotalHours] = useState(0);
  const [reportRefreshKey, setReportRefreshKey] = useState(0);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Initialize services (SDK already initialized before component mount)
      await dataService.initialize();
      await workItemService.initialize();
      dataService.setWorkItemService(workItemService);

      // Project context stamps new entries and lets My Timesheet exclude other
      // projects. Non-fatal: "This work item" needs none of it, so a failure
      // here must not take down the whole tab.
      try {
        await workItemMetadataService.initialize();
        dataService.setProjectContext({
          id: workItemMetadataService.getProjectId(),
          name: workItemMetadataService.getProjectName(),
        });
      } catch (metadataErr) {
        console.warn(
          "Project context unavailable; My Timesheet will not be project-scoped:",
          metadataErr,
        );
      }

      // Get current work item
      const id = await workItemService.getCurrentWorkItemId();
      setWorkItemId(id);

      // Get current user
      const user = SDK.getUser();
      setCurrentUserId(user.id);

      // Load time entries
      await loadTimeEntries(id);
    } catch (err) {
      console.error("Initialization error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to initialize extension: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTimeEntries = async (workItemId: number) => {
    try {
      const entries = await dataService.getTimeEntriesForWorkItem(workItemId);
      setEntries(entries);

      // Calculate total hours
      setTotalHours(sumHours(entries));
    } catch (err) {
      console.error("Failed to load entries:", err);
      setError("Failed to load time entries");
    }
  };

  const handleLogTimeClick = () => {
    setEditingEntry(undefined);
    setShowForm(true);
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleSaveEntry = async (
    input: CreateTimeEntryInput | UpdateTimeEntryInput,
  ) => {
    try {
      let syncOk: boolean;
      let stateTransitionOk = true;
      if ("id" in input) {
        ({ syncOk } = await dataService.updateTimeEntry(input));
      } else {
        ({ syncOk, stateTransitionOk } = await dataService.createTimeEntry(input));
      }

      if (!syncOk) {
        setSyncWarning(true);
      }
      if (!stateTransitionOk) {
        setStateTransitionWarning(true);
      }

      // Reload entries
      if (workItemId) {
        await loadTimeEntries(workItemId);
      }

      // Close panel and refresh report
      setShowForm(false);
      setEditingEntry(undefined);
      setReportRefreshKey((k) => k + 1);
    } catch (err) {
      throw err; // Let the form handle the error
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingEntry(undefined);
  };

  const handleDeleteEntry = async (entry: TimeEntry) => {
    try {
      const { syncOk, stateTransitionOk } = await dataService.deleteTimeEntry(entry.id);

      if (!syncOk) {
        setSyncWarning(true);
      }
      if (!stateTransitionOk) {
        setStateTransitionWarning(true);
      }

      // Reload entries and refresh report
      if (workItemId) {
        await loadTimeEntries(workItemId);
      }
      setReportRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to delete entry:", err);
      setError("Failed to delete time entry");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Loading time entries...</p>
      </div>
    );
  }

  if (error) {
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div>
            <h2 className="text-2xl font-bold">Time Sheet</h2>
            <p className="text-sm text-muted-foreground">
              {showReport
                ? `Total hours on work item #${workItemId}: ${totalHours.toFixed(2)}`
                : `${entries.length} ${entries.length === 1 ? "entry" : "entries"} on work item #${workItemId} · ${totalHours.toFixed(2)} hours`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Scope switch: My Timesheet spans every work item, so this is the
                only way back to the entries on the work item being viewed */}
            <div
              className="flex overflow-hidden rounded-md border"
              role="group"
              aria-label="View"
            >
              <button
                type="button"
                aria-pressed={showReport}
                onClick={() => setShowReport(true)}
                className={cn(
                  "border-r px-3 py-2 text-sm",
                  showReport
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                My Timesheet
              </button>
              <button
                type="button"
                aria-pressed={!showReport}
                onClick={() => setShowReport(false)}
                className={cn(
                  "px-3 py-2 text-sm",
                  !showReport
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                This work item
              </button>
            </div>
            <Button onClick={handleLogTimeClick} disabled={showForm}>
              Log Time
            </Button>
          </div>
        </div>
      </div>

      {/* Sync warning */}
      {syncWarning && (
        <div className="px-4 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Time entry saved, but work item fields (Completed Work /
                Remaining Work) could not be updated.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSyncWarning(false)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* State transition warning */}
      {stateTransitionWarning && (
        <div className="px-4 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Time entry saved, but the work item status could not be updated automatically.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStateTransitionWarning(false)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {showReport ? (
          <TimesheetReport
            onClose={() => setShowReport(false)}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            refreshKey={reportRefreshKey}
          />
        ) : (
          <TimeEntryList
            entries={entries}
            currentUserId={currentUserId}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
          />
        )}
        <TimeEntryPanel
          isOpen={showForm}
          workItemId={workItemId!}
          entry={editingEntry}
          onSave={handleSaveEntry}
          onClose={handleCancelForm}
        />
      </div>
    </div>
  );
};

// Initialize SDK and render the component
SDK.init().then(async () => {
  try {
    console.log(
      `Time Sheet tab v${typeof __EXTENSION_VERSION__ === "string" ? __EXTENSION_VERSION__ : "unknown"} starting`,
    );
    // Wait for SDK to be fully ready
    await SDK.ready();

    const container = document.getElementById("root");
    if (container) {
      const root = createRoot(container);
      root.render(<TimeSheetTab />);
    } else {
      console.error("Root container not found");
    }
  } catch (err) {
    console.error("Failed to initialize Azure DevOps SDK:", err);
    const container = document.getElementById("root");
    if (container) {
      container.innerHTML = `
        <div style="padding: 24px; color: #d13438;">
          <h3>Failed to load Time Sheet extension</h3>
          <p>Error: ${err instanceof Error ? err.message : String(err)}</p>
          <p>Please refresh the page or contact your administrator.</p>
        </div>
      `;
    }
  }
});
