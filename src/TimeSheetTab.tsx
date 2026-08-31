import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import * as SDK from "azure-devops-extension-sdk";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import {
  TimeEntry,
  CreateTimeEntryInput,
  UpdateTimeEntryInput,
} from "./models/TimeEntry";
import { dataService } from "./services/DataService";
import { workItemService } from "./services/WorkItemService";
import { workItemMetadataService } from "./services/WorkItemMetadataService";
import { hoursByActivity, totalHours as sumHours } from "./utils/aggregate";
import { TimeEntryList } from "./components/TimeEntryList/TimeEntryList";
import { TimeEntryPanel } from "./components/TimeEntryPanel/TimeEntryPanel";
import { ActivityDonutChart } from "./components/TimesheetReport/ActivityDonutChart";
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
  const [editingEntry, setEditingEntry] = useState<TimeEntry | undefined>(
    undefined,
  );
  const [totalHours, setTotalHours] = useState(0);

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

      // Close panel
      setShowForm(false);
      setEditingEntry(undefined);
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

      // Reload entries
      if (workItemId) {
        await loadTimeEntries(workItemId);
      }
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
              {`${entries.length} ${entries.length === 1 ? "entry" : "entries"} on work item #${workItemId} · ${totalHours.toFixed(2)} hours`}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
        {/* Entries on the left, activity breakdown on the right */}
        <div className="flex flex-col md:flex-row gap-0">
          {/* Left column (2/3): entries logged on this work item */}
          <div className="flex-[2] min-w-0 md:pr-6">
            <TimeEntryList
              entries={entries}
              currentUserId={currentUserId}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
            />
          </div>

          {/* Vertical separator */}
          <div className="hidden md:block w-px bg-border" />

          {/* Right column (1/3): summary */}
          <div className="flex-1 min-w-0 mt-6 md:mt-0 md:pl-6 space-y-4">
            <ActivityDonutChart
              activityHours={hoursByActivity(entries)}
              totalHours={totalHours}
            />

            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="text-xs text-muted-foreground">Hours</div>
                <div className="text-xl font-bold">{totalHours.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Entries</div>
                <div className="text-xl font-bold">{entries.length}</div>
              </div>
            </div>
          </div>
        </div>

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
