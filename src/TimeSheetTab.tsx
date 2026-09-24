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
import { WorkItemTimesheetView } from "./components/WorkItemTimesheet/WorkItemTimesheetView";
import { watchHostTheme } from "./utils/hostTheme";
import "./styles.css";

const TimeSheetTab: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [syncWarning, setSyncWarning] = useState(false);
  const [stateTransitionWarning, setStateTransitionWarning] = useState(false);
  const [workItemId, setWorkItemId] = useState<number | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");

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

      // Project context stamps new entries so the project hub can attribute
      // them. Non-fatal: this tab reads entries by work item id and needs none
      // of it, so a failure here must not take down the whole tab.
      try {
        await workItemMetadataService.initialize();
        dataService.setProjectContext({
          id: workItemMetadataService.getProjectId(),
          name: workItemMetadataService.getProjectName(),
        });
      } catch (metadataErr) {
        console.warn(
          "Project context unavailable; new entries will not be project-stamped:",
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
    } catch (err) {
      console.error("Failed to load entries:", err);
      setError("Failed to load time entries");
    }
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
    } catch (err) {
      throw err; // Let the form handle the error
    }
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
    <WorkItemTimesheetView
      workItemId={workItemId!}
      entries={entries}
      currentUserId={currentUserId}
      syncWarning={syncWarning}
      stateTransitionWarning={stateTransitionWarning}
      onDismissSyncWarning={() => setSyncWarning(false)}
      onDismissStateWarning={() => setStateTransitionWarning(false)}
      onSave={handleSaveEntry}
      onDelete={handleDeleteEntry}
    />
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
    watchHostTheme();

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
