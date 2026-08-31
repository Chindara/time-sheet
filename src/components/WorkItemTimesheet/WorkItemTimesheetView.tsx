import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  TimeEntry,
  CreateTimeEntryInput,
  UpdateTimeEntryInput,
} from "../../models/TimeEntry";
import { hoursByActivity, totalHours as sumHours } from "../../utils/aggregate";
import { TimeEntryList } from "../TimeEntryList/TimeEntryList";
import { TimeEntryPanel } from "../TimeEntryPanel/TimeEntryPanel";
import { ActivityDonutChart } from "../TimesheetReport/ActivityDonutChart";

export interface WorkItemTimesheetViewProps {
  workItemId: number;
  /** Every contributor's entries on this work item, newest first */
  entries: TimeEntry[];
  /** Whose entries carry edit and delete controls */
  currentUserId: string;
  /** Field write-back failed on the last mutation */
  syncWarning?: boolean;
  /** State transition failed on the last mutation */
  stateTransitionWarning?: boolean;
  onDismissSyncWarning?: () => void;
  onDismissStateWarning?: () => void;
  /** Rejects to let the form show the error and stay open */
  onSave: (input: CreateTimeEntryInput | UpdateTimeEntryInput) => Promise<void>;
  onDelete: (entry: TimeEntry) => Promise<void>;
}

/**
 * The work item tab, as a pure function of the data handed to it.
 *
 * Split from its container so the same component renders inside a work item
 * form and in the local preview harness — the panel state is UI-only and stays
 * here, while loading, saving and field sync stay with the container.
 */
export const WorkItemTimesheetView: React.FC<WorkItemTimesheetViewProps> = ({
  workItemId,
  entries,
  currentUserId,
  syncWarning = false,
  stateTransitionWarning = false,
  onDismissSyncWarning,
  onDismissStateWarning,
  onSave,
  onDelete,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | undefined>(
    undefined,
  );

  const totalHours = sumHours(entries);

  const handleLogTime = () => {
    setEditingEntry(undefined);
    setShowForm(true);
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingEntry(undefined);
  };

  /** Closes only on success — a rejection is the form's to report */
  const handleSave = async (
    input: CreateTimeEntryInput | UpdateTimeEntryInput,
  ) => {
    await onSave(input);
    handleClose();
  };

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
            <Button onClick={handleLogTime} disabled={showForm}>
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
                onClick={onDismissSyncWarning}
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
                onClick={onDismissStateWarning}
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
              onEdit={handleEdit}
              onDelete={onDelete}
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
          workItemId={workItemId}
          entry={editingEntry}
          onSave={handleSave}
          onClose={handleClose}
        />
      </div>
    </div>
  );
};
